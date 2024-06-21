import PluginRegister from "@/bridgeo/plugin/register/plugin-register";
import { PacketOptionsStub, PacketsReceiver, PacketStub } from "@/bridgeo/relay/packet-bus";
import CommonRelay from "@/bridgeo/relay/relay";
import { RelayContext, RelayCreatingMaterial, relays } from "@/bridgeo/relay/starter";

export interface IPluginRegisterRelay extends PacketsReceiver {
    onRelayCreating?(material: RelayCreatingMaterial): void;
    onRelayCreated?(relay: CommonRelay, material: Readonly<RelayCreatingMaterial>): void;
    onClientBound?<T>(this: RelayContext, packet: PacketStub<T>, options: PacketOptionsStub<T>): void;
    onServerBound?<T>(this: RelayContext, packet: PacketStub<T>, options: PacketOptionsStub<T>): void;
    onUpstream?(this: RelayContext, buffer: Buffer, options: { canceled: boolean }): void;
    onDownstream?(this: RelayContext, buffer: Buffer, options: { canceled: boolean }): void;
}
export class PluginRegisterRelay extends PluginRegister<IPluginRegisterRelay> {
    register(handler: IPluginRegisterRelay) {
        const onRelayCreating = handler.onRelayCreating?.bind(handler);
        if (onRelayCreating) this.plugin.lifecycle.on('relay.creating', onRelayCreating);

        const onRelayCreated = handler.onRelayCreated?.bind(handler);
        if (onRelayCreated) {
            relays.forEach(relay => onRelayCreated(relay, {
                class: relay.constructor as typeof CommonRelay,
                options: relay.options,
                logger: relay.logger
            }));
            this.plugin.lifecycle.on('relay.created', onRelayCreated);
        }

        const handlePackets = (context: RelayContext) => {
            const onClientBound = handler.onClientBound?.bind(context);
            const onServerBound = handler.onServerBound?.bind(context);
            if (onClientBound || onServerBound) {
                const receiver: PacketsReceiver = {
                    onClientBound,
                    onServerBound,
                };
                context.packets.register(receiver);
                this.plugin.lifecycle.on('self.unload', () => context.packets.unregister(receiver));
            }

            const onUpstream = handler.onUpstream?.bind(context);
            if (onUpstream) {
                context.client.on('upstream', onUpstream);
                this.plugin.lifecycle.on('self.unload', () => context.client.off('upstream', onUpstream));
            }
            const onDownstream = handler.onDownstream?.bind(context);
            if (onDownstream) {
                context.client.on('downstream', onDownstream);
                this.plugin.lifecycle.on('self.unload', () => context.client.off('downstream', onDownstream));
            }
        };
        relays.flatMap(relay => Object.values(relay.clients))
            .forEach(client => handlePackets(client.context));
        this.plugin.lifecycle.on('relay.joined', handlePackets);
    }
}

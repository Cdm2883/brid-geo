import PluginRegister from "@/bridgeo/plugin/register/plugin-register";
import { PacketOptionsStub, PacketsReceiver, PacketStub } from "@/bridgeo/relay/packet-bus";
import CommonRelay from "@/bridgeo/relay/relay";
import { BridgeoRelayOptions, RelayContext, RelayCreatingMaterial, relays } from "@/bridgeo/relay/starter";
import { binding } from "@/bridgeo/utils/js/functions";
import { ArrayShift } from "@/bridgeo/utils/js/type-utils";

export interface IPluginRegisterRelay {
    onRelayCreating?(material: RelayCreatingMaterial): void;
    onRelayCreated?(relay: CommonRelay, material: Readonly<RelayCreatingMaterial>): void;
    onRelayJoined?(context: RelayContext): void;
    onClientBound?<T>(context: RelayContext, packet: PacketStub<T>, options: PacketOptionsStub<T>): void;
    onServerBound?<T>(context: RelayContext, packet: PacketStub<T>, options: PacketOptionsStub<T>): void;
    onUpstream?(context: RelayContext, buffer: Buffer, options: { canceled: boolean }): void;
    onDownstream?(context: RelayContext, buffer: Buffer, options: { canceled: boolean }): void;
}
export class PluginRegisterRelay extends PluginRegister<IPluginRegisterRelay> {
    register(handler: IPluginRegisterRelay) {
        const onRelayCreating = binding(handler).onRelayCreating;
        if (onRelayCreating) this.plugin.lifecycle.on('relay.creating', onRelayCreating);

        const onRelayCreated = binding(handler).onRelayCreated;
        if (onRelayCreated) {
            relays.forEach(relay => onRelayCreated(relay, {
                class: relay.constructor as typeof CommonRelay,
                options: relay.options as BridgeoRelayOptions,
                logger: relay.logger
            }));
            this.plugin.lifecycle.on('relay.created', onRelayCreated);
        }

        const handlePackets = (context: RelayContext) => {
            handler.onRelayJoined?.(context);

            const onClientBound = handler.onClientBound;
            const onServerBound = handler.onServerBound;
            if (onClientBound || onServerBound) {
                const receiver: PacketsReceiver = {
                    onClientBound: (...args) => onClientBound?.(context, ...args),
                    onServerBound: (...args) => onServerBound?.(context, ...args),
                };
                context.packets.register(receiver);
                this.plugin.lifecycle.on('self.unload', () => context.packets.unregister(receiver));
            }

            const onUpstream = handler.onUpstream;
            if (onUpstream) {
                const args = [ 'upstream', (...args: ArrayShift<Parameters<typeof onUpstream>>) => onUpstream(context, ...args) ] as const;
                context.client.on(...args);
                this.plugin.lifecycle.on('self.unload', () => context.client.off(...args));
            }
            const onDownstream = handler.onDownstream?.bind(context);
            if (onDownstream) {
                const args = [ 'downstream', (...args: ArrayShift<Parameters<typeof onDownstream>>) => onDownstream(context, ...args) ] as const;
                context.client.on(...args);
                this.plugin.lifecycle.on('self.unload', () => context.client.off(...args));
            }
        };
        relays.flatMap(relay => Object.values(relay.clients))
            .forEach(client => handlePackets(client.context));
        this.plugin.lifecycle.on('relay.joined', handlePackets);
    }
}

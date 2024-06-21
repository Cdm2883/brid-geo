import { PacketOptionsStub, PacketsReceiver, PacketStub } from "@/bridgeo/relay/packet-bus";

abstract class LocalRecordProvider {
    local: LocalRecord;
    constructor(local: LocalRecord) {
        this.local = local;
    }
}

export class LocalPlayerRecord extends LocalRecordProvider implements PacketsReceiver {
    onClientBound<T>({ name, params }: PacketStub<T>, options: PacketOptionsStub<T>) {
    }
    onServerBound<T>({ name, params }: PacketStub<T>, options: PacketOptionsStub<T>) {
    }
}

export class LocalWorldRecord extends LocalRecordProvider implements PacketsReceiver {
    onClientBound<T>({ name, params }: PacketStub<T>, options: PacketOptionsStub<T>) {
    }
    onServerBound<T>({ name, params }: PacketStub<T>, options: PacketOptionsStub<T>) {
    }
}

export default class LocalRecord implements PacketsReceiver {
    player = new LocalPlayerRecord(this);
    world = new LocalWorldRecord(this);
    onClientBound<T>(packet: PacketStub<T>, options: PacketOptionsStub<T>) {
        this.player.onClientBound(packet, options);
        this.world.onClientBound(packet, options);
    }
    onServerBound<T>(packet: PacketStub<T>, options: PacketOptionsStub<T>) {
        this.player.onServerBound(packet, options);
        this.world.onServerBound(packet, options);
    }
}

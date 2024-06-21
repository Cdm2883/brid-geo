import _ from "lodash";
import { PacketBufferParsed } from "protodef";

import EventBus from "@/bridgeo/utils/js/event-bus";

export interface PacketStub<T> { name: string; params: T }
export type PacketOptionsStub<T> = PacketBufferParsed<PacketStub<T>> & { canceled: boolean }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PacketAny = PacketStub<any>;

export interface PacketsReceiver {
    onClientBound?<T>(packet: PacketStub<T>, options: PacketOptionsStub<T>): void;
    onServerBound?<T>(packet: PacketStub<T>, options: PacketOptionsStub<T>): void;
}

// noinspection JSUnusedGlobalSymbols
export declare interface PacketBus {
    on<T>(event: `server`, listener: (packet: PacketStub<T>, options: PacketOptionsStub<T>) => void): this;
    on<T>(event: `server.${string}`, listener: (packet: T, options: PacketOptionsStub<T>) => void): this;
    on<T>(event: `client`, listener: (packet: PacketStub<T>, options: PacketOptionsStub<T>) => void): this;
    on<T>(event: `client.${string}`, listener: (packet: T, options: PacketOptionsStub<T>) => void): this;
}
export class PacketBus extends EventBus implements PacketsReceiver {
    registers: PacketsReceiver[] = [];
    register(receiver: PacketsReceiver) {
        this.registers.push(receiver);
    }
    unregister(receiver: PacketsReceiver) {
        _.pull(this.registers, receiver);
    }

    onClientBound<T>(packet: PacketStub<T>, options: PacketOptionsStub<T>): void {
        this.registers.forEach(receiver => receiver.onClientBound?.(packet, options));
        this.emit(`server.${packet.name}`, packet.params, options);
    }
    onServerBound<T>(packet: PacketStub<T>, options: PacketOptionsStub<T>): void {
        this.registers.forEach(receiver => receiver.onServerBound?.(packet, options));
        this.emit(`client.${packet.name}`, packet.params, options);
    }
}
export default PacketBus;

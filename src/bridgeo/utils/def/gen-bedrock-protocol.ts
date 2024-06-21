/* eslint-disable @typescript-eslint/no-explicit-any,indent */
import * as fs from "node:fs";
import * as paths from "node:path";

import chalk from "chalk";
import _ from "lodash";
import minecraftData from "minecraft-data";

import { generatedBridgeoDeveloperConfig } from "@/bridgeo/utils/js/bridgeo-developer-config";
import { BridgeoPaths, createDirIfNotExists, simpleWriteFile } from "@/bridgeo/utils/js/file-utils";
import { lazy } from "@/bridgeo/utils/js/functions";
import { Logger } from "@/bridgeo/utils/js/logger";
import { enter, indent, line, removeComments, trimCode } from "@/bridgeo/utils/js/meta-programming";
import { mergeDuplicate, removeAt, replaceAt } from "@/bridgeo/utils/js/string-utils";
import { InternalVersion, ProtocolVersion, toInternalVersion, versions } from "@/bridgeo/utils/mc/versions";

const root = paths.resolve(BridgeoPaths.GENERATED, 'protocol-definitions');
const protocolVersionLatest = versions.at(-1)![2];
const internalVersionLatest = toInternalVersion(protocolVersionLatest);

declare module '@/bridgeo/utils/js/bridgeo-developer-config' {
    export interface BridgeoDeveloperConfig {
        generateBedrockProtocol?: false | InternalVersion | '*' | 'latest';
    }
}
export function generateBedrockProtocol() {
    const config = generatedBridgeoDeveloperConfig.generateBedrockProtocol ?? 'latest';
    if (config === false || fs.existsSync(root)) return;
    const logger = new Logger('GenerateBedrockProtocol').inPool();
    const version = 
        config === '*' ? null
        : config === 'latest' ? internalVersionLatest
        : config;
    logger.info(`> 正在生成 TS 协议定义 ${chalk.gray(`(版本: ${version ?? '*'})`)} ...`);
    const start = Date.now();
    generate(version);
    const end = Date.now();
    logger.info(`> 已完成生成! ${chalk.gray(`(${end - start}ms)`)}`);
    logger.destroy();
}

export function generate(version: InternalVersion | null = null) {
    if (!createDirIfNotExists(root)) return;

    const isIncludeLatest = version == null || version === internalVersionLatest;

    const imports: [ name: string, type: string, internal: InternalVersion ][] = [];
    const protocolDefinitions: any = {};

    for (const [ ,,protocol, internal ] of versions) {
        if (version && version !== internal) continue;
        const data: any = minecraftData('bedrock_' + internal).protocol;
        const types = data.types;
        generateVersion(internal, protocol, types);
        for (const type in types) {
            if (!isPacketType(type)) continue;
            const name = generateInterfaceName(type, protocol);
            imports.push([ name, type, internal ]);
            imports.push();
            protocolDefinitions[type] ??= {};
            protocolDefinitions[type][protocol] = name;
        }
    }

    simpleWriteFile(paths.resolve(root, 'protocol-definitions.d.ts'), trimCode(`
        /* eslint-disable @typescript-eslint/adjacent-overload-signatures,simple-import-sort/imports */
        // noinspection SpellCheckingInspection
        
        import { ProtocolVersion } from "@/bridgeo/utils/mc/versions";
        
        ${
        _.uniq(imports)
            .map(([ name, type, internal ]) => indent(2) + `import { ${name} } from "./${internal}/${type}.d.ts";`)
            .join('\n')
            .slice(2 * 4)
        }

        export type ProtocolVersionLatest = ${protocolVersionLatest};

        interface PacketDefinitions {
            ${(() => {
                let fields = '';
                for (const [ type, protocols ] of Object.entries(protocolDefinitions)) {
                    fields += line(3)`'${type.slice(7)}': {`;
                    for (const [ protocol, name ] of Object.entries(protocols as any)) {
                        fields += line(4)`${protocol}: ${name};`;
                    }
                    fields += line(3)`};`;
                }
                return fields.slice(3 * 4, -1);
            })()}
        }

        export type PacketDefinition<N extends string, V extends ProtocolVersion> =
            N extends keyof PacketDefinitions ?
                V extends keyof PacketDefinitions[N] ?
                    PacketDefinitions[N][V]
                    : never
                : never;
        export type PacketDefinitionLatest<N extends string> = PacketDefinition<N, ProtocolVersionLatest>;

        declare module 'bedrock-protocol' {
            export interface Connection {
                write(name: string, params: object): void;
                write<N extends string, V extends ProtocolVersion>(name: N, params: PacketDefinition<N, V>): void;
                queue(name: string, params: object): void;
                queue<N extends string, V extends ProtocolVersion>(name: N, params: PacketDefinition<N, V>): void;
                ${(() => {
                let functions = '';
                for (let type in protocolDefinitions) {
                    type = type.slice(7);
                    functions += line(4)`write<V extends ProtocolVersion>(name: '${type}', params: PacketDefinition<'${type}', V>): void;`;
                    functions += line(4)`queue<V extends ProtocolVersion>(name: '${type}', params: PacketDefinition<'${type}', V>): void;`;
                }
                return functions.slice(4 * 4, -1);
                })()}
            }
        }
    `));

    simpleWriteFile(paths.resolve(root, 'packet-bus.d.ts'), trimCode(`
        /* eslint-disable simple-import-sort/imports */
        import { PacketOptionsStub, PacketStub } from "@/bridgeo/relay/packet-bus";
        import { ProtocolVersion } from "@/bridgeo/utils/mc/versions";
        import { PacketDefinition } from "@/generated/protocol-definitions/protocol-definitions";
        
        ${
        !isIncludeLatest ? '' : Object.entries(
            (minecraftData('bedrock_' + internalVersionLatest).protocol as any).types
        )
            .filter(([ type ]) => isPacketType(type))
            .map(([ type ]) => line(2)`import { ${generateInterfaceName(type, protocolVersionLatest)} } from "@/generated/protocol-definitions/${internalVersionLatest}/${type}";`)
            .join('')
            .slice(2 * 4, -1)
        }
        
        declare module '@/bridgeo/relay/packet-bus' {
            export interface PacketBus {
                on<T>(event: \`server\`, listener: (packet: PacketStub<T>, options: PacketOptionsStub<T>) => void): this;
                on<T>(event: \`server.\${string}\`, listener: (packet: T, options: PacketOptionsStub<T>) => void): this;
                on<T>(event: \`client\`, listener: (packet: PacketStub<T>, options: PacketOptionsStub<T>) => void): this;
                on<T>(event: \`client.\${string}\`, listener: (packet: T, options: PacketOptionsStub<T>) => void): this;
                ${(() => {
                    let functions = '';
                    for (let type in protocolDefinitions) {
                        type = type.slice(7);
                        functions += line(4)`on<V extends ProtocolVersion>(event: 'server.${type}', listener: (packet: PacketDefinition<'${type}', V>, options: PacketOptionsStub<PacketDefinition<'${type}', V>>) => void): this;`;
                        functions += line(4)`on<V extends ProtocolVersion>(event: 'client.${type}', listener: (packet: PacketDefinition<'${type}', V>, options: PacketOptionsStub<PacketDefinition<'${type}', V>>) => void): this;`;
                    }
                    return functions.slice(4 * 4, -1);
                })()}
                ${
                    !isIncludeLatest ? '' : Object.entries(
                        (minecraftData('bedrock_' + internalVersionLatest).protocol as any).types
                    )
                        .filter(([ type ]) => isPacketType(type))
                        .map(([ type ]) => [ type.slice(7), generateInterfaceName(type, protocolVersionLatest) ])
                        .map(([ type, name ]) => line(4)`on(event: 'client.${type}', listener: (packet: ${name}, options: PacketOptionsStub<${name}>) => void): this;`)
                        .join('')
                        .slice(4 * 4, -1)
                }
            }
        }
    `));

    simpleWriteFile(paths.resolve(root, 'relay-player.d.ts'), trimCode(``));
}

function generateVersion(version: InternalVersion, protocol: ProtocolVersion, types: any) {
    createDirIfNotExists(paths.resolve(root, version));
    for (const [ name, type ] of Object.entries(types)) {
        generateType(version, protocol, name, type);
    }
}

const basicTypes: Record<string, string> = {
    i8: 'number',  // 未验证
    u8: 'number',  // 未验证
    i16: 'number',  // 未验证
    u16: 'number',  // 未验证
    i32: 'number',  // 未验证
    u32: 'number',  // 未验证
    f32: 'number',  // 未验证
    f64: 'number',  // 未验证
    i64: 'number',  // 未验证
    u64: 'number',  // 未验证
    li8: 'number',  // 未验证
    lu8: 'number',  // 未验证
    li16: 'number',  // 未验证
    lu16: 'number',  // 未验证
    li32: 'number',  // 未验证
    lu32: 'number',  // 未验证
    lf32: 'number',  // 未验证
    lf64: 'number',  // 未验证
    li64: 'number',  // 未验证
    lu64: 'number',  // 未验证
    int: 'number',  // 未验证
    varint: 'number',  // 未验证
    bool: 'boolean',
    cstring: 'string',  // 未验证
    void: 'null | undefined',  // 未验证
    pstring: 'string',  // 未验证
    buffer: 'Buffer',  // 未验证
};
const nativeTypes = lazy(() => {
    type Value = (imports: string[]) => string;
    const importAny: Value = imports => {
        imports.push(`/* eslint-disable @typescript-eslint/no-explicit-any */`);
        return 'any';
    };
    return {
        varint64: () => 'bigint',
        zigzag32: importAny,  // 未验证
        zigzag64: () => 'bigint',
        uuid: importAny,  // 未验证
        byterot: importAny,  // 未验证
        bitflags: importAny,  // 未验证
        restBuffer: importAny,  // 未验证
        encapsulated: importAny,  // 未验证
        nbt: importAny,  // 未验证
        lnbt: importAny,  // 未验证
        nbtLoop: importAny,  // 未验证
        enum_size_based_on_values_len: importAny,  // 未验证
        MapInfo: importAny,  // 未验证
    } as Record<string, Value>;
});
function generateType(version: InternalVersion, protocol: ProtocolVersion, name: string, type: any) {
    if (name === 'mcpe_packet') return;
    const interfaceName = generateInterfaceName(name, protocol);

    const imports: string[] = [];
    const generateTypeDefinition = (space: number, type: any): [ optional: boolean, definition: string ] => {
        if (typeof type === 'string') type = [ type ];
        let def = '';
        const optional = type[0] === 'option';
        const item = optional ? (typeof type[1] === 'string' ? type[1] : type[1][0]) : type[0];
        const body = optional ? type[1][1] : type[1];

        if (item === 'switch') {
            // TODO
            const conditions: Record<string, string[]> = {};
            for (const [ condition, conditionType ] of Object.entries<object>(body.fields)) {
                const jsonType = JSON.stringify(conditionType);
                conditions[jsonType] ??= [];
                conditions[jsonType].push(condition);
            }
            def += enter`// if`;

            // for (const [ jsonType, conditionArray ] of Object.entries(conditions)) {
            //     def += line(space + 1)`| /* ${
            //         conditionArray.map(c => body.compareTo + ' == ' + c).join(' || ')
            //     } */ ${generateTypeDefinition(space + 1, JSON.parse(jsonType))[1]}`;
            // }
            const conditionEntries = Object.entries(conditions);
            const conditionRealLength = body.default ? conditionEntries.length + 1 : conditionEntries.length;
            for (let i = 0; i < conditionEntries.length; i++) {
                const [ jsonType, conditionArray ] = conditionEntries[i];
                const conditionType = generateTypeDefinition(space + 1, JSON.parse(jsonType))[1];
                const conditionTypeLast = conditionType.slice(-1);
                def += line(space + 1)`| /* ${
                    conditionArray.map(c => body.compareTo + ' == ' + c).join(' || ')
                } */ ${conditionType}${
                    (conditionTypeLast === '}'
                        || conditionTypeLast === ']')
                    && i !== conditionRealLength - 1
                    ? ' // ;' : ''
                }`;
            }

            if (body.default) {
                def += line(space + 1)`| /* else */ ${generateTypeDefinition(space + 1, body.default)[1]}`;
            }
            def = def.slice(0, -1) + enter`;`;
        }
        else if (item === 'array') {
            let [ ,elementType ] = generateTypeDefinition(space, body.type);
            const clearedType = removeComments(elementType);
            if (clearedType.charAt(0) === '|') elementType = removeAt(elementType, elementType.indexOf('|'));
            let selfMinute = false;
            if (clearedType.slice(-1) === ';') {
                selfMinute = true;
                elementType = removeAt(elementType, elementType.lastIndexOf(';'));
            }
            const neededBrackets =
                elementType.includes("{")
                || elementType.includes("}")
                || elementType.includes("[")
                || elementType.includes("]")
                || elementType.trim().split('\n').length > 1;
            def += enter`${neededBrackets ? '(' : ''}${elementType}${neededBrackets ? ')' : ''}[]${selfMinute ? ';' : ''}`;
        }
        else if (item === 'container') {
            def += enter`{`;
            for (const { anon: fieldAnon, name: fieldName, type: fieldType } of body) {
                // TODO

                // fieldAnon 合并
                if (fieldAnon) {
                    if (fieldName) {
                        def += line(space + 1)`${fieldName}?: /*`;
                        def += line(space + 2)`TODO NameMerge`;
                        def += indent(space + 2, JSON.stringify(type, undefined, 4)) + '\n';
                        def += line(space + 1)`*/ /* eslint-disable @typescript-eslint/no-explicit-any */ any`;
                    } else {
                        def += line(space + 1)`/*`;
                        def += line(space + 2)`TODO AnonMerge`;
                        def += indent(space + 2, JSON.stringify(type, undefined, 4)) + '\n';
                        def += line(space + 1)`*/`;
                    }
                    continue;
                }

                const [ fieldOptional, fieldDefinition ] = generateTypeDefinition(space + 1, fieldType);

                // switch 特殊处理 (最后交给分号添加器统一处理?)
                if (fieldDefinition.startsWith('// if')) {
                    def += line(space + 1)`${fieldName}${fieldOptional ? '?' : ''}: /*`;
                    def += line(space + 2)`TODO MergeSwitch`;
                    def += line(space + 2)`${fieldDefinition.replaceAll('/*', '/+').replaceAll('*/', '+/')}`;
                    def += line(space + 1)`*/ /* eslint-disable @typescript-eslint/no-explicit-any */ any`;
                    continue;
                }

                def += line(space + 1)`${fieldName}${fieldOptional ? '?' : ''}: ${fieldDefinition}`;
            }
            def += line(space)`}`;
        }
        // else if (item === 'count') {}  // 没用到就不写了
        else if (item === 'bitfield') {
            // 未验证
            def += enter`{`;
            for (const { name: fieldName, size: fieldSize, signed: fieldSigned } of body) {
                def += line(space + 1)`${fieldName}: /* ${fieldSigned ? '' : 'u'}:${fieldSize} */ number`;
            }
            def += line(space)`}`;
        }
        else if (item === 'mapper') {
            def += enter`// ${body.type}`;
            for (const [ mappingType, mappingString ] of Object.entries(body.mappings)) {
                def += line(space + 1)`| /* ${mappingType} */ '${mappingString}'`;
            }
            def = def.slice(0, -1) + enter`;`;
        }
        else if (basicTypes[item]) {
            const shownType =
                item !== 'bool'
                && item !== 'void'
                && item !== 'buffer';
            def += enter`${shownType ? `/* ${item} */ ` : ''}${basicTypes[item]}`;
        }
        else {
            const importInterface = generateInterfaceName(item, protocol);
            imports.push(`import { ${importInterface} } from "./${item}.d.ts";`);
            def += enter`${importInterface}`;
        }

        return [ optional, def.slice(0, -1) || '/* eslint-disable @typescript-eslint/no-explicit-any */ any' ];
    };

    const definition = nativeTypes.value[name]
        ? nativeTypes.value[name](imports)
        : generateTypeDefinition(2, type)[1];

    simpleWriteFile(paths.resolve(root, version, `${name}.d.ts`), trimCode(`
        /* eslint-disable ${[
            'simple-import-sort/imports',
            '@typescript-eslint/consistent-type-definitions',
            '@typescript-eslint/no-unused-vars',
            '@typescript-eslint/ban-types'
        ].join()} */
        // noinspection SpellCheckingInspection,TypeScriptDuplicateUnionOrIntersectionType,ES6UnusedImports
        
        ${_.uniq(imports).sort().map(line => indent(2) + line).join('\n').slice(2 * 4)}

        export type ${interfaceName} = ${
            definition
                .split('\n')
                .map(line => {
                    line = mergeDuplicate(line, ';');
                    const cleared = removeComments(line);
                    if (!cleared || cleared === '*/') return line;
                    if (cleared == '|') return replaceAt(line, line.indexOf('|'), ' ');
                    const first = cleared.charAt(0);
                    const last = cleared.slice(-1);
                    const unify =
                        last === '{'
                        || last === '('
                        || last === ':'
                        || last === ';'
                        || last == '*'
                        || first === '|'
                        || cleared.startsWith('TODO ')
                        || line.endsWith('// ;');
                    return unify ? line : line + ';';
                })
                .join('\n')
        }

        ${protocol === protocolVersionLatest && isPacketType(name) ? `declare module 'bedrock-protocol' {
            export interface Connection {
                write(name: '${name.slice(7)}', params: ${interfaceName}): void;
                queue(name: '${name.slice(7)}', params: ${interfaceName}): void;
            }
        }` : ''}
    `));
}


function isPacketType(name: string) {
    return name.startsWith('packet_');
}
// function generateImport(name: string, protocol: ProtocolVersion, isInSubdir: boolean) {
    // TODO 去除前后版本一样的定义
// }
function generateInterfaceName(name: string, protocol: ProtocolVersion) {
    // TODO 去除前后版本一样的定义
    return `Protocol${_.upperFirst(_.camelCase(name))}_${protocol}`;
}

// generate();

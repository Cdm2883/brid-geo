// noinspection JSCheckFunctionSignatures,SpellCheckingInspection

import { Server } from "bedrock-protocol";

import { readPacket } from "./packets.js";
import { string2xyz, string2xz } from "./vectors.js";

class EmptyServer extends Server {
    necessary = {
        setupResourcePack,
        startGame: client => startGame(client, this.options),
        biomeDefinitionList,
        playerSpawn,
        tickSync,
    };
    constructor(options) {
        super(options);
        this.setup();
    }
    
    setup = () => this.on('connect', client =>
        client.on('join', () => {
            // 发送所有必要的数据包
            this.necessary.setupResourcePack(client);
            client.once('resource_pack_client_response', () => {
                this.necessary.startGame(client);
                this.necessary.biomeDefinitionList(client);
                this.necessary.playerSpawn(client);
                this.necessary.tickSync(client);
            });
        }));
}

async function startEmptyServer(options, onConnect, onSpawn) {
    options.port ??= 19132;
    const server = new EmptyServer(options);

    server.on('connect', client => {
        if (onConnect) onConnect(client);
        if (onSpawn) client.on('join', () =>
            client.once('spawn', () =>
                setTimeout(() => onSpawn(client), 200)));
    });

    await server.listen();
    return server;
}

function setupResourcePack(client) {
    client.write('resource_packs_info', {
        must_accept: false,
        has_scripts: false,
        behaviour_packs: [],
        texture_packs: [],
        resource_pack_links: []
    });
    client.write('resource_pack_stack', {
        must_accept: false,
        behavior_packs: [],
        resource_packs: [],
        game_version: '',
        experiments: [],
        experiments_previously_used: false
    });
}

function startGame(client, options) {
    let player = 1919810;
    let pos = string2xyz('0 69 0');
    let levelName = options.motd?.levelName ?? "Bedrock level";
    client.queue('start_game', {
        entity_id: String(player),
        runtime_entity_id: String(player),
        player_gamemode: "fallback",
        player_position: pos,
        rotation: string2xz('0, 0'),
        seed: -1,
        biome_type: 0,
        biome_name: "plains",
        dimension: "overworld",
        generator: 1,
        world_gamemode: "survival",
        difficulty: 1,
        spawn_position: pos,
        achievements_disabled: true,
        editor_world_type: "not_editor",
        created_in_editor: false,
        exported_from_editor: false,
        day_cycle_stop_time: 16,
        edu_offer: 0,
        edu_features_enabled: false,
        edu_product_uuid: "",
        rain_level: 0,
        lightning_level: 0,
        has_confirmed_platform_locked_content: false,
        is_multiplayer: true,
        broadcast_to_lan: true,
        xbox_live_broadcast_mode: 6,
        platform_broadcast_mode: 6,
        enable_commands: true,
        is_texturepacks_required: false,
        gamerules: [],
        experiments: [],
        experiments_previously_used: false,
        bonus_chest: false,
        map_enabled: false,
        permission_level: 4,
        server_chunk_tick_range: 4,
        has_locked_behavior_pack: false,
        has_locked_resource_pack: false,
        is_from_locked_world_template: false,
        msa_gamertags_only: true,
        is_from_world_template: false,
        is_world_template_option_locked: false,
        only_spawn_v1_villagers: false,
        persona_disabled: false,
        custom_skins_disabled: false,
        emote_chat_muted: false,
        game_version: "*",
        limited_world_width: 16,
        limited_world_length: 16,
        is_new_nether: false,
        edu_resource_uri: { button_name: "", link_uri: "" },
        experimental_gameplay_override: false,
        chat_restriction_level: "none",
        disable_player_interactions: false,
        level_id: levelName,
        world_name: levelName,
        premium_world_template_id: "00000000-0000-0000-0000-000000000000",
        is_trial: false,
        // 太吵了
        movement_authority: "server",
        // movement_authority: "client",
        rewind_history_size: 40,
        server_authoritative_block_breaking: false,
        current_tick: [ 0, 16 ],
        enchantment_seed: -1,
        block_properties: [],
        itemstates: [],
        multiplayer_correlation_id: "<raknet>",
        server_authoritative_inventory: true,
        engine: "BridGeo",
        property_data: { type: "compound", name: "", value: {} },
        block_pallette_checksum: [ 0, 0 ],
        world_template_id: "00000000-0000-0000-0000-000000000000",
        client_side_generation: false,
        block_network_ids_are_hashes: true,
        server_controlled_sound: false
    });
}

function biomeDefinitionList(client) {
    let name = 'biome_definition_list';
    client.queue(name, readPacket(name));
}

function playerSpawn(client) {
    client.queue('play_status', { status: 'player_spawn' });
}

function tickSync(client) {
    client.on('tick_sync', packet => {
        client.queue('tick_sync', {
            request_time: packet.request_time,
            response_time: BigInt(Date.now())
        });
    });
}


export { EmptyServer, startEmptyServer };

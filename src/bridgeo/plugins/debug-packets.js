import {
    button,
    custom_form,
    form, input,
    inputDefaulted,
    step_slider,
    textures,
    toggle
} from "../packets/modal_form_request.js";
import { requestModalForm } from "../utils/mc/relays.js";

const exceptServer = [
    'move_entity_delta',
    'set_entity_data',
    'entity_event',
    'update_attributes',
    'level_chunk',
    'subchunk',
    'set_entity_motion',
    'network_chunk_publisher_update',
    'unlocked_recipes',
    'block_entity_data',
    'update_subchunk_blocks',
    'add_entity',
    'level_sound_event',
    'add_item_entity',
    'crafting_data',
    'player_hotbar',
    'level_event',
    'tick_sync',
    'set_health',
    'level_event_generic',
    'available_commands',
    'inventory_content',
    'update_abilities',
    'game_rules_changed',
    'set_spawn_position',
    'remove_entity',
    'resource_pack_stack',
    'resource_packs_info',
    'inventory_slot',
    'player_list',
    'inventory_transaction',
    'start_game',
    'mob_equipment',
    'update_block',
    'respawn',
    'trim_data',
    'creative_content',
    'camera_presets',
    'feature_registry',
    'available_entity_identifiers',
    'player_fog',
    'compressed_biome_definitions',
    'update_adventure_settings',
    'set_commands_enabled',
    'item_component',
    'sync_entity_property',
    'chunk_radius_update',
    'event',
    'move_player',
    'set_score',
    'set_display_objective',
    'remove_objective',
    'text',
    'clientbound_map_item_data',
    'set_local_player_as_initialized',
    'set_time',
    'set_difficulty',
    'set_player_inventory_options',
    'add_player',
    'add_painting',
    'play_status',
    'play_sound',
    'set_title',
    'command_output',
    'animate',
    'mob_effect',
    'emote_list',
    'set_entity_link',
    'boss_event',
    'biome_definition_list',
    'set_last_hurt_by',
    'block_event',
    'mob_armor_equipment',
    'tick_sync',
    'take_item_entity',
    'update_player_game_type',
    'open_sign',
    'motion_prediction_hints',
    'player_skin',
    'item_stack_response',
    'container_open',
    'container_close',
    'death_info',
    'toast_request',
    '',
];
const exceptClient = [
    'subchunk_request',
    'player_auth_input',
    'resource_pack_client_response',
    'mob_equipment',
    'interact',
    'npc_request',
    'request_chunk_radius',
    'map_info_request',
    'animate',
    'set_local_player_as_initialized',
    'emote_list',
    'command_request',
    'inventory_transaction',  // 使用物品
    'boss_event',
    'player_action',
    'level_sound_event',
    'block_entity_data',
    'container_close',
    'item_stack_request',
    'respawn',
    'modal_form_response',
    '',
];

// export const metadata = {
//     name: "包测试",
// };
// export function quickMenu() {
//     requestModalForm.call(this,
//         {
//             ...custom_form("debug packet sender"),
//             content: [
//                 input('form_id'),
//             ]
//         },
//         (_, result) => {
//             if (result === undefined) return;
//             let form_id = Number(result[0]);
//             this.server.queue('modal_form_response', {
//                 form_id: form_id,
//                 has_response_data: true,
//                 data: '114514\n',
//                 has_cancel_reason: false,
//                 cancel_reason: undefined
//             });
//         }
//     );
// }

function JSONStringify(value) {
    // return JSON.stringify(value, (key, value) => {
    //     return typeof value === 'bigint' ? value.toString() : value;
    // });
}

export function onServerPackets({ name, params }, options) {
    // if (exceptServer.includes(name)) return;

    // relay.js#L64
    // if (name === 'crafting_data') return
    // if (name === 'spawn_particle_effect') return

    // this.logger.debug('fromServer', name, params);
    if (name === 'move_entity_delta') return;
    if (name === 'set_entity_data') return;

    this.logger.debug('fromServer', name);
}

export function onClientPackets({ name, params }, options) {
    if (exceptClient.includes(name)) return;
    // this.logger.debug('fromClient', name, params);
    // this.logger.debug('fromClient', name);

    // this.logger.debug('fromClient', name);
}

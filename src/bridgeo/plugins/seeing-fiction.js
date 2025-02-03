import {
    button,
    custom_form,
    form, input,
    label,
    textures, toggle,
} from "../packets/modal_form_request.js";
import { SS } from "../utils/mc/mc-text.js";
import createPlayerStorage from "../utils/mc/player-storage.js";
import { requestModalForm } from "../utils/mc/relays.js";

export const metadata = {
    namespace: "vip.cdms.seeing-fiction",
    name: `"虚拟现实"`,
    description: "欺骗客户端以获取特殊效果",
    version: [ 1, 0, 0 ],
    author: "Cdm2883",
    quick_menu: {
        text: '修改显示效果',
        image: textures('textures/ui/video_glyph_color_2x')
    }
};

const data = createPlayerStorage();

const status = bool => `${SS}${bool ? 2 : 4}●`;
export function quickMenu() {
    let current = data.get(this.player);

    const main = () => requestModalForm.call(this,
        {
            ...form(
                metadata.quick_menu.text,
                `修改${SS}l客户端${SS}r显示效果, 无法改变服务端状态!`
            ),
            buttons: [
                button(`修改时间 ${status(current.timer)}`, textures('textures/ui/timer')),
                button(`修改天气 ${status(current.weather)}`, textures('textures/items/feather')),
                button(`游戏模式 ${status(current.gamemode?.mode)}`, textures('textures/ui/armor_full')),
                button(`强制夜视 ${status(current.night_vision)}`, textures('textures/ui/night_vision_effect')),
            ]
        },
        (_, result) => {
            if (result === undefined) return;
            if (result === 0) return timer.call(this);
            if (result === 1) return weather.call(this);
            if (result === 2) return gamemode.call(this);
            if (result === 3) return nightVision.call(this);
        }
    );
    
    main();
}

function timer() {
    let current = data.get(this.player);

    const setTime = time => {
        current.timer = time;
        this.player.queue('set_time', {
            time: time || this.player.world.time
        });
    };

    const times = [
        [ `日出`, 'textures/ui/time_1sunrise',  23000 ],
        [ `白日`, 'textures/ui/time_2day',      1000  ],
        [ `中午`, 'textures/ui/time_3noon',     6000  ],
        [ `日落`, 'textures/ui/time_4sunset',   12000 ],
        [ `夜晚`, 'textures/ui/time_5night',    13000 ],
        [ `午夜`, 'textures/ui/time_6midnight', 18000 ],
    ];
    const main = () => requestModalForm.call(this,
        {
            ...form(
                `修改时间 ${status(current.timer)}`,
                `>>> ${current.timer || this.player.world.time}`
            ),
            buttons: [
                ...times.map(time => button(time[0], textures(time[1]))),
                button(`恢复`),
                button(`自定义`),
            ]
        },
        (_, result) => {
            if (result === undefined) return quickMenu.call(this);
            if (result === times.length) return setTime(false);
            if (result === times.length + 1) return custom();
            setTime(times[result][2]);
        }
    );

    const custom = () => requestModalForm.call(this,
        {
            ...custom_form(`自定义时间`),
            content: [
                input(`时间`, `${current.timer || this.player.world.time}`)
            ]
        },
        (_, result) => {
            if (result === undefined) return main();
            let time = result[0];
            if (!time) return main();
            setTime(Number(time));
        }
    );

    main();
}

function weather() {
    let current = data.get(this.player);
}

function gamemode() {
    let current = data.get(this.player);

    const setMode = mode => {
        if (!current.gamemode) current.gamemode = {};
        current.gamemode.mode = mode;
        this.player.queue('update_player_game_type', {
            gamemode: mode || this.player.local.gamemode,
            player_unique_id: this.player.local.entity_id
        });
    };

    const modes = [
        [ `默认`, 'fallback'  ],
        [ `冒险`, 'adventure' ],
        [ `生存`, 'survival'  ],
        [ `创造`, 'creative'  ],
        [ `旁观`, 'spectator' ],
    ];
    const main = () => requestModalForm.call(this,
        {
            ...form(
                `游戏模式 ${status(current.gamemode?.mode)}`,
                `>>> ${current.gamemode?.mode || this.player.local.gamemode + ' (default)'}`
            ),
            buttons: [
                button(`恢复`, textures('textures/ui/icon_recipe_nature')),
                button(`设置`, textures('textures/ui/icon_setting')),
                ...modes.map(mode => button(`${mode[0]} (${mode[1]})`)),
            ]
        },
        (_, result) => {
            if (result === undefined) return quickMenu.call(this);
            if (result === 0) return setMode(null);
            if (result === 1) return setting();
            setMode(modes[result - 2][1]);
        }
    );
    
    const setting = () => requestModalForm.call(this,
        {
            ...custom_form(`游戏模式设置`),
            content: [
                label(`# 拦截服务器包`),
                toggle(`update_player_game_type`, current.gamemode?.server_update_player_game_type ?? true),
                toggle(`update_abilities`, current.gamemode?.server_update_abilities ?? true),
                toggle(`correct_player_move_prediction`, current.gamemode?.correct_player_move_prediction ?? true),
                label(`# 拦截客户端包`),
                toggle(`subchunk_request`, current.gamemode?.client_subchunk_request),
                toggle(`player_auth_input`, current.gamemode?.client_player_auth_input),
            ]
        },
        (_, result) => {
            if (result === undefined) return main();
            if (!current.gamemode) current.gamemode = {};
            current.gamemode.server_update_player_game_type = result[1];
            current.gamemode.server_update_abilities = result[2];
            current.gamemode.correct_player_move_prediction = result[3];
            current.gamemode.client_subchunk_request = result[5];
            current.gamemode.client_player_auth_input = result[6];
        }
    );

    main();
}

function nightVision() {
    let current = data.get(this.player);
    let duration = 1000000;
    let enabled = current.night_vision = !current.night_vision;
    this.player.queue('mob_effect', {
        runtime_entity_id: this.player.local.runtime_entity_id,
        event_id: enabled ? 'add' : 'remove',
        effect_id: 16,
        amplifier: enabled ? 1 : 0,
        particles: false,
        duration: enabled ? duration * 20/* tick */ : 0,
        tick: 0n  // >= 1.20.71
    });
}

export function onServerPackets({ name, params }) {
    let current = data.get(this.player);

    if (current.timer && name === 'set_time') this.cancel();

    current.gamemode?.mode
    && (
        (name === 'update_player_game_type' && (current.gamemode.server_update_player_game_type ?? true))
        || (name === 'update_abilities' && (current.gamemode.server_update_abilities ?? true))
        || (name === 'correct_player_move_prediction' && (current.gamemode.correct_player_move_prediction ?? true))
    )
    && this.cancel();
}

export function onClientPackets({ name, params }) {
    let current = data.get(this.player);

    current.gamemode?.mode
    && (
        (name === 'subchunk_request' && current.gamemode.client_subchunk_request)
        || (name === 'player_auth_input' && current.gamemode.client_player_auth_input)
    )
    && this.cancel();
}

import * as nbs from "@encode42/nbs.js";
import { EventEmitter } from "events";
import fs from "fs";
import _ from "lodash";
import * as paths from "path";

import { utils as bossEventUtils } from "../packets/boss_event.js";
import {
    button,
    custom_form, dropdown,
    form,
    step_slider,
    textures
} from "../packets/modal_form_request.js";
import { betterArray, sleep, trying } from "../utils/js/functions.js";
import createJsonStorage from "../utils/js/json-storage.js";
import { SS, ss } from "../utils/mc/mc-text.js";
import { globalId } from "../utils/mc/packets.js";
import createPlayerStorage from "../utils/mc/player-storage.js";
import { requestModalForm } from "../utils/mc/relays.js";

export const metadata = {
    namespace: "vip.cdms.nbs-player",
    name: "NBS播放器",
    description: "我去, 使用BrodGeo播放NBS音乐!",
    version: [ 1, 0, 0 ],
    author: "Cdm2883",
    quick_menu: {
        text: player => `NBS播放器 ${SS}${data.get(player).playing ? 2 : 4}●`,
        image: textures('textures/blocks/noteblock')
    }
};

class NbsPlayer extends EventEmitter {
    static INSTRUMENTS = {
        0:  'note.harp',           1:  'note.bassattack',
        2:  'note.bd',             3:  'note.snare',
        4:  'note.hat',            5:  'note.guitar',
        6:  'note.flute',          7:  'note.bell',
        8:  'note.chime',          9:  'note.xylobone',
        10: 'note.iron_xylophone', 11: 'note.cow_bell',
        12: 'note.didgeridoo',     13: 'note.bit',
        14: 'note.banjo',          15: 'note.pling',
    };
    static playNote = (player, note) => player.write('play_sound', {
        name: NbsPlayer.INSTRUMENTS[note.instrument],
        coordinates: {
            // https://github.com/pmmp/BedrockProtocol/blob/8d63f39bb2cded3d3e578fd3cf7bc769b9674857/src/PlaySoundPacket.php#L56
            // https://github.com/lgc-LLDev/NBSPlayer/blob/9971b497e3b060e90e0e79ae6e5d7535ad26b469/nbs-player/src/player.ts#L65
            x: Math.round(player.local.position.x * 8),
            y: Math.round((player.local.position.y + 0.37 /* HEAD */) * 8),
            z: Math.round(player.local.position.z * 8)
        },
        volume: note.velocity,
        // https://github.com/encode42/NBSPlayer/blob/74ff96ad44347d13a9f516df14e63b3a4d48e670/src/audio/audio.js#L26
        pitch: 2 ** ((note.key + (note.pitch / 100) - 45) / 12)
    });
    
    static fromFile(path) {
        const file = fs.readFileSync(path);
        const buffer = new Uint8Array(file).buffer;
        const song = nbs.fromArrayBuffer(buffer);
        return new NbsPlayer(song);
    }
    constructor(song) {
        super();
        this.song = song;
        this.multiplier = 1;
        this.length = song.getLength();
        this.timePerTick = song.getTimePerTick();
        this.reset();
        this.on('end', this.reset.bind(this));
    }

    async play() {
        if (this.playing) return;
        this.playing = true;
        while (this.playing) await this.frame();
    }
    pause() { this.playing = false; }
    reset() { this.pause(); this.tick = 0; }

    async frame() {
        for (let layer of this.song.layers)
            if (!layer.isLocked) for (let [ tick, note ] of layer.notes)
                if (tick === this.tick && note) this.emit('note', note);
        this.emit('progress', this.tick / this.length);

        await sleep(this.timePerTick / this.multiplier);
        if (++this.tick >= this.length) this.emit('end');
    }
}


const musicRoot = './bridgeo-data/data/nbs-player';
const showPath = path => _.trimEnd(path.slice(paths.resolve(musicRoot, '').length + 1), '.nbs');

const PlaybackOrder = { Sequential: '顺序播放', ListLoops: '列表循环', Shuffle: '随机播放', SingleLoop: '单曲循环' };
const onPlayEnd = {
    [PlaybackOrder.Sequential]: function () {
        this.logger.info(`顺序播放`);
    },
    [PlaybackOrder.ListLoops]: function () {
        this.logger.info(`列表循环`);
    },
    [PlaybackOrder.Shuffle]: function () {
        this.logger.info(`随机播放`);
    },
    [PlaybackOrder.SingleLoop]: function () {
        this.logger.info(`单曲循环`);
    },
};

const data = createPlayerStorage(player => ({
    playing: null,  // path: string <- playlist
    player: null,
    multiplier: 1,
    onEnd: onPlayEnd[PlaybackOrder.Sequential],
    order: PlaybackOrder.Sequential,
    playlist: createJsonStorage(`nbs-player/${player.profile.name}`, [])
}), true);

function play(path) {
    const current = data.get(this.player);

    if (current.playing) current.player.pause();
    current.playing = path;
    current.player = NbsPlayer.fromFile(path);
    current.player.multiplier = current.multiplier;

    current.player.on('note', note =>
        trying(() => NbsPlayer.playNote(this.player, note), null));

    // current.player.on('note', note =>
    //     trying(() => this.server.queue('command_request', {
    //         command: '/execute as @a at @s run playsound '
    //             + NbsPlayer.INSTRUMENTS[note.instrument] + ' '
    //             + '@s ~~~ '
    //             + note.velocity + ' '
    //             + (2 ** ((note.key + (note.pitch / 100) - 45) / 12)),
    //         origin: {
    //             type: 'player',
    //             uuid: '',
    //             request_id: '',
    //         },
    //         internal: false,
    //         version: 52,
    //     }), null));

    const showName = path => showPath(path).split(paths.sep).pop();
    const bossId = BigInt(globalId.new);
    const colors = betterArray('4c6e2a3sb5d'.split(''));
    const hideBossBar = () => trying(() => bossEventUtils.removeBossBar.call(this, bossId), null);
    const hideBossBarDebounced =
        _.debounce(hideBossBar, current.player.timePerTick + 1000);
    current.player.on('progress', progress => trying(() => {
        hideBossBar();
        const title = ss[`_l${colors[colors.loop]}`]`${showName(path)} | ${current.order}`;
        bossEventUtils.setBossBar.call(this, bossId, title, progress, 0);
        hideBossBarDebounced();
    }, null));

    current.player.on('end', () => current.onEnd.call(this));
    // noinspection JSIgnoredPromiseFromCall
    current.player.play();
}

export function quickMenu() {
    const current = data.get(this.player);

    const main = () => requestModalForm.call(this,
        {
            ...form(
                metadata.quick_menu.text(this.player),
                current.playing ?
                    `当前播放: ${showPath(current.playing)}\n`
                    + `播放顺序: ${current.order}\n`
                    + `播放列表: ${current.playlist.length} 首`
                    : '当前未播放音乐'
            ),
            buttons: [
                button(`播放控制`),
                button(`播放列表`),
                button(`音乐列表`)
            ]
        },
        (_, result) => {
            if (result === undefined) return;
            if (result === 0) return controller();
            if (result === 1) return playlist();
            if (result === 2) return musics(musicRoot);
        }
    );

    const multipliers = [ .5, 1, 1.5, 2 ];
    const controller = () => requestModalForm.call(this,
        {
            ...custom_form(`播放控制`),
            content: [
                step_slider(
                    `播放状态`,
                    [ `继续`, `暂停`, `重新播放`, `关闭` ],
                    (!current.player) ? 3 : (current.player.playing ? 0 : 1)
                ),
                step_slider(`播放倍数`, multipliers.map(String), multipliers.indexOf(current.multiplier)),
                dropdown(`播放顺序`, Object.values(PlaybackOrder), Object.values(PlaybackOrder).indexOf(current.order))
            ]
        },
        (_, result) => {
            if (result === undefined) return main();

            const playStatus = result[0];
            const playMultiplier = result[1];
            const playOrder = result[2];

            if (playStatus === 0) {  // 继续
                if (current.player) current.player.play();
                else if (current.playlist.length > 0) play.call(this, current.playlist[0]);
            }
            if (playStatus === 1 && current.player) { // 暂停
                current.player.pause();
            }
            if (playStatus === 2 && current.player) { // 重新播放
                current.player.tick = 0;
                current.player.play();
            }
            if (playStatus === 3) { // 关闭
                if (current.player) current.player.pause();
                current.playing = false;
                current.player = null;
            }

            current.multiplier = multipliers[playMultiplier];
            if (current.player) current.player.multiplier = current.multiplier;

            current.order = PlaybackOrder[Object.keys(PlaybackOrder)[playOrder]];
            current.onEnd = onPlayEnd[current.order];
        }
    );

    const playlist = () => requestModalForm.call(this,
        {
            ...form(`播放列表`, `共 ${current.playlist.length} 首`),
            buttons: current.playlist.map(path =>
                path === current.playing ?
                    button(showPath(path), textures('textures/ui/icon_saleribbon'))
                    : button(showPath(path))
            )
        },
        (_, index) => index === undefined ? main() : requestModalForm.call(this, {
            ...form(`选择音乐`, showPath(current.playlist[index])),
            buttons: [
                button(`播放`),
                button(`上调`),
                button(`下调`),
                button(`从列表中删除`)
            ]
        }, (_, result) => {
            if (result === undefined) return playlist();
            if (result === 0) return play.call(this, current.playlist[index]);

            if (result === 1 && index !== 0)
                current.playlist[index] = current.playlist.splice(index - 1, 1, current.playlist[index])[0];
            if (result === 2 && index !== current.playlist.length - 1)
                current.playlist[index] = current.playlist.splice(index + 1, 1, current.playlist[index])[0];
            if (result === 3)
                current.playlist.splice(index, 1);

            return playlist();
        })
    );

    const musics = path => {
        const names = fs.readdirSync(path);
        const dirs = [], files = [];
        names.forEach(name => {
            const full = paths.resolve(path, name);
            const stats = fs.lstatSync(full);
            const item = { name, full };
            stats.isDirectory() ? dirs.push(item) : files.push(item);
        });

        const builder = { ...form(`音乐列表`, showPath(path)) };
        builder.buttons = [
            button(`全部添加到播放列表`),
            ...dirs.map(item => button(item.name, textures('textures/ui/storageIconColor'))),
            ...files.map(item => button(item.name, textures('textures/ui/copy'))),
        ];

        const callback = (_, result) => {
            if (result === undefined) return main();
            if (result === 0) {
                current.playlist.push(...files.map(item => item.full));
                return main();
            }

            let index = result - 1;
            if (index < dirs.length) return musics(dirs[index].full);

            index = result - dirs.length - 1;
            current.playlist.push(files[index].full);
            return main();
        };

        requestModalForm.call(this, builder, callback);
    };

    main();
}

import {
    button,
    custom_form,
    form,
    inputDefaulted,
    step_slider,
    textures,
    toggle
} from "../packets/modal_form_request.js";
import { setIntervalUntilError } from "../utils/js/functions.js";
import { SS, ss } from "../utils/mc/mc-text.js";
import createPlayerStorage from "../utils/mc/player-storage.js";
import { requestModalForm } from "../utils/mc/relays.js";
import { string2xyz, string2xz, vector2string } from "../utils/mc/vectors.js";

export const metadata = {
    namespace: "vip.cdms.camera-free",
    name: "自由摄像机",
    description: "自由调整摄像机!",
    version: [ 1, 0, 0 ],
    author: "Cdm2883",
    quick_menu: {
        text: function () {
            let status = data.get(this.player).enabled;
            status = status ? 2 : 4;
            status = SS + status + '●';
            return '自由摄像机 ' + status;
        },
        image: textures('textures/ui/vr_glyph_color')
    }
};
const templates = [
    {
        name: '俯视',
        position: string2xyz('~ ~20 ~'),
        rotation: string2xz('~ ~')
    },
    {
        name: '鸟瞰',
        ease: true,
        position: string2xyz('~ ~20 ~'),
        rotation: string2xz('90 0')
    },
    {
        name: '过肩视角',
        ease: true,
        position: string2xyz('^-2 ^2 ^-4'),
        facing: string2xyz('^ ^ ^5')
    }
];

const data = createPlayerStorage(() => ({ instructions: [] }));

// noinspection JSUnusedGlobalSymbols
export function quickMenu() {
    let current = data.get(this.player);

    const main = () => requestModalForm.call(this,
        {
            ...form(
                metadata.quick_menu.text.call(this),
                current.instruction ? '>>> ' + current.instruction.name : '当前未启动摄像机'
            ),
            buttons: [
                button(ss.$`$l[ $n添加摄像机$r $l]`, textures('textures/ui/vr_glyph_color')),
                button(ss.$`$l[ $n清除摄像机$r $l]`, textures('textures/ui/world_glyph_color')),
                ...(current.instructions ?? []).map(instruction =>
                    button(
                        instruction.name
                        + (current.instruction === instruction ? ` ${SS}r${SS}2●` : '')))
            ]
        },
        (_, result) => {
            if (result === undefined) return;
            if (result === 0) return add();
            if (result === 1) return clearInstruction.call(this);
            check(current.instructions[result - 2]);
        }
    );

    const add = () => requestModalForm.call(this,
        {
            ...form(
                metadata.quick_menu.text.call(this),
                `选择添加方式`
            ),
            buttons: [
                button(`当前位置`, textures('textures/ui/icon_map')),
                button(`开始录制`, textures('textures/items/map_empty')),
                ...templates.map(template =>
                    button(`[预设] ${template.name}`, textures('textures/items/map_locked')))
            ]
        },
        (_, result) => {
            if (result === undefined) return main();
            switch (result) {

            case 0:
                let position = {
                    x: this.player.local.position.x.toFixed(2),
                    y: this.player.local.position.y.toFixed(2) + 1,
                    z: this.player.local.position.z.toFixed(2)
                };
                let rotation = {
                    x: Math.trunc(this.player.local.pitch),
                    z: Math.trunc(this.player.local.yaw)
                };

                current.instructions.push({
                    name: Object.values(position).join(', ')
                        + '@'
                        + Object.values(rotation).join('|'),
                    ease: true,
                    position, rotation
                });
                main();
                break;

            case 1:
                // TODO record mode
                break;

            default:
                let template = templates[result - 2];
                template = JSON.parse(JSON.stringify(template));
                current.instructions.push(template);
                main();
            }
        }
    );

    const check = instruction => requestModalForm.call(this,
        {
            ...custom_form(`修改摄像机`),
            content: [
                inputDefaulted(`显示名称`, instruction.name),
                toggle(`相机视角平滑过渡`, !!instruction.ease),
                inputDefaulted(`摄像机坐标 (x, y, z)`, vector2string(instruction.position)),
                inputDefaulted(`摄像机偏转 (x, z)`, vector2string(instruction.rotation)),
                inputDefaulted(`摄像机朝向 (x, y, z)`, vector2string(instruction.facing)),
                step_slider(`# 操作`, [ `开启`, `保存`, `删除` ])
            ]
        },
        (_, result) => {
            if (result === undefined) return main();
            const save = () => {
                let edited = {
                    name: result[0].trim(),
                    ease: result[1],
                    position: string2xyz(result[2].trim()),
                    rotation: string2xz(result[3].trim()),
                    facing: string2xyz(result[4].trim())
                };
                current.instructions = current.instructions.map(item => item !== instruction ? item : edited);
                instruction = edited;
            };

            switch (result[5]) {
            case 0:
                save();
                startInstruction.call(this, instruction);
                break;
            case 1:
                save();
                main();
                break;
            case 2:
                current.instructions = current.instructions.filter(item => item !== instruction);
                main();
                break;
            }
        }
    );

    main();
}

function clearInstruction() {
    let current = data.get(this.player);
    current.enabled = false;
    current.instruction = undefined;
    if (current.loop) clearInterval(current.loop);
    setTimeout(() =>
        this.player.queue('camera_instruction', { clear: true }), 8);
}
function startInstruction(instruction) {
    let current = data.get(this.player);
    current.enabled = true;
    current.instruction = instruction;
    if (current.loop) clearInterval(current.loop);

    const parsePosition = pos => {
        const local = (deltaX, deltaY, deltaZ) => {
            let { x: exeX, y: exeY, z: exeZ } = this.player.local.position;
            let yaw = this.player.local.yaw * Math.PI / 180;
            let pitch = this.player.local.pitch * Math.PI / 180;

            let offsetX = -deltaZ * Math.sin(yaw) * Math.cos(pitch) + deltaX * Math.cos(yaw) - deltaY * Math.sin(yaw) * Math.sin(pitch);
            let offsetY = deltaZ * Math.sin(pitch) - deltaY * Math.cos(yaw) * Math.cos(pitch) + deltaX * Math.sin(pitch) * Math.cos(yaw);
            let offsetZ = deltaZ * Math.cos(pitch) * Math.cos(yaw) + deltaY * Math.sin(pitch) + deltaX * Math.cos(pitch) * Math.sin(yaw);

            let absoluteX = exeX + offsetX;
            let absoluteY = exeY + offsetY;
            let absoluteZ = exeZ + offsetZ;

            return { x: absoluteX, y: absoluteY, z: absoluteZ };
        };

        let needLocal = false;
        const relative = (x, delta) => {
            if (typeof x !== 'string') return x;
            let suffix = x.substring(0, 1);
            let num = Number(x.substring(1));
            if (Number.isNaN(num)) num = 0;
            if (suffix === '^') {
                needLocal = true;
                return num;
            }
            return suffix === '~' ? num + delta : x;
        };
        let x = relative(pos.x, this.player.local.position.x);
        let y = relative(pos.y, this.player.local.position.y);
        let z = relative(pos.z, this.player.local.position.z);
        return needLocal ? local(x, y, z) : { x, y, z };
    };
    const parseRotation = rot => {
        const relative = (x, delta) => {
            if (typeof x !== 'string') return x;
            let suffix = x.substring(0, 1);
            let num = Number(x.substring(1));
            if (Number.isNaN(num)) num = 0;
            return suffix === '~' ? num + delta : x;
        };

        let x = relative(rot.x, this.player.local.pitch);
        let z = relative(rot.z, this.player.local.yaw);
        return { x, z };
    };

    const send = () => {
        let packet = { instruction_set: { runtime_id: 1 } };

        packet.instruction_set.position = parsePosition(instruction.position);
        if (instruction.ease) packet.instruction_set.ease_data = { type: 'InOutQuad', duration: 0.25 };
        if (instruction.rotation) packet.instruction_set.rotation = parseRotation(instruction.rotation);
        if (instruction.facing) packet.instruction_set.facing = parsePosition(instruction.facing);

        this.player.queue('camera_instruction', packet);
    };

    const findRelative = vec => {
        for (let value of Object.values(vec))
            if (typeof value === 'string') return true;
        return false;
    };
    let needLoop =
        findRelative(instruction.position)
        || findRelative(instruction.rotation)
        || findRelative(instruction.facing);

    if (needLoop) current.loop = setIntervalUntilError(send, 1);
    else send();

}

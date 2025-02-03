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
    namespace: "vip.cdms.storyboard",
    name: "分镜大蛇",
    description: "拍摄你的世界",
    version: [ 1, 0, 0 ],
    author: "Cdm2883",
    quick_menu: {
        text: player => `分镜大蛇`,
        image: textures('textures/')
    }
};



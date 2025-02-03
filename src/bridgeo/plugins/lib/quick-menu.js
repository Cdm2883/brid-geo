// noinspection JSUnusedGlobalSymbols,JSUnresolvedReference

import { lazy } from "../../utils/js/functions.js";
import { enabledPlugins, importPlugin } from "../../utils/js/plugins.js";
import { requestModalForm } from "../../utils/mc/relays.js";

export const metadata = {
    namespace: "vip.cdms.quick-menu",
    name: "快捷菜单",
    description: "开发便捷, 使用快捷!",
    version: [ 1, 0, 0 ],
    author: "Cdm2883"
};
const config = {
    command: {
        name: "bridgeo",
        description: `§l§7// §rBridGeo §4Q§cu§6i§gc§ek§2M§ae§3n§du`
    }
};

const plugins = lazy(() => enabledPlugins.filter(({ module }) => module?.quickMenu));
function openSpecifiedMenu(command) {
    if (typeof command !== 'string')
        return importPlugin(command).then(module => module?.quickMenu?.call(this, undefined));

    let [ plugin, ...arg ] = command.split(' ');
    arg = arg.join(' ');
    importPlugin(plugin).then(module => module?.quickMenu?.call(this, arg));
}

function openMenu() {
    let form = {
        type: 'form',
        title: config.command.name,
        content: config.command.description,
        buttons: plugins.value.map(plugin => {
            let text =
                plugin?.module?.metadata?.quick_menu?.text
                ?? plugin?.module?.metadata?.name
                ?? plugin.name;
            if (typeof text === 'function') text = text.call(this, this.player);
            let button = { text };
            let image = plugin?.module?.metadata?.quick_menu?.image;
            if (image) button.image = image;
            return button;
        })
    };

    let callback = packet => {
        if (packet.has_cancel_reason) return;
        let data = Number(packet.data);
        openSpecifiedMenu.call(this, plugins.value[data]);
    };

    requestModalForm.call(this, form, callback);
}

export function onServerPackets({ name, params }) {
    if (name !== 'available_commands') return;

    const options = {
        unused: 0,
        collapse_enum: 0,
        has_semantic_constraint: 0,
        as_chained_command: 0,
        unknown2: 0
    };
    const parameter = (parameter_name, value_type) => ({
        parameter_name,
        value_type,
        enum_type: "valid",
        optional: true,
        options
    });
    const overloads = [ {
        chaining: false,
        parameters: [
            parameter("plugin", "file_path"),
            parameter("arg", 56)
        ]
    } ];
    params.command_data.push({
        name: config.command.name,
        description: config.command.description,
        flags: 0x80,
        permission_level: 0,
        alias: -1,
        chained_subcommand_offsets: [],
        overloads
    });
}

const openSpecifiedMenuReg = new RegExp(`^/${config.command.name} (.+)$`);
function onCommandRequest({ command }) {
    const commandPrefix = '/' + config.command.name;
    if (command.trim() === commandPrefix) {
        this.cancel();
        return openMenu.call(this);
    }

    const match = command.match(openSpecifiedMenuReg);
    if (match) {
        this.cancel();
        // noinspection JSIgnoredPromiseFromCall
        openSpecifiedMenu.call(this, match[1]);
    }
}

export function onClientPackets({ name, params }) {
    if (name === 'command_request') return onCommandRequest.call(this, params);
}

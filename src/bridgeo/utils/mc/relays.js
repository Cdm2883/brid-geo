import _ from "lodash";

import { build as modalFormRequestPacket } from "../../packets/modal_form_request.js";
import { CHECK } from "../js/type-check.js";
import { globalId } from "./packets.js";

function optionsDestinationTo(options, host, port) {
    CHECK.IsNotDefined({ options });

    const newOptions = _.cloneDeep(options);
    newOptions.destination ??= {};
    newOptions.destination.host = host;
    newOptions.destination.port = port;
    return newOptions;
}

function requestModalForm(data, callback) {
    CHECK.IsNotDefined({ data });

    let id = globalId.new;
    this.player.queue(...modalFormRequestPacket(id, data));
    const onResponse = packet => {
        if (packet?.form_id !== id)
            return this.packets.once('client.modal_form_response', onResponse);

        // noinspection JSUnresolvedReference
        if (packet.has_cancel_reason) return callback(packet, undefined);

        let result = packet.data;
        switch (data.type) {
        case 'modal':
            // TODO 忘记了modal表单的返回值类型...
            break;
        case 'form':
            result = Number(result);
            break;
        case 'custom_form':
            result = JSON.parse(result);
            break;
        }

        callback(packet, result);
    };
    if (callback) onResponse();
}

function RequestModalFormBuilder(context) {
    CHECK.ConstructorInvokedWithoutNew(new.target);
    CHECK.IsNotDefined({ context });

    // TODO
}

export {
    optionsDestinationTo,
    requestModalForm, RequestModalFormBuilder
};

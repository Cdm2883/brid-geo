import _ from "lodash";

import { enabledPlugins, lifecycle } from "../../utils/js/plugins.js";

export const metadata = {
    namespace: "vip.cdms.export-listener",
    name: "导出监听器",
    description: "在插件中导出函数即可监听生命周期事件!",
    version: [ 1, 0, 0 ],
    author: "Cdm2883"
};

const toUpperCamelCase =
    _.memoize(string => _.upperFirst(_.camelCase(string)));
const lifecycleListener = (eventName, ...args) => {
    for (const { module } of enabledPlugins)
        module['lifecycle$on' + toUpperCamelCase(eventName)]?.call(lifecycle, ...args);
};

export function onEnabled() {
    lifecycle.on('_emit', lifecycleListener);
}
export function onDisabled() {
    lifecycle.off('_emit', lifecycleListener);
}

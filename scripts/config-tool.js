// noinspection JSIgnoredPromiseFromCall,ES6PreferShortImport

import chalk from 'chalk';
import * as terminalKit from "terminal-kit";

import { setupPlugins } from "@/bridgeo/utils/js/plugins.js";

const { default: { terminal } } = terminalKit;

function main() {
    console.clear();
    terminal(`\n`);
    terminal(String.raw`  ╔╗ ┬─┐┬┌┬┐ ╔═╗┌─┐┌─┐` + '\n');
    terminal(String.raw`  ╠╩╗├┬┘│ ││ ║ ╦├┤ │ │` + '\n');
    terminal(String.raw`  ╚═╝┴└─┴─┴┘ ╚═╝└─┘└─┘` + '\n');
    terminal(`  配置工具:\n`);

    terminal.singleColumnMenu(
        [
            chalk.red.bgRed('<< 退出'),
            "1. BridGeo基本配置",
            "2. BridGeo插件管理",
            "3. 地图渲染材质包管理"
        ],
        (_error, response) => {
            switch (response.selectedIndex) {

            case 0:
                console.clear();
                process.exit();
                break;

            case 1:
                bridgeo();
                break;

            case 2:
                pluginManager();
                break;

            case 3:
                resourcePacks();
                break;

            }
        }
    );
}

function bridgeo() {}

async function pluginManager(selected = 0) {
    let plugins; {
        console.clear();
        terminal('加载插件列表 ');
        let spinner = await terminal.spinner('impulse');

        plugins = await setupPlugins();

        spinner.destroy();
        console.clear();
    }

    function plugin(index) {
        let plugin = plugins[index];
        let metadata = plugin.module.metadata;

        console.clear();
        terminal('\n');
        terminal.table(
            [
                [ '名称', metadata.name ],
                [ '描述', metadata.description ],
                [ '版本', metadata.version ],
                [ '作者', metadata.author ],
            ],
            {
                hasBorder: true,
                contentHasMarkup: true,
                borderChars: 'lightRounded',
                borderAttr: { color: 'grey' },
                firstColumnTextAttr: { bold: true, color: 'cyan' },
                width: 60,
                fit: true
            }
        );
        terminal.singleLineMenu(
            [ '<< 返回插件列表', plugin.isEnabled ? '禁用插件' : '启用插件' ],
            {
                y: 1,
                style: terminal.inverse
            },
            (_error, response) => {
                if (response.selectedIndex === 1) plugin.setEnable(!plugin.isEnabled);
                pluginManager(index + 1);
            }
        );

    }

    terminal('\n BridGeo插件管理:\n');
    terminal.singleColumnMenu(
        [
            chalk.red.bgRed('<< 返回主菜单'),
            ...plugins.map(plugin => {
                let metadata = plugin.module.metadata;
                let enabled = `[${plugin.isEnabled ? chalk.green('x') : ' '}]`;
                let name = metadata.name;
                let version = metadata.version ? chalk.grey(`v${metadata.version.join('.')}`) : '';

                return `${enabled} ${name} ${version}`;
            })
        ],
        {
            selectedIndex: selected
        },
        (_error, response) => {
            let selectedIndex = response.selectedIndex;
            if (selectedIndex === 0) return main();

            plugin(selectedIndex - 1);
        }
    );
}

function resourcePacks() {}

main();

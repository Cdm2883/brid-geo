const build = {};
build.hide_bar = boss_entity_id => [
    'boss_event',
    {
        boss_entity_id,
        type: 'hide_bar',
        title: undefined,
        progress: undefined,
        screen_darkening: undefined,
        color: undefined,
        overlay: undefined,
        player_id: undefined
    }
];
build.show_bar = (
    boss_entity_id,
    title,
    progress = .5,
    screen_darkening = 0,
    color = 0,
    overlay = 0
) => [
    'boss_event',
    {
        boss_entity_id,
        type: 'show_bar',
        title,
        progress,
        screen_darkening: 0,
        color,
        overlay,
        player_id: undefined,
    }
];

const utils = {};
utils.setBossBar = function (id, title = '', progress = .5, color = 0) {
    id = BigInt(id);

    this.player.write(...build.hide_bar(id));

    // https://github.com/LiteLDev/LegacyScriptEngine/blob/7ad8ee8547c6dacde1a21a6bb678c2ec83c3e9a5/src/legacy/api/PlayerAPI.cpp#L2165
    this.player.write('add_entity', {
        unique_id: id,
        runtime_id: id,
        entity_type: 'minecraft:player',
        position: {
            x: Math.round(this.player.local.position.x),
            y: -60,
            z: Math.round(this.player.local.position.z)
        },
        velocity: { x: 0, y: 0, z: 0 },
        pitch: 0,
        yaw: 0,
        head_yaw: 0,
        body_yaw: 0,
        attributes: [],
        metadata: [],
        properties: { ints: [], floats: [] },
        links: []
    });

    this.player.write(...build.show_bar(id, title, progress, 0, color));
};
utils.removeBossBar = function (id) {
    id = BigInt(id);
    this.player.write(...build.hide_bar(id));
};

export { build, utils };

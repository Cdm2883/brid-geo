import createJsonStorage from "../js/json-storage.js";

function createPlayerStorage(
    defaultPlayer = _player => ({}),
    singleLevel = false,
    persistence = ''  // path
) {
    const storage = persistence ?
        createJsonStorage(persistence, {}) : {};
    storage.get = player => {
        let xuid = player.profile.xuid;

        if (singleLevel) return storage[xuid] ?? (storage[xuid] = defaultPlayer(player));

        let { id: levelId } = player.getLevel();

        let level = storage[levelId] ?? (storage[levelId] = {});
        return level[xuid] ?? (storage[levelId][xuid] = defaultPlayer(player));
    };
    return storage;
}

export default createPlayerStorage;

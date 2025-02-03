import MinecraftData from "minecraft-data";

export default function trans({ params }) {
    this.client.write('login', {
        ...MinecraftData(this.client.version).loginPacket,
        entityId: params.entityId,
        isHardcore: false,
        maxPlayers: null,
        viewDistance: null,
        simulationDistance: null,
        reducedDebugInfo: null,
        enableRespawnScreen: null,
        doLimitedCrafting: null,
        worldType: null,
        worldName: null,
        hashedSeed: null,
        gameMode: params.player_gamemode,
        previousGameMode: params.player_gamemode,
        isDebug: false,
        isFlat: false,
        death: null,
        portalCooldown: null,
    });
}

/// <reference types="@altv/types-server" />
import alt from 'alt-server';
import { DEFAULT_CONFIG } from '../configuration/config';

alt.on('gamestate:SetupPlayer', handleSetupPlayer);
alt.onClient('gamestate:SelectVehicle', handleSelectVehicle);

// Game Logic
// 1. Call reset map.
// 2. Remove syncedMeta from all players.
// 3. Set map and reset scores.
// 4. Setup syncedMeta for all players.

let currentMapIndex = 0;
let currentScoreCount = 0;
let currentMapInfo = DEFAULT_CONFIG.MAPS[currentMapIndex];
let validPlayers = [];

function nextMap() {
    currentMapIndex += 1;

    if (currentMapIndex > DEFAULT_CONFIG.MAPS.length) {
        currentMapIndex = 0;
    }

    currentMapInfo = DEFAULT_CONFIG.MAPS[currentMapIndex];
    resetMap();
}

function resetMap() {
    currentScoreCount = 0;
    validPlayers = [];

    const currentPlayers = alt.Player.all.filter(p => {
        if (p.isAuthorized) {
            return true;
        }
    });

    for (let i = 0; i < currentPlayers.length; i++) {
        const player = currentPlayers[i];
        if (!player || !player.valid) {
            continue;
        }

        handleSetupPlayer(player);
    }
}

export function handleSetupPlayer(player) {
    player.emit('chat:Destroy');
    player.emit('vehicle:Models', currentMapInfo.vehicles, DEFAULT_CONFIG.VEHICLE_SELECT_SPAWN);
    player.setSyncedMeta('FadeScreen', true);
    player.setSyncedMeta('Ready', false);
    player.setSyncedMeta('Canister', null);
    player.setSyncedMeta('CanisterPos', null);
    player.setSyncedMeta('Frozen', true);
    player.setSyncedMeta('Invisible', true);
    player.setSyncedMeta('Selection', true);

    player.pos = DEFAULT_CONFIG.VEHICLE_SELECT_SPAWN;
    player.dimension = player.id;

    if (player.lastVehicle && player.lastVehicle.destroy) {
        player.lastVehicle.destroy();
        player.lastVehicle = null;
    }
}

function handleSelectVehicle(player, model) {
    if (!player.getSyncedMeta('Selection')) {
        handleSetupPlayer(player);
        return;
    }

    player.vehicleModel = model;
    player.setSyncedMeta('Selection', false);
    spawnPlayer(player);
}

function spawnPlayer(player) {
    if (player.lastVehicle && player.lastVehicle.destroy) {
        player.lastVehicle.destroy();
        player.lastVehicle = null;
    }

    player.lastVehicle = new alt.Vehicle(
        player.vehicleModel,
        currentMapInfo.spawn.x,
        currentMapInfo.spawn.y,
        currentMapInfo.spawn.z,
        0,
        0,
        0
    );

    player.setIntoVehicle(player.lastVehicle);
}

resetMap();

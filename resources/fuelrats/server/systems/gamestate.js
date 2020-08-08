/// <reference types="@altv/types-server" />
import alt from 'alt-server';
import { DEFAULT_CONFIG } from '../configuration/config';
import { distance } from '../utility/vector';

alt.setInterval(handleUpdates, 5);
alt.on('gamestate:SetupPlayer', handleSetupPlayer);
alt.on('playerDisconnect', playerDisconnect);
alt.onClient('gamestate:SelectVehicle', handleSelectVehicle);
alt.onClient('gamestate:Collide', handleVehicleColliison);

// Game Logic
// 1. Call reset map.
// 2. Remove syncedMeta from all players.
// 3. Set map and reset scores.
// 4. Setup syncedMeta for all players.

let paused = false;
let nextCanisterPickup = Date.now() + 1000;
let currentMapIndex = 0;
let currentScoreCount = 0;
let currentMapInfo = DEFAULT_CONFIG.MAPS[currentMapIndex];

let canisterInfo = {
    owner: null,
    goal: currentMapInfo.goals[0],
    pos: currentMapInfo.canisters[0],
    release: false,
    spawn: currentMapInfo.spawn
};

function nextMap() {
    currentMapIndex += 1;
    currentScoreCount = 0;

    if (currentMapIndex >= DEFAULT_CONFIG.MAPS.length) {
        currentMapIndex = 0;
    }

    currentMapInfo = DEFAULT_CONFIG.MAPS[currentMapIndex];
    resetMap();
}

function resetMap() {
    currentScoreCount = 0;

    const currentPlayers = alt.Player.all.filter(p => {
        if (p.isAuthorized) {
            return true;
        }
    });

    setupObjective();

    for (let i = 0; i < currentPlayers.length; i++) {
        const player = currentPlayers[i];
        if (!player || !player.valid) {
            continue;
        }

        handleSetupPlayer(player);
    }
}

function setupObjective() {
    paused = true;

    canisterInfo.owner = null;
    canisterInfo.pos = currentMapInfo.canisters[Math.floor(Math.random() * currentMapInfo.canisters.length)];
    canisterInfo.goal = currentMapInfo.goals[Math.floor(Math.random() * currentMapInfo.goals.length)];
    canisterInfo.release = false;
    canisterInfo.spawn = currentMapInfo.spawn;

    const currentPlayers = alt.Player.all.filter(p => {
        if (p.isAuthorized && p.getSyncedMeta('Ready') && p.vehicle && p.valid) {
            return true;
        }
    });

    for (let i = 0; i < currentPlayers.length; i++) {
        const player = currentPlayers[i];
        player.setSyncedMeta('Ready', false);
        spawnPlayer(player);
    }

    alt.setTimeout(() => {
        canisterInfo.release = true;

        for (let i = 0; i < currentPlayers.length; i++) {
            const player = currentPlayers[i];
            if (!player || !player.valid) {
                continue;
            }
        }
    }, 3000);

    paused = false;
}

export function handleSetupPlayer(player) {
    if (!player || !player.valid) {
        return;
    }

    player.emit('chat:Destroy');
    player.emit('vehicle:Models', currentMapInfo.vehicles, DEFAULT_CONFIG.VEHICLE_SELECT_SPAWN);
    player.setSyncedMeta('FadeScreen', true);
    player.setSyncedMeta('Ready', false);
    player.setSyncedMeta('Canister', null);
    player.setSyncedMeta('Frozen', true);
    player.setSyncedMeta('Invisible', true);
    player.setSyncedMeta('Selection', true);

    player.pos = DEFAULT_CONFIG.VEHICLE_SELECT_SPAWN;

    if (player.lastVehicle && player.lastVehicle.valid && player.lastVehicle.destroy) {
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

export function spawnPlayer(player) {
    if (player.lastVehicle && player.lastVehicle.valid && player.lastVehicle.destroy) {
        player.lastVehicle.destroy();
        player.lastVehicle = null;
    }

    player.spawn(currentMapInfo.spawn.x, currentMapInfo.spawn.y, currentMapInfo.spawn.z, 0);
    player.lastVehicle = new alt.Vehicle(
        player.vehicleModel,
        currentMapInfo.spawn.x,
        currentMapInfo.spawn.y,
        currentMapInfo.spawn.z,
        0,
        0,
        0
    );

    player.lastVehicle.customPrimaryColor = { r: 255, g: 255, b: 255, a: 255 };
    player.lastVehicle.customSecondaryColor = { r: 255, g: 255, b: 255, a: 255 };
    player.lastVehicle.player = player;
    player.dimension = 0;
    player.setIntoVehicle(player.lastVehicle);
    player.setSyncedMeta('Ready', true);

    if (!player.chatInit) {
        player.chatInit = true;
        player.emit('chat:Init');
    }
}

function handleVehicleColliison(player, vehicle) {
    if (!vehicle) {
        return;
    }

    if (vehicle.debug) {
        return;
    }

    if (!vehicle.player) {
        return;
    }

    if (vehicle.player === player) {
        return;
    }

    if (player.valid && player.vehicle) {
        player.vehicle.engineHealth = 999;
        player.emit('vehicle:Repair');
    }

    if (vehicle.player && vehicle.player.valid) {
        vehicle.engineHealth = 999;
        vehicle.player.emit('vehicle:Repair');
    }

    const playerHasCanister = canisterInfo.owner === player ? true : false;
    const targetHasCanister = canisterInfo.owner === vehicle.player ? true : false;

    if (playerHasCanister && Date.now() > nextCanisterPickup) {
        nextCanisterPickup = Date.now() + 500;
        handlePickup(vehicle.player);
        return;
    }

    if (targetHasCanister && Date.now() > nextCanisterPickup) {
        nextCanisterPickup = Date.now() + 500;
        handlePickup(player);
        return;
    }
}

function handlePickup(player) {
    if (canisterInfo.owner !== null) {
        canisterInfo.owner.vehicle.customPrimaryColor = { r: 255, g: 255, b: 255, a: 255 };
        canisterInfo.owner.vehicle.customSecondaryColor = { r: 255, g: 255, b: 255, a: 255 };
        canisterInfo.owner.vehicle.neon = {
            left: false,
            right: false,
            back: false,
            front: false
        };

        alt.emitClient(
            canisterInfo.owner,
            'audio:PlayFrontend',
            'Zone_Enemy_Capture',
            'DLC_Apartments_Drop_Zone_Sounds'
        );
    }

    canisterInfo.pos = player.pos;
    canisterInfo.owner = player;
    player.vehicle.customPrimaryColor = { r: 190, g: 110, b: 255, a: 255 };
    player.vehicle.customSecondaryColor = { r: 190, g: 110, b: 255, a: 255 };
    player.vehicle.neon = {
        left: true,
        right: true,
        back: true,
        front: true
    };
    player.vehicle.neonColor = { r: 190, g: 110, b: 255, a: 255 };

    alt.emitClient(player, 'audio:PlayFrontend', 'Zone_Team_Capture', 'DLC_Apartments_Drop_Zone_Sounds');

    const currentPlayers = alt.Player.all.filter(p => {
        if (p.getSyncedMeta('Ready')) {
            return true;
        }
    });

    for (let i = 0; i < currentPlayers.length; i++) {
        const player = currentPlayers[i];
        if (!player || !player.valid) {
            continue;
        }

        player.setSyncedMeta('Canister', canisterInfo);
    }
}

function handleUpdates() {
    if (paused) {
        return;
    }

    const currentPlayers = alt.Player.all.filter(p => {
        if (p.getSyncedMeta('Ready') && p && p.valid && p.vehicle) {
            return true;
        }
    });

    // Don't do shit if current players is non-existant.
    if (currentPlayers.length <= 0) {
        return;
    }

    for (let i = 0; i < currentPlayers.length; i++) {
        const player = currentPlayers[i];
        player.lastLocation = { ...player.pos };

        // Handle pickup from ground
        if (canisterInfo.owner === null) {
            const dist = distance(player.pos, canisterInfo.pos);
            if (dist <= 5 && nextCanisterPickup < Date.now()) {
                nextCanisterPickup = Date.now() + 500;
                handlePickup(player);
            }
        }

        // Update position if owner exists
        if (canisterInfo.owner === player) {
            canisterInfo.pos = player.pos;

            if (player.pos.z <= -1) {
                setupObjective();
                break;
            }

            const dist = distance(player.vehicle.pos, canisterInfo.goal);
            if (dist <= 5 && nextCanisterPickup < Date.now()) {
                nextCanisterPickup = Date.now() + 500;
                currentScoreCount += 1;

                alt.emitClient(null, 'audio:PlayFrontend', 'Whistle', 'DLC_TG_Running_Back_Sounds');

                if (currentScoreCount >= 2) {
                    currentScoreCount = 0;
                    nextMap();
                } else {
                    setupObjective();
                }
            }
        }

        // Update players with new canister data
        player.setSyncedMeta('Ping', player.ping);
        player.setSyncedMeta('Position', player.pos);
        player.setSyncedMeta('Canister', canisterInfo);
    }
}

function playerDisconnect(player) {
    alt.emitClient(null, 'player:RemoveBlip', player);

    if (canisterInfo.owner !== player) {
        return;
    }

    if (!player.lastLocation) {
        setupObjective();
        alt.emitClient(null, 'audio:PlayFrontend', 'Whistle', 'DLC_TG_Running_Back_Sounds');
        return;
    }

    canisterInfo.owner = null;
    canisterInfo.pos = player.lastLocation;
}

resetMap();

/// <reference types="@altv/types-client" />
import alt from 'alt-client';
import * as native from 'natives';
import { turnOnVehiclePicker, turnOffVehiclePicker } from '../panels/vehicleSelection';
import { drawMarker } from '../utility/markers';

alt.onServer('player:RemoveBlip', removeBlip);

const canisterModel = native.getHashKey('prop_jerrycan_01a');
const disabledControls = [37, 24, 25, 65, 66, 67, 68, 69, 70, 75, 91, 92, 58];
let interval;
let canisterObject;
let canisterBlip;
let canisterGoalBlip;
let canisterInfo;
let homeBlip;
let nextCollisionCheck = Date.now() + 1000;

native.requestModel(canisterModel);

const boundFunctions = {
    Ready: handleReady,
    Frozen: handleFrozen,
    Invisible: handleInvisible,
    FadeScreen: handleFadeScreen,
    Selection: handleVehicleSelection,
    Canister: handleCanister
};

alt.on('syncedMetaChange', handleSyncedMetaChange);

/**
 * @param  {string} key
 * @param  {any} value
 * @param  {any} oldValue
 */
function handleSyncedMetaChange(entity, key, newValue, oldValue) {
    if (entity.scriptID !== alt.Player.local.scriptID) {
        return;
    }

    if (!boundFunctions[key]) {
        return;
    }

    boundFunctions[key](newValue);
}

function handleReady(newValue) {
    if (!newValue) {
        if (interval) {
            alt.clearInterval(interval);
            interval = null;
        }

        return;
    }

    interval = alt.setInterval(handleTick, 0);
}

function handleFrozen(value) {
    native.freezeEntityPosition(alt.Player.local.scriptID, value);
}

function handleInvisible(value) {
    native.setEntityAlpha(alt.Player.local.scriptID, value ? 0 : 255, false);
}

function handleFadeScreen(value) {
    if (value) {
        native.doScreenFadeOut(250);
        return;
    }

    native.doScreenFadeIn(250);
}

function handleVehicleSelection(value) {
    if (value) {
        turnOnVehiclePicker();
        return;
    }

    turnOffVehiclePicker();
}

function handleCanister(value) {
    if (!alt.Player.local.getSyncedMeta('Ready')) {
        return;
    }

    canisterInfo = value;

    if (!canisterObject) {
        canisterObject = native.createObjectNoOffset(
            canisterModel,
            value.pos.x,
            value.pos.y,
            value.pos.z,
            false,
            false,
            false
        );

        native.freezeEntityPosition(canisterObject, true);
        native.setEntityCollision(canisterObject, false, false);
    }

    if (!canisterBlip) {
        canisterBlip = new alt.PointBlip(value.pos.x, value.pos.y, value.pos.z);
        canisterBlip.sprite = 361;
        canisterBlip.shortRange = false;
        canisterBlip.color = 1;
        canisterBlip.name = 'Canister';
        canisterBlip.priority = 99;
    } else {
        canisterBlip.pos = { ...value.pos };
    }

    if (!canisterGoalBlip) {
        canisterGoalBlip = new alt.PointBlip(value.pos.x, value.pos.y, value.pos.z);
        canisterGoalBlip.sprite = 38;
        canisterGoalBlip.shortRange = false;
        canisterGoalBlip.name = 'Goal';
    } else {
        canisterGoalBlip.pos = { ...value.goal };
    }

    if (!homeBlip) {
        homeBlip = new alt.PointBlip(value.spawn.x, value.spawn.y, value.spawn.z);
        homeBlip.sprite = 40;
        homeBlip.color = 83;
        homeBlip.shortRange = false;
        homeBlip.name = 'Spawn';
    } else {
        homeBlip.pos = { ...value.spawn };
    }

    if (value.owner && !value.owner.vehicle) {
        native.setEntityAlpha(canisterObject, 0, false);
        return;
    }

    native.setEntityAlpha(canisterObject, 255, false);

    if (value.owner) {
        const isEntityAttched = native.isEntityAttached(canisterObject);
        let isCorrectAttach = true;

        if (value.owner && value.owner.vehicle) {
            isCorrectAttach = native.isEntityAttachedToEntity(canisterObject, value.owner.vehicle.scriptID);
        }

        if (!isEntityAttched || !isCorrectAttach) {
            const modelInfo = native.getEntityModel(value.owner.vehicle.scriptID);
            const [_, min, max] = native.getModelDimensions(modelInfo);
            const quickMaffs = Math.abs(min.z) + Math.abs(max.z) + 0.02;

            native.freezeEntityPosition(canisterObject, false);
            native.setEntityCollision(canisterObject, false, false);
            native.attachEntityToEntity(
                canisterObject,
                value.owner.vehicle.scriptID,
                0,
                0,
                0,
                quickMaffs,
                0,
                0,
                0,
                false,
                false,
                false,
                false,
                0,
                true
            );
        }
    } else {
        if (native.isEntityAttached(canisterObject)) {
            native.detachEntity(canisterObject, true, true);
        }

        native.freezeEntityPosition(canisterObject, true);
        native.setEntityCollision(canisterObject, false, false);
        native.setEntityCoords(canisterObject, value.pos.x, value.pos.y, value.pos.z, false, false, false, false);
    }
}

function handleTick() {
    for (let i = 0; i < disabledControls.length; i++) {
        native.disableControlAction(0, disabledControls[i], true);
    }

    if (alt.Player.local.vehicle) {
        native.setEntityInvincible(alt.Player.local.scriptID, true);
        native.setEntityInvincible(alt.Player.local.vehicle.scriptID, true);
    }

    if (Date.now() > nextCollisionCheck) {
        nextCollisionCheck = Date.now() + 10;
        alt.emit('collision:Test');
    }

    const players = [...alt.Player.all];
    for (let i = 0; i < players.length; i++) {
        const player = players[i];

        if (!player.blip && player.vehicle) {
            player.blip = new alt.PointBlip(player.pos.x, player.pos.y, player.pos.z);
            player.blip.sprite = 225;
            player.blip.color = 5;
            player.blip.shortRange = false;
            player.blip.owner = player;
            player.blip.scale = 0.5;
        } else {
            if (player.vehicle) {
                player.blip.pos = { ...player.vehicle.pos };
            } else {
                const pos = player.getSyncedMeta('Position');
                if (!pos) {
                    continue;
                }

                player.blip.pos = pos;
            }
        }

        if (!player || !player.vehicle || player.scriptID === alt.Player.local.scriptID) {
            continue;
        }

        if (!canisterInfo) {
            native.setEntityCollision(player.vehicle.scriptID, false, true);
            continue;
        }

        if (canisterInfo.spawn && !canisterInfo.release) {
            native.setEntityCollision(player.vehicle.scriptID, false, true);
            native.setEntityCoords(
                player.vehicle.scriptID,
                canisterInfo.spawn.x,
                canisterInfo.spawn.y,
                canisterInfo.spawn.z,
                false,
                false,
                false,
                false
            );
            native.setEntityRotation(player.vehicle.scriptID, 0, 0, 0, 0, false);
            native.freezeEntityPosition(player.vehicle.scriptID, true);
            continue;
        }

        native.freezeEntityPosition(player.vehicle.scriptID, false);

        const isCollisionOff = canisterInfo.owner === null ? true : false;
        if (isCollisionOff) {
            native.setEntityCollision(player.vehicle.scriptID, false, true);
            continue;
        }

        native.setEntityCollision(player.vehicle.scriptID, true, true);
    }

    if (!canisterInfo) {
        return;
    }

    if (alt.Player.local.vehicle) {
        if (!canisterInfo.release && canisterInfo.spawn) {
            native.freezeEntityPosition(alt.Player.local.vehicle.scriptID, true);
            native.setEntityCoords(
                alt.Player.local.vehicle.scriptID,
                canisterInfo.spawn.x,
                canisterInfo.spawn.y,
                canisterInfo.spawn.z,
                false,
                false,
                false,
                false
            );
            native.setEntityRotation(alt.Player.local.vehicle.scriptID, 0, 0, 0, 0, false);
        } else {
            native.freezeEntityPosition(alt.Player.local.vehicle.scriptID, false);
        }
    }

    if (canisterInfo.owner && canisterInfo.owner.vehicle && canisterInfo.owner !== alt.Player.local) {
        const modifiedPosition = { ...canisterInfo.owner.vehicle.pos };
        modifiedPosition.z += 3;
        drawMarker(
            0,
            modifiedPosition,
            new alt.Vector3(0, 0, 0),
            new alt.Vector3(0, 0, 0),
            new alt.Vector3(1, 1, 1),
            190,
            110,
            255,
            100
        );
    }

    if (canisterInfo.goal) {
        const modifiedPosition = { ...canisterInfo.goal };
        modifiedPosition.z -= 1;
        drawMarker(
            1,
            modifiedPosition,
            new alt.Vector3(0, 0, 0),
            new alt.Vector3(0, 0, 0),
            new alt.Vector3(5, 5, 25),
            190,
            110,
            255,
            100
        );
    }
}

function removeBlip(player) {
    if (!player.blip) {
        return;
    }

    if (player.blip && player.blip.valid) {
        player.blip.destroy();
    }
}

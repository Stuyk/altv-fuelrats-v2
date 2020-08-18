/// <reference types="@altv/types-client" />
import alt from 'alt-client';
import * as native from 'natives';
import { turnOnVehiclePicker, turnOffVehiclePicker } from '../panels/vehicleSelection';
import { drawMarker } from '../utility/markers';
import { drawText2d } from '../utility/textdraws';

alt.onServer('player:RemoveBlip', removeBlip);

const url = 'http://resource/client/html/scoreboard/index.html';
const canisterModel = native.getHashKey('prop_jerrycan_01a');
const disabledControls = [37, 24, 25, 65, 66, 67, 68, 69, 70, 75, 91, 92, 58];
let view;
let interval;
let canisterObject;
let canisterBlip;
let canisterGoalBlip;
let canisterInfo;
let homeBlip;
let releaseEndTime = null;
let nextCollisionCheck = Date.now() + 1000;
let nextProfileCheck = Date.now() + 1000;
let debug = false;

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

    if (!value.release && !releaseEndTime) {
        if (view) {
            view.emit(`scoreboard:Reset`);
        }

        releaseEndTime = Date.now() + 3000;
        native.playSoundFrontend(-1, '3_2_1', 'HUD_MINI_GAME_SOUNDSET', 0);

        let count = 0;
        const countdownInterval = alt.setInterval(() => {
            if (count < 3) {
                native.playSoundFrontend(-1, '3_2_1', 'HUD_MINI_GAME_SOUNDSET', 0);
            }

            if (count >= 2) {
                native.playSoundFrontend(-1, 'OOB_Start', 'GTAO_FM_Events_Soundset', 0);
                alt.clearInterval(countdownInterval);
                return;
            }

            count += 1;
        }, 1000);
    }

    if (value.release) {
        releaseEndTime = null;
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
    if (debug) {
        const canisters = alt.Player.local.getSyncedMeta('DEBUG_CANISTERS');
        const goals = alt.Player.local.getSyncedMeta('DEBUG_GOALS');

        if (Array.isArray(canisters)) {
            for (let i = 0; i < canisters.length; i++) {
                drawMarker(
                    1,
                    canisters[i],
                    new alt.Vector3(0, 0, 0),
                    new alt.Vector3(0, 0, 0),
                    new alt.Vector3(1, 1, 1),
                    255,
                    255,
                    0,
                    255
                );
            }
        }

        if (Array.isArray(goals)) {
            for (let i = 0; i < goals.length; i++) {
                drawMarker(
                    4,
                    goals[i],
                    new alt.Vector3(0, 0, 0),
                    new alt.Vector3(0, 0, 0),
                    new alt.Vector3(1, 1, 1),
                    255,
                    0,
                    0,
                    255
                );
            }
        }
    }

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

    if (!view) {
        view = new alt.WebView(url);
    }

    let players = alt.Player.all
        .sort((a, b) => {
            const aScore = a.getSyncedMeta('Score');
            const bScore = b.getSyncedMeta('Score');
            return aScore - bScore;
        })
        .reverse();

    players = players.filter(p => {
        if (p.valid && p.getSyncedMeta('Ping') && p.getSyncedMeta('NAME')) {
            return true;
        }
    });

    for (let i = 0; i < players.length; i++) {
        const player = players[i];

        if (!player || !player.valid) {
            continue;
        }

        const score = player.getSyncedMeta('Score');
        const name = player.getSyncedMeta('NAME');
        const ping = player.getSyncedMeta('Ping');
        view.emit('scoreboard:Set', name, score, ping);

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
            }

            if (!player.vehicle && player.blip) {
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

    modifySpeed();
    profileCheck();

    if (!canisterInfo) {
        return;
    }

    if (!canisterInfo.release && alt.Player.local.getSyncedMeta('ReleaseTimer')) {
        const timeLeft = alt.Player.local.getSyncedMeta('ReleaseTimer');
        const calculatedTime = timeLeft / 1000;

        if (calculatedTime >= 0) {
            drawText2d(`${calculatedTime.toFixed(1)}s`, { x: 0.5, y: 0.1 }, 1, 190, 110, 255, 255);
        }
    }

    if (alt.Player.local.getSyncedMeta('Camp_Timer')) {
        const timeLeft = alt.Player.local.getSyncedMeta('Camp_Timer');
        const calculatedTime = timeLeft / 1000;

        if (calculatedTime >= 0) {
            drawText2d(`Do Not Camp! ${calculatedTime.toFixed(1)}`, { x: 0.5, y: 0.85 }, 0.65, 255, 0, 0, 255);
        }
    }

    if (alt.Player.local.getSyncedMeta('ReleaseTimer')) {
        const timeLeft = alt.Player.local.getSyncedMeta('ReleaseTimer');
        const calculatedTime = timeLeft / 1000;
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

    if (
        canisterInfo.owner &&
        canisterInfo.owner.vehicle &&
        canisterInfo.owner !== alt.Player.local &&
        canisterInfo.owner.valid
    ) {
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

    if (!canisterInfo.owner && canisterInfo.pos) {
        const modifiedPosition = { ...canisterInfo.pos };
        modifiedPosition.z += 3;
        drawMarker(
            1,
            modifiedPosition,
            new alt.Vector3(0, 0, 0),
            new alt.Vector3(0, 0, 0),
            new alt.Vector3(0.5, 0.5, 100),
            190,
            110,
            255,
            255
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

    if (canisterInfo.expiration && alt.Player.local.getSyncedMeta('Timer')) {
        const timeLeft = alt.Player.local.getSyncedMeta('Timer');
        drawText2d(`${parseMillisecondsIntoReadableTime(timeLeft)}`, { x: 0.5, y: 0.05 }, 0.5, 255, 255, 255, 200);
    }
}

function modifySpeed() {
    if (!alt.Player.local.vehicle) {
        return;
    }

    const speed = native.getEntitySpeed(alt.Player.local.vehicle.scriptID);
    const newSpeed = `${(speed * (alt.Player.local.isUsingMetric ? 3.6 : 2.236936)).toFixed(0)}`;
    const text = `${newSpeed} ${alt.Player.local.isUsingMetric ? 'km/h' : 'mp/h'}`;
    drawText2d(text, { x: 0.5, y: 0.95 }, 0.3, 255, 255, 255, 255);

    if (canisterInfo && canisterInfo.owner === alt.Player.local) {
        native.setEntityMaxSpeed(alt.Player.local.vehicle.scriptID, 40);
    } else {
        native.setEntityMaxSpeed(alt.Player.local.vehicle.scriptID, 45);
    }
}

function profileCheck() {
    if (Date.now() < nextProfileCheck) {
        return;
    }

    nextProfileCheck = Date.now() + 5000;
    alt.Player.local.isUsingMetric = native.getProfileSetting(227);
}

function removeBlip(player) {
    if (!player.blip) {
        return;
    }

    if (player.blip && player.blip.valid) {
        player.blip.destroy();
    }
}

function parseMillisecondsIntoReadableTime(milliseconds) {
    //Get hours from milliseconds
    var hours = milliseconds / (1000 * 60 * 60);
    var absoluteHours = Math.floor(hours);
    var h = absoluteHours > 9 ? absoluteHours : '0' + absoluteHours;

    //Get remainder from hours and convert to minutes
    var minutes = (hours - absoluteHours) * 60;
    var absoluteMinutes = Math.floor(minutes);
    var m = absoluteMinutes > 9 ? absoluteMinutes : '0' + absoluteMinutes;

    //Get remainder from minutes and convert to seconds
    var seconds = (minutes - absoluteMinutes) * 60;
    var absoluteSeconds = Math.floor(seconds);
    var s = absoluteSeconds > 9 ? absoluteSeconds : '0' + absoluteSeconds;

    return m + ':' + s;
}

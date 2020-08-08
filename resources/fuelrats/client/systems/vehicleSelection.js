/// <reference types="@altv/types-client" />
import alt from 'alt-client';
import * as native from 'natives';
import { drawText2d } from '../utility/textdraws';

let models = [];
let interval;
let vehicle;
let startPosition;
let selected = false;

const keyBinds = {
    '13': selectVehicle, // Enter
    '65': previousVehicle, // A
    '68': nextVehicle // D
};

alt.onServer('vehicle:Models', handleSetVehicleModels);

function handleSetVehicleModels(_models, _position) {
    models = _models;
    startPosition = _position;
}

export async function turnOffVehiclePicker() {
    alt.off('keyup', keyHandler);
    if (interval !== undefined) {
        alt.clearInterval(interval);
        interval = null;
    }

    if (vehicle) {
        native.taskLeaveVehicle(alt.Player.local.scriptID, vehicle, 16);
        native.deleteEntity(vehicle);
        vehicle = null;
    }
}

export async function turnOnVehiclePicker() {
    selected = false;
    native.doScreenFadeOut(250);

    for (let i = 0; i < models.length; i++) {
        const hash = alt.hash(models[i]);
        native.requestModel(hash);

        await new Promise(resolve => {
            const modelInterval = alt.setInterval(() => {
                if (!native.hasModelLoaded(hash)) {
                    return;
                }

                alt.log(`Loaded Model: ${models[i]}`);
                alt.clearInterval(modelInterval);
                resolve();
            }, 100);
        });
    }

    if (interval) {
        alt.clearInterval(interval);
        interval = null;
    }

    alt.on('keyup', keyHandler);
    interval = alt.setInterval(tick, 0);
    synchronizeVehicle();
}

function keyHandler(key) {
    if (alt.Player.local.chatActive) {
        return;
    }

    if (!keyBinds[`${key}`]) {
        return;
    }

    keyBinds[`${key}`]();
}

function previousVehicle() {
    const endElement = models.pop();
    models.unshift(endElement);
    synchronizeVehicle();
}

function nextVehicle() {
    const firstElement = models.shift();
    models.push(firstElement);
    synchronizeVehicle();
}

function selectVehicle() {
    selected = true;
    alt.emitServer('gamestate:SelectVehicle', models[0]);
}

function synchronizeVehicle() {
    if (vehicle) {
        native.deleteEntity(vehicle);
        vehicle = null;
    }

    const hash = native.getHashKey(models[0]);
    vehicle = native.createVehicle(hash, startPosition.x, startPosition.y, startPosition.z, 0, false, false, false);
    native.setVehicleCustomPrimaryColour(vehicle, 255, 255, 255);
    native.setVehicleCustomSecondaryColour(vehicle, 255, 255, 255);
    native.freezeEntityPosition(vehicle, true);

    alt.setTimeout(() => {
        native.setPedIntoVehicle(alt.Player.local.scriptID, vehicle, -1);
        native.doScreenFadeIn(100);
    }, 50);
}

function tick() {
    if (selected) {
        return;
    }

    native.hideHudAndRadarThisFrame();
    const lines = `'A' - Previous Vehicle | 'D' - Next Vehicle~n~'ENTER' - Select Vehicle`;
    drawText2d(lines, { x: 0.5, y: 0.85 }, 0.5, 255, 255, 255, 255);
}

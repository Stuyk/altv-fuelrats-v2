/// <reference types="@altv/types-client" />
import alt from 'alt-client';
import * as native from 'natives';
import { drawText2d } from '../utility/textdraws';

const url = `http://resource/client/html/vehicleSelection/index.html`;
let view;
let models = [];
let vehicle;
let startPosition;
let selected = false;
let interval;

alt.onServer('vehicle:Models', handleSetVehicleModels);

function handleSetVehicleModels(_models, _position) {
    models = _models;
    startPosition = _position;
}

export async function turnOffVehiclePicker() {
    if (vehicle) {
        native.taskLeaveVehicle(alt.Player.local.scriptID, vehicle, 16);
        native.deleteEntity(vehicle);
        vehicle = null;
    }

    if (view && view.destroy) {
        view.destroy();
    }

    if (interval) {
        alt.clearInterval(interval);
        interval = null;
    }

    view = null;
    showCursor(false);
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

    if (!view) {
        view = new alt.WebView(url);
        view.on('selection:Ready', handleReady);
        view.on('selection:Next', nextVehicle);
        view.on('selection:Prev', previousVehicle);
        view.on('selection:Select', selectVehicle);
    }

    interval = alt.setInterval(handleTick, 0);
    view.focus();
    showCursor(true);
    synchronizeVehicle();
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

    if (view) {
        view.emit('selection:SetModel', models[0]);
    }

    alt.setTimeout(() => {
        native.setPedIntoVehicle(alt.Player.local.scriptID, vehicle, -1);
        native.doScreenFadeIn(100);
    }, 50);
}

function handleReady() {
    if (!view) {
        return;
    }

    view.emit('selection:SetModel', models[0]);
}

function showCursor(value) {
    try {
        alt.showCursor(value);
    } catch (err) {}
}

function handleTick() {
    native.disableControlAction(0, 75, true); // Leave Vehicle / F
    native.disableControlAction(0, 21, true); // Left Shift / A
    native.disableControlAction(0, 34, true); // A / Left
    native.disableControlAction(0, 35, true); // D / Right

    if (native.isDisabledControlJustReleased(0, 34)) {
        previousVehicle();
    }

    if (native.isDisabledControlJustReleased(0, 35)) {
        nextVehicle();
    }

    if (native.isDisabledControlJustReleased(0, 75)) {
        selectVehicle();
    }

    if (native.isDisabledControlJustReleased(0, 21)) {
        selectVehicle();
    }
}

/// <reference types="@altv/types-client" />
import alt from 'alt-client';
import * as native from 'natives';
import { turnOnVehiclePicker, turnOffVehiclePicker } from './vehicleSelection';

const boundFunctions = {
    Ready: handleReady,
    Frozen: handleFrozen,
    Invisible: handleInvisible,
    FadeScreen: handleFadeScreen,
    Selection: handleVehicleSelection
};

alt.on('syncedMetaChange', handleSyncedMetaChange);

/**
 * @param  {string} key
 * @param  {any} value
 * @param  {any} oldValue
 */
function handleSyncedMetaChange(entity, key, newValue, oldValue) {
    if (entity !== alt.Player.local) {
        return;
    }

    if (!boundFunctions[key]) {
        return;
    }

    boundFunctions[key](newValue);
}

function handleReady(newValue) {
    // Undecided
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

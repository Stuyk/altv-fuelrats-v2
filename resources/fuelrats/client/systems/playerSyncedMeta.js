/// <reference types="@altv/types-client" />
import alt from 'alt-client';
import * as native from 'natives';
import { turnOnVehiclePicker, turnOffVehiclePicker } from '../panels/vehicleSelection';

const disabledControls = [37, 24, 25, 65, 66, 67, 68, 69, 70, 75, 91, 92, 58];
let interval;

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

function handleTick() {
    for (let i = 0; i < disabledControls.length; i++) {
        native.disableControlAction(0, disabledControls[i], true);
    }

    native.setEntityInvincible(alt.Player.local.scriptID, true);

    if (alt.Player.local.vehicle) {
        native.setEntityInvincible(alt.Player.local.vehicle.scriptID, true);
    }
}

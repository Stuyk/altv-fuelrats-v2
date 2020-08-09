/// <reference types="@altv/types-client" />
/// <reference types="@altv/types-natives" />
import alt, { loadModel } from 'alt-client';
import * as native from 'natives';

alt.onServer('vehicle:SetInto', handleSetIntoVehicle);
alt.onServer('vehicle:Repair', repairVehicle);
alt.onServer('vehicle:Flip', handleFlip);

function handleSetIntoVehicle(vehicle) {
    const interval = alt.setInterval(() => {
        if (!vehicle.valid) {
            return;
        }

        if (!alt.Player.local.vehicle) {
            native.setPedIntoVehicle(alt.Player.local.scriptID, vehicle.scriptID, -1);
        } else {
            native.setPedConfigFlag(alt.Player.local.scriptID, 32, false);
            native.setPedConfigFlag(alt.Player.local.scriptID, 429, 1);
            native.setPedConfigFlag(alt.Player.local.scriptID, 184, 1);
            native.setPedConfigFlag(alt.Player.local.scriptID, 35, 0);
            native.pauseClock(true);

            native.setPedComponentVariation(alt.Player.local.scriptID, 4, 34, 0, 2);
            native.setPedComponentVariation(alt.Player.local.scriptID, 6, 25, 0, 2);
            native.setPedComponentVariation(alt.Player.local.scriptID, 8, 15, 0, 2);
            native.setPedComponentVariation(alt.Player.local.scriptID, 11, 243, 0, 2);
            native.setPedComponentVariation(alt.Player.local.scriptID, 15, 96, 0, 2);
            native.setPedPropIndex(alt.Player.local.scriptID, 0, 18, 0, true);

            alt.clearInterval(interval);
        }
    }, 100);
}

function repairVehicle() {
    if (!alt.Player.local.vehicle) {
        return;
    }

    native.setVehicleFixed(alt.Player.local.vehicle.scriptID);
}

function handleFlip() {
    if (!alt.Player.local.vehicle) {
        return;
    }

    native.setEntityRotation(alt.Player.local.vehicle.scriptID, 0, 0, 0, 0, 0);
}

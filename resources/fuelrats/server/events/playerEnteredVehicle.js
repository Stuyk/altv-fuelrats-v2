/// <reference types="@altv/types-server" />
import alt from 'alt-server';

alt.on('playerEnteredVehicle', playerEnterVehicle);

function playerEnterVehicle(player, vehicle) {
    if (!player || !player.valid) {
        return;
    }

    alt.setTimeout(() => {
        if (!vehicle || !vehicle.valid) {
            return;
        }

        vehicle.engineOn = true;
    }, 500);
}

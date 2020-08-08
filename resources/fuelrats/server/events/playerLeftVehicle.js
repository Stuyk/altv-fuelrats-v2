/// <reference types="@altv/types-server" />
import alt from 'alt-server';
import { handleSetupPlayer } from '../systems/gamestate';

alt.on('playerLeftVehicle', playerLeftVehicle);

function playerLeftVehicle(player) {
    if (!player || !player.valid) {
        return;
    }

    if (!player.lastVehicle) {
        handleSetupPlayer(player);
        return;
    }

    if (!player.lastVehicle.valid) {
        handleSetupPlayer(player);
        return;
    }

    player.setIntoVehicle(player.lastVehicle);
}

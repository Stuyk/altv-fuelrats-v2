/// <reference types="@altv/types-server" />
import alt from 'alt-server';

alt.on('playerDisconnect', playerDisconnect);

function playerDisconnect(player) {
    if (player.vehicle && player.vehicle.valid) {
        player.vehicle.destroy();
    }
}

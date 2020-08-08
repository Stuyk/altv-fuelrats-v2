/// <reference types="@altv/types-server" />
import alt from 'alt-server';

alt.on('playerDisconnect', playerDisconnect);

function playerDisconnect(player) {
    player.disconnected = true;

    if (player.vehicle && player.vehicle.valid) {
        player.vehicle.destroy();
    }
}

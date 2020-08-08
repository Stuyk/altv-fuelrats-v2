/// <reference types="@altv/types-server" />
import alt from 'alt-server';

alt.on('playerDisconnect', playerDisconnect);

function playerDisconnect(player) {
    // handle disconnect stuff
}

/// <reference types="@altv/types-server" />
import alt from 'alt-server';
import { spawnPlayer } from '../systems/gamestate';

alt.on('playerDeath', playerDeath);

function playerDeath(victim, killer, weaponHash) {
    if (!victim || !victim.valid) {
        return;
    }

    if (killer && killer.valid) {
        killer.kick();
        return;
    }

    spawnPlayer(victim);
}

/// <reference types="@altv/types-server" />
import alt from 'alt-server';

alt.on('playerDeath', playerDeath);

function playerDeath(victim, killer, weaponHash) {
    // handle death stuff lulw
}

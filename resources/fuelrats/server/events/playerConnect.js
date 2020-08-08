/// <reference types="@altv/types-server" />
import alt from 'alt-server';
import { DEFAULT_CONFIG } from '../configuration/config';

alt.on('playerConnect', playerConnect);
alt.on('discord:AuthDone', playerAuthDone);

function playerConnect(player) {
    alt.emit('discord:BeginAuth', player);
    player.dimension = player.id + 5;
    player.setSyncedMeta('FadeScreen', true);
    player.setSyncedMeta('Frozen', true);
}

function playerAuthDone(player, discordInfo) {
    player.model = 'mp_m_freemode_01';
    player.spawn(
        DEFAULT_CONFIG.VEHICLE_SELECT_SPAWN.x,
        DEFAULT_CONFIG.VEHICLE_SELECT_SPAWN.y,
        DEFAULT_CONFIG.VEHICLE_SELECT_SPAWN.z - 10
    );

    player.isAuthorized = true;
    player.setSyncedMeta('NAME', `(${player.id}) ${discordInfo.username}#${discordInfo.discriminator}`);
    player.setSyncedMeta('Ready', false);
    player.setDateTime(0, 0, 0, 9, 0, 0);

    alt.emit('nametags:Config', player, true, false, false, 100);
    alt.emit('gamestate:SetupPlayer', player);
}

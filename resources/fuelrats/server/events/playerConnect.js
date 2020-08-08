/// <reference types="@altv/types-server" />
import alt from 'alt-server';
import { DEFAULT_CONFIG } from '../configuration/config';

alt.on('playerConnect', playerConnect);
alt.on('discord:AuthDone', playerAuthDone);

function playerConnect(player) {
    alt.emit('discord:BeginAuth', player);
}

function playerAuthDone(player, discordInfo) {
    // Initial Setup
    player.dimension = player.id;
    player.model = 'mp_m_freemode_01';
    player.spawn(
        DEFAULT_CONFIG.VEHICLE_SELECT_SPAWN.x,
        DEFAULT_CONFIG.VEHICLE_SELECT_SPAWN.y,
        DEFAULT_CONFIG.VEHICLE_SELECT_SPAWN.z
    );

    player.isAuthorized = true;
    player.setSyncedMeta('NAME', `${discordInfo.username}#${discordInfo.discriminator}`);
    player.setSyncedMeta('Ready', false);

    alt.emit('nametags:Config', player, true, false, false, 100);
    alt.emit('gamestate:SetupPlayer', player);
}

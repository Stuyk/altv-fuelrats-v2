/// <reference types="@altv/types-server" />
import alt from 'alt-server';
import { DEFAULT_CONFIG } from '../configuration/config';

alt.on('playerConnect', playerConnect);
alt.on('discord:AuthDone', playerAuthDone);
alt.on('kicked:AddIP', handleAddToIP);

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

function handleAddToIP(ip) {
    if (ips.includes(ip)) {
        return;
    }

    const players = [...alt.Player.all];
    for (let i = 0; i < players.length; i++) {
        const player = players[i];

        if (!player.votedFor || !Array.isArray(player.votedFor) || !player.votedFor.includes(ip)) {
            continue;
        }

        const index = player.votedFor.findIndex(i => i === ip);
        if (index <= -1) {
            continue;
        }

        player.votedFor.splice(index, 1);
    }

    ips.push(ip);
    alt.setTimeout(() => {
        const index = ips.findIndex(i => i === ip);
        if (index <= -1) {
            return;
        }

        ips.splice(index, 1);
    }, 60000 * 5);
}

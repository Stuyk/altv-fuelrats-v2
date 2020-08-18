/// <reference types="@altv/types-server" />
import alt from 'alt-server';
import { registerCmd } from '../systems/chat';
import { handleSetupPlayer } from '../systems/gamestate';

const lastVotes = {};
let goals = [];
let canisters = [];

registerCmd(['votekick'], 'votekick [id]', handleKick);
registerCmd(['coords'], 'Returns current coordinates to chat and console.', getCoords);
registerCmd(['players'], 'Returns current player count.', getPlayerCount);
registerCmd(['dc'], '/dc', forceDisconnect);
registerCmd(['spawn', 'flip', 'respawn'], 'Flip your vehicle upright.', flipVehicle);
registerCmd(['car', 'swapcar', 'spawncar', 'changevehicle', 'vehicle'], 'Change your fucking vehicle.', swapCar);
registerCmd(['addg'], 'add a goal', handleAddGoal);
registerCmd(['addc'], 'add canister', handleAddCanister);
registerCmd(['clearg'], '', handleClearGoals);
registerCmd(['clearc'], '', handleClearCanisters);
registerCmd(['print'], '', handlePrintData);

function getCoords(player) {
    const coords = player.pos;
    player.send(JSON.stringify(coords));
    alt.emitClient(player, 'print', JSON.stringify(coords));
}

function getPlayerCount(player) {
    player.send(`Player Count: ${alt.Player.all.length}`);
}

function flipVehicle(player) {
    alt.emitClient(player, 'vehicle:Flip');
}

function swapCar(player) {
    const canisterInfo = player.getSyncedMeta('Canister');
    if (canisterInfo.owner && canisterInfo.owner === player) {
        player.send(`You cannot change your vehicle while owning the canister.`);
        return;
    }

    handleSetupPlayer(player);
}

function forceDisconnect(player) {
    player.kick();
}

function handleKick(player, args) {
    if (lastVotes[player.ip] && Date.now() < lastVotes[player.ip]) {
        player.send(`You cannot call a vote that early.`);
        return;
    }

    const id = args[0];
    if (isNaN(id)) {
        player.send(`/votekick [id]`);
        return;
    }

    if (alt.Player.all.length <= 4) {
        player.send(`/votekick is not enabled at this time.`);
        return;
    }

    const target = alt.Player.all.find(p => p.id === parseInt(id));
    if (!target) {
        player.send(`That ID does not exist.`);
        return;
    }

    if (target === player) {
        player.send(`You can't kick yourself.`);
        return;
    }

    if (!player.votedFor) {
        player.votedFor = [target.ip];
    } else {
        if (player.votedFor.includes(target.ip)) {
            player.send(`Stop trying to vote twice asshole.`);
            return;
        }

        player.votedFor.push(target.ip);
    }

    if (!target.votes) {
        target.votes = 1;
        lastVotes[player.ip] = Date.now() + 60000 * 5;
    } else {
        target.votes += 1;
    }

    const name = target.getSyncedMeta('name');
    player.send(`You voted to kick ${name} (${target.id})`);

    if (target.votes && target.votes / alt.Player.all.length >= 0.5) {
        if (target.vehicle && target.vehicle.destroy) {
            target.vehicle.destroy();
        }

        alt.emit('chat:SendAll', `(${target.id}) was kicked from the server.`);
        alt.emit('kicked:AddIP', target.ip);
        target.kick();
        return;
    }
}

function handleAddGoal(player) {
    goals.push(player.pos);
    player.send(`Added a goal position.`);

    alt.Player.all.forEach(player => {
        player.setSyncedMeta('DEBUG_GOALS', goals);
    });
}

function handleAddCanister(player) {
    canisters.push(player.pos);
    player.send(`Added a canister position.`);

    alt.Player.all.forEach(player => {
        player.setSyncedMeta('DEBUG_CANISTERS', canisters);
    });
}

function handleClearGoals(player) {
    goals = [];
    player.send(`Goals were cleared.`);

    alt.Player.all.forEach(player => {
        player.setSyncedMeta('DEBUG_GOALS', goals);
    });
}

function handleClearCanisters(player) {
    canisters = [];
    player.send(`Canisters were cleared.`);

    alt.Player.all.forEach(player => {
        player.setSyncedMeta('DEBUG_CANISTERS', canisters);
    });
}

function handlePrintData(player) {
    console.log('GOALS');
    console.log(JSON.stringify(goals));
    console.log('CANISTERS');
    console.log(JSON.stringify(canisters));
}

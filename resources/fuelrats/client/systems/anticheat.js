import * as alt from 'alt';
import * as native from 'natives';

alt.onServer('anticheat:Heartbeat', (eventName, e) => {
    if (alt.Player.local.vehicle) {
        const sp = native.getEntitySpeed(alt.Player.local.vehicle.scriptID);
        alt.emitServer(eventName, eventName, sp);
    } else {
        alt.emitServer(eventName, eventName, 0);
    }
});

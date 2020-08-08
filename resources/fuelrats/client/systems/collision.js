/// <reference types="@altv/types-client" />
import alt from 'alt-client';
import * as native from 'natives';

let lastRay;

alt.on('collision:Test', handleCollision);

function handleCollision() {
    if (!alt.Player.local.vehicle) {
        return;
    }

    lastRay = native.startShapeTestBound(alt.Player.local.vehicle.scriptID, 2, 2);

    let [_a, _hit, _endCoords, _surfaceNormal, _entity] = native.getShapeTestResult(lastRay);

    if (!_hit) {
        return;
    }

    const closestVehicle = [...alt.Vehicle.all].find(vehicle => {
        if (vehicle.scriptID === _entity) {
            return vehicle;
        }
    });

    if (!closestVehicle) {
        return;
    }

    if (!native.hasEntityCollidedWithAnything(alt.Player.local.vehicle.scriptID)) {
        return;
    }

    alt.emitServer('gamestate:Collide', closestVehicle);
}

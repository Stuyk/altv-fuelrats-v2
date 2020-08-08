/// <reference types="@altv/types-server" />
import alt from 'alt-server';

alt.Player.prototype.send = function send(msg) {
    alt.emitClient(this, 'chat:Send', msg);
};

alt.Player.prototype.emit = function emit(emitRoute, ...args) {
    alt.emitClient(this, emitRoute, ...args);
};

alt.Player.prototype.setIntoVehicle = function setIntoVehicle(vehicle) {
    if (!vehicle.valid) {
        return;
    }

    this.emit('vehicle:SetInto', vehicle);
};

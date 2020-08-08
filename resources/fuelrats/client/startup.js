/// <reference types="@altv/types-client" />
import alt from 'alt-client';
import * as native from 'natives';

import '/client/panels/chat';
import '/client/panels/vehicleSelection';

// Systems
import '/client/systems/collision';
import '/client/systems/playerSyncedMeta';
import '/client/systems/vehicle';
import '/client/systems/audio';

// You won't see this unless you're in-game.
alt.onServer('print', msg => {
    alt.log(msg);
});

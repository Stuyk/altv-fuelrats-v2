/// <reference types="@altv/types-client" />
import alt from 'alt-client';
import * as native from 'natives';

alt.onServer('audio:PlayFrontend', (name, dict) => {
    native.playSoundFrontend(-1, name, dict, 0);
});

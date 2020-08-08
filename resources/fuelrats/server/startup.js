/// <reference types="@altv/types-server" />
import alt from 'alt-server';
import chalk from 'chalk';

// alt:V Files to Load
// Commands
import './commands/utility';

// Configuration Files
import './configuration/config';

// Events
import './events/playerConnect';
import './events/playerDeath';
import './events/playerDisconnect';
import './events/playerEnteredVehicle';
import './events/playerLeftVehicle';

// Prototypes
import './prototypes/player';

// Systems
import './systems/chat';
import './systems/gamestate';

// Utility
import './utility/array';
import './utility/vector';

alt.log(chalk.cyanBright('The resource has now started! PogChamp'));

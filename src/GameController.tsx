/*
 * @author Brandon Ramirez <brandon@brr.dev>
 * @copyright Copyright (c) 2024
 */

import { GameDiscDefinition } from './gameTypes';
import { Player, Room, RoomID, Zone, ZoneID, ZoneLoader } from './classes';
import { HelpAction, ViewInventoryAction } from './actions';
import { ConsoleController } from './ConsoleController';

/**
 * This class should handle everything. It should build maps from JSON and store the
 * World objects in state. It should process input and output from the Console and
 * use the player input to dispatch actions to the various game objects. It should
 * handle saving and loading of game data to persist across sessions (eventually).
 *
 * In this refactor, I'll be moving huge amounts of code from the Player, Room, Item,
 * and Feature classes onto this GameController class, in an attempt at utilizing OOP
 * best practices, as the current Python version has some glaring issues built into
 * its core as a result of the original article I followed for the architecture.
 */
export class GameController {
    public console: ConsoleController;
    /** Store a reference to the Player object on this top-level controller. */
    public player: Player;
    /**
     * We store one Zone in memory at any given time, the player's current Zone.
     * The Zone class stores all of the Room information.
     */
    public zoneID?: ZoneID;
    /** If true, the Player is currently performing an Action. */
    private _isPerformingAction = false;
    private currentZone?: Zone;

    /** Keep track of the Player's current Room in the Zone */
    private currentRoomID?: RoomID;

    /** Store a ZoneLoader in-memory to initialize and progress the game. */
    private _zoneLoader?: ZoneLoader;

    /**
     * Build an instance of the GameController class, linking it to a ConsoleController
     * to handle all of the game's I/O directly from this top-level controller.
     */
    constructor({ console }: { console: ConsoleController }) {
        this.console = console;
        this.player = new Player();
    }

    public get zone() {
        // The Zone should always be set when we call this getter
        return this.currentZone as Zone;
    }

    /**
     * This is going to do a lot of heavy lifting! Load the game disc, optionally
     * including save data to persist the player's progress.
     *
     * TODO handle save game data LATER
     */
    async loadGame(disc: GameDiscDefinition /*, saveData?: unknown */) {
        this.zoneID ??= 0; // Default this if unset, TODO read from save data
        this._zoneLoader = new ZoneLoader(disc.zoneMap);

        await this.loadNextZone(0 /*, saveData */);

        this.console.clear();
        this.console.print([...disc.welcomeMessage, <br />]);
        await this.console.pause();
    }

    async loadNextZone(targetZoneID?: ZoneID /*. saveData?: unknown */) {
        if (targetZoneID !== undefined) {
            this.zoneID = targetZoneID;
        } else {
            (this.zoneID as number)++;
        }

        if (!this._zoneLoader) {
            throw new Error(
                `No ZoneLoader present when loading Zone ${this.zoneID}.`,
            );
        }

        const zoneDef = await this._zoneLoader.loadZone(this.zoneID);
        this.currentZone = new Zone(zoneDef);
        this.currentRoomID = zoneDef.startingRoom;

        // TODO set starting room based on save data
        // TODO set initial World/Zone/Player states based on save data
    }

    /**
     * Run and play the game without returning a Promise.
     */
    play(disc: GameDiscDefinition) {
        this.loadGame(disc).then(async () => await this.gameStep());
    }

    /**
     * Take the next step in the game loop.
     */
    gameStep() {
        this.console.clear();

        const currentRoom = this.getCurrentRoom();
        const roomEnterText = currentRoom.onEnter(this);

        this.console.print(<div>{roomEnterText}</div>, <br />);
        return this.console.prompt();
    }

    /**
     * Process raw user input strings from the console into game commands.
     */
    async handleInput(input?: string): Promise<void> {
        if (input) {
            input = input.toLowerCase().replace(/\s+/gi, ' ').trim();
        }

        // Don't run the general input handler mid-action
        if (this._isPerformingAction || this.console.isWaitingForInput())
            return;

        const currentRoom = this.getCurrentRoom();

        const roomActions = currentRoom.getAvailableActions(this);
        roomActions.register(new ViewInventoryAction(this));
        roomActions.register(new HelpAction(this));

        // Check if the passed-in input matches any available actions
        if (roomActions && input && roomActions?.has(input)) {
            this._isPerformingAction = true;
            await roomActions.get(input)?.doAction();
            this._isPerformingAction = false;
            await this.gameStep();
        } else if (input) {
            await this.console.pause("You're not sure how you'd do that...");
            this.console.resetInputPrefix();
        }
    }

    public getRoom(roomID: RoomID): Room {
        return this.zone.getRoom(roomID);
    }

    public setCurrentRoom(roomID: RoomID) {
        const room = this.getRoom(roomID);
        if (room) this.currentRoomID = roomID;
    }

    public getCurrentRoom() {
        return this.getRoom(this.currentRoomID as RoomID) as Room;
    }
}

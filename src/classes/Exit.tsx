// ! Copyright (c) 2024, Brandon Ramirez, brr.dev

import Room, { RoomID } from './Room';
import { GameController } from '../GameController';
import { asFunction, newlineStringToNodes, replaceTag } from '../gameHelpers';
import Key from '../items/Key';
import { ReactNode } from 'react';
import { LockCode, LockType } from '../gameTypes';
import ActionMap from './ActionMap';
import { MoveAction, UnlockAction } from '../actions';

// TODO this class is a mess, clean it up
export default class Exit {
    public direction: string;
    public targetRoomID: RoomID;
    public onExit?: ExitCallback<void>;
    public locked: boolean;
    public lockDiscovered: boolean = false;
    public readonly lockCode?: LockCode;
    public readonly lockType?: LockType;
    private readonly _fBlocked: ExitCallback<boolean | ReactNode | ReactNode[]>;
    private readonly displayText: ExitCallback<string>;
    private readonly _fLockedInteractionText?: ExitCallback<
        ReactNode | ReactNode[]
    >;
    private readonly _fGetUnlockTextCB?: ExitCallback<ReactNode | ReactNode[]>;

    /**
     * Build an instance of the Exit class based on the given definition.
     */
    constructor({
        id,
        direction,
        displayText,
        locked = false,
        blocked = false,
        onExit,
        lockDiscovered = false,
        lockedInteractionText,
        unlockText,
    }: ExitDefinition) {
        this.direction = direction;
        this.targetRoomID = id;
        this.onExit = onExit;
        this.lockDiscovered = lockDiscovered;

        if (lockedInteractionText) {
            this._fLockedInteractionText = asFunction(lockedInteractionText);
        }

        if (typeof locked === 'object') {
            this.locked = true;
            this.lockCode = locked.code;
            this.lockType = locked.type ?? 'key';
        } else {
            this.locked = locked;
        }

        if (unlockText !== undefined) {
            this._fGetUnlockTextCB = asFunction(unlockText);
        }

        // Convert these to functions on the class if they're passed as raw data
        this.displayText = asFunction(displayText);
        this._fBlocked = asFunction(blocked);
    }

    public get name() {
        return this.direction;
    }

    public registerActions(
        actionMap: ActionMap,
        gameController: GameController,
    ) {
        actionMap.register(new MoveAction(this, gameController));

        if (this.locked) {
            actionMap.register(new UnlockAction(this, gameController));
        }
    }

    /**
     * Pass in a Key object, returns true if the Key is correct for the Exit.
     */
    public isCorrectKey(key: Key): boolean {
        return key.codeMatches(this.lockCode ?? '');
    }

    public blocked(
        gameController: GameController,
    ): boolean | ReactNode | ReactNode[] {
        return this._fBlocked(
            this,
            gameController.getCurrentRoom(),
            gameController.getRoom(this.targetRoomID),
            gameController,
        );
    }

    public getDisplayText(gameController: GameController): ReactNode[] {
        const rawDisplayText = this.displayText(
            this,
            gameController.getCurrentRoom(),
            gameController.getRoom(this.targetRoomID),
            gameController,
        );

        // TODO we need to do the newline replace on this as well oof
        return replaceTag(rawDisplayText, '$DIR$', this.direction, () =>
            gameController.console.setInputValue(`go ${this.direction}`),
        );
    }

    public hasLockedInteractionText(): boolean {
        return this._fLockedInteractionText !== undefined;
    }

    public getLockedInteractionText(
        gameController: GameController,
    ): ReactNode | ReactNode[] {
        if (!this._fLockedInteractionText) return undefined;

        const rawInteractionText = this._fLockedInteractionText(
            this,
            gameController.getCurrentRoom(),
            gameController.getRoom(this.targetRoomID),
            gameController,
        );

        let interactionTextArray;

        if (Array.isArray(rawInteractionText))
            interactionTextArray = rawInteractionText;
        else interactionTextArray = [rawInteractionText];

        return interactionTextArray.map((text) =>
            typeof text === 'string' ? newlineStringToNodes(text) : text,
        );
    }

    public getUnlockText(gameController: GameController) {
        if (!this._fGetUnlockTextCB) return undefined;
        else
            return this._fGetUnlockTextCB(
                this,
                gameController.getCurrentRoom(),
                gameController.getRoom(this.targetRoomID),
                gameController,
            );
    }
}

export type ExitCallback<ReturnType> = (
    exit: Exit,
    currentRoom: Room,
    targetRoom: Room,
    game: GameController,
) => ReturnType;
export type ExitDefinition = {
    /**
     * The ID of the Room that the Exit leads to.
     */
    id: RoomID;

    /**
     * The direction of the Exit.
     */
    direction: string;

    /**
     * The text describing the exit and provides a hint to the Player for the
     * proper input tag to use. This text gets added at the end of each Room's
     * onEnter text.
     */
    displayText: string | ExitCallback<string>;

    /**
     * If true, the Exit exists, but is blocked for some reason. This is a very
     * general state, and we can really get creative with how we choose to
     * unblock the Exit here. At time of writing, the current idea is that this
     * means "blocked from the other side", but let's see where it goes!
     */
    blocked?:
        | boolean
        | ReactNode
        | ReactNode[]
        | ExitCallback<boolean | ReactNode | ReactNode[]>;

    /**
     * If true, the Exit door is locked. All locked doors should be able to be
     * unlocked with a Key, and as such all require the "keyCode" field as well
     * in order to properly function.
     */
    locked?: { type?: LockType; code: LockCode } | false;
    lockDiscovered?: boolean;

    /**
     * The text that displays when you attempt to use an Exit, but it's locked.
     */
    lockedInteractionText?:
        | ExitCallback<ReactNode | ReactNode[]>
        | ReactNode
        | ReactNode[];
    unlockText?:
        | ReactNode
        | ReactNode[]
        | ExitCallback<ReactNode | ReactNode[]>;

    /**
     * TODO flesh this out more
     * If passed, add a method that optionally controls exit handling?
     */
    onExit?: ExitCallback<boolean>;
};

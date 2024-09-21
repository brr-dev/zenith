// ! Copyright (c) 2024, Brandon Ramirez, brr.dev

import Item, { ItemDefinition } from './Item';
import Exit, { ExitDefinition } from './Exit';
import GameController from '../GameController';
import { asFunction, newlineStringToNodes } from '../gameHelpers';
import ActionMap from './ActionMap';
import { ReactNode } from 'react';
import Feature, { FeatureDefinition } from './Feature';
import { DefinitionMap } from '../gameTypes';

/**
 * Instances of the Room class represent a single tile on the Zone map. Each
 * Room is responsible for keeping track of its own Features and Items. If there
 * are changes made to the state of the Room so that it is different from its
 * initial state, those changes need to be stored somehow in their own object
 * within the class, and applied from getters and setters when reading out
 * information from the Room class. These "update" objects will be stored in
 * memory (somehow) in order to allow persisting saved games across sessions.
 */
export default class Room {
    public roomID: RoomID;
    public _fOnEnter: RoomCallback<ReactNode | ReactNode[]>;
    private visited = false;
    private readonly exits: Exit[] = [];
    private features: Feature[] = [];

    /**
     * Build an instance of the Room class based on the given definition.
     */
    constructor({ id, exits, features, items, onEnter }: RoomDefinition) {
        this.roomID = id;
        this._fOnEnter = asFunction(onEnter);

        for (const exitDefinition of exits) {
            this.exits.push(new Exit(exitDefinition));
        }

        if (items) {
            for (const { type: ItemType = Item, definition } of items) {
                this._items.push(new ItemType(definition));
            }
        }

        if (features) {
            for (const { type: FeatureType = Feature, definition } of features) {
                this.features.push(new FeatureType(definition));
            }
        }
    }

    private _items: Item[] = [];

    public get items() {
        return this._items;
    }

    /** If true, this Room has been visited at least once. */
    get isVisited() {
        return this.visited;
    }

    public discoverFrom(fromFeature: Feature) {
        while (fromFeature.items?.length > 0) {
            const item = fromFeature.items.shift();
            if (item) this.items.push(item);
        }

        const newFeatures = [];
        while (fromFeature.features.length > 0) {
            const feature = fromFeature.features.shift();
            if (feature) newFeatures.push(feature);
        }

        if (newFeatures.length > 0) {
            let fromIndex = this.features.indexOf(fromFeature);
            if (fromIndex < 0) fromIndex = this.features.length - 1;

            this.features = [
                ...this.features.slice(0, fromIndex + 1),
                ...newFeatures,
                ...this.features.slice(fromIndex + 1),
            ];
        }
    }

    public onEnter(gameController: GameController) {
        const enterText: ReactNode[] = [];

        // Add the Room enter text
        const _rawRoomText = this._fOnEnter(this, gameController);
        enterText.push(
            typeof _rawRoomText === 'string' ? newlineStringToNodes(_rawRoomText) : _rawRoomText,
        );

        const featureRoomText = this.features
            .map<[Feature, ReactNode[] | null]>((feat) => [feat, feat.getRoomText(gameController)])
            .filter(([_feat, _roomText]) => _roomText !== null);

        // Add text for each feature
        if (featureRoomText.length > 0) enterText.push(<br />);
        for (const [, _featRoomText] of featureRoomText) {
            if (!_featRoomText) continue;

            enterText.push(<br />, ..._featRoomText);
        }

        // Add text for each item
        if (this._items.length > 0) enterText.push(<br />);
        for (const item of this._items) {
            enterText.push(<br />, ...item.getRoomText(gameController));
        }

        // Add text for each exit
        if (this.exits.length > 0) enterText.push(<br />);
        for (const exit of this.exits) {
            enterText.push(<br />, ...exit.getDisplayText(gameController));
        }

        // Mark visited AFTER the other stuff finishes calculating
        this.visited = true;

        return enterText;
    }

    /** Get a collection of all actions currently available in the room */
    public getAvailableActions(gameController: GameController): ActionMap {
        const actions = new ActionMap();

        // Add a MoveAction for each Exit
        for (const exit of this.exits) {
            exit.registerActions(actions, gameController);
        }

        for (const feature of this.features) {
            feature.registerActions(actions, gameController);
        }

        for (const item of this._items) {
            item.registerActions(actions, gameController);
        }

        return actions;
    }

    public removeItem(item: Item) {
        const idx = this._items.indexOf(item);
        if (idx >= 0) {
            this._items = [...this._items.slice(0, idx), ...this._items.slice(idx + 1)];
            return item;
        }
    }

    public getExit(direction: string): Exit {
        let matchingExit = undefined;

        for (const exit of this.exits) {
            if (exit.direction === direction) {
                matchingExit = exit;
                break;
            }
        }

        if (!matchingExit) {
            throw new Error(
                `Could not find Exit with direction "${direction}" in room "${this.roomID}".`,
            );
        }

        return matchingExit;
    }
}

export type RoomID = string;
export type RoomCallback<ReturnType> = (room: Room, game: GameController) => ReturnType;

export type RoomDefinition = {
    /**
     * The ID of the Room. Should be completely unique to this Zone and defined as
     * a constant at the top of your Zone definition file.
     */
    id: RoomID;

    /**
     * The text displayed when a Room is entered. You can pass a callback to
     * add handling for when a room is entered
     */
    onEnter: ReactNode | ReactNode[] | RoomCallback<ReactNode | ReactNode[]>;

    /**
     * A list of exits from the Room, each with their own direction input
     * tag, display text, and target Room ID.
     */
    exits: ExitDefinition[];

    /**
     * A list of interactive Features in the Room. Anything that the Player
     * can interact with but not pick up should be a Feature.
     */
    features?: DefinitionMap<FeatureDefinition, typeof Feature>[];

    /**
     * A list of interactive Items in the Room. Anything that the Player can
     * pick up and move to their inventory should be an Item.
     */
    items?: DefinitionMap<ItemDefinition, typeof Item>[];
};

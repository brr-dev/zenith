// ! Copyright (c) 2024, Brandon Ramirez, brr.dev

import { ReactNode } from 'react';
import { replaceTag } from '../gameHelpers';
import GameController from '../GameController';
import ActionMap from './ActionMap';
import TakeItemAction from '../actions/TakeItemAction';

export default class Item {
    public name: string;
    public description: string;
    private readonly _roomText: string;
    private readonly _discoverText: string | null;

    constructor({
        name,
        description,
        roomText = 'You see a $NAME$.',
        discoverText = 'You find a $NAME$.',
    }: ItemDefinition) {
        this.name = name;
        this.description = description;
        this._roomText = roomText;

        if (discoverText === undefined) discoverText = 'You find a $NAME$.';
        else if (discoverText === '') discoverText = null;

        this._discoverText = discoverText;
    }

    get discoverText() {
        return this._discoverText
            ? replaceTag(this._discoverText, '$NAME$', this.name)
            : this._discoverText;
    }

    get inventoryText(): ReactNode | ReactNode[] {
        // TODO consistent formatting
        return `${this.name} => ${this.description}`;
    }

    public registerActions(actionMap: ActionMap, gameController: GameController) {
        actionMap.register(
            new TakeItemAction(this, gameController.getCurrentRoom(), gameController),
        );
    }

    getRoomText(gameController: GameController) {
        return replaceTag(this._roomText, '$NAME$', this.name, () =>
            gameController.console.setInputValue(`take ${this.name}`),
        );
    }
}

export type ItemDefinition = {
    /** Display title for the item in your inventory */
    name: string;

    /** Description text for the item in your inventory */

    description: string;

    /** Display text for the item when it's in a Room */
    roomText: string;

    /** Display text when an Item in is discovered a Feature (optional) */
    discoverText?: string | null;
};

// ! Copyright (c) 2024, Brandon Ramirez, brr.dev

import Action from '../classes/Action';
import GameController from '../GameController';
import { Item, Room } from '../classes';
import { wrapInputTag } from '../gameHelpers';

export default class TakeItemAction extends Action {
    constructor(item: Item, room: Room, gameController: GameController) {
        super(`take ${item.name}|pick up ${item.name}`, () => {
            const removedItem = room.removeItem(item);
            if (removedItem) gameController.player.takeItem(removedItem);

            return gameController.console.pause(
                <>You reach out and take the {wrapInputTag(item.name)}.</>,
            );
        });
    }
}

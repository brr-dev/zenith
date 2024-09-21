// ! Copyright (c) 2024, Brandon Ramirez, brr.dev

import Action from '../classes/Action';
import { GameController } from '../GameController';
import { Exit } from '../classes';
import { playInteractionText, wrapInputTag } from '../gameHelpers';

export default class MoveAction extends Action {
    constructor(
        exit: Exit,
        gameController: GameController,
        { includeUnlockHint = true }: { includeUnlockHint?: boolean } = {},
    ) {
        super(`go ${exit.direction}|move ${exit.direction}`, async () => {
            let exitSuccess = false;

            let blockText = exit.blocked(gameController);
            if (blockText) {
                blockText =
                    typeof blockText === 'string'
                        ? blockText
                        : 'This path is blocked.';
                await gameController.console.pause(blockText);
            } else if (exit.locked) {
                if (exit.hasLockedInteractionText()) {
                    const intText =
                        exit.getLockedInteractionText(gameController);

                    gameController.console.clear();
                    await playInteractionText(intText, gameController, {
                        pauseBetween: false,
                    });

                    await gameController.console.pause();
                    exit.lockDiscovered = true;
                } else if (exit.lockDiscovered && includeUnlockHint) {
                    await gameController.console.pause(
                        <>
                            The door is locked, {wrapInputTag('unlock')} it to
                            get through.
                        </>,
                    );
                } else {
                    await gameController.console.pause('The door is locked.');
                    exit.lockDiscovered = true;
                }
            } else {
                exitSuccess = true;
            }

            if (exitSuccess) {
                gameController.setCurrentRoom(exit.targetRoomID);
                await gameController.console.pause(
                    `You head ${exit.direction}...`,
                );
            }
        });
    }
}

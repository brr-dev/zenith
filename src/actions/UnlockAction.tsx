// ! Copyright (c) 2024, Brandon Ramirez, brr.dev

import Action from '../classes/Action';
import { GameController } from '../GameController';
import { Key } from '../items';
import { Exit, Feature } from '../classes';

export default class UnlockAction extends Action {
    constructor(target: Exit | Feature, gameController: GameController) {
        super(`unlock ${target.name}`, async () => {
            if (!target.locked) {
                // Target is not locked (shouldn't happen)
                console.log(
                    "Uh oh! You tried to unlock something that wasn't locked. ",
                );
                return;
            }

            if (target.lockType === 'key') {
                await this.keyLockHandler(target, gameController);
            } else if (target.lockType === 'pin') {
                await this.pinLockHandler(target, gameController);
            } else {
                console.log(`Unhandled lock type "${target.lockType}".`);
            }
        });
    }

    private async keyLockHandler(
        target: Exit | Feature,
        gameController: GameController,
    ) {
        let hasKey = false;

        for (const item of gameController.player.inventory) {
            if (item instanceof Key && target.isCorrectKey(item)) {
                target.locked = false;
                gameController.player.removeItem(item);

                const unlockText =
                    target.getUnlockText(gameController) ??
                    'You turn the key and the lock clicks.';
                await gameController.console.pause(unlockText);

                hasKey = true;
                break;
            }
        }

        if (!hasKey) {
            await gameController.console.pause(
                <>You don't seem to have the right key...</>,
            );
        }
    }

    private async pinLockHandler(
        target: Exit | Feature,
        gameController: GameController,
    ) {
        const displayText = target instanceof Exit ? 'door' : target.name;
        const lockCode = target.lockCode;

        const inputHintStr = lockCode
            ? ` (${new Array(lockCode.length).fill('_').join(' ')})`
            : '';

        const _usrInput = await gameController.console.prompt(
            <>
                <br />
                <br />
                Enter the code for the {displayText}
                {inputHintStr}:
            </>,
            { allowEmpty: true },
        );
        const inputCode = _usrInput.trim();

        if (lockCode === inputCode) {
            target.locked = false;

            const unlockText =
                target.getUnlockText(gameController) ??
                `The code unlocked the ${displayText}!`;
            await gameController.console.pause(unlockText);
        } else if (inputCode === '') {
            await gameController.console.pause('No code entered.');
        } else {
            await gameController.console.pause('The code was incorrect.');
        }
    }
}

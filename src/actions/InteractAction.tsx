// ! Copyright (c) 2024, Brandon Ramirez, brr.dev

import Action from '../classes/Action';
import GameController from '../GameController';
import Feature from '../classes/Feature';
import { wrapInputTag } from '../gameHelpers';

export default class InteractAction extends Action {
    constructor(
        feature: Feature,
        gameController: GameController,
        {
            includeUnlockHint = false,
        }: {
            includeUnlockHint?: boolean;
        } = {},
    ) {
        super(feature.getInteractHotkeys(gameController), async () => {
            let interactSuccess = false;

            if (feature.locked) {
                // await this._handleLock(gameController);
                if (feature.lockDiscovered && includeUnlockHint) {
                    await gameController.console.pause(
                        <>
                            The {feature.name} is locked,{' '}
                            {wrapInputTag('unlock')} it to get inside.
                        </>,
                    );
                } else {
                    await gameController.console.pause(
                        `The ${feature.name} is locked.`,
                    );
                    feature.lockDiscovered = true;
                }
            } else {
                interactSuccess = true;
            }

            if (interactSuccess) {
                await gameController.console.pause(
                    `You examine the ${feature.name}...`,
                );
                return await feature.interact(gameController);
            }
        });
    }
}

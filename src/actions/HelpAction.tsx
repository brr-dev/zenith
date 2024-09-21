// ! Copyright (c) 2024, Brandon Ramirez, brr.dev

import GameController from '../GameController';
import Action from '../classes/Action';

import { GameControls } from '../gameControls';

export default class HelpAction extends Action {
    constructor(gameController: GameController) {
        super('help|controls', () => {
            gameController.console.clear();

            // TODO add more helpful content
            gameController.console.print(GameControls, <br />, <br />);
            return gameController.console.pause();
        });
    }
}

// ! Copyright (c) 2024, Brandon Ramirez, brr.dev

import Action from '../classes/Action';
import { GameController } from '../GameController';

export default class ViewInventoryAction extends Action<never[]> {
    constructor(gameController: GameController) {
        super('i|inv|inventory', () => {
            gameController.console.clear();

            // TODO "empty inventory" message, box and clean up output
            gameController.console.print(
                <>
                    <div className="box container">
                        <div className="center-align alt">Inventory</div>
                        <div className="top-space-x2">
                            {gameController.player.inventory.length === 0 ? (
                                <>Your inventory is empty.</>
                            ) : (
                                gameController.player.inventory.map((item) => (
                                    <div>{item.inventoryText}</div>
                                ))
                            )}
                        </div>
                    </div>
                    <br />
                    <br />
                </>,
            );

            return gameController.console.pause();
        });
    }
}

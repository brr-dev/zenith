// ! Copyright (c) 2024, Brandon Ramirez, brr.dev

import { Feature, FeatureDefinition } from '../classes';
import { GameController } from '../GameController';
import { newlineStringToNodes } from '../gameHelpers';
import { ReactNode } from 'react';
import { OptionalKeys } from '@brr-dev/ts-utils';

export default class Book extends Feature {
    public title?: string;
    public author?: string;
    public text?: string;

    constructor({
        title,
        author,
        text,
        name = 'book',
        interactionText = '',
        ...params
    }: BookDefinition) {
        super({ name, interactionText, ...params });

        this.title = title;
        this.author = author;
        this.text = text;
    }

    public getInteractHotkeys(_gameController: GameController): string {
        let hotkeys = super.getInteractHotkeys(_gameController);

        hotkeys += `|read ${this.name}`;
        if (this.title) hotkeys += `|read ${this.title}`;

        return hotkeys;
    }

    getInteractionText(_gameController: GameController): ReactNode[] {
        return [
            <div className="box container">
                {this.title && (
                    <div className="center-align">- {this.title} -</div>
                )}
                {this.author && (
                    <div className="center-align">{this.author}</div>
                )}
                {(this.title || this.author) && (
                    <div className="center-align">---</div>
                )}
                {this.text ? (
                    <>
                        <div>{newlineStringToNodes(this.text)}</div>
                    </>
                ) : (
                    <div className="center-align">
                        <em>You can't make out any of the text.</em>
                    </div>
                )}
            </div>,
        ];
    }

    async _interaction(gameController: GameController): Promise<void> {
        if (this.name === 'book')
            await gameController.console.pause(`You reach for the book...`);
        await super._interaction(gameController);
        if (this.name === 'book')
            await gameController.console.pause(`You put the book down.`);
    }
}

export type BookDefinition = OptionalKeys<
    FeatureDefinition,
    'name' | 'interactionText'
> & {
    title?: string;
    author?: string;
    text?: string;
};

// ! Copyright (c) 2024, Brandon Ramirez, brr.dev

import Feature, { FeatureDefinition } from '../classes/Feature';
import GameController from '../GameController';
import Book, { BookDefinition } from './Book';
import { wrapInputTag } from '../gameHelpers';
import { DefinitionMap } from '../gameTypes';
import React from 'react';
import { OptionalKeys } from '@brr-dev/ts-utils';

export default class Bookshelf extends Feature {
    private readonly books: Book[] = [];

    constructor({
        name = 'bookshelf',
        books = [],
        ...params
    }: BookshelfDefinition) {
        super({ name, ...params });

        books?.forEach(
            ({ type: BookType = Book, definition: bookDefinition }) => {
                this.books.push(new BookType(bookDefinition));
            },
        );
    }

    public async _interaction(gameController: GameController): Promise<void> {
        gameController.console.clear();
        gameController.console.print(
            <div>{this.getInteractionText(gameController)}</div>,
            <br />,
        );

        const itemNodes = this._getItemNodes();
        if (itemNodes)
            gameController.console.print(...itemNodes, <br />, <br />);

        const featureNodes = this._getFeatureNodes();
        if (featureNodes)
            gameController.console.print(...featureNodes, <br />, <br />);

        let bookChoice = 0;

        if (this.books.length > 1) {
            // Multiple book flow
            gameController.console.print(
                ...this.getBookMenu(gameController),
                <br />,
                <br />,
            );

            const _input = await gameController.console.prompt(
                'Pick a book by number:',
                {
                    allowEmpty: true,
                },
            );
            const menuInput = parseInt(_input.trim().toLowerCase(), 10);

            bookChoice = isNaN(menuInput) ? -1 : menuInput - 1;
        } else if (this.books.length === 1) {
            // Single book flow
            const _readBook = await gameController.console.confirm(
                `Would you like to read ${this.books[0].title}?`,
            );
            bookChoice = _readBook ? 0 : -1;
        } else {
            // No books flow
            await gameController.console.pause(
                'There are no books on the shelf...',
            );
        }

        if (bookChoice === -1) {
            await gameController.console.pause(
                "You don't feel like reading right now.",
            );
        } else if (bookChoice >= 0 && this.books[bookChoice]) {
            await this.books[bookChoice].interact(gameController);
        } else {
            // TODO possibly change this text?
            await gameController.console.pause(
                "You're not sure how you'd do that...",
            );
            await this._interaction(gameController); // Run again
        }
    }

    private getBookMenu(gameController: GameController) {
        const padIndex = this.books.length > 9;
        return [
            ...this.books.map((book, idx) => {
                const bookNumStr = (idx + 1).toString(10);
                const bookLabel = padIndex
                    ? bookNumStr.padStart(2, ' ')
                    : bookNumStr;

                return (
                    <>
                        {wrapInputTag(bookLabel, () =>
                            gameController.console.setInputValue(bookLabel),
                        )}
                        : {book.title}
                        <br />
                    </>
                );
            }),
            <>
                {wrapInputTag(`${padIndex ? ' ' : ''}n`, () =>
                    gameController.console.setInputValue('n'),
                )}
                : I don't want to read
            </>,
        ];
    }
}

export type BookshelfDefinition = OptionalKeys<FeatureDefinition, 'name'> & {
    books?: OptionalKeys<DefinitionMap<BookDefinition>, 'type'>[];
};

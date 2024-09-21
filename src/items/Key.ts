// ! Copyright (c) 2024, Brandon Ramirez, brr.dev

import Item, { ItemDefinition } from '../classes/Item';
import { OptionalKeys } from '@brr-dev/ts-utils';

export default class Key extends Item {
    private readonly keyCode: string;

    constructor({ keyCode, name = 'key', ...itemDefinition }: KeyDefinition) {
        super({ name, ...itemDefinition });

        this.keyCode = keyCode;
    }

    public codeMatches(keyCode: string): boolean {
        return keyCode === this.keyCode;
    }
}

export type KeyDefinition = OptionalKeys<ItemDefinition, 'name'> & {
    keyCode: string;
};

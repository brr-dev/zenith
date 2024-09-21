// ! Copyright (c) 2024, Brandon Ramirez, brr.dev

import Item, { ItemDefinition } from '../classes/Item';
import { OptionalKeys } from '@brr-dev/ts-utils';

export default class Keychain extends Item {
    constructor({ name = 'keychain', ...params }: KeychainDefinition) {
        super({ name, ...params });
    }
}

export type KeychainDefinition = OptionalKeys<ItemDefinition, 'name'>;

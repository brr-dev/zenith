// ! Copyright (c) 2024, Brandon Ramirez, brr.dev

import Action from './Action';

export default class ActionMap extends Map<string, Action> {
    public register(action: Action) {
        action.registerTo(this);
    }
}

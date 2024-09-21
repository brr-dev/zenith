// ! Copyright (c) 2024, Brandon Ramirez, brr.dev

export default class Action<MethodArgs extends unknown[] = unknown[]> {
    public doAction: () => Promise<void> | void;

    private hotkeys: string;

    constructor(
        hotkeys: string,
        method: (...args: MethodArgs) => Promise<void> | void,
        ...methodArgs: MethodArgs
    ) {
        this.hotkeys = hotkeys.toLocaleLowerCase();
        this.doAction = () => method(...methodArgs);
    }

    registerTo(actionMap: Map<string, Action>) {
        for (const hotkey of this.hotkeys.split('|')) {
            actionMap.set(hotkey, this);
        }
    }
}

// ! Copyright (c) 2024, Brandon Ramirez, brr.dev

import { ConditionMap } from "../gameTypes";
import Item from "./Item";

export default class Player {
    public inventory: Item[] = [];

    private readonly conditions: ConditionMap = {};

    hasCondition(condition: string): boolean {
        return this.conditions[condition] ?? false;
    }

    setCondition(condition: string, state: boolean): void {
        this.conditions[condition] = state;
    }

    takeItem(item: Item) {
        this.inventory.push(item);
    }

    removeItem(item: Item) {
        const idx = this.inventory.indexOf(item);
        if (idx >= 0) {
            this.inventory = [...this.inventory.slice(0, idx), ...this.inventory.slice(idx + 1)];
        }
    }
}

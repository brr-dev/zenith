// ! Copyright (c) 2024, Brandon Ramirez, brr.dev

import { ReactNode } from 'react';
import { InteractionText } from './gameTypes';
import GameController from './GameController';
import { Feature, Item, Room } from './classes';
import { cn } from '@brr-dev/classnames';

/**
 * Return the value if it's a function, or return a new cb returning the value.
 */
export function asFunction<CBType, DataType>(data: DataType) {
    return (typeof data !== 'function' ? () => data : data) as CBType;
}

export function wrapInputTag(tag: string, tagOnClick?: () => void): ReactNode {
    return (
        <span className={cn('alt', tagOnClick && 'interactive')} onClick={tagOnClick}>
            &gt;{tag}&lt;
        </span>
    );
}

export function replaceTag(
    fullString: string,
    replaceThis: string,
    replaceWith: string,
    tagOnClick?: () => void,
) {
    const wrappedTag = wrapInputTag(replaceWith, tagOnClick);
    return fullString.split(replaceThis).reduce((res, stringPart) => {
        if (res.length > 0) res.push(wrappedTag);
        res.push(stringPart);
        return res;
    }, [] as ReactNode[]);
}

export function newlineStringToNodes(strWithNewlines: string, newlineChar = '\n'): ReactNode[] {
    return strWithNewlines.split(newlineChar).reduce((res, stringPart) => {
        if (res.length > 0) res.push(<br />);
        res.push(stringPart);
        return res;
    }, [] as ReactNode[]);
}

export function hasItem(featureOrRoom: Feature | Room, itemOrName: string | Item): boolean {
    if (typeof itemOrName === 'string') {
        return featureOrRoom.items.find((value) => value.name === itemOrName) !== undefined;
    } else {
        return featureOrRoom.items.indexOf(itemOrName) >= 0;
    }
}

export async function playInteractionText(
    text: InteractionText,
    gameController: GameController,
    {
        pauseText,
        clearBetween = false,
        pauseBetween = true,
    }: {
        pauseText?: ReactNode;
        clearBetween?: boolean;
        pauseBetween?: boolean;
    },
) {
    let interactionText: (ReactNode | string)[];

    if (!Array.isArray(text)) interactionText = [text];
    else interactionText = text;

    for (let idx = 0; idx < interactionText.length; idx++) {
        if (idx !== 0 && clearBetween) gameController.console.clear();

        const _txt = interactionText[idx];

        if (typeof _txt === 'string') {
            gameController.console.print(<div>{newlineStringToNodes(_txt)}</div>, <br />);
        } else {
            gameController.console.print(<div>{_txt}</div>, <br />);
        }

        if (pauseBetween) await gameController.console.pause(pauseText);
    }
}

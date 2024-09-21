// ! Copyright (c) 2024, Brandon Ramirez, brr.dev

import { GameController } from '../GameController';
import { asFunction, newlineStringToNodes, replaceTag } from '../gameHelpers';
import Item, { ItemDefinition } from './Item';
import { DefinitionMap, LockCode, LockType } from '../gameTypes';
import { ReactNode } from 'react';
import { Key } from '../items';
import ActionMap from './ActionMap';
import { InteractAction, UnlockAction } from '../actions';
import { RequiredKeys } from '@brr-dev/ts-utils';

export default class Feature {
    public name: string;
    public locked: boolean;
    public lockDiscovered: boolean;
    public readonly lockCode?: LockCode;
    public readonly lockType?: LockType;
    protected readonly _fRoomTextCB: FeatureCallback<string | null>;
    protected readonly _fGetUnlockTextCB?: FeatureCallback<
        ReactNode | ReactNode[]
    >;
    protected readonly _fInteractionTextCB: FeatureCallback<
        ReactNode | ReactNode[]
    >;
    private readonly _discoverText: string | null;

    constructor({
        name,
        roomText,
        interactionText,
        items = [],
        features = [],
        locked = false,
        lockDiscovered = false,
        unlockText,
        discoverText,
    }: FeatureDefinition) {
        this.name = name;
        this._fInteractionTextCB = asFunction(interactionText);
        this.lockDiscovered = lockDiscovered;

        if (roomText === undefined) roomText = 'You see a $NAME$.';
        else if (roomText === '') roomText = null;
        this._fRoomTextCB = asFunction(roomText);

        if (discoverText === undefined) discoverText = 'You find a $NAME$.';
        else if (discoverText === '') discoverText = null;
        this._discoverText = discoverText;

        if (typeof locked === 'object') {
            this.locked = true;
            this.lockType = locked.type ?? 'key';
            this.lockCode = locked.code;
        } else {
            this.locked = !!locked;
        }

        if (unlockText !== undefined) {
            this._fGetUnlockTextCB = asFunction(unlockText);
        }

        for (const { type: ItemType = Item, definition } of items) {
            this._items.push(new ItemType(definition));
        }

        for (const { type: FeatureType = Feature, definition } of features) {
            this._features.push(new FeatureType(definition));
        }
    }

    protected _items: Item[] = [];
    public get items() {
        return this._items;
    }

    protected _features: Feature[] = [];
    public get features() {
        return this._features;
    }

    public get discoverText() {
        return this._discoverText
            ? replaceTag(this._discoverText, '$NAME$', this.name)
            : this._discoverText;
    }

    public getInteractHotkeys(_gameController: GameController): string {
        return `look at ${this.name}|look ${this.name}|inspect ${this.name}|examine ${this.name}`;
    }

    public registerActions(
        actionMap: ActionMap,
        gameController: GameController,
    ) {
        actionMap.register(new InteractAction(this, gameController));

        if (this.locked) {
            actionMap.register(new UnlockAction(this, gameController));
        }
    }

    public getInteractionText(gameController: GameController) {
        const _rawInteractionText = this._fInteractionTextCB(
            this,
            gameController,
        );
        return Array.isArray(_rawInteractionText)
            ? _rawInteractionText
            : [_rawInteractionText];
    }

    public getUnlockText(gameController: GameController) {
        if (!this._fGetUnlockTextCB) return undefined;
        else return this._fGetUnlockTextCB(this, gameController);
    }

    public isCorrectKey(key: Key) {
        return key.codeMatches(this.lockCode ?? '');
    }

    public getRoomText(_gameController: GameController) {
        const _rawRoomText = this._fRoomTextCB(this, _gameController);
        return _rawRoomText !== null
            ? replaceTag(_rawRoomText, '$NAME$', this.name, () =>
                  _gameController.console.setInputValue(`look at ${this.name}`),
              )
            : _rawRoomText;
    }

    public async interact(gameController: GameController) {
        await this._interaction(gameController);
        gameController.getCurrentRoom().discoverFrom(this);
    }

    protected async _interaction(gameController: GameController) {
        gameController.console.clear();

        let interactionText = this.getInteractionText(gameController);
        const itemNodes = this._getItemNodes();
        const featureNodes = this._getFeatureNodes();

        if (interactionText.length <= 1) {
            const _text: string | ReactNode = interactionText[0];
            const interactionNodes: ReactNode[] =
                typeof _text === 'string'
                    ? newlineStringToNodes(_text)
                    : [_text];

            gameController.console.print(
                <div>
                    {interactionNodes}
                    <br />
                    <br />
                    {featureNodes && (
                        <>
                            {featureNodes}
                            <br />
                            <br />
                        </>
                    )}
                    {itemNodes && (
                        <>
                            {itemNodes}
                            <br />
                            <br />
                        </>
                    )}
                </div>,
            );

            await gameController.console.pause();
        } else {
            for (let idx = 0; idx < interactionText.length; idx++) {
                const textPart = interactionText[idx];
                const interactionNodes =
                    typeof textPart === 'string'
                        ? newlineStringToNodes(textPart)
                        : [textPart];
                gameController.console.print(
                    <div>{interactionNodes}</div>,
                    <br />,
                );

                const isFinalLoop = idx === interactionText.length - 1;

                if (itemNodes && isFinalLoop) {
                    gameController.console.print(
                        <div>{itemNodes}</div>,
                        <br />,
                    );
                }
                if (featureNodes && isFinalLoop) {
                    gameController.console.print(
                        <div>{featureNodes}</div>,
                        <br />,
                    );
                }

                await gameController.console.pause();
            }
        }
    }

    protected _getItemNodes(): ReactNode[] | undefined {
        const itemsWithDiscoverText = this._items
            .map<
                [Item, string | ReactNode[] | null]
            >((item) => [item, item.discoverText])
            .filter(([, text]) => text !== null);

        return itemsWithDiscoverText.length < 1
            ? undefined
            : itemsWithDiscoverText.map(([, text], i, _l) => (
                  <>
                      {text}
                      {i !== _l.length - 1 ? <br /> : null}
                  </>
              ));
    }

    protected _getFeatureNodes(): ReactNode[] | undefined {
        const featuresWithDiscoverText = this._features
            .map<
                [Feature, null | string | ReactNode[]]
            >((feat) => [feat, feat.discoverText])
            .filter(([, text]) => text !== null);

        return featuresWithDiscoverText.length < 1
            ? undefined
            : featuresWithDiscoverText.map(([, text], i, _l) => (
                  <>
                      {text}
                      {i !== _l.length - 1 ? <br /> : null}
                  </>
              ));
    }
}

export type FeatureCallback<ReturnType> = (
    feature: Feature,
    gameController: GameController,
) => ReturnType;

export type FeatureDefinition = {
    /** The interaction tag/display name of the Feature */
    name: string;

    /**
     * The text to display in a Room to acknowledge your Feature:
     * @default "You see a $NAME$."
     */
    roomText?: string | null | FeatureCallback<string | null>;

    /** Define what happens when you interact with your feature */
    interactionText:
        | ReactNode
        | ReactNode[]
        | FeatureCallback<ReactNode | ReactNode[]>;

    /** Optionally include discoverable Items within the Feature. */
    items?: DefinitionMap<FeatureItemDefinition>[];
    features?: DefinitionMap<FeatureDefinition>[];

    discoverText?: string | null;
    locked?: false | { type?: LockType; code: LockCode };
    lockDiscovered?: boolean;
    unlockText?:
        | ReactNode
        | ReactNode[]
        | FeatureCallback<ReactNode | ReactNode[]>;
};

export type FeatureItemDefinition = ItemDefinition &
    RequiredKeys<ItemDefinition, 'discoverText'>;

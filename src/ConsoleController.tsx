// ! Copyright (c) 2024, Brandon Ramirez, brr.dev

import React, { Dispatch, ReactNode, RefObject, SetStateAction } from 'react';

type SetInputPrefixCB = Dispatch<SetStateAction<undefined | ReactNode>>;
type SetOutputTextCB = Dispatch<SetStateAction<undefined | ReactNode[]>>;

const DEFAULT_INPUT_PREFIX = <>&gt;&gt;&nbsp;</>;

/**
 * A class that lets you link a Console component from the cozy-ui library
 * to React state and exposes Python-esque console I/O controller methods.
 */
export default class ConsoleController {
    private _inputRef: RefObject<HTMLDivElement>;
    private readonly _setInputPrefix: SetInputPrefixCB;
    private readonly _setOutputText: SetOutputTextCB;
    private _waitingForInput: boolean = false;

    constructor({
        inputRef,
        setInputPrefix,
        setOutputText,
    }: {
        inputRef: RefObject<HTMLDivElement>;
        setInputPrefix: SetInputPrefixCB;
        setOutputText: SetOutputTextCB;
    }) {
        this._inputRef = inputRef;
        this._setInputPrefix = setInputPrefix;
        this._setOutputText = setOutputText;
    }

    /**
     * Simple getter for the passed-in inputRef that throws an error if unset.
     */
    private get consoleInputElem() {
        if (!this._inputRef.current) {
            throw new Error('No inputRef found in the ConsoleController.');
        }

        return this._inputRef.current;
    }

    public isWaitingForInput() {
        return this._waitingForInput;
    }

    public setInputValue(newValue: string) {
        if (this._inputRef.current) this._inputRef.current.innerText = newValue;
    }

    /**
     * Create a Promise that pauses program execution and waits for user input.
     * Optionally provide a custom input prefix node, defaults to ">> ".
     */
    public input(
        inputPrefix: ReactNode = DEFAULT_INPUT_PREFIX,
    ): Promise<string> {
        this._waitingForInput = true;
        const _doneWaitingForInput = () => {
            this._waitingForInput = false;
        };

        return new Promise((resolve) => {
            const consoleInputElem = this.consoleInputElem;

            consoleInputElem.removeEventListener(
                'keydown',
                _resolveOnEnterPress,
            );
            consoleInputElem.addEventListener('keydown', _resolveOnEnterPress);
            this.setInputPrefix(inputPrefix);

            function _resolveOnEnterPress(evt: KeyboardEvent) {
                const inputValue = consoleInputElem.innerText.trim();

                if (evt.key === 'Enter') {
                    consoleInputElem.removeEventListener(
                        'keydown',
                        _resolveOnEnterPress,
                    );
                    _doneWaitingForInput();
                    resolve(inputValue);
                }
            }
        });
    }

    /**
     * Print the provided output to the Console output element.
     */
    public print(...output: ReactNode[]) {
        this._setOutputText((currentOutput) => [
            ...(currentOutput ?? []),
            ...output,
        ]);
    }

    /**
     * Clear the Console output.
     */
    public clear() {
        this._setOutputText([]);
    }

    /**
     * Pause program execution to prompt the user for input.
     */
    public async prompt(
        prompt: ReactNode = 'What do you do?',
        { allowEmpty = false, inputPrefix }: ConsolePromptOptions = {},
    ): Promise<string> {
        this.print(prompt);

        let res;

        do {
            res = await this.input(inputPrefix);
        } while (!allowEmpty && !res);

        return res;
    }

    public async confirm(
        prompt: ReactNode,
        { defaultValue = true, ...params }: ConsoleConfirmOptions = {},
    ) {
        // Capitalize one of the options based on defaultValue
        const yesChar = defaultValue === true ? 'Y' : 'y';
        const noChar = defaultValue === false ? 'N' : 'n';

        // Add indicator to the prompt that this is a yes/no question
        prompt = (
            <>
                {prompt} ({yesChar}/{noChar})
            </>
        );

        // Resolve to true or false based on the user's input
        switch (await this.prompt(prompt, { ...params, allowEmpty: true })) {
            case 'y':
            case 'Y':
            case 'yes':
            case 'Yes':
                return true;

            case 'n':
            case 'N':
            case 'no':
            case 'No':
                return false;

            case '':
            default:
                return defaultValue;
        }
    }

    /**
     * Pause program execution with a little message.
     */
    public async pause(
        pauseText: ReactNode = 'Press Enter to continue...',
    ): Promise<void> {
        await this.input(pauseText);
    }

    /**
     * Set the input prefix of the Console component.
     */
    public setInputPrefix(prefix: ReactNode) {
        this._setInputPrefix(prefix);
    }

    /**
     * Reset the input prefix of the Console back to default.
     */
    public resetInputPrefix() {
        this.setInputPrefix(DEFAULT_INPUT_PREFIX);
    }
}

type ConsolePromptOptions = { allowEmpty?: boolean; inputPrefix?: ReactNode };
type ConsoleConfirmOptions = Omit<ConsolePromptOptions, 'allowEmpty'> & {
    defaultValue?: boolean;
};

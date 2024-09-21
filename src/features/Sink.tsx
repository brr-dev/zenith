// ! Copyright (c) 2024, Brandon Ramirez, brr.dev

import Feature, { FeatureDefinition } from '../classes/Feature';

export default class Sink extends Feature {
    constructor({
        name = 'sink',
        interactionText = "It's a sink. Not much else to say.",
        ...params
    }: FeatureDefinition) {
        super({ name, interactionText, ...params });
    }
}

/*
 * @author Brandon Ramirez <brandon@brr.dev>
 * @copyright Copyright (c) 2024
 */

import { ReactNode } from 'react';
import { ZoneMap } from './classes';

/**
 * Conditions should be tracked by creating string constants for reference keys
 * and mapping them to boolean values indicating the state of the condition.
 */
export type ConditionMap = Record<string, boolean>;

export type DefinitionMap<
    FeatureDefinition = any,
    ClassType extends new (...args: any) => any = new (...args: any) => any,
> = {
    type: ClassType;
    definition: FeatureDefinition;
};

/**
 * This is effectively how we will define our game "discs".
 */
export type GameDiscDefinition = {
    gameTitle: ReactNode;
    gameDescription: ReactNode;
    zoneMap: ZoneMap;
    welcomeMessage: ReactNode[];
};

export type InteractionText = ReactNode | ReactNode[];

export type LockType = 'key' | 'pin';
export type LockCode = string;

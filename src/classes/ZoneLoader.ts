// ! Copyright (c) 2024, Brandon Ramirez, brr.dev

import { ZoneDefinition, ZoneID } from './Zone';

export type ZoneMap = Record<
    ZoneID,
    () => Promise<{ default: ZoneDefinition }>
>;

export default class ZoneLoader {
    _zoneMap: ZoneMap;

    constructor(zoneMap: ZoneMap) {
        this._zoneMap = zoneMap;
    }

    /**
     * Load the Zone with the given number. If the Zone is not defined, or the definition is
     * missing in our ZONE_MAP object, will throw an error.
     */
    async loadZone(zoneID: ZoneID = 0): Promise<ZoneDefinition> {
        if (!this._zoneIsDefined(zoneID)) {
            throw new Error(
                `Could not load Zone #${zoneID}. Missing definition.`,
            );
        }

        const _importZoneDynamically = this._zoneMap[zoneID];
        const _zoneModule = await _importZoneDynamically();
        return _zoneModule.default; // Should be the ZoneDefinition object
    }

    /**
     * Simple type guard method to make sure that we have a matching definition for the
     * Zone with the input number in our ZONE_MAP object.
     */
    private _zoneIsDefined(
        zoneID: ZoneID,
    ): zoneID is keyof typeof this._zoneMap {
        return (
            this._zoneMap[zoneID as keyof typeof this._zoneMap] !== undefined
        );
    }
}

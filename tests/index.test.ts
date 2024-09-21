/*
 * @author Brandon Ramirez <brandon@brr.dev>
 * @copyright Copyright (c) 2024
 */

import { testFunc } from '../src';

describe('Testing the test function', () => {
    afterAll(() => {
        jest.restoreAllMocks();
    });

    it('works', () => {
        const loggerSpy = jest.spyOn(console, 'log');
        loggerSpy.mockImplementationOnce(() => {});

        expect(loggerSpy).toHaveBeenCalledTimes(0);

        testFunc();

        expect(loggerSpy).toHaveBeenCalledTimes(1);
    });
});

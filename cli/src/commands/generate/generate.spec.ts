/* eslint-disable  @typescript-eslint/no-explicit-any */

import { exportedForTesting } from './generate';
import { runGenerate } from './generate';
import { tmpdir } from 'node:os';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { SchemaDirectory } from './schema-directory';

jest.mock('../helper', () => {
    return {
        initLogger: () => {
            return {
                info: () => {},
                debug: () => {}
            };
        }
    };
});

jest.mock('./schema-directory');

jest.mock('../../consts', () => ({
    get CALM_META_SCHEMA_DIRECTORY() { return '../calm/draft/2024-04/meta'; }
}));

let mockSchemaDir;

beforeEach(() => {
    mockSchemaDir = new SchemaDirectory();
});

const {
    instantiateAdditionalTopLevelProperties
} = exportedForTesting;


describe('instantiateAdditionalTopLevelProperties', () => {
    it('instantiate an additional top level array property', () => {
        const pattern = {
            properties: {
                'extra-property': {
                    properties: {
                        values: {
                            type: 'array' 
                        }
                    }
                }
            }
        };

        expect(instantiateAdditionalTopLevelProperties(pattern, mockSchemaDir))
            .toEqual({
                'extra-property': {
                    values: [ '{{ VALUES }}' ]
                }
            });
    });
    
    it('instantiate an additional top level const property', () => {
        const pattern = {
            properties: {
                'extra': {
                    properties: {
                        'extra-property': {
                            const: 'value here'
                        }
                    }
                }
            }
        };

        expect(instantiateAdditionalTopLevelProperties(pattern, mockSchemaDir))
            .toEqual({
                'extra': {
                    'extra-property': 'value here'
                }
            });
    });
    
    it('instantiate an additional top level string property', () => {
        const pattern = {
            properties: {
                'extra': {
                    properties: {
                        'extra-property': {
                            'type': 'string'
                        }
                    }
                }
            }
        };

        expect(instantiateAdditionalTopLevelProperties(pattern, mockSchemaDir))
            .toEqual({
                extra: {
                    'extra-property': '{{ EXTRA_PROPERTY }}'
                }
            });
    });
});


describe('runGenerate', () => {
    let tempDirectoryPath;
    const testPath: string = 'test_fixtures/api-gateway.json';

    beforeEach(() => {
        tempDirectoryPath = mkdtempSync(path.join(tmpdir(), 'calm-test-'));
    });

    afterEach(() => {
        rmSync(tempDirectoryPath, { recursive: true, force: true });
    });

    it('instantiates to given directory', async () => {
        const outPath = path.join(tempDirectoryPath, 'output.json');
        await runGenerate(testPath, outPath, false, false);

        expect(existsSync(outPath))
            .toBeTruthy();
    });

    it('instantiates to given directory with nested folders', async () => {
        const outPath = path.join(tempDirectoryPath, 'output/test/output.json');
        await runGenerate(testPath, outPath, false, false);

        expect(existsSync(outPath))
            .toBeTruthy();
    });

    it('instantiates to calm instantiation file', async () => {
        const outPath = path.join(tempDirectoryPath, 'output.json');
        await runGenerate(testPath, outPath, false, false);

        expect(existsSync(outPath))
            .toBeTruthy();

        const spec = readFileSync(outPath, { encoding: 'utf-8' });
        const parsed = JSON.parse(spec);
        expect(parsed)
            .toHaveProperty('nodes');
        expect(parsed)
            .toHaveProperty('relationships');
    });
});

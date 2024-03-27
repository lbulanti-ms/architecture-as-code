import Ajv2020 from 'ajv/dist/2020.js';
import { readFileSync } from 'fs';

export default async function validateSchemaInstantiationAgainstJsonSchema(jsonSchemaInstantiationPath: string, jsonSchemaPath: string) {

    const ajv = new Ajv2020({ strict: false, loadSchema: loadSchema });
    const jsonSchemaInstantiation = await readFile(jsonSchemaInstantiationPath);
    const jsonSchema = await readFile(jsonSchemaPath);
    const validate = await ajv.compileAsync(JSON.parse(jsonSchema));
    if (validate(jsonSchemaInstantiation)) {
        return [];
    } else {
        return validate.errors;
    }
}

async function readFile(filePath: string): Promise<string> {
    const file = readFileSync(filePath, 'utf-8');
    return file;
}

async function loadSchema(uri) {
    const res = await fetch(uri)
    console.log(res.body)
    if (res.status >= 400) throw new Error("Loading error: " + res.status)
    return res.body
}

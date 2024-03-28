#! /usr/bin/env node

import { program } from 'commander';
import validate from './validation/schema-validation.js'


program
    .version('0.1.0')
    .description('A set of utilities for interacting with CALM');

program
    .command('placeholder <input>')
    .description('This is just a placeholder. Replace with an actual command.')
    .action((input) => { console.log(input); });

program
.command("validate")
.requiredOption("-p, --pattern <pattern>", "The location of the JSON Schema Pattern")
.requiredOption("-i, --instantiation <instantiation>", "The location of the instantiation of the Pattern")
.action(async (options)=> {
    await validate(options.instantiation, options.pattern);
})

program.parse(process.argv);

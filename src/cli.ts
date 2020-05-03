
import * as fs from 'fs';
import { Lexer } from './lexer';
import { Parser } from './parser';
import { evaluate } from './interpreter';

// skip unecessary arguments
const [, , ...args] = process.argv;

if (args.length < 1) {
    throw "expecting one argument";
}

const inputFilename = args[0];

fs.readFile(inputFilename, 'utf8', (err, data) => {
    if (err) throw err;
    const lexer = new Lexer(data);
    const parser = new Parser(lexer);
    const result = parser.parseFile();
    console.log(evaluate(result));
});
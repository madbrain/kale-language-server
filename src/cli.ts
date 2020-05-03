
import * as fs from 'fs';
import { Lexer, TokenKind } from './lexer';
import { Parser } from './parser';

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
    const file = parser.parseFile();
    console.log(JSON.stringify(file, null, 2));
});

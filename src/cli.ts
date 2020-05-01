
import * as fs from 'fs';
import { Lexer, TokenKind } from './lexer';

// skip unecessary arguments
const [, , ...args] = process.argv;

if (args.length < 1) {
    throw "expecting one argument";
}

const inputFilename = args[0];

fs.readFile(inputFilename, 'utf8', (err, data) => {
    if (err) throw err;
    const lexer = new Lexer(data);
    while (true) {
        let token = lexer.nextToken();
        if (token.kind == TokenKind.EOF) {
	    break;
        }
      console.log(token);
    }
});

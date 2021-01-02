
import { expect } from 'chai';

import { Parser } from './parser';
import { Lexer } from './lexer';
import { KaleFile } from './ast';
import { evaluate } from './interpreter';

function getResult(content: string): KaleFile {
    return new Parser(new Lexer(content)).parseFile();
}

describe("Interpreter Tests", function() {

    it("evaluate simple message", function() {
        const content = 'message := "hello world"';
        expect(evaluate(getResult(content))).to.equal("hello world");
    });

    it("evaluate complex program", function() {
        const content = `// test computation
        price := 12
        quantity := 34
        cost := price * quantity + 23 
        message := "result: " + cost`;
        expect(evaluate(getResult(content))).to.equal("result: 431");
    });
});

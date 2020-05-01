
import { expect } from 'chai';

import { Lexer, TokenKind } from './lexer';

describe("Lexer Tests", function () {

    it("scan integer", function () {
        const content = "256";
        const lexer = new Lexer(content);
        expect(lexer.nextToken()).to.eql({ kind: TokenKind.INTEGER, value: "256" });
    });

    it("scan identifier", function () {
        const content = "hello";
        const lexer = new Lexer(content);
        expect(lexer.nextToken()).to.eql({ kind: TokenKind.IDENT, value: "hello" });
    });

    it("identifier can contains digit and '_'", function () {
        const content = "hello_256";
        const lexer = new Lexer(content);
        expect(lexer.nextToken()).to.eql({ kind: TokenKind.IDENT, value: "hello_256" });
    });

    it("scan multiple tokens separated by whitespaces", function () {
        const content = "\rhello 256\n\tworld";
        const lexer = new Lexer(content);
        expect(lexer.nextToken()).to.eql({ kind: TokenKind.IDENT, value: "hello" });
        expect(lexer.nextToken()).to.eql({ kind: TokenKind.INTEGER, value: "256" });
        expect(lexer.nextToken()).to.eql({ kind: TokenKind.IDENT, value: "world" });
    });

    it("end of stream is token EOF", function () {
        const content = "hello 256";
        const lexer = new Lexer(content);
        expect(lexer.nextToken()).to.eql({ kind: TokenKind.IDENT, value: "hello" });
        expect(lexer.nextToken()).to.eql({ kind: TokenKind.INTEGER, value: "256" });
        expect(lexer.nextToken()).to.eql({ kind: TokenKind.EOF });
        expect(lexer.nextToken()).to.eql({ kind: TokenKind.EOF });
    });

    it("scan string delimited by '\"'", function () {
        const content = "\"my string with spaces\"";
        const lexer = new Lexer(content);
        expect(lexer.nextToken()).to.eql({ kind: TokenKind.STRING, value: "my string with spaces" });
    });

    it("fail on unterminated string", function () {
        const content = "\"my wrong string";
        const lexer = new Lexer(content);
        expect(() => lexer.nextToken()).to.throw("Unterminated string");
    });

    it("scan operators", function () {
        const content = ":= + - * /";
        const lexer = new Lexer(content);
        expect(lexer.nextToken()).to.eql({ kind: TokenKind.ASSIGN });
        expect(lexer.nextToken()).to.eql({ kind: TokenKind.ADD });
        expect(lexer.nextToken()).to.eql({ kind: TokenKind.SUBSTRACT });
        expect(lexer.nextToken()).to.eql({ kind: TokenKind.MULTIPLY });
        expect(lexer.nextToken()).to.eql({ kind: TokenKind.DIVIDE });
    });

    it("ignore single line comments", function () {
        const content = "hello// comment to end of line\n256";
        const lexer = new Lexer(content);
        expect(lexer.nextToken()).to.eql({ kind: TokenKind.IDENT, value: "hello" });
        expect(lexer.nextToken()).to.eql({ kind: TokenKind.INTEGER, value: "256" });
        expect(lexer.nextToken()).to.eql({ kind: TokenKind.EOF });
    });
});

import { expect } from 'chai';

import { Lexer, TokenKind } from './lexer';
import { code } from './code-utils';

describe("Lexer Tests", function () {

    it("scan integer", function () {
        const content = code("@{1}256@{2}");
        const lexer = new Lexer(content.value);
        expect(lexer.nextToken()).to.eql({ span: content.span(1, 2), kind: TokenKind.INTEGER, value: "256" });
    });

    it("scan identifier", function () {
        const content = code("@{1}hello@{2}");
        const lexer = new Lexer(content.value);
        expect(lexer.nextToken()).to.eql({ span: content.span(1, 2), kind: TokenKind.IDENT, value: "hello" });
    });

    it("identifier can contains digit and '_'", function () {
        const content = code("@{1}hello_256@{2}");
        const lexer = new Lexer(content.value);
        expect(lexer.nextToken()).to.eql({ span: content.span(1, 2), kind: TokenKind.IDENT, value: "hello_256" });
    });

    it("scan multiple tokens separated by whitespaces", function () {
        const content = code(" @{1}hello@{2} @{3}256@{4}\n\t@{5}world@{6}");
        const lexer = new Lexer(content.value);
        expect(lexer.nextToken()).to.eql({ span: content.span(1, 2), kind: TokenKind.IDENT, value: "hello" });
        expect(lexer.nextToken()).to.eql({ span: content.span(3, 4), kind: TokenKind.INTEGER, value: "256" });
        expect(lexer.nextToken()).to.eql({ span: content.span(5, 6), kind: TokenKind.IDENT, value: "world" });
    });

    it("end of stream is token EOF", function () {
        const content = code("@{1}hello@{2} @{3}256@{4}");
        const lexer = new Lexer(content.value);
        expect(lexer.nextToken()).to.eql({ span: content.span(1, 2), kind: TokenKind.IDENT, value: "hello" });
        expect(lexer.nextToken()).to.eql({ span: content.span(3, 4), kind: TokenKind.INTEGER, value: "256" });
        expect(lexer.nextToken()).to.eql({ span: content.span(4, 4), kind: TokenKind.EOF });
        expect(lexer.nextToken()).to.eql({ span: content.span(4, 4), kind: TokenKind.EOF });
    });

    it("scan string delimited by '\"'", function () {
        const content = code("@{1}\"my string with spaces\"@{2}");
        const lexer = new Lexer(content.value);
        expect(lexer.nextToken()).to.eql({ span: content.span(1, 2), kind: TokenKind.STRING, value: "my string with spaces" });
    });

    it("fail on unterminated string", function () {
        const lexer = new Lexer("\"my wrong string");
        expect(() => lexer.nextToken()).to.throw("Unterminated string");
    });

    it("scan operators", function () {
        const content = code("@{1}:=@{2} @{3}+@{4} @{5}-@{6} @{7}*@{8} @{9}/@{10}");
        const lexer = new Lexer(content.value);
        expect(lexer.nextToken()).to.eql({ span: content.span(1, 2), kind: TokenKind.ASSIGN });
        expect(lexer.nextToken()).to.eql({ span: content.span(3, 4), kind: TokenKind.ADD });
        expect(lexer.nextToken()).to.eql({ span: content.span(5, 6), kind: TokenKind.SUBSTRACT });
        expect(lexer.nextToken()).to.eql({ span: content.span(7, 8), kind: TokenKind.MULTIPLY });
        expect(lexer.nextToken()).to.eql({ span: content.span(9, 10), kind: TokenKind.DIVIDE });
    });

    it("ignore single line comments", function () {
        const content = code("@{1}hello@{2}// comment to end of line\n@{3}256@{4}");
        const lexer = new Lexer(content.value);
        expect(lexer.nextToken()).to.eql({ span: content.span(1, 2), kind: TokenKind.IDENT, value: "hello" });
        expect(lexer.nextToken()).to.eql({ span: content.span(3, 4), kind: TokenKind.INTEGER, value: "256" });
        expect(lexer.nextToken()).to.eql({ span: content.span(4, 4), kind: TokenKind.EOF });
    });
});
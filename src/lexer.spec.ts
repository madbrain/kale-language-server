
import { expect } from 'chai';

import { Lexer, TokenKind } from './lexer';
import { code, TestErrorReporter } from './code-utils';

describe("Lexer Tests", function() {

    it("scan integer", function() {
        const reporter = new TestErrorReporter();
        const content = code("@{1}256@{2}");
        const lexer = new Lexer(content.value, reporter);
        expect(lexer.nextToken()).to.eql({ span: content.span(1, 2), kind: TokenKind.INTEGER, value: "256" });
        expect(reporter.errors).to.empty;
    });

    it("scan identifiers", function() {
        const reporter = new TestErrorReporter();
        const content = code("  @{1}hello@{2} @{3}hello@{4}");
        const lexer = new Lexer(content.value, reporter);
        expect(lexer.nextToken()).to.eql({ span: content.span(1, 2), kind: TokenKind.START_IDENT, value: "hello" });
        expect(lexer.nextToken()).to.eql({ span: content.span(3, 4), kind: TokenKind.IDENT, value: "hello" });
        expect(reporter.errors).to.empty;
    });

    it("identifier can contains digit and '_'", function() {
        const reporter = new TestErrorReporter();
        const content = code("@{1}hello_256@{2}");
        const lexer = new Lexer(content.value, reporter);
        expect(lexer.nextToken()).to.eql({ span: content.span(1, 2), kind: TokenKind.START_IDENT, value: "hello_256" });
        expect(reporter.errors).to.empty;
    });

    it("scan multiple tokens separated by whitespaces", function() {
        const reporter = new TestErrorReporter();
        const content = code(" @{1}hello@{2} @{3}256@{4}\n\t@{5}world@{6}");
        const lexer = new Lexer(content.value, reporter);
		expect(lexer.nextToken()).to.eql({ span: content.span(1, 2), kind: TokenKind.START_IDENT, value: "hello" });
		expect(lexer.nextToken()).to.eql({ span: content.span(3, 4), kind: TokenKind.INTEGER, value: "256" });
        expect(lexer.nextToken()).to.eql({ span: content.span(5, 6), kind: TokenKind.START_IDENT, value: "world" });
        expect(reporter.errors).to.empty;
    });

    it("end of stream is token EOF", function() {
        const reporter = new TestErrorReporter();
        const content = code("@{1}hello@{2} @{3}256@{4}");
        const lexer = new Lexer("hello 256", reporter);
		expect(lexer.nextToken()).to.eql({ span: content.span(1, 2), kind: TokenKind.START_IDENT, value: "hello" });
		expect(lexer.nextToken()).to.eql({ span: content.span(3, 4), kind: TokenKind.INTEGER, value: "256" });
		expect(lexer.nextToken()).to.eql({ span: content.span(4, 4), kind: TokenKind.EOF });
        expect(lexer.nextToken()).to.eql({ span: content.span(4, 4), kind: TokenKind.EOF });
        expect(reporter.errors).to.empty;
    });

    it("scan string delimited by '\"'", function() {
        const reporter = new TestErrorReporter();
        const content = code("@{1}\"my string with spaces\"@{2}");
        const lexer = new Lexer(content.value, reporter);
        expect(lexer.nextToken()).to.eql({ span: content.span(1, 2), kind: TokenKind.STRING, value: "my string with spaces" });
        expect(reporter.errors).to.empty;
    });

    it("fail on unterminated string", function() {
        const reporter = new TestErrorReporter();
        const content = code("@{1}\"my wrong string@{2}");
        const lexer = new Lexer(content.value, reporter);
        expect(lexer.nextToken()).to.eql({ span: content.span(1, 2), kind: TokenKind.STRING, value: "my wrong string" });
        expect(lexer.nextToken()).to.eql({ span: content.span(2, 2), kind: TokenKind.EOF });
        expect(reporter.errors).to.eql([{ span: content.span(1, 2), message: "Unterminated string"}]);
    });

    it("scan operators", function() {
        const reporter = new TestErrorReporter();
        const content = code("@{1}:=@{2} @{3}+@{4} @{5}-@{6} @{7}*@{8} @{9}/@{10}");
        const lexer = new Lexer(content.value, reporter);
		expect(lexer.nextToken()).to.eql({ span: content.span(1, 2), kind: TokenKind.ASSIGN });
		expect(lexer.nextToken()).to.eql({ span: content.span(3, 4), kind: TokenKind.ADD });
		expect(lexer.nextToken()).to.eql({ span: content.span(5, 6), kind: TokenKind.SUBSTRACT });
		expect(lexer.nextToken()).to.eql({ span: content.span(7, 8), kind: TokenKind.MULTIPLY });
        expect(lexer.nextToken()).to.eql({ span: content.span(9, 10), kind: TokenKind.DIVIDE });
        expect(reporter.errors).to.empty;
    });

    it("ignore single line comments", function() {
        const reporter = new TestErrorReporter();
        const content = code("@{1}hello@{2}// comment to end of line\n@{3}256@{4}");
        const lexer = new Lexer(content.value, reporter);
		expect(lexer.nextToken()).to.eql({ span: content.span(1, 2), kind: TokenKind.START_IDENT, value: "hello" });
		expect(lexer.nextToken()).to.eql({ span: content.span(3, 4), kind: TokenKind.INTEGER, value: "256" });
        expect(lexer.nextToken()).to.eql({ span: content.span(4, 4), kind: TokenKind.EOF });
        expect(reporter.errors).to.empty;
    });
});

describe("Lexer Robustness Tests", function() {

    it("report unknown characters", function() {
        const reporter = new TestErrorReporter();
        const content = code("@{1}%^@{2} @{3}256@{4}\n @{5}#'@{6}");
        const lexer = new Lexer(content.value, reporter);
        expect(lexer.nextToken()).to.eql({ span: content.span(3, 4), kind: TokenKind.INTEGER, value: "256" });
        expect(lexer.nextToken()).to.eql({ span: content.span(6, 6), kind: TokenKind.EOF });
        expect(reporter.errors).to.eql([
            { span: content.span(1, 2), message: "Unknown character(s)"},
            { span: content.span(5, 6), message: "Unknown character(s)"}
        ]);
    });
});
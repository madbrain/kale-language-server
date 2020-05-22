
import { expect } from 'chai';

import { Parser } from './parser';
import { Lexer } from './lexer';
import { code, TestErrorReporter } from './code-utils';
import { checkSemantic, RefactoringAction } from './semantic';

describe("Semantic Tests", function() {

    it("report use of undefined variable", function() {
        const reporter = new TestErrorReporter();
        const content = code('message := 10 * @{1}price@{2}');
        const parser = new Parser(new Lexer(content.value, reporter), reporter);
        const result = parser.parseFile();

        checkSemantic(result, reporter);

        expect(reporter.errors).to.eql([{span: content.span(1, 2), message: "Unknown variable 'price'" }]);
    });

    it("report use of - * / on string", function() {
        const reporter = new TestErrorReporter();
        const content = code('price := "10" + 20\nmessage := @{1}price * 30@{2}');
        const parser = new Parser(new Lexer(content.value, reporter), reporter);
        const result = parser.parseFile();

        checkSemantic(result, reporter);

        expect(reporter.errors).to.eql([{span: content.span(1, 2), message: "Cannot use '*' on strings" }]);
    });

    it("don't report error on unknown type", function() {
        const reporter = new TestErrorReporter();
        const content = code('price := @{1}"10" - 20@{2}\nmessage := price * "hello"');
        const parser = new Parser(new Lexer(content.value, reporter), reporter);
        const result = parser.parseFile();

        checkSemantic(result, reporter);

        expect(reporter.errors).to.eql([{span: content.span(1, 2), message: "Cannot use '-' on strings" }]);
    });

    it("report missing message variable", function() {
        const reporter = new TestErrorReporter();
        const content = code('quantity := 30\n@{1}price := 20@{2}');
        const parser = new Parser(new Lexer(content.value, reporter), reporter);
        const result = parser.parseFile();

        checkSemantic(result, reporter);

        expect(reporter.errors).to.eql([{span: content.span(1, 2), message: "Missing 'message' variable" }]);
    });

    it("report missing message variable on empty file", function() {
        const reporter = new TestErrorReporter();
        const content = code('@{1}');
        const parser = new Parser(new Lexer(content.value, reporter), reporter);
        const result = parser.parseFile();

        checkSemantic(result, reporter);

        expect(reporter.errors).to.eql([{span: content.span(1, 1), message: "Missing 'message' variable" }]);
    });
});

describe("Semantic of bad value Tests", function() {

    it("bad assignment has unknown type", function() {
        const reporter = new TestErrorReporter();
        const content = code('price := @{1}+@{2}\nmessage := price * "hello"');
        const parser = new Parser(new Lexer(content.value, reporter), reporter);
        const result = parser.parseFile();

        checkSemantic(result, reporter);

        expect(reporter.errors).to.eql([{span: content.span(1, 2), message: "Expecting STRING, got ADD" }]);
    });

    it("bad add/sub value has unknown type", function() {
        const reporter = new TestErrorReporter();
        const content = code('price := 20 - @{1}+@{2} 30\nmessage := price * "hello"');
        const parser = new Parser(new Lexer(content.value, reporter), reporter);
        const result = parser.parseFile();

        checkSemantic(result, reporter);

        expect(reporter.errors).to.eql([{span: content.span(1, 2), message: "Expecting STRING, got ADD" }]);
    });

    it("bad mul/div value has unknown type", function() {
        const reporter = new TestErrorReporter();
        const content = code('price := 20 / @{1}*@{2} 30\nmessage := price * "hello"');
        const parser = new Parser(new Lexer(content.value, reporter), reporter);
        const result = parser.parseFile();

        checkSemantic(result, reporter);

        expect(reporter.errors).to.eql([{span: content.span(1, 2), message: "Expecting STRING, got MULTIPLY" }]);
    });

});

describe("Semantic of refactoring", function() {

    it("report hint on unused variables", function() {
        const reporter = new TestErrorReporter();
        const content = code('@{1}price := 10@{2}\nmessage := "hello"');
        const parser = new Parser(new Lexer(content.value, reporter), reporter);
        const result = parser.parseFile();

        checkSemantic(result, reporter);

        expect(reporter.hints).to.eql([{span: content.span(1, 2), message: "Unused definition", code: RefactoringAction.UNUSED_DEFINITION }]);
    });
});
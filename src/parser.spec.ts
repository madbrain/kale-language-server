
import { expect } from 'chai';

import { Parser } from './parser';
import { Lexer } from './lexer';
import { TestErrorReporter } from './code-utils';

describe("Parser Tests", function() {

    it("parse empty file", function() {
        const reporter = new TestErrorReporter();
        const content = "";
        const parser = new Parser(new Lexer(content, reporter));
        const result = parser.parseFile();
        expect(result).to.eql({ assignments: [] });
    });

    it("parse single assignment", function() {
        const reporter = new TestErrorReporter();
        const content = "my_var := 10";
        const parser = new Parser(new Lexer(content, reporter));
        const result = parser.parseFile();
        expect(result).to.eql({ assignments: [
            { variable: { value: "my_var" }, value: { type: 'integer', value: 10 } }
        ]});
    });

    it("parse multiple assignments", function() {
        const reporter = new TestErrorReporter();
        const content = 'my_var := 10 my_other_var := "hello"';
        const parser = new Parser(new Lexer(content, reporter));
        const result = parser.parseFile();
        expect(result).to.eql({ assignments: [
            { variable: { value: "my_var" }, value: { type: 'integer', value: 10 } },
            { variable: { value: "my_other_var" }, value: { type: 'string', value: 'hello' } },
        ]});
    });

    it("parse complex value", function() {
        const reporter = new TestErrorReporter();
        const content = 'my_var := 10 + my_other_var';
        const parser = new Parser(new Lexer(content, reporter));
        const result = parser.parseFile();
        expect(result).to.eql({ assignments: [
            {
                variable: { value: "my_var" },
                value: {
                    type: 'operation',
                    op: 'add',
                    left: { type: 'integer', value: 10 },
                    right: { type: 'variable', value: "my_other_var" }
                }
            }
        ]});
    });

    it("parse complex value with priority", function() {
        const reporter = new TestErrorReporter();
        const content = 'my_var := 10 + my_other_var * 30';
        const parser = new Parser(new Lexer(content, reporter));
        const result = parser.parseFile();
        expect(result).to.eql({ assignments: [
            {
                variable: { value: "my_var" },
                value: {
                    type: 'operation',
                    op: 'add',
                    left: { type: 'integer', value: 10 },
                    right: {
                        type: 'operation',
                        op: 'multiply',
                        left: { type: 'variable', value: 'my_other_var' },
                        right: { type: 'integer', value: 30 },
                    }
                }
            }
        ]});
    });

    it("parse same priority from left to right", function() {
        const reporter = new TestErrorReporter();
        const content = 'my_var := 10 + foo - my_other_var * 30 / bar';
        const parser = new Parser(new Lexer(content, reporter));
        const result = parser.parseFile();
        expect(result).to.eql({ assignments: [
            {
                variable: { value: "my_var" },
                value: {
                    type: 'operation',
                    op: 'substract',
                    left: {
                        type: 'operation',
                        op: 'add',
                        left: { type: 'integer', value: 10 },
                        right: { type: 'variable', value: 'foo' }
                    },
                    right: {
                        type: 'operation',
                        op: 'divide',
                        left: {
                            type: 'operation',
                            op: 'multiply',
                            left: { type: 'variable', value: 'my_other_var' },
                            right: { type: 'integer', value: 30 }
                        },
                        right: { type: 'variable', value: 'bar' }
                    }
                }
            }
        ]});
    });

});

import { expect } from 'chai';

import { Parser } from './parser';
import { Lexer } from './lexer';
import { code, TestErrorReporter } from './code-utils';

describe("Parser Tests", function() {

    it("parse empty file", function() {
        const reporter = new TestErrorReporter();
        const content = code("@{1}");
        const parser = new Parser(new Lexer(content.value, reporter), reporter);
        const result = parser.parseFile();
        expect(result).to.eql({ span: content.span(1, 1), assignments: [] });
        expect(reporter.errors).to.empty;
    });

    it("parse single assignment", function() {
        const reporter = new TestErrorReporter();
        const content = code("@{1}my_var@{2} := @{3}10@{4}");
        const parser = new Parser(new Lexer(content.value, reporter), reporter);
        const result = parser.parseFile();
        expect(result).to.eql({
            span: content.span(1, 4),
            assignments: [
            {
                isOk: true,
                span: content.span(1, 4),
                variable: { span: content.span(1, 2), value: "my_var" },
                value: { span: content.span(3, 4), type: 'integer', value: 10 }
            }
        ]});
        expect(reporter.errors).to.empty;
    });

    it("parse multiple assignments", function() {
        const reporter = new TestErrorReporter();
        const content = code('@{1}my_var@{2} := @{3}10@{4} @{5}my_other_var@{6} := @{7}"hello"@{8}');
        const parser = new Parser(new Lexer(content.value, reporter), reporter);
        const result = parser.parseFile();
        expect(result).to.eql({
            span: content.span(1, 8),
            assignments: [
            {
                isOk: true,
                span: content.span(1, 4),
                variable: { span: content.span(1, 2), value: "my_var" },
                value: { span: content.span(3, 4), type: 'integer', value: 10 }
            },
            {
                isOk: true,
                span: content.span(5, 8),
                variable: { span: content.span(5, 6), value: "my_other_var" },
                value: { span: content.span(7, 8), type: 'string', value: 'hello' }
            }
        ]});
        expect(reporter.errors).to.empty;
    });

    it("parse complex value", function() {
        const reporter = new TestErrorReporter();
        const content = code('@{1}my_var@{2} := @{3}10@{4} + @{5}my_other_var@{6}');
        const parser = new Parser(new Lexer(content.value, reporter), reporter);
        const result = parser.parseFile();
        expect(result).to.eql({
            span: content.span(1, 6),
            assignments: [
            {
                isOk: true,
                span: content.span(1, 6),
                variable: { span: content.span(1, 2), value: "my_var" },
                value: {
                    span: content.span(3, 6),
                    type: 'operation',
                    isOk: true,
                    op: 'add',
                    left: { span: content.span(3, 4), type: 'integer', value: 10 },
                    right: { span: content.span(5, 6), type: 'variable', value: "my_other_var" }
                }
            }
        ]});
        expect(reporter.errors).to.empty;
    });

    it("parse complex value with priority", function() {
        const reporter = new TestErrorReporter();
        const content = code('@{1}my_var@{2} := @{3}10@{4} + @{5}my_other_var@{6} * @{7}30@{8}');
        const parser = new Parser(new Lexer(content.value, reporter), reporter);
        const result = parser.parseFile();
        expect(result).to.eql({
            span: content.span(1, 8),
            assignments: [
            {
                isOk: true,
                span: content.span(1, 8),
                variable: { span: content.span(1, 2), value: "my_var" },
                value: {
                    span: content.span(3, 8),
                    type: 'operation',
                    isOk: true,
                    op: 'add',
                    left: { span: content.span(3, 4), type: 'integer', value: 10 },
                    right: {
                        span: content.span(5, 8),
                        type: 'operation',
                        isOk: true,
                        op: 'multiply',
                        left: { span: content.span(5, 6), type: 'variable', value: 'my_other_var' },
                        right: { span: content.span(7, 8), type: 'integer', value: 30 },
                    }
                }
            }
        ]});
        expect(reporter.errors).to.empty;
    });

    it("parse same priority from left to right", function() {
        const reporter = new TestErrorReporter();
        const content = code('@{1}my_var@{2} := @{3}10@{4} + @{5}foo@{6} - @{7}my_other_var@{8} * @{9}30@{10} / @{11}bar@{12}');
        const parser = new Parser(new Lexer(content.value, reporter), reporter);
        const result = parser.parseFile();
        expect(result).to.eql({
            span: content.span(1, 12),
            assignments: [
            {
                isOk: true,
                span: content.span(1, 12),
                variable: { span: content.span(1, 2), value: "my_var" },
                value: {
                    span: content.span(3, 12),
                    type: 'operation',
                    isOk: true,
                    op: 'substract',
                    left: {
                        span: content.span(3, 6),
                        type: 'operation',
                        isOk: true,
                        op: 'add',
                        left: { span: content.span(3, 4), type: 'integer', value: 10 },
                        right: { span: content.span(5, 6), type: 'variable', value: 'foo' }
                    },
                    right: {
                        span: content.span(7, 12),
                        type: 'operation',
                        op: 'divide',
                        isOk: true,
                        left: {
                            span: content.span(7, 10),
                            type: 'operation',
                            op: 'multiply',
                            isOk: true,
                            left: { span: content.span(7, 8), type: 'variable', value: 'my_other_var' },
                            right: { span: content.span(9, 10), type: 'integer', value: 30 }
                        },
                        right: { span: content.span(11, 12), type: 'variable', value: 'bar' }
                    }
                }
            }
        ]});
        expect(reporter.errors).to.empty;
    });

});

describe("Parser Robustness Tests", function() {
    
    it("parse missing assignment", function() {
        const reporter = new TestErrorReporter();
        const content = code('@{1}my_var@{2} @{7}+@{8} 20@{9}\n@{3}my_other_var@{4} := @{5}30@{6}');
        const parser = new Parser(new Lexer(content.value, reporter), reporter);
        const result = parser.parseFile();
        expect(result).to.eql({
            span: content.span(1, 6),
            assignments: [
            {
                isOk: false,
                span: content.span(1, 9),
                variable: { span: content.span(1, 2), value: "my_var" }
            },
            {
                isOk: true,
                span: content.span(3, 6),
                variable: { span: content.span(3, 4), value: "my_other_var" },
                value: { span: content.span(5, 6), type: 'integer', value: 30 }
            }
        ]});
        expect(reporter.errors).to.eql([ { span: content.span(7, 8), message: "Expecting ASSIGN, got ADD" }]);
    });

    it("parse bad assignment value", function() {
        const reporter = new TestErrorReporter();
        const content = code('@{1}my_var@{2} := @{7}+@{8}\n@{3}my_other_var@{4} := @{5}30@{6}');
        const parser = new Parser(new Lexer(content.value, reporter), reporter);
        const result = parser.parseFile();
        expect(result).to.eql({
            span: content.span(1, 6),
            assignments: [
            {
                isOk: false,
                span: content.span(1, 8),
                variable: { span: content.span(1, 2), value: "my_var" }
            },
            {
                isOk: true,
                span: content.span(3, 6),
                variable: { span: content.span(3, 4), value: "my_other_var" },
                value: { span: content.span(5, 6), type: 'integer', value: 30 }
            }
        ]});
        expect(reporter.errors).to.eql([ { span: content.span(7, 8), message: "Expecting STRING, got ADD" }]);
    });

    it("ignore bad assignment", function() {
        const reporter = new TestErrorReporter();
        const content = code('@{1}+@{2} 20\n@{3}my_other_var@{4} := @{5}30@{6}');
        const parser = new Parser(new Lexer(content.value, reporter), reporter);
        const result = parser.parseFile();
        expect(result).to.eql({
            span: content.span(1, 6),
            assignments: [
            {
                isOk: true,
                span: content.span(3, 6),
                variable: { span: content.span(3, 4), value: "my_other_var" },
                value: { span: content.span(5, 6), type: 'integer', value: 30 }
            }
        ]});
        expect(reporter.errors).to.eql([ { span: content.span(1, 2), message: "Expecting IDENT, got ADD" }]);
    });

    it("parse bad add/sub operation", function() {
        const reporter = new TestErrorReporter();
        const content = code('@{1}my_var@{2} := @{3}20@{4} - @{8}+@{9} @{5}"10"@{6}');
        const parser = new Parser(new Lexer(content.value, reporter), reporter);
        const result = parser.parseFile();
        expect(result).to.eql({
            span: content.span(1, 6),
            assignments: [
            {
                isOk: true,
                span: content.span(1, 6),
                variable: { span: content.span(1, 2), value: "my_var" },
                value: {
                    isOk: true,
                    span: content.span(3, 6),
                    type: 'operation',
                    op: 'add',
                    left: {
                        isOk: false,
                        span: content.span(3, 4),
                        type: 'operation',
                        op: 'substract',
                        left: { span: content.span(3, 4), type: 'integer', value: 20 },
                    },
                    right: { span: content.span(5, 6), type: 'string', value: "10" }
                }
            }
        ]});
        expect(reporter.errors).to.eql([ { span: content.span(8, 9), message: "Expecting STRING, got ADD" }]);
    });

    it("parse bad mul/div operation", function() {
        const reporter = new TestErrorReporter();
        const content = code('@{1}my_var@{2} := @{3}20@{4} * @{8}/@{9} @{5}"10"@{6}');
        const parser = new Parser(new Lexer(content.value, reporter), reporter);
        const result = parser.parseFile();
        expect(result).to.eql({
            span: content.span(1, 6),
            assignments: [
            {
                isOk: true,
                span: content.span(1, 6),
                variable: { span: content.span(1, 2), value: "my_var" },
                value: {
                    isOk: true,
                    span: content.span(3, 6),
                    type: 'operation',
                    op: 'divide',
                    left: {
                        isOk: false,
                        span: content.span(3, 4),
                        type: 'operation',
                        op: 'multiply',
                        left: { span: content.span(3, 4), type: 'integer', value: 20 },
                    },
                    right: { span: content.span(5, 6), type: 'string', value: "10" }
                }
            }
        ]});
        expect(reporter.errors).to.eql([ { span: content.span(8, 9), message: "Expecting STRING, got DIVIDE" }]);
    });
});
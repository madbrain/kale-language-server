
import * as fs from 'fs';
import { Lexer } from './lexer';
import { Parser } from './parser';
import { checkSemantic } from './semantic';
import { evaluate } from './interpreter';
import { ErrorReporter, Span } from './positions';

// skip unecessary arguments
const [, , ...args] = process.argv;

if (args.length < 1) {
    throw "expecting one argument";
}

const inputFilename = args[0];

class ConsoleErrorReporter implements ErrorReporter {
    errors: {span: Span, message: string}[] = [];
    hints: {span: Span, message: string}[] = [];
    reportError(span: Span, message: string): void {
        this.errors.push({ span, message });
    }
    reportHint(span: Span, message: string, code: string): void {
        this.hints.push({ span, message });
    }
    reportAll(content: string) {
        content.split('\n').forEach((line, i) => {
            this.errors.concat(this.hints)
                .filter(error => error.span.from.line == i)
                .forEach(error => {
                    let marker = this.repeat(' ', error.span.from.character);
                    const end = error.span.from.line == error.span.to.line
                        ? error.span.to.character
                        : line.length;
                    marker += this.repeat('^', end - error.span.from.character);
                    console.log(line);
                    console.log(marker);
                    console.log(`[${i}] ${error.message}`);
                    console.log();
                });
        });
    }
    private repeat(c: string, count: number) {
        let str = '';
        while (count-- > 0) {
            str += c;
        }
        return str;
    }
}

fs.readFile(inputFilename, 'utf8', (err, data) => {
    if (err) throw err;
    const reporter = new ConsoleErrorReporter();
    const lexer = new Lexer(data, reporter);
    const parser = new Parser(lexer, reporter);
    const result = parser.parseFile();
    checkSemantic(result, reporter);
    reporter.reportAll(data);
    if (reporter.errors.length == 0) {
        console.log(evaluate(result));
    }
});

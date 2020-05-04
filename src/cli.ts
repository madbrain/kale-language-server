
import * as fs from 'fs';
import { Lexer } from './lexer';
import { Parser } from './parser';
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
    reportError(span: Span, message: string): void {
        this.errors.push({ span, message });
    }
    reportAll(content: string) {
        content.split('\n').forEach((line, i) => {
            this.errors
                .filter(error => error.span.from.line == i)
                .forEach(error => {
                    let marker = this.repeat(' ', error.span.from.character);
                    marker += this.repeat('^', error.span.to.character - error.span.from.character);
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
    const lexer = new Lexer(data);
    const parser = new Parser(lexer);
    const result = parser.parseFile();
    if (reporter.errors.length > 0) {
        reporter.reportAll(data);
    } else {
        console.log(evaluate(result));
    }
});
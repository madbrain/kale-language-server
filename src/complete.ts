import { Position, ErrorReporter, Span, isIn } from "./positions";
import { Parser } from "./parser";
import { Lexer } from "./lexer";

const NULL_REPORTER: ErrorReporter = {
    reportError(span: Span, message: string) { /* ignore */ }
}

export interface Completion {
    value: string;
}

export function complete(content: string, position: Position): Completion[] {
    const parser = new Parser(new Lexer(content, NULL_REPORTER), NULL_REPORTER);
    const result = parser.parseFile();
    const completions: Completion[] = [];

    /*
     * TODO calculate possible completions at position from result AST
     */
    
    return completions;
}
import { Position, Span, ErrorReporter } from "./positions";
import { Range } from "vscode-languageserver";

export class Code {
    constructor(public value: string, public positions: Position[]) { }

    span(from: number, to: number): Span {
        return { from: this.positions[from], to: this.positions[to] };
    }

    toPosition(n: number) {
        return {
            line: this.positions[n].line,
            character: this.positions[n].character
        };
    }

    range(from: number, to: number): Range {
        return {
            start: this.toPosition(from),
            end: this.toPosition(to)
        };
    }
}

export function code(content: string) {
    const MARKER_REGEXP = /([^@]*)@{([0-9]+)}/g;
    let result = '';
    let m;
    let lastIndex = 0;
    const positions: Position[] = [];
    const current: Position = { offset: 0, line: 0, character: 0 };
    do {
        m = MARKER_REGEXP.exec(content);
        if (m) {
            result += update(m[1], current);
            positions[parseInt(m[2])] = {...current};
            lastIndex = m.index + m[0].length;
        } else {
            result += update(content.substring(lastIndex), current);
        }
    } while (m);
    return new Code(result, positions);
}

function update(s: string, current: Position) {
    for (let i = 0; i < s.length; ++i) {
        current.character += 1;
        if (s.charAt(i) == '\n') {
            current.line += 1;
            current.character = 0;
        }
    }
    current.offset += s.length;
    return s;
}

export interface Error {
    span: Span;
    message: string;
}

export interface Hint {
    span: Span;
    message: string;
    code: string;
}

export class TestErrorReporter implements ErrorReporter {
    errors: Error[] = [];
    hints: Hint[] = [];
    reportError(span: Span, message: string): void {
        this.errors.push({ span, message });
    }
    reportHint(span: Span, message: string, code: string): void {
        this.hints.push({ span, message, code });
    }
}
import { Span, Position, ErrorReporter } from "./positions";

export enum TokenKind {
    IDENT = "IDENT",
    INTEGER = "INTEGER",
    STRING = "STRING",

    ASSIGN = "ASSIGN",
    ADD = "ADD",
    SUBSTRACT = "SUBSTRACT",
    MULTIPLY = "MULTIPLY",
    DIVIDE = "DIVIDE",
    
    EOF = "EOF"
}

export interface Token {
    span: Span;
    kind: TokenKind;
    value?: string;
}

export class Lexer {
    
    private position = 0;
    private line = 0;
    private character = 0;
    private lastEndOfLine = -1;
    private from = this.makePosition();
    private errorSpan: Span | null = null;

    constructor(private content: string, private reporter: ErrorReporter) { }

    nextToken(): Token {
        while (true) {
            this.from = this.makePosition();
            if (this.atEnd()) {
                return this.token(TokenKind.EOF);
            }
            const c = this.getChar();
            if (this.isLetter(c)) {
                return this.ident(c);
            } else if (this.isDigit(c)) {
                return this.integer(c);
            } else if (c == '\"') {
                return this.stringLiteral();
            } else if (c == ':') {
                if (this.getChar() == '=') {
                    return this.token(TokenKind.ASSIGN);
                }
                this.ungetChar()
            } else if (c == '+') {
                return this.token(TokenKind.ADD);
            } else if (c == '-') {
                return this.token(TokenKind.SUBSTRACT);
            } else if (c == '*') {
                return this.token(TokenKind.MULTIPLY);
            } else if (c == '/') {
                if (this.getChar() == '/') {
                    this.comment();
                    continue;
                }
                this.ungetChar();
                return this.token(TokenKind.DIVIDE);
            } else if (this.isSpace(c)) {
                continue;
            }
            this.accumulateBadChar();
        }
    }

    private accumulateBadChar() {
        if (this.errorSpan == null) {
            this.errorSpan = { from: this.from, to: this.makePosition() };
        } else {
            this.errorSpan = {...this.errorSpan, to: this.makePosition() };
        }
    }

    private flushErrors() {
        if (this.errorSpan != null) {
            this.reporter.reportError(this.errorSpan, "Unknown character(s)");
            this.errorSpan = null;
        }
    }

    private makePosition(): Position {
        return { offset: this.position, line: this.line, character: this.character };
    }

    private token(kind: TokenKind, value?: string): Token {
        this.flushErrors();
        if (value) {
            return { span: { from: this.from, to: this.makePosition() }, kind, value };
        }
        return { span: { from: this.from, to: this.makePosition() }, kind };
    }

    private ident(c: string): Token {
        let result = c;
        while (true) {
            c = this.getChar();
            if (! this.isLetterOrDigit(c)) {
                break;
            }
            result += c;
        }
        this.ungetChar();
        return this.token(TokenKind.IDENT, result);
    }

    private integer(c: string): Token {
        let result = c;
        while (true) {
            c = this.getChar();
            if (! this.isDigit(c)) {
                break;
            }
            result += c;
        }
        this.ungetChar();
        return this.token(TokenKind.INTEGER, result);
    }

    private stringLiteral(): Token {
        let result = "";
        while (true) {
            if (this.atEnd()) {
                this.reporter.reportError({ from: this.from, to: this.makePosition() }, "Unterminated string")
                break;
            }
            const c = this.getChar();
            if (c == "\"") {
                break;
            }
            result += c;
        }
        return this.token(TokenKind.STRING, result);
    }

    private comment() {
        while (true) {
            const c = this.getChar();
            if (this.atEnd() || c == "\n" || c == "\r") {
                break;
            }
        }
    }

    private isLetter(c: string) {
        return c >= 'a' && c <= 'z' || c >= 'A' && c <= 'Z' || c == '_';
    }

    private isDigit(c: string) {
        return c >= '0' && c <= '9';
    }

    private isLetterOrDigit(c: string) {
        return this.isLetter(c) || this.isDigit(c);
    }

    private isSpace(c: string) {
        return c == ' ' || c == '\t' || c == '\n' || c == '\r';
    }

    private atEnd() {
        return this.position >= this.content.length;
    }

    // KEEP
    private getChar(): string {
        const c = this.content[this.position++];
        this.character += 1;
        if (c == '\n') {
            this.line += 1;
            this.lastEndOfLine = this.character-1;
            this.character = 0;
        }
        return c;
    }

    private ungetChar() {
        this.character -= 1;
        this.position -= 1;
        if (this.content[this.position] == '\n') {
            this.line -= 1;
            this.character = this.lastEndOfLine;
        }
    }

}
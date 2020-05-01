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
    kind: TokenKind;
    value?: string;
}

export class Lexer {
    
    private position = 0;

    constructor(private content: string) { }

    nextToken(): Token {
        while (true) {
            if (this.atEnd()) {
                return { kind: TokenKind.EOF };
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
                    return { kind: TokenKind.ASSIGN };
                }
                this.ungetChar()
            } else if (c == '+') {
                return { kind: TokenKind.ADD };
            } else if (c == '-') {
                return { kind: TokenKind.SUBSTRACT };
            } else if (c == '*') {
                return { kind: TokenKind.MULTIPLY };
            } else if (c == '/') {
                if (this.getChar() == '/') {
                    this.comment();
                    continue;
                }
                this.ungetChar();
                return { kind: TokenKind.DIVIDE };
            } else if (this.isSpace(c)) {
                continue;
            }
            throw Error(`Unexpected char '${c}'`);
        }
    }

    private ident(c: string) {
        let result = c;
        while (true) {
            c = this.getChar();
            if (! this.isLetterOrDigit(c)) {
                break;
            }
            result += c;
        }
        this.ungetChar();
        return { kind: TokenKind.IDENT, value: result };
    }

    private integer(c: string) {
        let result = c;
        while (true) {
            c = this.getChar();
            if (! this.isDigit(c)) {
                break;
            }
            result += c;
        }
        this.ungetChar();
        return { kind: TokenKind.INTEGER, value: result };
    }

    private stringLiteral() {
        let result = "";
        while (true) {
            if (this.atEnd()) {
                throw Error("Unterminated string");
            }
            const c = this.getChar();
            if (c == "\"") {
                break;
            }
            result += c;
        }
        return { kind: TokenKind.STRING, value: result };
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

    private getChar(): string {
        return this.content[this.position++];
    }

    private ungetChar() {
        this.position -= 1;
    }

}
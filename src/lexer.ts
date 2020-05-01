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
        throw Error("TODO: complete")
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
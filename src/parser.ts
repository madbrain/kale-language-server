import { Lexer, Token, TokenKind } from "./lexer";
import { KaleFile } from "./ast";

export class Parser {
    private token: Token;
    
    constructor(private lexer: Lexer) {
        this.token = this.scanToken()
    }

    parseFile(): KaleFile {
        throw new Error("TODO : complete");
    }

    private scanToken() {
        this.token = this.lexer.nextToken();
        return this.token;
    }

    private test(kind: TokenKind) {
        if (this.token.kind == kind) {
            this.scanToken();
            return true;
        }
        return false;
    }

    private expect(kind: TokenKind) {
        if (this.token.kind != kind) {
            throw new Error(`Expecting token ${kind}, got ${this.token.kind}`);
        }
        this.scanToken();
    }
}
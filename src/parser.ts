import { Lexer, Token, TokenKind } from "./lexer";
import { KaleFile, Assignment, Ident, ValueType, OperationType, Value } from "./ast";

export class Parser {
    private token: Token;
    
    constructor(private lexer: Lexer) {
        this.token = this.scanToken()
    }

    parseFile(): KaleFile {
        const assignments: Assignment[] = [];
        while (! this.test(TokenKind.EOF)) {
            assignments.push(this.parseAssignment());
        }
        this.expect(TokenKind.EOF);
        return { assignments };
    }

    private parseAssignment(): Assignment {
        const variable = this.parseIdent();
        this.expect(TokenKind.ASSIGN);
        const value = this.parseValue();
        return { variable, value };
    }

    private parseIdent(): Ident {
        const value = this.token.value;
        this.expect(TokenKind.IDENT);
        return { value: value! };
    }

    private parseValue() {
        let expr: Value = this.parseMulDivValue();
        while (true) {
            if (this.test(TokenKind.ADD)) {
                const right = this.parseMulDivValue();
                expr = <Value>{ type: ValueType.OPERATION, op: OperationType.ADD, left: expr, right };
            } else if (this.test(TokenKind.SUBSTRACT)) {
                const right = this.parseMulDivValue();
                expr = <Value>{ type: ValueType.OPERATION, op: OperationType.SUBSTRACT, left: expr, right };
            } else {
                break;
            }
        }
        return expr;
    }

    private parseMulDivValue() {
        let expr: Value = this.parseAtomValue();
        while (true) {
            if (this.test(TokenKind.MULTIPLY)) {
                const right = this.parseAtomValue();
                expr = <Value>{ type: ValueType.OPERATION, op: OperationType.MULTIPLY, left: expr, right };
            } else if (this.test(TokenKind.DIVIDE)) {
                const right = this.parseAtomValue();
                expr = <Value>{ type: ValueType.OPERATION, op: OperationType.DIVIDE, left: expr, right };
            } else {
                break;
            }
        }
        return expr;
    }

    private parseAtomValue() {
        const value = this.token.value;
        if (this.test(TokenKind.INTEGER)) {
            return { type: ValueType.INTEGER, value: parseInt(value!) };
        }
        if (this.test(TokenKind.IDENT)) {
            return { type: ValueType.VARIABLE, value: value! };
        }
        this.expect(TokenKind.STRING);
        return { type: ValueType.STRING, value: value! };
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
import { Lexer, Token, TokenKind } from "./lexer";
import { KaleFile, Assignment, Ident, ValueType, OperationType, Value } from "./ast";
import { mergeSpan } from "./positions";

export class Parser {
    private token: Token;
    
    constructor(private lexer: Lexer) {
        this.token = this.scanToken()
    }

    parseFile(): KaleFile {
        const start = this.token.span;
        const assignments: Assignment[] = [];
        while (! this.test(TokenKind.EOF)) {
            assignments.push(this.parseAssignment());
        }
        const end = this.token.span;
        this.expect(TokenKind.EOF);
        return { span: mergeSpan(start, end), assignments };
    }

    private parseAssignment(): Assignment {
        const variable = this.parseIdent();
        this.expect(TokenKind.ASSIGN);
        const value = this.parseValue();
        return { span: mergeSpan(variable.span, value.span), variable, value };
    }

    private parseIdent(): Ident {
        const current = this.token;
        this.expect(TokenKind.IDENT);
        return { span: current.span, value: current.value! };
    }

    private parseValue(): Value {
        let expr: Value = this.parseMulDivValue();
        while (true) {
            if (this.test(TokenKind.ADD)) {
                const right = this.parseMulDivValue();
                expr = <Value>{ span: mergeSpan(expr.span, right.span), type: ValueType.OPERATION, op: OperationType.ADD, left: expr, right };
            } else if (this.test(TokenKind.SUBSTRACT)) {
                const right = this.parseMulDivValue();
                expr = <Value>{ span: mergeSpan(expr.span, right.span), type: ValueType.OPERATION, op: OperationType.SUBSTRACT, left: expr, right };
            } else {
                break;
            }
        }
        return expr;
    }

    private parseMulDivValue(): Value {
        let expr: Value = this.parseAtomValue();
        while (true) {
            if (this.test(TokenKind.MULTIPLY)) {
                const right = this.parseAtomValue();
                expr = <Value>{ span: mergeSpan(expr.span, right.span), type: ValueType.OPERATION, op: OperationType.MULTIPLY, left: expr, right };
            } else if (this.test(TokenKind.DIVIDE)) {
                const right = this.parseAtomValue();
                expr = <Value>{ span: mergeSpan(expr.span, right.span), type: ValueType.OPERATION, op: OperationType.DIVIDE, left: expr, right };
            } else {
                break;
            }
        }
        return expr;
    }

    private parseAtomValue(): Value {
        const current = this.token;
        if (this.test(TokenKind.INTEGER)) {
            return <Value>{ span: current.span, type: ValueType.INTEGER, value: parseInt(current.value!) };
        }
        if (this.test(TokenKind.IDENT)) {
            return <Value>{ span: current.span, type: ValueType.VARIABLE, value: current.value! };
        }
        this.expect(TokenKind.STRING);
        return <Value>{ span: current.span, type: ValueType.STRING, value: current.value! };
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
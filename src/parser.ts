import { Lexer, Token, TokenKind } from "./lexer";
import { KaleFile, Assignment, Ident, ValueType, OperationType, Value, Operation } from "./ast";
import { mergeSpan, Span, ErrorReporter } from "./positions";

export class Parser {
    private token: Token;
    
    constructor(private lexer: Lexer, private reporter: ErrorReporter) {
        this.token = this.scanToken()
    }

    /**
     * KaleFile ::= Assignment* EOF
     * 
     * First(KaleFile) = First(Assignment)
     */
    parseFile(): KaleFile {
        const start = this.token.span;
        const assignments: Assignment[] = [];
        while (! this.test(TokenKind.EOF)) {
            this.recoverWith([TokenKind.START_IDENT, TokenKind.EOF ], start, (endSpan) => {
                // ignore
            }, () => {
                assignments.push(this.parseAssignment());
            });
        }
        const end = this.token.span;
        this.expect(TokenKind.EOF);
        return { span: mergeSpan(start, end), assignments };
    }

    /**
     * Assignment ::= Ident ASSIGN Value
     * 
     * First(Assignment) = First(Ident) = { START_IDENT }
     * Follow(Assignment) = { EOF } + First(Assignment) = { START_IDENT, EOF }
     * 
     */
    private parseAssignment(): Assignment {
        const variable = this.parseStartIdent();
        return this.recoverWith([ TokenKind.START_IDENT, TokenKind.EOF], variable.span, (endSpan) => {
            return <Assignment>{ span: mergeSpan(variable.span, endSpan), isOk: false, variable };
        }, () => {
            this.expect(TokenKind.ASSIGN);
            const value = this.parseValue();
            return { span: mergeSpan(variable.span, value.span), isOk: true, variable, value };
        });
    }

    /**
     * Ident ::= START_IDENT
     * 
     * First(Ident) = { START_IDENT }
     * Follow(Ident) = { ASSIGN } + Follow(AtomValue)
     */
    private parseStartIdent(): Ident {
        const current = this.token;
        this.expect(TokenKind.START_IDENT);
        return { span: current.span, value: current.value! };
    }

    /**
     * Value ::= MulDivValue ( ((ADD | SUBSTRACT) MulDivValue)* | <empty> )
     * 
     * First(Value) = First(MulDivValue) = { INTEGER, IDENT, STRING }
     * Follow(Value) = Follow(Assignment) = { START_IDENT, EOF }
     */
    private parseValue(): Value {
        const SYNC_MUL_DIV_VALUE = [ TokenKind.ADD, TokenKind.SUBSTRACT, TokenKind.START_IDENT, TokenKind.EOF ];
        const startSpan = this.token.span;
        let expr: Value = this.parseMulDivValue();
        while (true) {
            if (this.test(TokenKind.ADD)) {
                expr = this.parseNextValue(OperationType.ADD, expr, SYNC_MUL_DIV_VALUE, startSpan, () => this.parseMulDivValue());
            } else if (this.test(TokenKind.SUBSTRACT)) {
                expr = this.parseNextValue(OperationType.SUBSTRACT, expr, SYNC_MUL_DIV_VALUE, startSpan, () => this.parseMulDivValue());
            } else {
                break;
            }
        }
        return expr;
    }

    /**
     * MulDivValue ::= AtomValue ( ((MULTIPLY | DIVIDE) AtomValue)* | <empty> )
     * 
     * First(MulDivValue) = First(AtomValue) = { INTEGER, IDENT, STRING }
     * Follow(MulDivValue) = { ADD, SUBSTRACT } + Follow(Value) = { ADD, SUBSTRACT, START_IDENT, EOF }
     */
    private parseMulDivValue(): Value {
        const SYNC_ATOM_VALUE = [ TokenKind.ADD, TokenKind.SUBSTRACT, TokenKind.MULTIPLY, TokenKind.DIVIDE, TokenKind.START_IDENT, TokenKind.EOF ];
        const startSpan = this.token.span;
        let expr: Value = this.parseAtomValue();
        while (true) {
            if (this.test(TokenKind.MULTIPLY)) {
                expr = this.parseNextValue(OperationType.MULTIPLY, expr, SYNC_ATOM_VALUE, startSpan, () => this.parseAtomValue());
            } else if (this.test(TokenKind.DIVIDE)) {
                expr = this.parseNextValue(OperationType.DIVIDE, expr, SYNC_ATOM_VALUE, startSpan, () => this.parseAtomValue());
            } else {
                break;
            }
        }
        return expr;
    }

    private parseNextValue(op: OperationType, expr: Value, syncTokens: TokenKind[], startSpan: Span, parseNext: () => Value) {
        return this.recoverWith(syncTokens, startSpan, (endSpan) => {
            return <Value>{ span: mergeSpan(startSpan, endSpan), type: ValueType.OPERATION, isOk: false, op, left: expr };
        }, () => {
            const right = parseNext();
            return <Value>{ span: mergeSpan(expr.span, right.span), type: ValueType.OPERATION, isOk: true, op, left: expr, right };
        });
    }

    /**
     * AtomValue ::= INTEGER | IDENT | STRING
     * 
     * First(AtomValue) = { INTEGER, IDENT, STRING }
     * Follow(AtomValue) = { MULTIPLY, DIVIDE } + Follow(MulDivValue) = { ADD, SUBSTRACT, MULTIPLY, DIVIDE, START_IDENT, EOF }
     */
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
            const msg = `Expecting ${kind}, got ${this.token.kind}`;
            this.reporter.reportError(this.token.span, msg)
            throw new Error(msg);
        }
        this.scanToken();
    }

    private recoverWith<T>(syncTokens: TokenKind[], start: Span, makeError: (span: Span) => T, parseFunc: () => T): T {
        try {
            return parseFunc();
        } catch(e) {
            const tokens = this.skipTo(syncTokens);
            const range = tokens.length > 0 ? mergeSpan(start, tokens[tokens.length-1].span) : start;
            return makeError(range);
        }
    }

    private skipTo(syncTokens: TokenKind[]): Token[] {
        const tokens: Token[] = []
        while (! (this.token.kind == TokenKind.EOF || syncTokens.indexOf(this.token.kind) >= 0)) {
            tokens.push(this.token);
            this.scanToken();
        }
        return tokens;
    }
}
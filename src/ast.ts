import { Span } from "./positions";

export interface AstNode {
    span: Span;
}

export interface KaleFile extends AstNode {
    assignments: Assignment[];
}

export interface Assignment extends AstNode {
    isOk: boolean;
    variable: Ident;
}

export interface CompleteAssignment extends Assignment {
    value: Value;
}

export interface Ident extends AstNode {
    value: string;
}

export enum ValueType {
    INTEGER = "integer",
    STRING  = "string",
    OPERATION = "operation",
    VARIABLE = "variable"
}

export interface Value extends AstNode {
    type: ValueType;
}

export interface SimpleValue extends Value {
    value: any;
}

export enum OperationType {
    ADD = "add",
    SUBSTRACT  = "substract",
    MULTIPLY  = "multiply",
    DIVIDE  = "divide",
}

export interface Operation extends Value {
    isOk: boolean;
    op: OperationType;
}

export interface UnaryOperation extends Operation {
    expr: Value;
}

export interface BinaryOperation extends Operation {
    left: Value;
    right: Value;
}

export interface BadBinaryOperation extends Operation {
    left: Value;
}
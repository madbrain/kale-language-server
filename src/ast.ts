
export interface AstNode {
}

export interface KaleFile extends AstNode {
    assignments: Assignment[];
}

export interface Assignment extends AstNode {
    variable: Ident;
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
    op: OperationType;
}

export interface UnaryOperation extends Operation {
    expr: Value;
}

export interface BinaryOperation extends Operation {
    left: Value;
    right: Value;
}
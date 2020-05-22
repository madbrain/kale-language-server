import { ErrorReporter, Span } from "./positions";
import { KaleFile, Value, ValueType, SimpleValue, BinaryOperation, OperationType, CompleteAssignment, Assignment } from "./ast";

export enum Type {
    INTEGER,
    STRING,
    UNKNOWN,
}

export interface Definition {
    span: Span;
    type: Type;
    isUsed: boolean;
}

export enum RefactoringAction {
    UNUSED_DEFINITION = "0001"
}

export function checkSemantic(file: KaleFile, reporter: ErrorReporter) {
    const variables = new Map<string, Definition>();
    let lastSpan : Span = file.span;
    file.assignments.forEach(assignment => {
        lastSpan = checkAssignment(assignment, variables, reporter);
    });
    if (! variables.has('message')) {
        reporter.reportError(lastSpan, "Missing 'message' variable");
    }
    variables.forEach((definition, name) => {
        if (! definition.isUsed && name != "message") {
            reporter.reportHint(definition.span, "Unused definition", RefactoringAction.UNUSED_DEFINITION);
        }
    });
}

export function checkAssignment(assignment: Assignment, variables: Map<string, Definition>, reporter: ErrorReporter) {
    let type;
    if (assignment.isOk) {
        const assign = <CompleteAssignment>assignment;
        type = checkValue(assign.value, variables, reporter);
    } else {
        type = Type.UNKNOWN;
    }
    variables.set(assignment.variable.value, { span: assignment.span, type, isUsed: false });
    return assignment.span;
}

function checkValue(value: Value, variables: Map<string, Definition>, reporter: ErrorReporter): Type {
    if (value.type == ValueType.INTEGER) {
        return Type.INTEGER;
    }
    if (value.type == ValueType.STRING) {
        return Type.STRING;
    }
    if (value.type == ValueType.VARIABLE) {
        const name = (<SimpleValue>value).value;
        if (variables.has(name)) {
            const definition = variables.get(name)!;
            definition.isUsed = true;
            return definition.type;
        }
        reporter.reportError(value.span, `Unknown variable '${name}'`);
        return Type.UNKNOWN;
    }
    const operation = <BinaryOperation>value;
    switch(operation.op) {
        case OperationType.ADD:
            const lt = checkValue(operation.left, variables, reporter);
            if (! operation.isOk) {
                return Type.UNKNOWN;
            }
            return combine(lt, checkValue(operation.right, variables, reporter));
        case OperationType.SUBSTRACT:
            return checkIntegerOperation(operation, '-', variables, reporter);
        case OperationType.MULTIPLY:
            return checkIntegerOperation(operation, '*', variables, reporter);
        case OperationType.DIVIDE:
            return checkIntegerOperation(operation, '/', variables, reporter);
    }
    return Type.UNKNOWN;
}

function checkIntegerOperation(operation: BinaryOperation, op: string, variables: Map<string, Definition>, reporter: ErrorReporter) {
    const lt = checkValue(operation.left, variables, reporter);
    if (!operation.isOk) {
        return Type.UNKNOWN;
    }
    const rt = checkValue(operation.right, variables, reporter);
    if (hasUnknown(lt, rt)) {
        return Type.UNKNOWN;
    }
    if (lt != Type.INTEGER || rt != Type.INTEGER) {
        reporter.reportError(operation.span, `Cannot use '${op}' on strings`);
        return Type.UNKNOWN;
    }
    return Type.INTEGER;
}

function combine(a: Type, b: Type) {
    if (hasUnknown(a, b)) {
        return Type.UNKNOWN;
    }
    return a == Type.STRING || b == Type.STRING ? Type.STRING : Type.INTEGER;
}

function hasUnknown(a: Type, b: Type) {
    return a == Type.UNKNOWN || b == Type.UNKNOWN;
}
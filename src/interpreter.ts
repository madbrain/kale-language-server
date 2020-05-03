import { KaleFile, Value, ValueType, SimpleValue, Operation, OperationType, BinaryOperation } from "./ast";

export function evaluate(file: KaleFile): string {
    const context = new Map<string, any>()
    file.assignments.forEach(assignment => {
        context.set(assignment.variable.value, evaluateValue(assignment.value, context));
    });
    return String(context.get("message"));
}

function evaluateValue(value: Value, context: Map<string, any>): any {
    if (value.type == ValueType.INTEGER) {
        return (<SimpleValue>value).value;
    }
    if (value.type == ValueType.STRING) {
        return (<SimpleValue>value).value;
    }
    if (value.type == ValueType.VARIABLE) {
        return context.get((<SimpleValue>value).value);
    }
    const operation = <BinaryOperation>value;
    switch(operation.op) {
        case OperationType.ADD:
            return evaluateValue(operation.left, context) + evaluateValue(operation.right, context);
        case OperationType.SUBSTRACT:
            return evaluateValue(operation.left, context) - evaluateValue(operation.right, context);
        case OperationType.MULTIPLY:
            return evaluateValue(operation.left, context) * evaluateValue(operation.right, context);
        case OperationType.DIVIDE:
            return evaluateValue(operation.left, context) / evaluateValue(operation.right, context);
    }
}
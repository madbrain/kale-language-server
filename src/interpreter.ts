import { KaleFile, Value, ValueType, SimpleValue, Operation, OperationType, BinaryOperation, CompleteAssignment } from "./ast";

export function evaluate(file: KaleFile): string {
    const context = new Map<string, any>()
    file.assignments.forEach(assignment => {
        const assign = <CompleteAssignment>assignment;
        context.set(assign.variable.value, evaluateValue(assign.value, context));
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
    const left = evaluateValue(operation.left, context)
    const right = evaluateValue(operation.right, context);
    switch(operation.op) {
        case OperationType.ADD:
            return left + right;
        case OperationType.SUBSTRACT:
            return left - right;
        case OperationType.MULTIPLY:
            return left * right;
        case OperationType.DIVIDE:
            return left / right;
    }
}
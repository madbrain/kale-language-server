import { Position, ErrorReporter, Span, isIn } from "./positions";
import { Parser } from "./parser";
import { Lexer } from "./lexer";
import { CompleteAssignment, Assignment, Value, ValueType, SimpleValue, Operation, BinaryOperation, BadBinaryOperation, OperationType } from "./ast";
import { Type, checkAssignment } from "./semantic";

const NULL_REPORTER: ErrorReporter = {
    reportError(span: Span, message: string) { /* ignore */ }
}

export interface Completion {
    value: string;
}

export function complete(content: string, position: Position): Completion[] {
    const parser = new Parser(new Lexer(content, NULL_REPORTER), NULL_REPORTER);
    const result = parser.parseFile();
    const completions: Completion[] = [];
    let previousAssignment: Assignment | null = null;
    const variables = new Map<string, Type>();
    result.assignments.forEach(assignment => {
        if (previousAssignment != null) {
            checkAssignment(previousAssignment, variables, NULL_REPORTER);
        }
        if (isIn(position, assignment.span)) {
            if (assignment.isOk) {
                const completeAssignment = <CompleteAssignment>assignment;
                if (isIn(position, completeAssignment.value.span)) {
                    completeInValue(position, completeAssignment.value, variables, Type.UNKNOWN, completions);
                }
            }
            return completions;
        }
        previousAssignment = assignment;
    });
    completions.sort((a, b) => a.value < b.value ? -1 : 1);
    return completions;
}

function completeInValue(position: Position, value: Value, variables: Map<string, Type>, context: Type, completions: Completion[]) {
    if (value.type == ValueType.VARIABLE) {
        const variableValue = <SimpleValue>value;
        const content = <string>variableValue.value;
        const prefix = content.substring(0, position.offset - value.span.from.offset);
        variables.forEach((type, name) => {
            if (name.startsWith(prefix) && (context == Type.UNKNOWN || type == context)) {
                completions.push({ value: name });
            }
        });
    } else if (value.type == ValueType.OPERATION) {
        const operation = <Operation>value;
        if (operation.isOk) {
            const binop = <BinaryOperation>value;
            context = restrictContext(binop.op);
            if (isIn(position, binop.left.span)) {
                completeInValue(position, binop.left, variables, context, completions);
            } else if (isIn(position, binop.right.span)) {
                completeInValue(position, binop.right, variables, context, completions);
            }
        } else {
            const binop = <BadBinaryOperation>value;
            if (isIn(position, binop.left.span)) {
                completeInValue(position, binop.left, variables, restrictContext(binop.op), completions);
            }
        }
    }
}

function restrictContext(op: OperationType): Type {
    return op == OperationType.ADD ? Type.UNKNOWN : Type.INTEGER;
}
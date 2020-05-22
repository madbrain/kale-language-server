import { Parser } from "./parser";
import { Lexer } from "./lexer";
import { checkSemantic, RefactoringAction } from "./semantic";
import { ErrorReporter, Span, overlap } from "./positions";

class CollectingErrorReporter implements ErrorReporter {
    hints: {span: Span, code: string }[] = [];
    reportError(span: Span, message: string): void {
    }
    reportHint(span: Span, message: string, code: string): void {
        this.hints.push({ span, code });
    }
}

export interface Action {
    title: string;
    span: Span;
    newText: string;
}


export function findCodeActions(content: string, span: Span): Action[] {
    const reporter = new CollectingErrorReporter();
    const parser = new Parser(new Lexer(content, reporter), reporter);
    const result = parser.parseFile();
    checkSemantic(result, reporter);
    const knownActions: string[] = [ RefactoringAction.UNUSED_DEFINITION ];
    return reporter.hints
        .filter(hint => overlap(hint.span, span) && knownActions.indexOf(hint.code) >= 0)
        .map(hint => makeAction(hint.span, hint.code));
}

function makeAction(span: Span, code: string): Action {
    if (code == RefactoringAction.UNUSED_DEFINITION) {
        return { title: "Remove unused definition", span, newText: "" }
    }
    throw Error("unknown action");
}
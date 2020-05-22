
export interface Position {
    offset: number;
    line: number;
    character: number;
}

export interface Span {
    from: Position;
    to: Position
}

export function mergeSpan(a: Span, b: Span) {
    function minPosition(a: Position, b: Position) {
        return a.offset < b.offset ? a : b;
    }
    function maxPosition(a: Position, b: Position) {
        return a.offset > b.offset ? a : b;
    }
    return { from: minPosition(a.from, b.from), to: maxPosition(a.to, b.to)};
}

export function isIn(position: Position, span: Span) {
    return span.from.offset <= position.offset && position.offset <= span.to.offset;
}

export function overlap(span: Span, other: Span) {
    return isIn(span.from, other) || isIn(span.to, other)
        || isIn(other.from, span) || isIn(other.to, span);
}

export interface ErrorReporter {
    reportError(span: Span, message: string): void;
    reportHint(span: Span, message: string, code: string): void;
}
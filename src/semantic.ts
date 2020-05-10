import { ErrorReporter, Span } from "./positions";
import { KaleFile } from "./ast";

export enum Type {
    INTEGER,
    STRING,
    UNKNOWN,
}

export function checkSemantic(file: KaleFile, reporter: ErrorReporter) {
    const variables = new Map<string, Type>();
    throw new Error("TODO : complete");
}

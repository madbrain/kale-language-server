import { createConnection, ProposedFeatures, InitializeParams,
	InitializeResult, TextDocumentSyncKind, DidOpenTextDocumentParams, TextDocument, Diagnostic, DiagnosticSeverity, DidChangeTextDocumentParams, DidCloseTextDocumentParams, TextDocumentPositionParams, CompletionItem, CompletionItemKind
} from "vscode-languageserver";
import { Parser } from "./parser";
import { Lexer } from "./lexer";
import { checkSemantic } from "./semantic";
import { Span, Position } from "./positions";
import { complete } from "./complete";

const connection = createConnection(ProposedFeatures.all);

const documents: { [ uri: string ]: TextDocument } = {};

connection.onInitialize((params: InitializeParams): InitializeResult => {
	return {
		capabilities: {
			textDocumentSync: TextDocumentSyncKind.Incremental,
			completionProvider: {}
		} as any
	}
});

connection.onDidOpenTextDocument((didOpenTextDocumentParams: DidOpenTextDocumentParams): void => {
	const document = TextDocument.create(didOpenTextDocumentParams.textDocument.uri, didOpenTextDocumentParams.textDocument.languageId,
		didOpenTextDocumentParams.textDocument.version, didOpenTextDocumentParams.textDocument.text);
	documents[didOpenTextDocumentParams.textDocument.uri] = document;
	validateTextDocument(document);
});

connection.onDidChangeTextDocument((didChangeTextDocumentParams: DidChangeTextDocumentParams): void => {
	let document = documents[didChangeTextDocumentParams.textDocument.uri];
	const changes = didChangeTextDocumentParams.contentChanges;
	const content = document.getText();
	let buffer = content;
	for (let i = 0; i < changes.length; i++) {
		const change = changes[i] as any;
		if (!change.range && !change.rangeLength) {
			// no ranges defined, the text is the entire document then
			buffer = change.text;
			break;
		}
		const offset = document.offsetAt(change.range.start);
		const end = change.range.end
				? document.offsetAt(change.range.end)
				: offset + change.rangeLength;
		buffer = buffer.substring(0, offset) + change.text + buffer.substring(end);
	}
	document = TextDocument.create(didChangeTextDocumentParams.textDocument.uri, document.languageId, didChangeTextDocumentParams.textDocument.version || 1, buffer);
	documents[didChangeTextDocumentParams.textDocument.uri] = document;
	if (content !== buffer) {
		validateTextDocument(document);
	}
});

connection.onDidCloseTextDocument((didCloseTextDocumentParams: DidCloseTextDocumentParams): void => {
	connection.sendDiagnostics({ uri: didCloseTextDocumentParams.textDocument.uri, diagnostics: [] });
	delete documents[didCloseTextDocumentParams.textDocument.uri];
});

function validateTextDocument(textDocument: TextDocument) {
	const diagnostics: Diagnostic[] = [];
	function toPosition(pos: Position) {
		return { line: pos.line, character: pos.character };
	}
	const reporter = {
		reportError(span: Span, message: string) {
			diagnostics.push({
				range: {
					start: toPosition(span.from),
					end: toPosition(span.to)
				},
				severity: DiagnosticSeverity.Error,
				message });
		}
	}
	const parser = new Parser(new Lexer(textDocument.getText(), reporter), reporter)
	checkSemantic(parser.parseFile(), reporter);
	connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}

connection.onCompletion((textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
	let document = documents[textDocumentPosition.textDocument.uri];
	const offset = document.offsetAt(textDocumentPosition.position);
	const result = complete(document.getText(), {
		line: textDocumentPosition.position.line,
		character: textDocumentPosition.position.character,
		offset
	});
	return result.map(x => {
		return { label: x.value, kind: CompletionItemKind.Variable };
	});
});

connection.listen();
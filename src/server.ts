import { createConnection, ProposedFeatures, InitializeParams,
	InitializeResult, TextDocumentSyncKind, DidOpenTextDocumentParams, TextDocument,
	Diagnostic, DiagnosticSeverity, DidChangeTextDocumentParams, DidCloseTextDocumentParams,
	TextEdit, Range, Position as vscPosition
} from "vscode-languageserver";
import { Parser } from "./parser";
import { Lexer } from "./lexer";
import { checkSemantic } from "./semantic";
import { Span, Position} from "./positions";

const connection = createConnection(ProposedFeatures.all);

const documents: { [ uri: string ]: TextDocument } = {};

connection.onInitialize((params: InitializeParams): InitializeResult => {
	return {
		capabilities: {
			textDocumentSync: TextDocumentSyncKind.Incremental,
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
	const previousContent = document.getText();
	const newContent = TextDocument.applyEdits(document, didChangeTextDocumentParams.contentChanges.map(c => {
		const change = c as any;
		const range = !change.range && !change.rangeLength
			? Range.create(document.positionAt(0), document.positionAt(previousContent.length))
			: change.range;
		return TextEdit.replace(range, change.text);
	}));

	document = TextDocument.create(didChangeTextDocumentParams.textDocument.uri,
		document.languageId, didChangeTextDocumentParams.textDocument.version || 1, newContent);
	documents[didChangeTextDocumentParams.textDocument.uri] = document;
	if (previousContent !== newContent) {
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
		return vscPosition.create(pos.line, pos.character);
	}
	const reporter = {
		reportError(span: Span, message: string) {
			diagnostics.push({
				range: Range.create(toPosition(span.from), toPosition(span.to)),
				severity: DiagnosticSeverity.Error,
				message });
		}
	}
	const parser = new Parser(new Lexer(textDocument.getText(), reporter), reporter)
	checkSemantic(parser.parseFile(), reporter);
	connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}

connection.listen();
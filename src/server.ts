import {
	createConnection, ProposedFeatures,
	InitializeParams, InitializeResult,
	TextDocumentSyncKind
} from "vscode-languageserver";

const connection = createConnection(ProposedFeatures.all);

connection.onInitialize((params: InitializeParams): InitializeResult => {
	return {
		capabilities: {
			textDocumentSync: TextDocumentSyncKind.Incremental,
		} as any
	}
});

// ... more handlers ...

connection.listen();
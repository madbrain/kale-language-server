
import * as child_process from "child_process";
import { expect } from 'chai';

import { code } from './code-utils';

import {
    TextDocumentSyncKind, CompletionItemKind, DiagnosticSeverity, DiagnosticTag
} from 'vscode-languageserver';

const lspProcess = child_process.fork("lib/server.js", [ "--node-ipc" ]);
let messageId = 1;

function sendRequest(method: string, params: any): number {
	const message = {
		jsonrpc: "2.0",
		id: messageId++,
		method: method,
		params: params
	};
	lspProcess.send(message);
	return messageId - 1;
}

function sendNotification(method: string, params: any) {
	const message = {
		jsonrpc: "2.0",
		method: method,
		params: params
	};
	lspProcess.send(message);
}

function initialize(): number {
	const capabilities = {
		workspace: { }
	};
	return sendRequest("initialize", {
		rootPath: process.cwd(),
		processId: process.pid,
		capabilities
	});
}

describe("Server Tests", function() {

    it("initialize", function(finished) {
		this.timeout(5000);
		const responseId = initialize();
		lspProcess.once('message', function (json) {
			const capabilities = json.result.capabilities;
			
			expect(json.id).to.equal(responseId);
			expect(capabilities.textDocumentSync).to.equal(TextDocumentSyncKind.Incremental);
			expect(capabilities.completionProvider).to.eql({});
			
			finished();
		});
	});

	it("open document and publish diagnostics", function (finished) {
		this.timeout(5000);
		const uri = "uri://example1.kl";
		const content = code("message := @{1}foo@{2}");
		sendNotification("textDocument/didOpen", {
			textDocument: {
				languageId: "kale",
				version: 1,
				uri: uri,
				text: content.value
			}
		});

		lspProcess.once("message", (json) => {
			
			if (json.method === "textDocument/publishDiagnostics") {
				expect(json.params).to.eql({
					uri: uri,
					diagnostics: [
						{
							severity: 1,
							message: "Unknown variable 'foo'",
							range: content.range(1, 2)
						}
					]
				});
				
				sendNotification("textDocument/didChange", {
					textDocument: {
						version: 2,
						uri: uri,
					},
					contentChanges: [
						{
							range: content.range(1, 2),
							rangeLength: 3,
							text: "10"
						}
					]
				});
				lspProcess.once("message", (json) => {
					if (json.method === "textDocument/publishDiagnostics") {
						expect(json.params).to.eql({
							uri: uri,
							diagnostics: [ ]
						});
						sendNotification("textDocument/didClose", {
							textDocument: {
								uri: uri
							}
						});
						finished();
					}
				});
			}
		});
	});

	it("open document and publish hint diagnostics", function (finished) {
		this.timeout(5000);
		const uri = "uri://example1.kl";
		const content = code('@{1}my_var := 10@{2}\nmessage := "10"\n');
		sendNotification("textDocument/didOpen", {
			textDocument: {
				languageId: "kale",
				version: 1,
				uri: uri,
				text: content.value
			}
		});
	
		lspProcess.once("message", (json) => {
			
			if (json.method === "textDocument/publishDiagnostics") {
				expect(json.params).to.eql({
					uri: uri,
					diagnostics: [
						{
							range: content.range(1, 2),
							severity: DiagnosticSeverity.Hint,
							tags: [ DiagnosticTag.Unnecessary ],
							message: "Unused definition",
							code: "0001"
						}
					]
				});
				finished();
			}
		});
	});

	it("open document and complete", function (finished) {
		this.timeout(5000);
		const uri = "uri://example1.kl";
		const content = code('my_var := 10\nmy_second_var := "10"\nmy_other_var := my@{1}stic');
		sendNotification("textDocument/didOpen", {
			textDocument: {
				languageId: "kale",
				version: 1,
				uri: uri,
				text: content.value
			}
		});
		const id = sendRequest("textDocument/completion", {
			textDocument: {
				uri
			},
			position: {
				line: content.positions[1].line,
				character: content.positions[1].character
			}
		});
		const responseListener = (json: any) => {
			if (json.id === id) {
				expect(json.result).to.eql([
					{ label: "my_second_var", kind: CompletionItemKind.Variable },
					{ label: "my_var", kind: CompletionItemKind.Variable }
				]);
				lspProcess.removeListener("message", responseListener);
				sendNotification("textDocument/didClose", {
					textDocument: {
						uri
					}
				});
				finished();
			}
		};
		lspProcess.on("message", responseListener);
	});

	after(() => {
		// terminate the forked LSP process after all the tests have been run
		lspProcess.kill();
	});
});

// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { stringify } from 'querystring';
import * as vscode from 'vscode';
import { languages, Diagnostic, DiagnosticSeverity, Range } from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "calm-validate" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('calm-validate.calm-validate', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from calm-validate!');

		let calmResult = callCalmValidate();

		let diagnostics: Diagnostic[] = calmResult.map((calmValidation: any) => new Diagnostic(new Range(new vscode.Position(1,1),new vscode.Position(1,1)),
		calmValidation.message, convertSeverity(calmValidation.severity)));

		let diagnosticCollection = languages.createDiagnosticCollection("calm");
	
		if (vscode.window.activeTextEditor) {
			diagnosticCollection.set(vscode.window.activeTextEditor.document.uri, diagnostics);
		}
	});

	context.subscriptions.push(disposable);
}

function callCalmValidate() {
	return JSON.parse(`[
    {
        "code": "json-schema",
        "severity": "error",
        "message": "schema is invalid: data/properties/relationships/minItems must be >= 0",
        "path": "/"
    },
    {
        "code": "pattern-has-no-placeholder-properties-numerical",
        "severity": "warning",
        "message": "Numerical placeholder (-1) detected in instantiated pattern.",
        "path": "/properties/relationships/minItems"
    }
]`);
}

function convertSeverity(severityStr: string): DiagnosticSeverity {
	if(severityStr === "error") {
		return DiagnosticSeverity.Error;
	} else if (severityStr === "warning") {
		return DiagnosticSeverity.Warning;
	} else {
		return DiagnosticSeverity.Information;
	}
}

// This method is called when your extension is deactivated
export function deactivate() { }

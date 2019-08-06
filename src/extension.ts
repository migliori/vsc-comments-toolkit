'use strict';

// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json

	// a completion item that inserts its text as snippet,
	// the `insertText`-property is a `SnippetString` which we will
	// honored by the editor.

	/*=============================================
	=          Register All the coments           =
	=============================================*/

	const commentSection = new vscode.CompletionItem('comm:section', vscode.CompletionItemKind.Text);
	commentSection.insertText = new vscode.SnippetString("/*=============================================\n=                   ${1:Section}                   =\n=============================================*/\n\n${2:}\n\n/*============  End of ${1}  =============*/");
	commentSection.documentation = "/*=============================\n=                            Section                            =\n=============================*/\n\n\n\n/*========  End of Section  =========*/";

	const commentSectionHeader = new vscode.CompletionItem('comm:section-header', vscode.CompletionItemKind.Text);
	commentSectionHeader.insertText = new vscode.SnippetString("/*=============================================\n=                   ${1:Section}                   =\n=============================================*/\n\n");
	commentSectionHeader.documentation = "/*=============================\n=                            Section                            =\n=============================*/\n\n";

	const commentSectionFooter = new vscode.CompletionItem('comm:section-footer', vscode.CompletionItemKind.Text);
	commentSectionFooter.insertText = new vscode.SnippetString("\n/*============  End of ${1:Section}  =============*/");
	commentSectionFooter.documentation = "\n/*========  End of Section  =========*/";

	const commentSubsection = new vscode.CompletionItem('comm:subsection', vscode.CompletionItemKind.Text);
	commentSubsection.insertText = new vscode.SnippetString("/* ${1:Subsection}\n-------------------------------------------------- */\n\n${2:}\n\n/* End of ${1}\n-------------------------------------------------- */");
	commentSubsection.documentation = "/* Subsection\n-------------------------------------------------- */\n\n\n\n/* End of Subsection\n-------------------------------------------------- */";

	const commentSubsectionHeader = new vscode.CompletionItem('comm:subsection-header', vscode.CompletionItemKind.Text);
	commentSubsectionHeader.insertText = new vscode.SnippetString("/* ${1:Subsection}\n-------------------------------------------------- */\n");
	commentSubsectionHeader.documentation = "/* Subsection\n-------------------------------------------------- */\n";

	const commentSubsectionFooter = new vscode.CompletionItem('comm:subsection-footer', vscode.CompletionItemKind.Text);
	commentSubsectionFooter.insertText = new vscode.SnippetString("\n/* End of ${1:Subsection}\n-------------------------------------------------- */");
	commentSubsectionFooter.documentation = "\n/* End of Subsection\n-------------------------------------------------- */";

	const commentSimple = new vscode.CompletionItem('comm:simple', vscode.CompletionItemKind.Text);
	commentSimple.insertText = new vscode.SnippetString("/* ${1:Comment} */");
	commentSimple.documentation = "/* Comment */";

	const commentBlock = new vscode.CompletionItem('comm:block', vscode.CompletionItemKind.Text);
	commentBlock.insertText = new vscode.SnippetString("/**\n*\n* ${1:Block}\n*\n*/");
	commentBlock.documentation = "/**\n*\n* Block\n*\n*/";

	const commentTodo = new vscode.CompletionItem('comm:todo', vscode.CompletionItemKind.Text);
	commentTodo.insertText = new vscode.SnippetString("/**\n\n    TODO:\n    - ${1:First todo item}\n    - ${2:Second todo item}\n\n*/");
	commentTodo.documentation = "/**\n\n    TODO:\n    - First todo item\n    - Second todo item\n\n*/";

	const commentHtmlSection = new vscode.CompletionItem('comm:html-section', vscode.CompletionItemKind.Text);
	commentHtmlSection.insertText = new vscode.SnippetString("<!--=====================================\n=                ${1:Section}                =\n======================================-->\n\n${2}\n\n<!--=======  End of ${1}  ========-->");
	commentHtmlSection.documentation = "<!--=============================\n=                             Section                             =\n=============================-->\n\n\n\n<!--======== End of Section =========-->";

	const commentHtmlSectionHeader = new vscode.CompletionItem('comm:html-section-header', vscode.CompletionItemKind.Text);
	commentHtmlSectionHeader.insertText = new vscode.SnippetString("<!--=====================================\n=                ${1:Section}                =\n======================================-->\n\n");
	commentHtmlSectionHeader.documentation = "<!--=============================\n=                             Section                             =\n=============================-->\n";

	const commentHtmlSectionFooter = new vscode.CompletionItem('comm:html-section-footer', vscode.CompletionItemKind.Text);
	commentHtmlSectionFooter.insertText = new vscode.SnippetString("\n<!--=======  End of ${1:Section}  ========-->");
	commentHtmlSectionFooter.documentation = "\n<!--======== End of Section =========-->";

	const commentHtmlSimple = new vscode.CompletionItem('comm:html-simple', vscode.CompletionItemKind.Text);
	commentHtmlSimple.insertText = new vscode.SnippetString("<!-- ${1:html} -->");
	commentHtmlSimple.documentation = "<!-- html -->";

	/*=====  End of Register All the coments  ======*/

	/*=============================================
	=  Register the providers for each language   =
	=============================================*/

	let providerCss = vscode.languages.registerCompletionItemProvider('css', {
		provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext) {
			// return all completion items as array
			return [
				commentSection, commentSectionHeader, commentSectionFooter, commentSubsection, commentSubsectionHeader, commentSubsectionFooter, commentSimple, commentBlock, commentTodo
			];
		}
	}, 'comm');

	let providerHtml = vscode.languages.registerCompletionItemProvider('html', {
		provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext) {
			// return all completion items as array
			return [
				commentHtmlSection, commentHtmlSectionHeader, commentHtmlSectionFooter, commentHtmlSimple
			];
		}
	}, 'comm');

	let providerJavascript = vscode.languages.registerCompletionItemProvider('javascript', {
		provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext) {
			// return all completion items as array
			return [
				commentSection, commentSectionHeader, commentSectionFooter, commentSubsection, commentSubsectionHeader, commentSubsectionFooter, commentSimple, commentBlock, commentTodo
			];
		}
	}, 'comm');

	let providerPhp = vscode.languages.registerCompletionItemProvider('php', {
		provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext) {
			// return all completion items as array
			return [
				commentSection, commentSectionHeader, commentSectionFooter, commentSubsection, commentSubsectionHeader, commentSubsectionFooter, commentSimple, commentBlock, commentTodo
			];
		}
	}, 'comm');

	let providerScss = vscode.languages.registerCompletionItemProvider('scss', {
		provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext) {
			// return all completion items as array
			return [
				commentSection, commentSectionHeader, commentSectionFooter, commentSubsection, commentSubsectionHeader, commentSubsectionFooter, commentSimple, commentBlock, commentTodo
			];
		}
	}, 'comm');

	let providerTypescript = vscode.languages.registerCompletionItemProvider('typescript', {
		provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext) {
			// return all completion items as array
			return [
				commentSection, commentSectionHeader, commentSectionFooter, commentSubsection, commentSubsectionHeader, commentSubsectionFooter, commentSimple, commentBlock, commentTodo
			];
		}
	}, 'comm');
	
	let providerVue = vscode.languages.registerCompletionItemProvider('typescript', {
		provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext) {
			// return all completion items as array
			return [
				commentSection, commentSectionHeader, commentSectionFooter, commentSubsection, commentSubsectionHeader, commentSubsectionFooter, commentSimple, commentBlock, commentTodo, commentHtmlSection, commentHtmlSectionHeader, commentHtmlSectionFooter, commentHtmlSimple
			];
		}
	}, 'comm');

	context.subscriptions.push(providerCss);
	context.subscriptions.push(providerHtml);
	context.subscriptions.push(providerJavascript);
	context.subscriptions.push(providerPhp);
	context.subscriptions.push(providerScss);
	context.subscriptions.push(providerTypescript);
	context.subscriptions.push(providerVue);
}

// this method is called when your extension is deactivated
export function deactivate() { }

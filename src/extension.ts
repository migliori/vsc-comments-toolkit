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

	const commentSection = new vscode.CompletionItem('comment:section', vscode.CompletionItemKind.Text);
	commentSection.insertText = new vscode.SnippetString("/*=============================================\n=            ${1:Section comment block}            =\n=============================================*/\n\n${2:}\n\n/*=====  End of ${1}  ======*/");
	commentSection.documentation = "/*=============================\n=               Section comment block               =\n=============================*/\n\n\n\n/*===  End of Section comment block  ====*/";

	const commentSectionHeader = new vscode.CompletionItem('comment:section-header', vscode.CompletionItemKind.Text);
	commentSectionHeader.insertText = new vscode.SnippetString("/*=============================================\n=            ${1:Section comment block}            =\n=============================================*/\n\n");
	commentSectionHeader.documentation = "/*=============================\n=               Section comment block               =\n=============================*/\n\n";

	const commentSectionFooter = new vscode.CompletionItem('comment:section-footer', vscode.CompletionItemKind.Text);
	commentSectionFooter.insertText = new vscode.SnippetString("\n/*=====  End of ${1:Section comment block}  ======*/");
	commentSectionFooter.documentation = "\n/*===  End of Section comment block  ====*/";

	const commentSimple = new vscode.CompletionItem('comment:simple', vscode.CompletionItemKind.Text);
	commentSimple.insertText = new vscode.SnippetString("/* ${1:Comment} */");
	commentSimple.documentation = "/* Comment */";

	const commentBlock = new vscode.CompletionItem('comment:block', vscode.CompletionItemKind.Text);
	commentBlock.insertText = new vscode.SnippetString("/**\n*\n* ${1:Block comment}\n*\n*/");
	commentBlock.documentation = "/**\n*\n* Block comment\n*\n*/";

	const commentTodo = new vscode.CompletionItem('comment:todo', vscode.CompletionItemKind.Text);
	commentTodo.insertText = new vscode.SnippetString("/**\n\n    TODO:\n    - ${1:First todo item}\n    - ${2:Second todo item}\n\n*/");
	commentTodo.documentation = "/**\n\n    TODO:\n    - First todo item\n    - Second todo item\n\n*/";

	const commentHtmlSection = new vscode.CompletionItem('comment:html-section', vscode.CompletionItemKind.Text);
	commentHtmlSection.insertText = new vscode.SnippetString("<!--=====================================\n=            ${1:Section comment}            =\n======================================-->\n\n${2}\n\n<!--====  End of ${1}  ====-->");
	commentHtmlSection.documentation = "<!--=============================\n=                 Section comment block                 =\n=============================-->\n\n\n\n<!--=== End of Section comment block ====-->";

	const commentHtmlSectionHeader = new vscode.CompletionItem('comment:html-section-header', vscode.CompletionItemKind.Text);
	commentHtmlSectionHeader.insertText = new vscode.SnippetString("<!--=====================================\n=            ${1:Section comment}            =\n======================================-->\n\n");
	commentHtmlSectionHeader.documentation = "<!--=============================\n=                 Section comment block                 =\n=============================-->\n";

	const commentHtmlSectionFooter = new vscode.CompletionItem('comment:html-section-footer', vscode.CompletionItemKind.Text);
	commentHtmlSectionFooter.insertText = new vscode.SnippetString("\n<!--====  End of ${1:Section comment}  ====-->");
	commentHtmlSectionFooter.documentation = "\n<!--=== End of Section comment block ====-->";

	const commentHtmlSimple = new vscode.CompletionItem('comment:html-simple', vscode.CompletionItemKind.Text);
	commentHtmlSimple.insertText = new vscode.SnippetString("<!-- ${1:html comment} -->");
	commentHtmlSimple.documentation = "<!-- html comment -->";

	/*=====  End of Register All the coments  ======*/

	/*=============================================
	=  Register the providers for each language   =
	=============================================*/

	let providerCss = vscode.languages.registerCompletionItemProvider('css', {
		provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext) {
			// return all completion items as array
			return [
				commentSection, commentSectionHeader, commentSectionFooter, commentSimple, commentBlock, commentTodo
			];
		}
	}, 'comment');

	let providerHtml = vscode.languages.registerCompletionItemProvider('html', {
		provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext) {
			// return all completion items as array
			return [
				commentHtmlSection, commentHtmlSectionHeader, commentHtmlSectionFooter, commentHtmlSimple
			];
		}
	}, 'comment');

	let providerJavascript = vscode.languages.registerCompletionItemProvider('javascript', {
		provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext) {
			// return all completion items as array
			return [
				commentSection, commentSectionHeader, commentSectionFooter, commentSimple, commentBlock, commentTodo
			];
		}
	}, 'comment');

	let providerPhp = vscode.languages.registerCompletionItemProvider('php', {
		provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext) {
			// return all completion items as array
			return [
				commentSection, commentSectionHeader, commentSectionFooter, commentSimple, commentBlock, commentTodo
			];
		}
	}, 'comment');

	let providerScss = vscode.languages.registerCompletionItemProvider('scss', {
		provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext) {
			// return all completion items as array
			return [
				commentSection, commentSectionHeader, commentSectionFooter, commentSimple, commentBlock, commentTodo
			];
		}
	}, 'comment');

	context.subscriptions.push(providerCss);
	context.subscriptions.push(providerHtml);
	context.subscriptions.push(providerJavascript);
	context.subscriptions.push(providerPhp);
	context.subscriptions.push(providerScss);
}

// this method is called when your extension is deactivated
export function deactivate() { }

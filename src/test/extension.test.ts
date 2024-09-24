process.env.NODE_ENV = 'test'; // Ensure NODE_ENV is set to 'test'

import * as assert from 'assert';
import * as vscode from 'vscode';
import { logger } from '../logger';
import Parser from 'tree-sitter';
import HTML from 'tree-sitter-html';
import sinon from 'sinon';

const {
    patternCache,
    completionItemsMap,
    getConfiguration,
    globalPatterns,
    getHtmlParser,
    log,
    isInsidePHP,
    detectLanguageAtPosition,
    findLanguageFromNode,
    generateCommentPattern,
    getCompletionItems,
    activate,
} = require('../extension');

console.log('NODE_ENV:', process.env.NODE_ENV);

suite('Extension Test Suite', () => {
    vscode.window.showInformationMessage('Start all tests.');

    test('getConfiguration should return default values when no configuration is set', async () => {
        const config = vscode.workspace.getConfiguration('commentToolkit');
        await config.update('baseLength', undefined, vscode.ConfigurationTarget.Global);
        await config.update('separator', undefined, vscode.ConfigurationTarget.Global);

        const defaultConfig = getConfiguration();
        assert.strictEqual(defaultConfig.baseLength, 40);
        assert.strictEqual(defaultConfig.separator, '=');
    });

    test('getConfiguration should return user-defined values when configuration is set', async () => {
        const config = vscode.workspace.getConfiguration('commentToolkit');
        await config.update('baseLength', 50, vscode.ConfigurationTarget.Global);
        await config.update('separator', '-', vscode.ConfigurationTarget.Global);

        const updatedConfig = getConfiguration();
        assert.strictEqual(updatedConfig.baseLength, 50);
        assert.strictEqual(updatedConfig.separator, '-');

        // Clean up: reset the configuration to default values
        await config.update('baseLength', undefined, vscode.ConfigurationTarget.Global);
        await config.update('separator', undefined, vscode.ConfigurationTarget.Global);
    });



    vscode.window.showInformationMessage('Start getHtmlParser tests.');

    test('getHtmlParser should return a Parser instance', () => {
        const parser = getHtmlParser();
        assert.ok(parser instanceof Parser, 'Expected parser to be an instance of Parser');
    });

    test('getHtmlParser should set the language to HTML', () => {
        const parser = getHtmlParser();
        assert.strictEqual(parser.getLanguage(), HTML, 'Expected parser language to be set to HTML');
    });

    test('getHtmlParser should return the same instance on subsequent calls', () => {
        const firstCallParser = getHtmlParser();
        const secondCallParser = getHtmlParser();
        assert.strictEqual(firstCallParser, secondCallParser, 'Expected the same parser instance on subsequent calls');
    });

    vscode.window.showInformationMessage('Start isInsidePHP tests.');

    test('should return false if there is no active editor', () => {
        const stub = sinon.stub(vscode.window, 'activeTextEditor').get(() => null);
        const result = isInsidePHP('<?php echo "Hello, World!"; ?>', new vscode.Position(0, 5));
        assert.strictEqual(result, false);
        stub.restore();
    });

    test('should return true if cursor is inside PHP tags', () => {
        const document = {
            getText: () => '<?php echo "Hello, World!"; ?>',
            offsetAt: (position: vscode.Position) => 10
        } as vscode.TextDocument;
        const editorStub = sinon.stub(vscode.window, 'activeTextEditor').get(() => ({
            document,
            selection: new vscode.Selection(new vscode.Position(0, 10), new vscode.Position(0, 10))
        }));
        const result = isInsidePHP('<?php echo "Hello, World!"; ?>', new vscode.Position(0, 10));
        assert.strictEqual(result, true);
        editorStub.restore();
    });

    test('should return false if cursor is outside PHP tags', () => {
        const document = {
            getText: () => '<span>Hello, World!</span>>',
            offsetAt: (position: vscode.Position) => 10
        } as vscode.TextDocument;
        const editorStub = sinon.stub(vscode.window, 'activeTextEditor').get(() => ({
            document,
            selection: new vscode.Selection(new vscode.Position(0, 10), new vscode.Position(0, 10))
        }));
        const result = isInsidePHP('<span>Hello, World!</span>>', new vscode.Position(0, 10));
        assert.strictEqual(result, false);
        editorStub.restore();
    });

    test('should return true if PHP code extends to the end of the document', () => {
        const document = {
            getText: () => '<?php echo "Hello, World!";',
            offsetAt: (position: vscode.Position) => 10
        } as vscode.TextDocument;
        const editorStub = sinon.stub(vscode.window, 'activeTextEditor').get(() => ({
            document,
            selection: new vscode.Selection(new vscode.Position(0, 10), new vscode.Position(0, 10)),
            offsetAt: (position: vscode.Position) => 10,
            getText: () => '<?php echo "Hello, World!";'
        }));
        const result = isInsidePHP('<?php echo "Hello, World!";', new vscode.Position(0, 10));
        assert.strictEqual(result, true);
        editorStub.restore();
    });

    vscode.window.showInformationMessage('Start generateCommentPattern tests.');

    test('generateCommentPattern should return cached pattern if available', () => {
        const language = 'javascript';
        const patternKey = 'testPattern';
        const pattern = '/* test pattern */';

        patternCache.set(`${language}-${patternKey}`, '/* cached pattern */');

        const result = generateCommentPattern(language, patternKey, pattern);
        assert.strictEqual(result, patternCache.get(`${language}-${patternKey}`), 'Expected to return cached pattern');
    });

    test('generateCommentPattern should generate single-line comment pattern', () => {
        const language = 'javascript';
        const patternKey = 'singleLinePattern';
        const pattern = 'singleLineStart[s]This is a single-line comment singleLineEnd';

        const result = generateCommentPattern(language, patternKey, pattern);
        assert.strictEqual(result, '// This is a single-line comment', 'Expected single-line comment pattern');
    });

    test('generateCommentPattern should generate multi-line comment pattern', () => {
        const language = 'css';
        const patternKey = 'multiLinePattern';
        const pattern = 'multiLineStart[s]This is a multi-line comment[s]multiLineEnd';

        const result = generateCommentPattern(language, patternKey, pattern);
        assert.strictEqual(result, '/* This is a multi-line comment */', 'Expected multi-line comment pattern');
    });

    test('generateCommentPattern should handle mixed single and multi-line comments', () => {
        const language = 'javascript';
        const patternKey = 'mixedPattern';
        const pattern = 'singleLineStart[s]This is a single-line comment singleLineEnd\nmultiLineStart[s]This is a multi-line comment[s]multiLineEnd';

        const result = generateCommentPattern(language, patternKey, pattern);
        console.log(result);
        assert.strictEqual(result, '// This is a single-line comment\n/* This is a multi-line comment */', 'Expected mixed comment pattern');
    });

    test('generateCommentPattern should log error and return original pattern on failure', () => {
        const language = 'unknownLanguage';
        const patternKey = 'errorPattern';
        const pattern = 'singleLineStart[s]This should fail singleLineEnd';

        const errorStub = sinon.stub(logger, 'error');

        const result = generateCommentPattern(language, patternKey, pattern);
        console.log(result);
        assert.strictEqual(result, pattern, 'Expected to return original pattern on failure');
        assert.strictEqual(errorStub.calledOnce, true, 'Expected error to be logged');

        errorStub.restore();
    });

    test('getCompletionItems should return cached items if available', () => {
        const document = {
            languageId: 'javascript',
            getText: () => ''
        } as vscode.TextDocument;
        const position = new vscode.Position(0, 0);
        const cachedItems = [new vscode.CompletionItem('cachedItem')];

        completionItemsMap['javascript'] = cachedItems;

        const result = getCompletionItems(document, position);
        assert.strictEqual(result, cachedItems, 'Expected to return cached completion items');
    });

    vscode.window.showInformationMessage('Start activate tests.');

    test('activate should register completion item provider for all languages', () => {
        const context = { subscriptions: [] } as unknown as vscode.ExtensionContext;
        const registerCompletionItemProviderStub = sinon.stub(vscode.languages, 'registerCompletionItemProvider');

        activate(context);

        assert.strictEqual(registerCompletionItemProviderStub.calledOnce, true, 'Expected registerCompletionItemProvider to be called once');
        const [languages, provider, trigger] = registerCompletionItemProviderStub.firstCall.args;
        assert.ok(Array.isArray(languages), 'Expected languages to be an array');
        assert.strictEqual(trigger, 'comm', 'Expected trigger character to be "comm"');

        registerCompletionItemProviderStub.restore();
    });

    test('activate should register context subscriptions', () => {
        const context = { subscriptions: [] } as unknown as vscode.ExtensionContext;

        activate(context);

        assert.strictEqual(context.subscriptions.length, 1, 'Expected one subscription to be registered');
        const [subscription] = context.subscriptions;
        assert.strictEqual(typeof subscription.dispose, 'function', 'Expected subscription to have a dispose method');
    });

    test('activate should log error if an exception occurs', () => {
        const context = { subscriptions: [] } as unknown as vscode.ExtensionContext;
        const errorStub = sinon.stub(logger, 'error');

        // Simulate an error in the activate function
        sinon.stub(vscode.languages, 'registerCompletionItemProvider').throws(new Error('Test error'));

        try {
            activate(context);
        } catch (e) {
            // Expected error
        }

        assert.strictEqual(errorStub.calledOnce, true, 'Expected error to be logged');
        assert.strictEqual(errorStub.firstCall.args[0], 'Error in activate: Test error', 'Expected log level to be "error"');

        errorStub.restore();
    });

    vscode.window.showInformationMessage('Start log function tests.');

    test('log should call logger.info with the correct message', () => {
        sinon.stub(logger, 'info').restore();
        const infoStub = sinon.stub(logger, 'info');

        log('info', 'Test info message');
        assert.strictEqual(infoStub.calledOnce, true, 'Expected logger.info to be called once');
        assert.strictEqual(infoStub.firstCall.args[0], 'Test info message', 'Expected correct message to be logged');

        infoStub.restore();
    });

    test('log should call logger.warn with the correct message', () => {
        const warnStub = sinon.stub(logger, 'warn');
        const message = 'This is a warning message';

        log('warn', message);

        assert.strictEqual(warnStub.calledOnce, true, 'Expected logger.warn to be called once');
        assert.strictEqual(warnStub.firstCall.args[0], message, 'Expected logger.warn to be called with the correct message');

        warnStub.restore();
    });

    test('log should call logger.error with the correct message', () => {
        const errorStub = sinon.stub(logger, 'error');

        log('error', 'Test error message');
        assert.strictEqual(errorStub.calledOnce, true, 'Expected logger.error to be called once');
        assert.strictEqual(errorStub.firstCall.args[0], 'Test error message', 'Expected correct message to be logged');

        errorStub.restore();
    });

    // Additional tests...

});

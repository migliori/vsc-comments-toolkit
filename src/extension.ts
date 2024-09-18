/**
 * Comment Toolkit Extension
 *
 * This Visual Studio Code extension provides a set of tools for generating and managing comment patterns
 * in various programming languages. It supports both single-line and multi-line comments and allows users
 * to insert predefined comment patterns using completion items.
 *
 * Features:
 * - Supports multiple programming languages with their respective comment styles.
 * - Provides predefined comment patterns such as sections, subsections, simple comments, blocks, and TODOs.
 * - Automatically adjusts the length of comment lines to maintain a consistent format.
 * - Registers completion item providers for active editors to offer comment pattern suggestions.
 * - Caches generated comment patterns to avoid redundant computations.
 * - Logs messages with different log levels (info, warning, error) for better debugging and monitoring.
 *
 * Main Components:
 * - `commentStyles`: Defines the comment styles for supported languages.
 * - `globalPatterns`: Contains the predefined comment patterns.
 * - `interpretSpaces`: Replaces placeholders with spaces in the comment patterns.
 * - `calculateContentLength`: Calculates the length of content after replacing placeholders.
 * - `adjustLineLength`: Adjusts the length of a line based on the base length and separators.
 * - `generateCommentPattern`: Generates the comment pattern for a given language and pattern key, with caching.
 * - `updateCompletionItems`: Updates completion items based on the language.
 * - `registerProviderForActiveEditor`: Registers completion provider for the active editor's language.
 * - `activate`: Registers providers for active editors, listens for changes, and clears cache on configuration changes.
 * - `deactivate`: Cleans up resources when the extension is deactivated.
 * - `logger`: Provides logging functionality with different log levels (info, warning, error).
 */

'use strict';

import * as vscode from 'vscode';
import { logger } from './logger';

const registeredEditors = new Map<vscode.TextEditor, string>();
const patternCache = new Map<string, string>();

function getConfiguration() {
	const config = vscode.workspace.getConfiguration('commentToolkit');
	return {
		baseLength: config.get<number>('baseLength', 40),
		separator: config.get<string>('separator', '=')
	};
}

const { baseLength, separator } = getConfiguration();

const commentStyles = {
    "abap": { singleLine: { start: "*", end: "" }, multiLine: { start: "/*", end: "*/" } },
    "bat": { singleLine: { start: "REM", end: "" }, multiLine: false },
    "bibtex": { singleLine: { start: "%", end: "" }, multiLine: false },
    "clojure": { singleLine: { start: ";;", end: "" }, multiLine: false },
    "coffeescript": { singleLine: { start: "#", end: "" }, multiLine: { start: "###", end: "###" } },
    "c": { singleLine: { start: "//", end: "" }, multiLine: { start: "/*", end: "*/" } },
    "cpp": { singleLine: { start: "//", end: "" }, multiLine: { start: "/*", end: "*/" } },
    "csharp": { singleLine: { start: "//", end: "" }, multiLine: { start: "/*", end: "*/" } },
    "cuda-cpp": { singleLine: { start: "//", end: "" }, multiLine: { start: "/*", end: "*/" } },
    "css": { singleLine: { start: "/*", end: "*/" }, multiLine: { start: "/*", end: "*/" } },
    "diff": { singleLine: { start: "#", end: "" }, multiLine: false },
    "dockerfile": { singleLine: { start: "#", end: "" }, multiLine: false },
    "fsharp": { singleLine: { start: "//", end: "" }, multiLine: { start: "(*", end: "*)" } },
    "git-commit": { singleLine: { start: "#", end: "" }, multiLine: false },
    "git-rebase": { singleLine: { start: "#", end: "" }, multiLine: false },
    "go": { singleLine: { start: "//", end: "" }, multiLine: { start: "/*", end: "*/" } },
    "groovy": { singleLine: { start: "//", end: "" }, multiLine: { start: "/*", end: "*/" } },
    "handlebars": { singleLine: { start: "{{!--", end: "--}}" }, multiLine: { start: "{{!--", end: "--}}" } },
    "html": { singleLine: { start: "<!--", end: "-->" }, multiLine: { start: "<!--", end: "-->" } },
    "ini": { singleLine: { start: ";", end: "" }, multiLine: false },
    "java": { singleLine: { start: "//", end: "" }, multiLine: { start: "/*", end: "*/" } },
    "javascript": { singleLine: { start: "//", end: "" }, multiLine: { start: "/*", end: "*/" } },
    "javascriptreact": { singleLine: { start: "{/*", end: "*/}" }, multiLine: { start: "{/*", end: "*/}" } },
    "json": { singleLine: { start: "//", end: "" }, multiLine: { start: "/*", end: "*/" } },
    "jsonc": { singleLine: { start: "//", end: "" }, multiLine: { start: "/*", end: "*/" } },
    "latex": { singleLine: { start: "%", end: "" }, multiLine: false },
    "less": { singleLine: { start: "//", end: "" }, multiLine: { start: "/*", end: "*/" } },
    "lua": { singleLine: { start: "--", end: "" }, multiLine: { start: "--[[", end: "]]" } },
    "makefile": { singleLine: { start: "#", end: "" }, multiLine: false },
    "markdown": { singleLine: { start: "<!--", end: "-->" }, multiLine: { start: "<!--", end: "-->" } },
    "objective-c": { singleLine: { start: "//", end: "" }, multiLine: { start: "/*", end: "*/" } },
    "objective-cpp": { singleLine: { start: "//", end: "" }, multiLine: { start: "/*", end: "*/" } },
    "perl": { singleLine: { start: "#", end: "" }, multiLine: false },
    "perl6": { singleLine: { start: "#", end: "" }, multiLine: false },
    "php": { singleLine: { start: "//", end: "" }, multiLine: { start: "/*", end: "*/" } },
    "plaintext": { singleLine: { start: "", end: "" }, multiLine: false },
    "powershell": { singleLine: { start: "#", end: "" }, multiLine: { start: "<#", end: "#>" } },
    "jade": { singleLine: { start: "//-", end: "" }, multiLine: { start: "/*", end: "*/" } },
    "python": { singleLine: { start: "#", end: "" }, multiLine: { start: '"""', end: '"""' } },
    "r": { singleLine: { start: "#", end: "" }, multiLine: { start: "/*", end: "*/" } },
    "razor": { singleLine: { start: "@*", end: "*@" }, multiLine: { start: "@*", end: "*@" } },
    "ruby": { singleLine: { start: "#", end: "" }, multiLine: { start: "=begin", end: "=end" } },
    "rust": { singleLine: { start: "//", end: "" }, multiLine: { start: "/*", end: "*/" } },
    "scss": { singleLine: { start: "//", end: "" }, multiLine: { start: "/*", end: "*/" } },
    "sass": { singleLine: { start: "//", end: "" }, multiLine: { start: "/*", end: "*/" } },
    "shaderlab": { singleLine: { start: "//", end: "" }, multiLine: { start: "/*", end: "*/" } },
    "shellscript": { singleLine: { start: "#", end: "" }, multiLine: false },
    "sql": { singleLine: { start: "--", end: "" }, multiLine: { start: "/*", end: "*/" } },
    "swift": { singleLine: { start: "//", end: "" }, multiLine: { start: "/*", end: "*/" } },
    "typescript": { singleLine: { start: "//", end: "" }, multiLine: { start: "/*", end: "*/" } },
    "typescriptreact": { singleLine: { start: "{/*", end: "*/}" }, multiLine: { start: "{/*", end: "*/}" } },
    "tex": { singleLine: { start: "%", end: "" }, multiLine: false },
    "vb": { singleLine: { start: "'", end: "" }, multiLine: false },
    "xml": { singleLine: { start: "<!--", end: "-->" }, multiLine: { start: "<!--", end: "-->" } },
    "xsl": { singleLine: { start: "<!--", end: "-->" }, multiLine: { start: "<!--", end: "-->" } },
    "yaml": { singleLine: { start: "#", end: "" }, multiLine: false }
};

const globalPatterns = {
    section: "[fill]multiLineStart\n[spaceFill]${1:Section}\n[fill] multiLineEnd\n\n[s]${2:}\n\nmultiLineStart[fill] End of ${1} multiLineEnd",
    'section-header': "[fill]multiLineStart\n[spaceFill]${1:Section}\n[fill] multiLineEnd\n",
    'section-footer': "\nmultiLineStart[fill] End of ${1:Section} multiLineEnd",
    subsection: "multiLineStart[s]${1:Subsection}\n[fill] multiLineEnd\n\n[s]${2:}\n\nmultiLineStart[s]End of ${1}\n[fill] multiLineEnd",
    'subsection-header': "multiLineStart[s]${1:Subsection}\n[fill] multiLineEnd\n",
    'subsection-footer': "\nmultiLineStart[s]End of ${1:Subsection}\n[fill] multiLineEnd",
    simple: "singleLineStart[s]${1:Comment}singleLineEnd",
    block: "multiLineStart*\n*\n*[s]${1:Block}\n*\nmultiLineEnd",
    todo: "multiLineStart*\n\n[s:4]TODO:\n[s:4]- First todo item\n[s:4]- Second todo item\n\nmultiLineEnd",
};

let completionItems: vscode.CompletionItem[] = [];

/**
 * Replaces placeholders with spaces in the comment patterns.
 *
 * @param {string} content - The content containing placeholders.
 * @returns {string} - The content with placeholders replaced by spaces.
 */
export function interpretSpaces(content: string): string {
    try {
        return content.replace(/\[s:(\d+)\]/g, (match, p1) => ' '.repeat(parseInt(p1, 10)))
                      .replace(/\[s\]/g, ' ');
    } catch (error) {
        logger.error(`Error in interpretSpaces: ${(error as Error).message}`);
        return content;
    }
}

/**
 * Calculates the length of content after replacing placeholders.
 *
 * @param {string} content - The content containing placeholders.
 * @param {Map<string, string>} placeholderMap - A map to store placeholder values.
 * @returns {number} - The length of the content after replacing placeholders.
 */
export function calculateContentLength(content: string, placeholderMap: Map<string, string>): number {
    try {
        const interpretedContent = interpretSpaces(content);
        return interpretedContent.replace(/\$\{(\d+)(?::(.*?))?\}/g, (match, p1, p2) => {
            if (p2) {
                placeholderMap.set(p1, p2);
                return p2;
            } else {
                return placeholderMap.get(p1) || '';
            }
        }).length;
    } catch (error) {
        logger.error(`Error in calculateContentLength: ${(error as Error).message}`);
        return content.length;
    }
}

/**
 * Adjusts the length of a line based on the base length and separators.
 *
 * @param {string} line - The line to adjust.
 * @param {number} baseLength - The base length for the line.
 * @param {string} separator - The separator character.
 * @param {string} multiLineStart - The multi-line comment start string.
 * @param {string} multiLineEnd - The multi-line comment end string.
 * @param {string} singleLineStart - The single-line comment start string.
 * @param {string} singleLineEnd - The single-line comment end string.
 * @param {Map<string, string>} placeholderMap - A map to store placeholder values.
 * @returns {string} - The adjusted line.
 */
export function adjustLineLength(line: string, baseLength: number, separator: string, multiLineStart: string, multiLineEnd: string, singleLineStart: string, singleLineEnd: string, placeholderMap: Map<string, string>): string {
    try {
        const hasMultiLineStart = line.includes(multiLineStart);
        const hasMultiLineEnd = line.includes(multiLineEnd);
        const hasSingleLineStart = line.includes(singleLineStart);
        const hasSingleLineEnd = line.includes(singleLineEnd);

        const content = line.replace('[fill]', '')
                            .replace('[spaceFill]', '')
                            .replace(multiLineStart, '')
                            .replace(multiLineEnd, '')
                            .replace(singleLineStart, '')
                            .replace(singleLineEnd, '')
                            .trim();
        const interpretedContent = interpretSpaces(content);
        const contentLength = calculateContentLength(interpretedContent, placeholderMap);

        const startLength = (hasMultiLineStart ? multiLineStart.length : 0) + (hasSingleLineStart && singleLineStart !== multiLineStart ? singleLineStart.length : 0);
        const endLength = (hasMultiLineEnd ? multiLineEnd.length : 0) + (hasSingleLineEnd && singleLineEnd !== multiLineEnd ? singleLineEnd.length : 0);

        const spacesBetweenParts = (startLength > 0 ? 1 : 0) + (endLength > 0 ? 1 : 0) + (contentLength > 0 ? 2 : 0);
        const fillLength = baseLength - contentLength - startLength - endLength - spacesBetweenParts;

        const start = `${hasMultiLineStart ? multiLineStart : ''}${hasSingleLineStart && singleLineStart !== multiLineStart ? singleLineStart : ''}`;
        const end = `${hasMultiLineEnd ? multiLineEnd : ''}${hasSingleLineEnd && singleLineEnd !== multiLineEnd ? singleLineEnd : ''}`;

        let result = '';

        if (line.includes('[fill]')) {
            const fill = separator.repeat(Math.floor(fillLength / 2));
            const extraSeparator = fillLength % 2 === 1 ? separator : '';
            result = `${start}${start ? ' ' : ''}${fill}${interpretedContent ? ` ${interpretedContent} ` : ''}${extraSeparator}${fill}${end ? ' ' : ''}${end}`;
        } else if (line.includes('[spaceFill]')) {
            const fill = ' '.repeat(Math.floor(fillLength / 2));
            const extraSpace = fillLength % 2 === 1 ? ' ' : '';
            result = `${start}${start ? ' ' : ''}${separator}${fill}${interpretedContent}${extraSpace}${fill}${separator}${end ? ' ' : ''}${end}`;
        } else {
            result = `${start}${interpretedContent}${end}`;
        }

        return result;
    } catch (error) {
        logger.error(`Error in adjustLineLength: ${(error as Error).message}`);
        return line;
    }
}

/**
 * Generates the comment pattern for a given language and pattern key.
 *
 * @param {string} language - The programming language.
 * @param {string} patternKey - The key for the comment pattern.
 * @param {string} pattern - The comment pattern template.
 * @returns {string} - The generated comment pattern.
 */
function generateCommentPattern(language: string, patternKey: string, pattern: string): string {
    try {
        const cacheKey = `${language}-${patternKey}`;
        if (patternCache.has(cacheKey)) {
            return patternCache.get(cacheKey) as string;
        }

        const commentStyle = commentStyles[language as keyof typeof commentStyles];
        let result = pattern;

        const singleLineStart = commentStyle.singleLine.start;
        const singleLineEnd = commentStyle.singleLine.end;
        const multiLineStart = commentStyle.multiLine && typeof commentStyle.multiLine === 'object' ? commentStyle.multiLine.start : '';
        const multiLineEnd = commentStyle.multiLine && typeof commentStyle.multiLine === 'object' ? commentStyle.multiLine.end : '';

        const placeholderMap = new Map<string, string>();
        const lines = result.split('\n');

        result = lines.map(line => {
            let hasSingleLineStart = line.includes('singleLineStart');
            let hasSingleLineEnd = line.includes('singleLineEnd');
            let hasMultiLineStart = line.includes('multiLineStart');
            let hasMultiLineEnd = line.includes('multiLineEnd');

            line = line.replace(/singleLineStart/g, singleLineStart);
            line = line.replace(/singleLineEnd/g, singleLineEnd);

            if (!commentStyle.multiLine) {
                line = line.replace(/multiLineStart/g, singleLineStart);
                line = line.replace(/multiLineEnd/g, singleLineEnd);

                if (hasMultiLineStart) hasSingleLineStart = true;
                if (hasMultiLineEnd) hasSingleLineEnd = true;

                if (line.trim() && !line.includes(singleLineStart)) {
                    line = `${singleLineStart} ${line}`;
                    hasSingleLineStart = true;
                } else if (line.includes(singleLineStart)) {
                    line = line.replace(singleLineStart, `${singleLineStart} `);
                }
            } else {
                line = line.replace(/multiLineStart/g, multiLineStart);
                line = line.replace(/multiLineEnd/g, multiLineEnd);

                if (multiLineStart === multiLineEnd) {
                    if (line.includes(multiLineStart)) {
                        line = line.replace(multiLineStart, `${multiLineStart} `);
                    }
                } else {
                    if (line.includes(multiLineStart) && !line.includes(multiLineEnd)) {
                        line = line.replace(multiLineStart, `${multiLineStart} `);
                    } else if (line.includes(multiLineStart) && line.includes(multiLineEnd)) {
                        line = line.replace(multiLineStart, `${multiLineStart} `).replace(multiLineEnd, ` ${multiLineEnd}`);
                    }
                }
            }

            return adjustLineLength(line, baseLength, separator, hasMultiLineStart ? multiLineStart : '', hasMultiLineEnd ? multiLineEnd : '', hasSingleLineStart ? singleLineStart : '', hasSingleLineEnd ? singleLineEnd : '', placeholderMap);
        }).join('\n');

        patternCache.set(cacheKey, result);
        logger.info(`Generated comment "${patternKey}" pattern for ${language}`);
        return result;
    } catch (error) {
        logger.error(`Error in generateCommentPattern: ${(error as Error).message}`);
        return pattern;
    }
}

function replacePlaceholders(commentPattern: string): string {
    const placeholderMap: { [key: string]: string } = {};

    const cp = commentPattern.replace(/\$\{(\d+)(?::(.*?))?\}/g, (match, p1, p2) => {
        if (placeholderMap[p1]) {
            return placeholderMap[p1];
        } else {
            const value = p2 || '';
            placeholderMap[p1] = value;
            return value;
        }
    });

    return `\`\`\`\n${cp}\n\`\`\``;
}

/**
 * Updates completion items based on the language.
 *
 * @param {string} language - The programming language.
 */
function updateCompletionItems(language: string) {
    try {
        completionItems = [];

        for (const patternKey in globalPatterns) {
            const pattern = globalPatterns[patternKey as keyof typeof globalPatterns];
            const commentPattern = generateCommentPattern(language, patternKey, pattern);
            const item = new vscode.CompletionItem(`comm::${patternKey}`, vscode.CompletionItemKind.Snippet);
            item.documentation = new vscode.MarkdownString(replacePlaceholders(commentPattern));
            item.insertText = new vscode.SnippetString(commentPattern);
            completionItems.push(item);
        }
    } catch (error) {
        logger.error(`Error in updateCompletionItems: ${(error as Error).message}`);
    }
}

/**
 * Registers completion provider for the active editor's language.
 *
 * @param {vscode.TextEditor} editor - The active text editor.
 */
function registerProviderForActiveEditor(editor: vscode.TextEditor) {
    try {
        const language = editor.document.languageId;

        if (registeredEditors.get(editor) === language) {
            return;
        }

        registeredEditors.set(editor, language);

        if (editor) {
            const language = editor.document.languageId as keyof typeof commentStyles;
            if (Object.keys(commentStyles).includes(language)) {
                logger.info(`Registering completion provider for language: ${language}`);
                updateCompletionItems(language);
                vscode.languages.registerCompletionItemProvider(
                    [{ language, scheme: 'file' }, { language, scheme: 'untitled' }],
                    {
                        provideCompletionItems() {
                            const uniqueCompletionItems = new Set<string>();
                            const deduplicatedItems: vscode.CompletionItem[] = [];
                            completionItems.forEach(item => {
                                if (!uniqueCompletionItems.has(item.label.toString())) {
                                    uniqueCompletionItems.add(item.label.toString());
                                    deduplicatedItems.push(item);
                                }
                            });
                            return deduplicatedItems;
                        }
                    },
                    ':'
                );
            } else {
                logger.warning(`Language not supported: ${language}`);
            }
        }
    } catch (error) {
        logger.error(`Error in registerProviderForActiveEditor: ${(error as Error).message}`);
    }
}

/**
 * Activates the extension by registering providers for active editors and listening for changes.
 *
 * @param {vscode.ExtensionContext} context - The extension context.
 */
export function activate(context: vscode.ExtensionContext) {
    try {
        if (vscode.window.activeTextEditor) {
            registerProviderForActiveEditor(vscode.window.activeTextEditor);
        }

        vscode.window.onDidChangeActiveTextEditor(editor => {
            if (editor) {
                registerProviderForActiveEditor(editor);
            }
        });

        vscode.workspace.onDidOpenTextDocument(document => {
            const editor = vscode.window.activeTextEditor;
            if (editor && editor.document === document) {
                registerProviderForActiveEditor(editor);
            }
        });

        vscode.workspace.onDidChangeTextDocument(event => {
            const editor = vscode.window.activeTextEditor;
            if (editor && editor.document === event.document) {
                registerProviderForActiveEditor(editor);
            }
        });

        vscode.workspace.onDidChangeConfiguration(event => {
            if (event.affectsConfiguration('commentToolkit')) {
                patternCache.clear();
                logger.info('Configuration changed, cache cleared.');
            }
        });

        context.subscriptions.push({
            dispose() {
                registeredEditors.clear();
            }
        });
    } catch (error) {
        logger.error(`Error in activate: ${(error as Error).message}`);
    }
}

/**
 * Cleans up resources when the extension is deactivated.
 */
export function deactivate() {
    try {
        registeredEditors.clear();
    } catch (error) {
        logger.error(`Error in deactivate: ${(error as Error).message}`);
    }
}

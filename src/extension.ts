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
 * - Registers a single completion item provider for all supported languages to offer comment pattern suggestions.
 * - Dynamically loads and caches generated comment patterns to avoid redundant computations.
 * - Logs messages with different log levels (info, warning, error) for better debugging and monitoring.
 *
 * Main Components:
 * - `commentStyles`: Defines the comment styles for supported languages.
 * - `globalPatterns`: Contains the predefined comment patterns.
 * - `interpretSpaces`: Replaces placeholders with spaces in the comment patterns.
 * - `calculateContentLength`: Calculates the length of content after replacing placeholders.
 * - `adjustLineLength`: Adjusts the length of a line based on the base length and separators.
 * - `generateCommentPattern`: Generates the comment pattern for a given language and pattern key, with caching.
 * - `getCompletionItems`: Dynamically loads and returns completion items for a given language.
 * - `activate`: Registers a single completion item provider for all supported languages and listens for changes.
 * - `deactivate`: Cleans up resources when the extension is deactivated.
 * - `logger`: Provides logging functionality with different log levels (info, warning, error).
 */

import * as vscode from 'vscode';
import { logger } from './logger';
import Parser from 'tree-sitter';
import HTML from 'tree-sitter-html';
import { debounce } from 'lodash';

/**
*
* Imports and Initialization
*
*/

// Initialize a parser instance for Tree-sitter
let htmlParser: Parser | null = null;

// Global map to store completion items by language
const completionItemsMap: { [key: string]: vscode.CompletionItem[] } = {};
const patternCache = new Map<string, string>();

/**
 * Retrieves the configuration settings for the comment toolkit extension.
 *
 * @returns An object containing the following properties:
 * - `baseLength` (number): The base length for comments, defaulting to 40 if not set.
 * - `separator` (string): The character used as a separator in comments, defaulting to '=' if not set.
 */
function getConfiguration() {
    const config = vscode.workspace.getConfiguration('commentToolkit');
    let baseLength = config.get<number>('baseLength', 40);
    const separator = config.get<string>('separator', '=');

    // Validate baseLength
    /* if (typeof baseLength !== 'number' || baseLength <= 0) {
        log('warn', `Invalid baseLength: ${baseLength}. Using default value.`);
        baseLength = 40;
    } */

    log('info', `Configuration: baseLength=${baseLength}, separator=${separator}`);

    return {
        baseLength,
        separator
    };
}

let { baseLength, separator } = getConfiguration();

/**
*
* Comment Styles and Patterns
*
*/

const commentStyles = {
    "abap": { singleLine: { start: "*", end: "" }, multiLine: { start: "/*", end: "*/" } },
    "ahk": { singleLine: { start: ";", end: "" }, multiLine: { start: "/*", end: "*/" } },
    "ahk2": { singleLine: { start: ";", end: "" }, multiLine: { start: "/*", end: "*/" } },
    "bat": { singleLine: { start: "REM", end: "" }, multiLine: false },
    "bibtex": { singleLine: { start: "%", end: "" }, multiLine: false },
    "clojure": { singleLine: { start: ";;", end: "" }, multiLine: false },
    "coffeescript": { singleLine: { start: "#", end: "" }, multiLine: { start: "###", end: "###" } },
    "c": { singleLine: { start: "//", end: "" }, multiLine: { start: "/*", end: "*/" } },
    "cpp": { singleLine: { start: "//", end: "" }, multiLine: { start: "/*", end: "*/" } },
    "csharp": { singleLine: { start: "//", end: "" }, multiLine: { start: "/*", end: "*/" } },
    "cuda-cpp": { singleLine: { start: "//", end: "" }, multiLine: { start: "/*", end: "*/" } },
    "css": { singleLine: { start: "/*", end: "*/" }, multiLine: { start: "/*", end: "*/" } },
    "dart": { singleLine: { start: "//", end: "" }, multiLine: { start: "/*", end: "*/" } },
    "diff": { singleLine: { start: "#", end: "" }, multiLine: false },
    "dockerfile": { singleLine: { start: "#", end: "" }, multiLine: false },
    "fsharp": { singleLine: { start: "//", end: "" }, multiLine: { start: "(*", end: "*)" } },
    "git-commit": { singleLine: { start: "#", end: "" }, multiLine: false },
    "git-rebase": { singleLine: { start: "#", end: "" }, multiLine: false },
    "go": { singleLine: { start: "//", end: "" }, multiLine: { start: "/*", end: "*/" } },
    "groovy": { singleLine: { start: "//", end: "" }, multiLine: { start: "/*", end: "*/" } },
    "handlebars": { singleLine: { start: "{{!--", end: "--}}" }, multiLine: { start: "{{!--", end: "--}}" } },
    "html": { singleLine: { start: "<!--", end: "-->" }, multiLine: { start: "<!--", end: "-->" } },
    "hlsl": { singleLine: { start: "//", end: "" }, multiLine: { start: "/*", end: "*/" } },
    "ignore": { singleLine: { start: "#", end: "" }, multiLine: false },
    "ini": { singleLine: { start: ";", end: "" }, multiLine: false },
    "java": { singleLine: { start: "//", end: "" }, multiLine: { start: "/*", end: "*/" } },
    "javascript": { singleLine: { start: "//", end: "" }, multiLine: { start: "/*", end: "*/" } },
    "javascriptreact": { singleLine: { start: "{/*", end: "*/}" }, multiLine: { start: "{/*", end: "*/}" } },
    "json": { singleLine: { start: "//", end: "" }, multiLine: { start: "/*", end: "*/" } },
    "jsonc": { singleLine: { start: "//", end: "" }, multiLine: { start: "/*", end: "*/" } },
    "julia": { singleLine: { start: "#", end: "" }, multiLine: { start: "#=", end: "=#" } },
    "juliamarkdown": { singleLine: { start: "<!--", end: "-->" }, multiLine: { start: "<!--", end: "-->" } },
    "latex": { singleLine: { start: "%", end: "" }, multiLine: false },
    "less": { singleLine: { start: "//", end: "" }, multiLine: { start: "/*", end: "*/" } },
    "log": { singleLine: { start: "#", end: "" }, multiLine: false },
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
    "raku": { singleLine: { start: "#", end: "" }, multiLine: { start: "#=", end: "=#" } }
,    "razor": { singleLine: { start: "@*", end: "*@" }, multiLine: { start: "@*", end: "*@" } },
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
    "twig": { singleLine: { start: "{#", end: "#}" }, multiLine: { start: "{#", end: "#}" } },
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

/**
*
* Utility Functions
*
*/

/**
 * Logs a message at the specified log level.
 *
 * @param level - The level of the log message. Can be 'info', 'warn', or 'error'.
 * @param message - The message to log.
 */
function log(level: 'info' | 'warn' | 'error', message: string) {
    logger[level](message);
    // console.log(`[${level.toUpperCase()}] ${message}`);
}

/**
 * Retrieves the HTML parser instance.
 *
 * @returns The HTML parser instance.
 */
function getHtmlParser() {
    if (!htmlParser) {
        htmlParser = new Parser();
        htmlParser.setLanguage(HTML);
    }
    return htmlParser;
}

/**
*
* Language Detection and Registration
*
*/

/**
 * Determines if the cursor is inside PHP code within a mixed PHP/HTML document.
 *
 * @param text - The text content of the document.
 * @param position - The current cursor position.
 * @returns True if the cursor is inside PHP code, false otherwise.
 */
function isInsidePHP(text: string, position: vscode.Position): boolean {
    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) {
        return false; // Handle the case when there is no active editor
    }
    const offset = activeEditor.document.offsetAt(position);

    // Check for the last opening PHP tag before the cursor
    const openPHPIndex = Math.max(text.lastIndexOf('<?php', offset), text.lastIndexOf('<?', offset));

    // No PHP tag before cursor, definitely not inside PHP
    if (openPHPIndex === -1) {
        return false;
    }

    // Check for the first closing PHP tag after the cursor
    const closePHPIndex = text.indexOf('?>', offset);

    // If there's no closing tag after the cursor, we are inside an open-ended PHP block
    if (closePHPIndex === -1) {
        return true;
    }

    // Return true only if the cursor is between an opening and a closing PHP tag
    return openPHPIndex < offset && offset < closePHPIndex;
}


/**
 * Determines the programming language based on the provided syntax node.
 *
 * @param node - The syntax node from which to determine the language.
 * @returns The language as a string. Defaults to 'html' if no valid node is provided or if no script/style tags are found.
 *
 * The function checks the type of the node and its parents recursively:
 * - Returns 'javascript' if the node type is 'script_element' or 'script'.
 * - Returns 'css' if the node type is 'style_element' or 'style'.
 * - Recursively checks the parent node if the current node type does not match the above conditions.
 * - Defaults to 'html' if no matching node type is found.
 */
function findLanguageFromNode(node: Parser.SyntaxNode): string {
    if (!node) return 'html'; // Default to 'html' if no valid node

    // Check for 'script' node type or parent
    if (node.type === 'script_element' || node.type === 'script') {
        return 'javascript';
    }
    if (node.type === 'style_element' || node.type === 'style') {
        return 'css';
    }

    if (node.parent) {
        return findLanguageFromNode(node.parent); // Recursively move up to parent
    }

    return 'html';  // Default to 'html' if no script/style tags are found
}


/**
 * Detects the programming language at a given position within a text document.
 *
 * @param text - The content of the text document.
 * @param position - The position within the text document to check.
 * @returns The detected programming language as a string. Defaults to 'html' if no editor is found.
 */
function detectLanguageAtPosition(text: string, position: vscode.Position) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return 'html';  // Default to 'html' if no editor is found
    }
    // Check if the cursor is inside PHP tags
    if (isInsidePHP(text, position)) {
        return 'php';
    }

    // Parse the document using the HTML parser
    const tree = getHtmlParser().parse(text);
    const node = tree.rootNode.descendantForPosition({ row: position.line, column: position.character });

    const detectedLanguage = findLanguageFromNode(node);

    return detectedLanguage;
}

/**
*
* Comment Pattern Generation and Adjustment
*
*/

/**
 * Replaces custom space markers in the given content string with actual spaces.
 *
 * The function looks for two types of markers:
 * - `[s:n]` where `n` is a number, and replaces it with `n` spaces.
 * - `[s]` and replaces it with a single space.
 *
 * @param content - The string containing custom space markers to be interpreted.
 * @returns The content string with custom space markers replaced by actual spaces.
 *
 * @throws Will log an error message if an exception occurs during the replacement process.
 */
function interpretSpaces(content: string): string {
    try {
        return content.replace(/\[s:(\d+)\]/g, (match, p1) => ' '.repeat(parseInt(p1, 10)))
                      .replace(/\[s\]/g, ' ');
    } catch (error) {
        log('error', `Error in interpretSpaces: ${(error as Error).message}`);
        return content;
    }
}

/**
 * Calculates the length of the content after interpreting placeholders and spaces.
 *
 * This function processes the given content string by interpreting spaces and replacing
 * placeholders with their corresponding values from the placeholder map. If a placeholder
 * has a value provided within the content string, it updates the placeholder map with this value.
 *
 * @param content - The content string containing placeholders to be interpreted.
 * @param placeholderMap - A map where keys are placeholder identifiers and values are the corresponding replacement strings.
 * @returns The length of the content after placeholders have been replaced and spaces interpreted.
 *
 * @throws Will log an error and return the original content length if an error occurs during processing.
 */
function calculateContentLength(content: string, placeholderMap: Map<string, string>): number {
    try {
        const interpretedContent = interpretSpaces(content);
        return interpretedContent.replace(/\$\{(\d+)(?::(.*?))?\}/g, (match, p1, p2) => {
            if (p2) {
                placeholderMap.set(p1, p2);
                return p2;
            } else {
                return placeholderMap.get(p1) ?? '';
            }
        }).length;
    } catch (error) {
        log('error', `Error in calculateContentLength: ${(error as Error).message}`);
        return content.length;
    }
}

/**
 * Adjusts the length of a given line to match a specified base length by adding separators or spaces.
 *
 * @param line - The input string to be adjusted.
 * @param baseLength - The desired length of the output string.
 * @param separator - The character used to fill the space when adjusting the length.
 * @param multiLineStart - The string indicating the start of a multi-line comment.
 * @param multiLineEnd - The string indicating the end of a multi-line comment.
 * @param singleLineStart - The string indicating the start of a single-line comment.
 * @param singleLineEnd - The string indicating the end of a single-line comment.
 * @param placeholderMap - A map of placeholders and their corresponding values.
 * @returns The adjusted string with the specified length.
 *
 * @throws Will log an error message if an error occurs during the adjustment process.
 */
function adjustLineLength(line: string, baseLength: number, separator: string, multiLineStart: string, multiLineEnd: string, singleLineStart: string, singleLineEnd: string, placeholderMap: Map<string, string>): string {
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
        const minimumLength = contentLength + startLength + endLength + spacesBetweenParts;

        // Ensure baseLength is not less than the minimum required length
        const adjustedBaseLength = Math.max(baseLength, minimumLength);
        const fillLength = adjustedBaseLength - contentLength - startLength - endLength - spacesBetweenParts;

        const start = `${hasMultiLineStart ? multiLineStart : ''}${hasSingleLineStart && singleLineStart !== multiLineStart ? singleLineStart : ''}`;
        const end = `${hasMultiLineEnd ? multiLineEnd : ''}${hasSingleLineEnd && singleLineEnd !== multiLineEnd ? singleLineEnd : ''}`;

        let result = '';

        if (line.includes('[fill]')) {
            const fill = separator.repeat(Math.floor(fillLength / 2));
            const extraSeparator = fillLength % 2 === 1 ? separator : '';
            const startPart = `${start}${start ? ' ' : ''}`;
            const contentPart = interpretedContent ? ` ${interpretedContent} ` : '';
            const endPart = `${end ? ' ' : ''}${end}`;
            result = `${startPart}${fill}${contentPart}${extraSeparator}${fill}${endPart}`;
        } else if (line.includes('[spaceFill]')) {
            const fill = ' '.repeat(Math.floor(fillLength / 2));
            const extraSpace = fillLength % 2 === 1 ? ' ' : '';
            result = `${start}${start ? ' ' : ''}${separator}${fill}${interpretedContent}${extraSpace}${fill}${separator}${end ? ' ' : ''}${end}`;
        } else {
            result = `${start}${interpretedContent}${end}`;
        }

        return result;
    } catch (error) {
        log('error', `Error in adjustLineLength: ${(error as Error).message}`);
        return line;
    }
}



/**
 * Generates a comment pattern for a given programming language.
 *
 * This function takes a language, a pattern key, and a pattern string, and returns
 * a formatted comment pattern based on the comment styles defined for the language.
 * It caches the generated patterns to avoid redundant computations.
 *
 * @param {string} language - The programming language for which the comment pattern is generated.
 * @param {string} patternKey - A unique key identifying the pattern.
 * @param {string} pattern - The pattern string that needs to be formatted.
 * @returns {string} - The formatted comment pattern.
 *
 * @throws {Error} - Throws an error if there is an issue generating the comment pattern.
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
                } else if (line.includes(multiLineStart)) {
                    if (!line.includes(multiLineEnd)) {
                        line = line.replace(multiLineStart, `${multiLineStart} `);
                    } else {
                        line = line.replace(multiLineStart, `${multiLineStart} `).replace(multiLineEnd, ` ${multiLineEnd}`);
                    }
                }
            }

            return adjustLineLength(line, baseLength, separator, hasMultiLineStart ? multiLineStart : '', hasMultiLineEnd ? multiLineEnd : '', hasSingleLineStart ? singleLineStart : '', hasSingleLineEnd ? singleLineEnd : '', placeholderMap);
        }).join('\n');

        patternCache.set(cacheKey, result);

        return result;
    } catch (error) {
        log('error', `Error in generateCommentPattern: ${(error as Error).message}`);
        return pattern;
    }
}

/**
 * Replaces placeholders in the given comment pattern with corresponding values.
 *
 * The placeholders in the comment pattern should be in the format `${number:optionalDefaultValue}`.
 * If a placeholder with the same number appears multiple times, it will be replaced with the same value.
 * If a default value is provided, it will be used as the replacement value.
 *
 * @param commentPattern - The comment pattern containing placeholders to be replaced.
 * @returns A string with the placeholders replaced by their corresponding values, wrapped in code block syntax.
 */
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
*
* Completion Items
*
*/


/**
 * Generates and retrieves completion items for a given document and position.
 *
 * This function determines the language of the document and generates completion items
 * based on predefined patterns. If the language is 'html' or 'php', it detects the language
 * at the specified position. It then checks if completion items for the language are already
 * cached in `completionItemsMap`. If so, it returns the cached items. Otherwise, it generates
 * new completion items, caches them, and returns the new items.
 *
 * @param document - The text document in which completion is requested.
 * @param position - The position at which completion is requested.
 * @returns An array of `vscode.CompletionItem` objects for the specified document and position.
 * @throws Will log an error message if an error occurs during the generation of completion items.
 */
function getCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
    try {
        let language = document.languageId;

        if (document.languageId === 'html' || document.languageId === 'php' || document.languageId === 'vue') {
            language = detectLanguageAtPosition(document.getText(), position);
        }

        log('info', `Detected language: ${language}`);

        // if completionItemsMap has the language, return it
        if (completionItemsMap[language]) {
            log('info', `Returning cached completion items for ${language}`);
            return completionItemsMap[language];
        }

        // Generate completion items
        let newCompletionItems = [];

        for (const patternKey in globalPatterns) {
            const pattern = globalPatterns[patternKey as keyof typeof globalPatterns];
            const commentPattern = generateCommentPattern(language, patternKey, pattern);
            const item = new vscode.CompletionItem(`comm::${patternKey}`, vscode.CompletionItemKind.Snippet);
            item.documentation = new vscode.MarkdownString(replacePlaceholders(commentPattern));
            item.insertText = new vscode.SnippetString(commentPattern);
            newCompletionItems.push(item);
        }

        log('info', `*** Generated comment patterns for ${language} ***`);

        completionItemsMap[language] = newCompletionItems;

        return newCompletionItems;
    } catch (error) {
        log('error', `Error in getCompletionItems: ${(error as Error).message}`);
    }
}

/**
*
* Activation and Deactivation
*
*/

/**
 * Activates the extension.
 *
 * @param context - The context in which the extension is activated.
 *
 * This function performs the following tasks:
 * - Registers a single provider for all languages issued from `commentStyles`.
 * - Extracts all language keys from `commentStyles` and registers completion item providers for both 'file' and 'untitled' schemes.
 * - Debounces the configuration change handler to clear the pattern cache and log the change.
 * - Handles configuration changes by checking if they affect the 'commentToolkit' configuration and invoking the debounced handler.
 * - Registers context subscriptions to clear the pattern cache when disposed.
 *
 * If an error occurs during activation, it logs the error message.
 */
export function activate(context: vscode.ExtensionContext) {
    try {
        // Register a single provider for all languages issued from commentStyles

        // Extract all language keys from commentStyles
        const languages = Object.keys(commentStyles).map(language => ({ language, scheme: 'file' })).concat(
            Object.keys(commentStyles).map(language => ({ language, scheme: 'untitled' }))
        );

        vscode.languages.registerCompletionItemProvider(
            languages,
            {
                provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
                    // Vérifier si l'utilisateur a tapé "comm" ou "comm::"
                    const lineText = document.lineAt(position).text;
                    const textBeforeCursor = lineText.substring(0, position.character);

                    // Ne proposer nos suggestions que si l'utilisateur tape explicitement "comm"
                    // Cela évite d'interférer avec les suggestions de mots natives
                    const wordRange = document.getWordRangeAtPosition(position);
                    const currentWord = wordRange ? document.getText(wordRange) : '';

                    // Déclencher seulement si on tape "comm" au début d'un mot ou après "comm::"
                    if (!currentWord.startsWith('comm') && !textBeforeCursor.includes('comm::')) {
                        return undefined; // Laisser les autres providers gérer (suggestions de mots natives, etc.)
                    }

                    const items = getCompletionItems(document, position);
                    // Retourner une CompletionList avec isIncomplete=false pour indiquer que
                    // d'autres providers peuvent aussi fournir des suggestions
                    return new vscode.CompletionList(items || [], false);
                }
            },
            'comm'
        );

        // Debounce configuration change handler
        const handleConfigurationChange = debounce(() => {
            Object.keys(completionItemsMap).forEach(key => delete completionItemsMap[key]);
            patternCache.clear();
            const config = getConfiguration();
            baseLength = config.baseLength;
            separator = config.separator;
            log('info', 'Configuration changed, cache cleared.');
            log('info', `Configuration updated: baseLength=${baseLength}, separator=${separator}`);
        }, 1000);

        // Handle configuration changes
        vscode.workspace.onDidChangeConfiguration(event => {
            if (event.affectsConfiguration('commentToolkit')) {
                handleConfigurationChange();
            }
        });

        // Register context subscriptions
        context.subscriptions.push({
            dispose() {
                // Clear registered editors
                Object.keys(completionItemsMap).forEach(key => delete completionItemsMap[key]);
                patternCache.clear();
            }
        });

        const packageJson = require('../package.json');
        const currentVersion = packageJson.version;
        const previousVersion = context.globalState.get<string>('extensionVersion');

        if (currentVersion !== previousVersion) {
            const changelogUrl = 'https://github.com/migliori/vsc-comments-toolkit/blob/master/CHANGELOG.md';
            vscode.window.showInformationMessage(
                `New version ${currentVersion} of the Comments Toolkit extension is now available!`,
                'View Changelog'
            ).then(selection => {
                if (selection === 'View Changelog') {
                    vscode.env.openExternal(vscode.Uri.parse(changelogUrl));
                }
            });
            context.globalState.update('extensionVersion', currentVersion);
        }
    } catch (error) {
        log('error', `Error in activate: ${(error as Error).message}`);
    }
}

/**
 * Deactivates the extension by clearing registered editors.
 *
 * This function attempts to clear the `patternCache` to ensure that
 * all registered editors are properly disposed of. If an error occurs
 * during this process, it logs the error message.
 *
 * @throws Will log an error message if an exception occurs during deactivation.
 */
export function deactivate() {
    try {
        // Clear registered editors
        Object.keys(completionItemsMap).forEach(key => delete completionItemsMap[key]);
        patternCache.clear();
    } catch (error) {
        log('error', `Error in deactivate: ${(error as Error).message}`);
    }
}

// Conditionally export for testing
if (process.env.NODE_ENV === 'test') {
    module.exports = {
        completionItemsMap,
        patternCache,
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
        deactivate
        // Add other functions to export for testing
    };
} else {
    module.exports = {
        getConfiguration,
        getHtmlParser,
        activate,
        deactivate
        // Only export public functions
    };
}

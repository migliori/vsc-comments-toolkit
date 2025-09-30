# Change Log

All notable changes to the "comments-toolkit" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## v1.0.0

- Initial release

## v1.0.1

- Add subsections comments
- add Typescript support
- loop png preview

## v1.0.2

- Add C# and vuejs

## v1.1.0

- Refactored the extension to improve maintainability and readability.
- Added detailed documentation for the extension's features and main components.
- Defined `commentStyles` for various programming languages.
- Defined `globalPatterns` for different comment patterns.
- Introduced functions like `interpretSpaces`, `calculateContentLength`, and `adjustLineLength`.
- Enhanced the `activate` function to handle more functionalities and register providers more comprehensively.
- Improved caching mechanism for generated comment patterns.
- Added logging functionality with different log levels (info, warning, error).

## v1.2.0

- Added support for additional programming languages in `commentStyles`.
- Introduced `getConfiguration` function to retrieve extension settings.
- Enhanced `globalPatterns` with new comment patterns.
- Improved `log` function for better logging.
- Added `getHtmlParser` function to retrieve HTML parser instance.
- Implemented `isInsidePHP` function to detect PHP code within mixed PHP/HTML documents.
- Added `findLanguageFromNode` function to determine language from syntax node.
- Enhanced `detectLanguageAtPosition` function for better language detection.
- Improved `interpretSpaces` function to handle custom space markers.
- Enhanced `calculateContentLength` function to process placeholders and spaces.

## v1.2.1

- add AutoHotkey support

## v1.2.2

- **Fixed IntelliSense interference**: Improved completion provider to preserve native word suggestions
- **Enhanced provider logic**: Completion items now only trigger when explicitly typing "comm" to avoid interfering with default IntelliSense
- **Better coexistence**: Extension now uses `CompletionList` instead of array to allow multiple providers to work together

## v1.2.3

- **Optimized package size**: Improved `.vscodeignore` to exclude unnecessary files
- **Performance improvement**: Reduced extension size
- **Faster installation**: Extension now packages and installs much faster

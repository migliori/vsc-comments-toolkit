# Comments Toolkit

![Comments Toolkit Logo](comments-toolkit-logo.png)

Comments Toolkit provides comments auto-completions (snippets) for various programming languages. It supports both single-line and multi-line comments and allows users to insert predefined comment patterns using completion items.

![Comments Toolkit Completions Preview](vsc-comment-toolkit.gif)

## Features

- Supports multiple programming languages with their respective comment styles.
- Provides predefined comment patterns such as sections, subsections, simple comments, blocks, and TODOs.
- Automatically adjusts the length of comment lines to maintain a consistent format.
- Registers completion item providers for active editors to offer comment pattern suggestions.
- Caches generated comment patterns to avoid redundant computations.
- Logs messages with different log levels (info, warning, error) for better debugging and monitoring.
- **new in 1.2.0** Detects the active language at the cursor position and provides relevant comment completions.

## Configuration

To customize the behavior of the Comments Toolkit extension, you can modify the following settings in your Visual Studio Code settings:

1. **Base Length**: Defines the base length for comments. The default value is 40.
2. **Separator**: Specifies the character used as a separator in comments. The default value is '='.

**To change these settings, follow these steps:**

1. Open the Command Palette (`Ctrl+Shift+P` on Windows).
2. Type `Preferences: Open Settings` and select it.
3. In the Settings UI, search for `commentToolkit`.
4. Modify the settings such as `Base Length` and `Separator` as needed.

## Usage

Start typing "*comm:*", and the auto-complete list will appear with available comment patterns.

## File types & Languages

The completions are currently available for the following languages and file types:

- ABAP
- Batch
- BibTeX
- Clojure
- CoffeeScript
- C
- C++
- C#
- CUDA C++
- CSS
- Dart
- Diff
- Dockerfile
- F#
- Git Commit
- Git Rebase
- Go
- Groovy
- Handlebars
- HTML
- HLSL
- Ignore
- INI
- Java
- JavaScript
- JavaScript React
- JSON
- JSON with Comments (JSONC)
- Julia
- Julia Markdown
- LaTeX
- Less
- Log
- Lua
- Makefile
- Markdown
- Objective-C
- Objective-C++
- Perl
- Perl 6
- PHP
- Plain Text
- PowerShell
- Pug (Jade)
- Python
- R
- Raku
- Razor
- Ruby
- Rust
- SCSS
- Sass
- ShaderLab
- Shell Script
- SQL
- Swift
- TypeScript
- TypeScript React
- TeX
- Twig
- Visual Basic
- XML
- XSL
- YAML

If you want to add other languages or file types, please [open an issue](https://github.com/migliori/vsc-comments-toolkit/issues).

## More

### --- Curious to discover high-quality tools for web developers? ---

- PHP CRUD Generator - Create outstanding [PHP CRUD Admin Dashboard](https://www.phpcrudgenerator.com)
- PHP Form Builder - The very best [PHP Form Generator](https://www.phpformbuilder.pro)

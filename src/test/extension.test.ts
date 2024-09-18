//
// Note: This example test is leveraging the Mocha test framework.
// Please refer to their documentation on https://mochajs.org/ for help.
//

// The module 'assert' provides assertion methods from node
import * as assert from 'assert';
import { interpretSpaces, calculateContentLength, adjustLineLength } from '../extension';

suite("interpretSpaces Tests", function () {
    test("should replace [s] with a single space", function () {
        const result = interpretSpaces("Hello[s]World");
        assert.equal(result, "Hello World");
    });

    test("should replace [s:4] with four spaces", function () {
        const result = interpretSpaces("Hello[s:4]World");
        assert.equal(result, "Hello    World");
    });

    test("should handle multiple placeholders", function () {
        const result = interpretSpaces("Hello[s]World[s:2]!");
        assert.equal(result, "Hello World  !");
    });

    test("should return the same string if no placeholders", function () {
        const result = interpretSpaces("Hello World!");
        assert.equal(result, "Hello World!");
    });
});

suite("calculateContentLength Tests", function () {
    test("should calculate length without placeholders", function () {
        const placeholderMap = new Map<string, string>();
        const result = calculateContentLength("Hello World", placeholderMap);
        assert.equal(result, 11);
    });

    test("should calculate length with placeholders", function () {
        const placeholderMap = new Map<string, string>();
        const result = calculateContentLength("Hello ${1:World}", placeholderMap);
        assert.equal(result, 11);
        assert.equal(placeholderMap.get("1"), "World");
    });

    test("should handle multiple placeholders", function () {
        const placeholderMap = new Map<string, string>();
        const result = calculateContentLength("Hello ${1:World} ${2:!}", placeholderMap);
        assert.equal(result, 13);
        assert.equal(placeholderMap.get("1"), "World");
        assert.equal(placeholderMap.get("2"), "!");
    });

    test("should handle empty placeholders", function () {
        const placeholderMap = new Map<string, string>();
        calculateContentLength("Hello ${1:World} ${2:!}", placeholderMap);
        const result2 = calculateContentLength("Hello ${1} !", placeholderMap);
        assert.equal(result2, 13);
        assert.equal(placeholderMap.get("1"), "World");
    });
});

suite("adjustLineLength Tests", function () {
    const baseLength = 40;
    const separator = "=";
    const multiLineStart = "/*";
    const multiLineEnd = "*/";
    const singleLineStart = "//";
    const singleLineEnd = "";

    test("should adjust line length with [fill]", function () {
        const placeholderMap = new Map<string, string>();
        const result = adjustLineLength("[fill]Hello World", baseLength, separator, multiLineStart, multiLineEnd, singleLineStart, singleLineEnd, placeholderMap);
        assert.equal(result.length, baseLength);
    });

    test("should adjust line length with [spaceFill]", function () {
        const placeholderMap = new Map<string, string>();
        const result = adjustLineLength("[spaceFill]Hello World", baseLength, separator, multiLineStart, multiLineEnd, singleLineStart, singleLineEnd, placeholderMap);
        assert.equal(result.length, baseLength);
    });

    test("should handle multi-line comments", function () {
        const placeholderMap = new Map<string, string>();
        const result = adjustLineLength("/*[fill]Hello World*/", baseLength, separator, multiLineStart, multiLineEnd, singleLineStart, singleLineEnd, placeholderMap);
        assert.equal(result.length, baseLength);
    });

    test("should handle single-line comments", function () {
        const placeholderMap = new Map<string, string>();
        const result = adjustLineLength("//[fill]Hello World", baseLength, separator, multiLineStart, multiLineEnd, singleLineStart, singleLineEnd, placeholderMap);
        assert.equal(result.length, baseLength);
    });
});

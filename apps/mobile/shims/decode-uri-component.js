'use strict';
/**
 * decode-uri-component for the app bundle (security review L6, gap G-22).
 *
 * expo-router > query-string 7 requires decode-uri-component 0.2.2, whose
 * fallback for malformed input re-splits and re-joins the string in a loop
 * that grows exponentially (GHSA-vcc3-ghjq-m6fr, fixed in 0.5.0). A crafted
 * link with many bad percent escapes would hang the app. 0.5.0 is ESM-only,
 * so an npm override breaks query-string's require(); metro.config.js
 * resolves `decode-uri-component` to this file instead, on every platform.
 *
 * Same contract as 0.2.2 (CommonJS default export, `+` read as a space,
 * TypeError for a non-string), with 0.5.0's left-to-right O(n) fallback.
 * Valid input decodes exactly as before; only malformed input can differ,
 * and then it is left literal instead of guessed. Tested in
 * test/decode-uri-component-shim.test.ts.
 *
 * The decoding below is adapted from decode-uri-component 0.5.0,
 * MIT License, Copyright (c) 2017, Sam Verschueren
 * <sam.verschueren@gmail.com> (github.com/SamVerschueren).
 */

var token = '%[a-f0-9]{2}';
var hexPair = /^[a-f\d]{2}$/i;

/** A `%XX` sequence at `position`: its byte value and where to continue. */
function parsePercentByte(input, position) {
  if (input.charCodeAt(position) !== 37 || position + 3 > input.length) {
    return null;
  }
  var digits = input.slice(position + 1, position + 3);
  if (!hexPair.test(digits)) {
    return null;
  }
  return { byte: parseInt(digits, 16), next: position + 3 };
}

/** Bytes a UTF-8 code point needs, from its lead byte; 0 for continuation and invalid bytes. */
function utf8SequenceLength(byte) {
  if (byte <= 0x7f) return 1;
  if (byte >= 0xc2 && byte <= 0xdf) return 2;
  if (byte >= 0xe0 && byte <= 0xef) return 3;
  if (byte >= 0xf0 && byte <= 0xf4) return 4;
  return 0;
}

function isContinuationByte(byte) {
  return byte >= 0x80 && byte <= 0xbf;
}

/** Decodes as much of `input` as possible without throwing, in one left-to-right pass. */
function decode(input) {
  try {
    return decodeURIComponent(input);
  } catch (err) {
    var output = '';
    var position = 0;
    while (position < input.length) {
      if (input.charCodeAt(position) !== 37) {
        output += input.charAt(position);
        position++;
        continue;
      }
      var first = parsePercentByte(input, position);
      if (!first) {
        output += input.charAt(position);
        position++;
        continue;
      }
      var length = utf8SequenceLength(first.byte);
      if (length === 0) {
        output += input.slice(position, position + 3);
        position += 3;
        continue;
      }
      var end = first.next;
      var valid = true;
      for (var i = 1; i < length; i++) {
        var next = parsePercentByte(input, end);
        if (!next || !isContinuationByte(next.byte)) {
          valid = false;
          break;
        }
        end = next.next;
      }
      if (valid) {
        try {
          output += decodeURIComponent(input.slice(position, end));
          position = end;
          continue;
        } catch (err2) {
          // Right shape, invalid UTF-8: keep the first byte literal.
        }
      }
      output += input.slice(position, position + 3);
      position += 3;
    }
    return output;
  }
}

function customDecodeURIComponent(input) {
  // The byte order marks, as 0.2.2 and 0.5.0 both map them.
  var replaceMap = {
    '%FE%FF': '\uFFFD\uFFFD',
    '%FF%FE': '\uFFFD\uFFFD',
  };
  var multiMatcher = new RegExp('(' + token + ')+', 'gi');
  var match = multiMatcher.exec(input);
  while (match) {
    try {
      replaceMap[match[0]] = decodeURIComponent(match[0]);
    } catch (err) {
      var result = decode(match[0]);
      if (result !== match[0]) {
        replaceMap[match[0]] = result;
      }
    }
    match = multiMatcher.exec(input);
  }
  // Last, so it never splits a sequence that starts with %C2.
  replaceMap['%C2'] = '\uFFFD';
  var keys = Object.keys(replaceMap);
  for (var k = 0; k < keys.length; k++) {
    input = input.replace(new RegExp(keys[k], 'g'), replaceMap[keys[k]]);
  }
  return input;
}

module.exports = function decodeUriComponent(encodedURI) {
  if (typeof encodedURI !== 'string') {
    throw new TypeError('Expected `encodedURI` to be of type `string`, got `' + typeof encodedURI + '`');
  }
  try {
    // 0.2.2 reads `+` as a space; query-string 7 relies on that, so it stays.
    encodedURI = encodedURI.replace(/\+/g, ' ');
    return decodeURIComponent(encodedURI);
  } catch (err) {
    return customDecodeURIComponent(encodedURI);
  }
};

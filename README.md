# `Number.isSafeNumeric`

> For problem-statement, please look at https://github.com/Lxxyx/proposal-number-is-safe-numeric/issues/4

A TC39 proposal to add `Number.isSafeNumeric`.

A simple and reliable method to validate input is numeric string and represents a valid javascript number.

Key Benefits:

1. Ensure input is a valid numeric string, **reducing unexpected behaviors during parsing and subsequent operations**
2. Avoid string's mathematical value changes during string-number conversions **(developers may not aware of this)**
3. Reduce developer mental overhead

## Status

**Stage:** 0  
**Champion:** [ZiJian Liu](@lxxyx) / [YiLong Li](@umuoy1)  
**Authors:** [ZiJian Liu](@lxxyx) / [YiLong Li](@umuoy1)  
**Last Presented:** (unpresented)  
**Slides:**

- [2025.02](https://docs.google.com/presentation/d/1Noxi5L0jnikYce1h7X67FnjMUbkBQAcMDNafkM7bF4A/edit?usp=sharing)

## Motivation

In web development, validating strings that can be safely converted to JavaScript Numbers (float64) is a common requirement, particularly in scenarios like:

- API response parsing(falsy values(`null`, `undefined`, `''`), `Java.Long` overflow,  etc.)
- Form input validation(falsy values, whitespace, unexpected characters, etc.)
- Financial calculations(Mathematical value changes in conversion)
- Data processing(complex validation logic)

However, current solutions have significant limitations:

### 1. Inconsistent Built-in Parsing and Validation Methods

JavaScript's built-in methods (`Number()`, `parseInt()`, `parseFloat()`, `isFinite()`) have inconsistent behaviors:

- Difficult to choose which method to use
- Need handle edge cases manually, and it's hard to remember all of them

#### Built-in Parsing and Validation Methods

| Input String              | `Number()`            | `parseInt()`       | `parseFloat()`        | `isFinite()` | Issue                                    |
| ------------------------- | --------------------- | ------------------ | --------------------- | ------------ | ---------------------------------------- |
| `''`                      | `0`                   | `NaN`              | `NaN`                 | `true`       | Empty string handling inconsistent       |
| `' '`                     | `0`                   | `NaN`              | `NaN`                 | `true`       | Whitespace handling inconsistent         |
| `'123.45'`                | `123.45`              | `123`              | `123.45`              | `true`       | `parseInt` truncates decimals            |
| `'.123'`                  | `0.123`               | `NaN`              | `0.123`               | `true`       | Leading decimal point handling           |
| `'123.'`                  | `123`                 | `123`              | `123`                 | `true`       | Trailing decimal point silently accepted |
| `'00123'`                 | `123`                 | `123`              | `123`                 | `true`       | Leading zeros silently accepted          |
| `'1e5'`                   | `100000`              | `1`                | `100000`              | `true`       | Scientific notation handling varies      |
| `'0x123'`                 | `291`                 | `291`              | `0`                   | `true`       | Hex string handling inconsistent         |
| `'9007199254740993'`      | `9007199254740992`    | `9007199254740992` | `9007199254740992`    | `true`       | Exceeds MAX_SAFE_INTEGER                 |
| `'0.1234567890123456789'` | `0.12345678901234568` | `0`                | `0.12345678901234568` | `true`       | Mathematical value changes in conversion |
| `'Infinity'`              | `Infinity`            | `NaN`              | `Infinity`            | `false`      | Infinity handling inconsistent           |
| `'-Infinity'`             | `-Infinity`           | `NaN`              | `-Infinity`           | `false`      | Negative infinity handling inconsistent  |

### 2. Complex Custom Validation

Current validation approaches often require complex code or third-party libraries:

<details>
<summary>StackOverflow Example</summary>

> 3276 Votes, Link: [How can I check if a string is a valid number?](https://stackoverflow.com/questions/175739/how-can-i-check-if-a-string-is-a-valid-number)

```javascript
// Simple but unreliable
function isNumeric(str) {
  if (typeof str != 'string') return false // we only process strings!
  return !isNaN(str) && !isNaN(parseFloat(str))
}

isNumeric('0.1234567890123456789') // true, but mathematical value changes when converted to Number
```

</details>

<details>
<summary>Using npm libraries: `validator` and `is-number`</summary>

Using [validator](https://www.npmjs.com/package/validator)#isDecimal and [is-number](https://www.npmjs.com/package/is-number)#isNumber

```javascript
// Even popular libraries have limitations
const validator = require('validator')
console.log(validator.isDecimal('0.1234567890123456789')) // true, but mathematical value changes when converted to Number

const isNumber = require('is-number')
console.log(isNumber('0.1234567890123456789')) // true, but mathematical value changes when converted to Number
```

</details>

<details>
<summary>Complex Validation Example</summary>

```javascript
// Complex but still has edge cases
function isValidNumber(str) {
  // 1. Basic type checks
  if (typeof str !== 'string') return false
  if (str.trim() === '') return false

  // 2. Format checks
  const num = Number(str)
  if (Number.isNaN(num)) return false
  if (!Number.isFinite(num)) return false

  // 3. Range checks (often overlooked)
  if (num > Number.MAX_SAFE_INTEGER) return false
  if (num < Number.MIN_SAFE_INTEGER) return false

  // 4. Format consistency check (often overlooked)
  if (String(num) !== str) return false

  return true
}

// Even with such complex validation, edge cases slip through
isValidNumber('1e5') // true, but might not be desired format
isValidNumber('0x123') // true, accepts hexadecimal
isValidNumber('.123') // true, accepts non-standard decimal format
```

</details>

This complex validation approach has several drawbacks:

- Increases code complexity
- Prone to missing edge cases
- High maintenance cost
- Difficult to reuse across different projects

## The Solution

```javascript
Number.isSafeNumeric(input)
```

This method aims to provide a simple and reliable way to validate input numeric string can be safely converted to a JavaScript Number (using float64).

### Safety Definition

A input is considered "safe numeric string" if it meets ALL of the following criteria:

1. Format Rules:

   - Contains only ASCII digits (0-9) with optional single leading minus sign
   - Has at most one decimal point, must have digits on both sides (e.g. "0.1", not ".1" or "1.")
   - No leading zeros (except for decimal numbers < 1)
   - No whitespace or other characters allowed

2. Value safety:

   - Must be within the range of ±2^53-1 (`Number.MAX_SAFE_INTEGER`)
   - The mathematical value represented by the string must remain unchanged through the string-number-string conversion process. That is:
     `MV(string) === MV(ToString(ToNumber(string)))`, `MV` is the mathematical value of the string(pseudo code).

   This equation ensures:

   - The string can be safely converted to a JavaScript Number and back without losing its original mathematical meaning.
   - The displayed value will be consistent across different systems and contexts
   - Aligns with developer's intuition and expectations.

   For more details, see [Why string to number to string may cause mathematical value changes](#why-string-to-number-to-string-may-cause-mathematical-value-changes)

### Examples

#### Format Rules

```javascript
// Valid numeric strings
Number.isSafeNumeric('0') // true
Number.isSafeNumeric('123') // true
Number.isSafeNumeric('-123') // true
Number.isSafeNumeric('0.123') // true
Number.isSafeNumeric('-0.123') // true
Number.isSafeNumeric('1.1') // true

// Invalid numeric strings
Number.isSafeNumeric('.123') // false (missing leading zero)
Number.isSafeNumeric('123.') // false (trailing decimal)
Number.isSafeNumeric('00123') // false (leading zeros)
Number.isSafeNumeric('1.2.3') // false (multiple decimal points)
Number.isSafeNumeric(' 0 ') // false (whitespace)
Number.isSafeNumeric('1,000') // false (thousands separator)
Number.isSafeNumeric('abc') // false (non-numeric characters)
Number.isSafeNumeric('12a3') // false (contains letter)
Number.isSafeNumeric('1e5') // false (scientific notation)
Number.isSafeNumeric('1.23e-4') // false (scientific notation)
Number.isSafeNumeric('0x123') // false (hexadecimal)
```

#### Value Safety

```javascript
// Valid numeric strings
Number.isSafeNumeric('9007199254740991') // true (MAX_SAFE_INTEGER)
Number.isSafeNumeric('-9007199254740991') // true (-MAX_SAFE_INTEGER)
Number.isSafeNumeric('1234.5678') // true (maintains same mathematical value after conversion)

// Invalid numeric strings
Number.isSafeNumeric('9007199254740992') // false (exceeds MAX_SAFE_INTEGER)
Number.isSafeNumeric('9007199254740989.1') // false (mathematical value changes near MAX_SAFE_INTEGER)
Number.isSafeNumeric('0.1234567890123456789') // false (mathematical value changes in conversion)
```

## More Details

### Why string to number to string may cause mathematical value changes

During the String → Number conversion process, two factors may cause the mathematical value to change:

a) [RoundMVResult](https://tc39.es/ecma262/#sec-roundmvresult) behavior:

- When a decimal string has more than 20 significant digits, the value will be modified during conversion
- This modification is irreversible and always changes the original mathematical value
- Example: "0.300000000000000041" becomes "0.30000000000000004"

b) IEEE-754 double precision format limitations:

- Some decimal values cannot be represented exactly in binary format
- This may lead to different decimal representations when converting back to string
- for examples: `Number('0.300000000000000041')` is `0.30000000000000004`, but `0.30000000000000004.toString()` is `0.30000000000000004`, which is not the same as the original string.

## Specification

- [Ecmarkup source](spec.emu)
- [HTML version](https://lxxyx.github.io/proposal-number-is-safe-numeric/)

## Implementations

_No implementations yet_

## FAQ

**Q: Why use strict number format rules by default, and not support other formats(scientific notation, International number formats, etc.)?**

A: By validating decimal strings, we:

1. Focus on the fundamental programming format used in JavaScript programming
2. Ensure consistent parsing across different systems (e.g. `1e5` is `100000` in JavaScript but may be treated as string in others)
3. Reduce complexity in data processing and validation

Further, we could add the second parameter to support more formats and parsing options. 

For example:

1. Support scientific notation with `format` option (enum: `'decimal'`, `'number'`)

```javascript
// Scientific notation format
Number.isSafeNumeric('1e5', { format: 'number' }) // true, with decimal + scientific notation supported

// Decimal format
Number.isSafeNumeric('100000', { format: 'decimal' }) // true
```

2. Support flexible parsing with `loose` option (boolean, default: `false`) to allow common number formats, which is more friendly to old code that already uses these formats.

```javascript
Number.isSafeNumeric('00123', { loose: true }) // true, with leading zeros
Number.isSafeNumeric('+123', { loose: true }) // true, with leading plus sign
Number.isSafeNumeric('.123', { loose: true }) // true, with leading decimal point
Number.isSafeNumeric('123.', { loose: true }) // true, with trailing decimal point
Number.isSafeNumeric(' 0 ', { loose: true }) // true, with whitespace
```

**Q: How to handle subsequent numeric calculations?**

A: This proposal focuses on ensuring numeric string representation is safe to be converted to a JavaScript number (float64).

For high-precision decimal calculations, please refer to high-precision decimal libraries like [decimal.js](https://github.com/MikeMcl/decimal.js/) or the upcoming [proposal-decimal](https://github.com/tc39/proposal-decimal).

**Q: How does this relate to proposal-decimal?**

A: These two proposals have different goals:

- proposal-decimal creates a new type of number for precise calculations
- this proposal (Number.isSafeNumeric) just checks if a string can be safely converted to a regular JavaScript number (float64)

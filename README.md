# `Number.isSafeNumeric`

A TC39 proposal to add `Number.isSafeNumeric`.

A simple and reliable method to validate input is numeric string and represents a valid javascript number.

Pros:

1. Ensure input is a valid numeric string, **reducing unexpected behaviors during parsing and subsequent calculations**
2. Avoid precision loss that may lead to unexpected behavior **(developers may not aware of this)**
3. Reduce developer mental overhead

## Status

**Stage:** 0  
**Champion:** WIP  
**Authors:** [ZiJian Liu](@lxxyx) / [YiLong Li](@umuoy1)  
**Last Presented:** (unpresented)

## Motivation

In web development, validating strings that can be safely converted to JavaScript Numbers (float64) is a common requirement, particularly in scenarios like:

- API response parsing
- Form input validation
- Financial calculations
- Data processing

However, current solutions have significant limitations:

### 1. Issues with Built-in Parsing Methods and Validation Methods

Using existing JavaScript APIs (`Number()`, `parseInt()`, `parseFloat()`, `isFinite()`) to parse or validate numeric strings presents multiple challenges:

- Difficult to choose which method to use
- Need handle edge cases manually, and it's hard to remember all of them
- Brings unnecessary performance overhead

#### Built-in Parsing Methods

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
| `'9007199254740993'`      | `9007199254740992`    | `9007199254740992` | `9007199254740992`    | `true`       | Large number precision loss              |
| `'0.1234567890123456789'` | `0.12345678901234568` | `0`                | `0.12345678901234568` | `true`       | Decimal precision loss                   |
| `'Infinity'`              | `Infinity`            | `NaN`              | `Infinity`            | `false`      | Infinity handling inconsistent           |
| `'-Infinity'`             | `-Infinity`           | `NaN`              | `-Infinity`           | `false`      | Negative infinity handling inconsistent  |

### 2. Limitations of Code based validation

Developers often need to implement complex validation logic to properly validate numeric strings:

<details>
<summary>StackOverflow Example</summary>

> 3276 Votes, Link: [How can I check if a string is a valid number?](https://stackoverflow.com/questions/175739/how-can-i-check-if-a-string-is-a-valid-number)

```javascript
function isNumeric(str) {
  if (typeof str != 'string') return false // we only process strings!
  return !isNaN(str) && !isNaN(parseFloat(str))
}

isNumeric('0.1234567890123456789') // true, but when converted to Number, precision loss will happen
```

</details>

<details>
<summary>Using npm libraries: `validator` and `is-number`</summary>

Using [validator](https://www.npmjs.com/package/validator)#isDecimal and [is-number](https://www.npmjs.com/package/is-number)#isNumber

```javascript
const validator = require('validator')
console.log(validator.isDecimal('0.1234567890123456789')) // true, but when converted to Number, precision loss will happen

const isNumber = require('is-number')
console.log(isNumber('0.1234567890123456789')) // true, but when converted to Number, precision loss will happen
```

</details>

<details>
<summary>Complex Validation Example</summary>

```javascript
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

1. Strict number format:

   - Contains only digits (0-9)
   - Has exactly one decimal point (optional)
   - May have one leading minus sign
   - No other characters allowed (no whitespace)

2. Value constraints:

   - Integer part must be within ±2^53-1 (Number.MAX_SAFE_INTEGER)
   - When converted to Number and back to string, must match the original input exactly

3. Format requirements:
   - No leading zeros (except for decimal numbers < 1)
   - No trailing decimal point
   - No leading decimal point (must have 0 before decimal)

Note: This method specifically targets JavaScript's float64 number format and does not consider:

- International number formats (use Intl.NumberFormat for those cases)
- Scientific notation (e.g., 1e5)
- BigInt conversions
- Decimal128 or other arbitrary precision formats

Examples:

```javascript
// Valid number strings
Number.isSafeNumeric('0') // true
Number.isSafeNumeric('123') // true
Number.isSafeNumeric('-123') // true
Number.isSafeNumeric('0.123') // true
Number.isSafeNumeric('-0.123') // true
Number.isSafeNumeric('9007199254740991') // true (MAX_SAFE_INTEGER)

// Invalid format
Number.isSafeNumeric('.123') // false (missing leading zero)
Number.isSafeNumeric('123.') // false (trailing decimal)
Number.isSafeNumeric('00123') // false (leading zeros)
Number.isSafeNumeric('1.2.3') // false (multiple decimal points)
Number.isSafeNumeric('1,000') // false (thousands separator)
Number.isSafeNumeric('1e5') // false (scientific notation)
Number.isSafeNumeric('1.23e-4') // false (scientific notation)

// Unsafe values
Number.isSafeNumeric('9007199254740992') // false (exceeds MAX_SAFE_INTEGER)
Number.isSafeNumeric('0.1234567890123456789') // false (precision loss)
```

## Specification

- [Ecmarkup source](spec.emu)
- [HTML version](https://lxxyx.github.io/proposal-number-is-safe-numeric/)

## Implementations

_No implementations yet_

## FAQ

**Q: Why not support international number formats?**
A: This API focuses on the programmatic use case of decimal string validation. For international number formats, use `Intl.NumberFormat`.

**Q: Why not support scientific notation and other number formats (like hex)?**
A: By only validating decimal strings, we ensure consistent data handling across different systems and reduce format-related bugs. Different number formats (scientific notation, hex) can lead to ambiguous interpretations and increase complexity in data processing.

**Q: How does this relate to the decimal128 proposal?**
A: This proposal focuses on validating whether a string can be safely converted to a JavaScript Number (float64) without precision loss or edge case issues. While the decimal128 proposal aims to provide a new numeric type for high-precision decimal arithmetic, this proposal helps developers validate input before using existing Number operations.

The two proposals serve different but complementary purposes in JavaScript's numeric ecosystem.

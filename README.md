# `Number.isSafeNumeric`

A TC39 proposal to add `Number.isSafeNumeric`.

A simple and reliable method to validate input is numeric string that represents a valid javascript number without considering:

- Handling multiple edge cases
- Avoid precision loss
- Avoid format ambiguity

Pros:

1. Reduce developer mental overhead (no more complex validation logic and edge case handling)
2. Avoid precision loss that may lead to unexpected behavior (developers may not aware of this)

## Status

**Stage:** 0  
**Champion:** WIP  
**Authors:** [ZiJian Liu](@lxxyx) / [YiLong Li](@umuoy1)  
**Last Presented:** (unpresented)

## Motivation

In web development, validating strings that can be safely converted to JavaScript Numbers (float64) is a common requirement, particularly in scenarios like:

- Form input validation
- API response parsing
- Financial calculations
- Data processing

However, using existing JavaScript APIs (`Number()`, `parseInt()`, `parseFloat()`) to validate numeric strings is error-prone and requires handling numerous edge cases. Developers face the following challenges:

### 1. Edge Cases Handling

```javascript
// 1. Scientific notation causing false positives
Number.isFinite('1e5') // true, but might not be the desired input format
Number.isFinite('1.23e-4') // true, same issue

// 2. Special strings
Number('') // 0, empty string converts to 0
Number(' ') // 0, whitespace converts to 0
Number(null) // 0, null converts to 0
Number('0x123') // 291, unintended hex string parsing

// 3. Leading/trailing issues
Number('123.') // 123, accepts trailing decimal
Number('.123') // 0.123, accepts leading decimal
Number('00123') // 123, accepts leading zeros
```

### 2. Precision Loss Issues

Developers may not be aware of precision loss issues when using `Number()`, `parseInt()`, `parseFloat()`, etc.

```javascript
// 1. Large integer precision loss
const largeNum = '9007199254740993'
Number(largeNum) // 9007199254740992, silent precision loss

// 2. Decimal precision loss
const decimal = '0.1234567890123456789'
Number(decimal) // 0.12345678901234568, precision lost
String(Number(decimal)) !== decimal // true, but hard to detect

// 3. Dangerous for financial calculations
const amount = '9007199254740992.5'
Number(amount) // 9007199254740992, incorrect amount
```

### 3. Type Coercion Traps

```javascript
// 1. NaN handling
Number('abc') // NaN
Number('123abc') // NaN
Number.isNaN(Number('123abc')) // true, more reliable than global isNaN
isNaN('123abc') // true, but incorrectly coerces strings first

// 2. Integer validation issues
Number.isInteger('123') // false, doesn't coerce strings
Number.isInteger(Number('123')) // true, requires manual coercion
Number.isInteger(Number('123.45')) // false, rejects valid float numbers
Number.isInteger(Number('123.0')) // true, but '123' !== '123.0'

Number.isSafeInteger('9007199254740991') // false, doesn't coerce strings
Number.isSafeInteger(Number('9007199254740991')) // true, requires manual coercion
Number.isSafeInteger(Number('9007199254740992')) // false, but no way to know if it's due to overflow or invalid format
Number.isSafeInteger(Number('123.45')) // false, rejects valid float numbers
Number.isSafeInteger(Number('9007199254740991.0')) // false, rejects valid numbers with decimal point

// Even worse with precision loss
const num = '9007199254740992.0'
Number(num) // 9007199254740992
String(Number(num)) !== num // true, precision lost but isSafeInteger doesn't detect this

// 3. Implicit coercion
Number('123') + // 123, recommended approach
  '123' // 123, not recommended
Number('123abc') // NaN
Number.isFinite(Number('123abc')) // false, requires additional checks

// 4. parseInt/parseFloat inconsistencies
parseInt('12.34') // 12, truncates decimal
parseFloat('12.34') // 12.34, keeps decimal
```

### 4. Complex Validation Logic

Developers often need to combine multiple checks to properly validate a numeric string:

```javascript
function isValidNumber(str) {
  // 1. Basic checks
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

These challenges force developers to either implement complex validation logic or use incomplete validation approaches, increasing code complexity and potential for errors. We need a simple, reliable API to handle all these cases consistently.

## The Solution

```javascript
Number.isSafeNumeric(input)
```

This method aims to provide a simple and reliable way to validate whether input can be safely converted to a JavaScript Number (using float64).

### Safety Definition

A string is considered "safe numeric" if it meets ALL of the following criteria:

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

## Comparison with Existing Solutions

### Native JavaScript Methods

| Method              | Purpose                   | Limitations                      |
| ------------------- | ------------------------- | -------------------------------- |
| `Number()`          | General number conversion | No safety checking               |
| `parseInt()`        | Integer parsing           | Integer-only, no decimal support |
| `parseFloat()`      | Decimal parsing           | No precision loss detection      |
| `Number.isFinite()` | Range checking            | Doesn't detect precision loss    |

### Why Not Use Existing Methods?

1. **parseInt/parseFloat**

   - Don't validate format strictness
   - Can't detect precision loss
   - Accepts invalid formats (leading/trailing decimal points)

2. **Number() + isFinite()**

   - Can't distinguish between safe and unsafe conversions
   - Accepts non-decimal formats (hex, scientific notation)

3. **Regular Expressions**
   - Can validate format but can't check numerical safety
   - Complex to maintain and error-prone

## Prior Art

## JavaScript Libraries

Many libraries implement similar functionality, but most don't handle safe integers properly:

## Specification

- [Ecmarkup source](spec.emu)
- [HTML version](https://lxxyx.github.io/proposal-string-issafedecimal/)

## Implementations

_No implementations yet_

## FAQ

**Q: Why not support international number formats?**
A: This API focuses on the programmatic use case of decimal string validation. For international number formats, use `Intl.NumberFormat`.

**Q: Why not support scientific notation?**
A: Scientific notation introduces additional complexity and ambiguity. This API prioritizes explicit decimal representation.

**Q: How does this relate to the decimal128 proposal?**
A: This proposal focuses on validating whether a string can be safely converted to a JavaScript Number (float64) without precision loss or edge case issues. While the decimal128 proposal aims to provide a new numeric type for high-precision decimal arithmetic, this proposal helps developers validate input before using existing Number operations. The two proposals serve different but complementary purposes in JavaScript's numeric ecosystem.

## Acknowledgements

[List contributors and references here]

# `String.prototype.isNumeric`

A TC39 proposal to add `String.prototype.isNumeric`: a method that determines if a string represents a valid numeric value.

## Status

**Stage:** 0  \
**Champion:** WIP  \
**Authors:** [ZiJian Liu](@lxxyx) / [YiLong Li](@umuoy1)  \
**Last Presented:** (unpresented)

## Overview and motivation

When working with strings, developers frequently need to determine if a string represents a numeric value. Currently, developers typically implement this using regular expressions or type conversion checks:

```js
// Using regex
function isNumeric(str) {
    return /^-?\d*\.?\d+$/.test(str);
}

// Using type conversion
function isNumeric(str) {
    return !isNaN(str) && !isNaN(parseFloat(str));
}
```

## Current Problems

When developers need to validate if a string represents a valid number, they often face several challenges:

### Inconsistent Type Coercion

JavaScript's loose type system can lead to unexpected results:

```js
Number("123")     // 123
Number("12.3")    // 12.3
Number("12.3.4")  // NaN
Number("")        // 0 (not NaN!)
Number(" ")       // 0 (not NaN!)
Number(null)      // 0 (not NaN!)
Number("0x11")    // 17 (converts hex)
Number("011")     // 11 (no octal in strict mode)
```

### NaN Propagation Issues

Invalid number parsing can lead to hard-to-debug NaN propagation:

```js
const userInput = "invalid";
const number = Number(userInput);  // NaN

// NaN silently propagates through calculations
const total = number + 100;        // NaN
const average = total / 2;         // NaN

// Can lead to unexpected UI states
element.style.width = average + "px";  // "NaNpx"
```

### Inconsistent Validation Methods

Different approaches give different results:

```js
// Using Number
!isNaN("123")           // true
!isNaN("12.3")         // true
!isNaN("")             // true (problematic!)
!isNaN(" ")            // true (problematic!)

// Using parseFloat
!isNaN(parseFloat("123"))     // true
!isNaN(parseFloat("12.3"))    // true
!isNaN(parseFloat(""))        // false
!isNaN(parseFloat("abc"))     // false

// Using regex
+/^-?\d*\.?\d+$/.test("123")   // true
+/^-?\d*\.?\d+$/.test("12.3")  // true
+/^-?\d*\.?\d+$/.test("")      // false
+/^-?\d*\.?\d+$/.test("1e5")   // false (doesn't handle scientific notation)
```

These inconsistencies force developers to either:
1. Accept potential bugs from loose type coercion
2. Write complex validation logic
3. Include external libraries for proper number validation

## Motivation

Our primary motivation is its usefulness and common implementation in existing projects where it is often defined for the sake of readability. Projects tend to implement this functionality through various approaches, each with their own drawbacks:

- Regular expressions require knowledge of regex syntax and are error-prone
- Type conversion approaches may have unexpected behavior with edge cases
- Different implementations may handle edge cases differently (scientific notation, localized numbers)
- Handling of Unicode numeric values varies between implementations

## Existing Implementations

Many other programming languages provide this functionality as a built-in method:

- Python: [`str.isnumeric()`](https://docs.python.org/3/library/stdtypes.html#str.isnumeric)
- Java: [`Character.isDigit()`](https://docs.oracle.com/javase/8/docs/api/java/lang/Character.html#isDigit-char-)
- C#: [`Double.TryParse()`](https://learn.microsoft.com/en-us/dotnet/api/system.double.tryparse)
- Ruby: [`String#match?`](https://ruby-doc.org/core-3.0.0/String.html#method-i-match-3F)
- PHP: [`is_numeric()`](https://www.php.net/manual/en/function.is-numeric.php)
- Swift: [`Character.isNumber`](https://developer.apple.com/documentation/swift/character/3127017-isnumber)
- Go: [`unicode.IsDigit()`](https://pkg.go.dev/unicode#IsDigit)
- Rust: [`str::parse::<f64>()`](https://doc.rust-lang.org/std/primitive.str.html#method.parse)
- Kotlin: [`Char.isDigit()`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.text/is-digit.html)
- Perl: [`isdigit()`](https://perldoc.perl.org/functions/isdigit)

And userland JavaScript implementations:

```js
// Lodash
_.isNumber('3') // true

// validator.js
validator.isNumeric('3') // true

// is.js
is.number('3') // true

// Common custom implementation
const isNumeric = str => /^-?\d*\.?\d+$/.test(str);

// Comprehensive implementation
const isNumeric = str => {
  if (typeof str !== 'string') return false;
  return !isNaN(str) && 
         !isNaN(parseFloat(str));
};
```

Popular libraries and frameworks that implement similar functionality:

- [`lodash`](https://lodash.com/docs/#isNumber)
- [`validator.js`](https://github.com/validatorjs/validator.js)
- [`is.js`](https://is.js.org/)
- [`ramda`](https://ramdajs.com/)
- [`underscore`](https://underscorejs.org/)

## Examples

The proposed API allows developers to check for numeric values like:

```js
"5".isNumeric() // true
"3.14".isNumeric() // true
"-42".isNumeric() // true
"1e-10".isNumeric() // true
"abc".isNumeric() // false
"12px".isNumeric() // false
"".isNumeric() // false
"٥".isNumeric() // true (Unicode digit)
"½".isNumeric() // true (numeric fraction)
```

## Specification

- [Ecmarkup source](spec.emu)
- [HTML version](https://lxxyx.github.io/proposal-string-isnumeric/)

## Implementations

_No implementations yet_

## Alternative Names

### `String.prototype.isDigit`

The name `isDigit` was considered as an alternative to `isNumeric`. This method would check if a string contains only digit characters (0-9). Here's the comparison:

**Pros of `isDigit`:**
- More specific in purpose (checking for digit-only strings)
- Aligns with similar methods in other languages:
  - Python: `str.isdigit()` - Returns True if all characters in the string are digits
  - PHP: `ctype_digit()` - Checks if all characters in a string are decimal digits
  - Ruby: `String#match?(/^\d+$/)` - Common pattern to check digit-only strings
  - Java: `String.matches("\\d+")` - Common pattern for digit validation
- Clearer distinction from `Number.isInteger` and `Number.isFinite`
- Better suited for validating strings containing only digits

**Cons of `isDigit`:**
- More limited in scope (only digit characters)
- Doesn't handle decimal points, negative signs, or scientific notation
- May be confused with Unicode digit categories
- Less flexible for general numeric validation

## Acknowledgements

[List contributors and references here]

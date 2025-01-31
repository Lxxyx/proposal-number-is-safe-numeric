# `String.isSafeDecimal`

A TC39 proposal to add `String.isSafeDecimal`: a method that tests if a string can be safely converted to a JavaScript number without precision loss.

## Status

**Stage:** 0  
**Champion:** WIP  
**Authors:** [ZiJian Liu](@lxxyx) / [YiLong Li](@umuoy1)  
**Last Presented:** (unpresented)

## Motivation

JavaScript numbers have fundamental limitations due to IEEE 754 double-precision:

1. Can only safely represent integers between ±2^53-1
2. No standardized way to validate if a string can be safely converted to a number
3. Silent precision loss when handling large numbers

### The Problem

These limitations cause real problems in common use cases:

- **User Input**: Forms collecting numeric data need reliable validation to ensure accurate processing
- **API Integration**: When receiving numeric data as strings from external APIs, validation is crucial to prevent data corruption
- **Data Processing**: Parsing large datasets with numeric identifiers or statistics requires careful handling
- **Financial Applications**: When handling currency amounts or financial calculations, precision loss can lead to incorrect monetary values

### Bad Cases

1. Inconsistent Type Coercion

```javascript
Number('') // 0 (not NaN!)
Number(' ') // 0 (not NaN!)
Number(null) // 0 (not NaN!)
Number('0x11') // 17 (converts hex)
Number('12.3.4') // NaN
```

2. Inconsistent Validation Methods

```javascript
// Using Number/isNaN
!isNaN('') // true (problematic!)
!isNaN(' ') // true (problematic!)

// Using parseFloat
!isNaN(parseFloat('')) // false
!isNaN(parseFloat('abc')) // false
```

3. NaN Propagation Issues

```javascript
const userInput = 'invalid'
const number = Number(userInput) // NaN
const total = number + 100 // NaN silently propagates
element.style.width = total + 'px' // "NaNpx"

const apiResponse = 'null'
document.querySelector('.price').value = Number(apiResponse) // NaN
```

## Alternative Names

Alternative names considered for this proposal:

## The Solution

`String.isSafeDecimal` is a method that tests if a string can be safely converted to a JavaScript number without precision loss.

### Method Definition

```javascript
String.isSafeDecimal(input)
```

Returns `true` if the input string represents a valid decimal number that can be safely converted to a JavaScript number without precision loss, `false` otherwise.

### Scope Definition

The method returns `true` only if:

- The input string represents a decimal number (integer or floating point)
- The number is within JavaScript's safe integer range (±2^53-1, from `Number.MIN_SAFE_INTEGER` to `Number.MAX_SAFE_INTEGER`)
- The number has no scientific notation
- The number has no special formatting (separators, unicode numbers, etc)

Returns `false` for:

- Numbers outside safe range
- Invalid number formats
- Special values like NaN or Infinity
- Empty strings or whitespace
- Non-numeric strings

This scope aligns with ECMAScript Number Type specification while ensuring safe integer operations.

### Examples

```javascript
// user input
String.isSafeDecimal('123') // true
String.isSafeDecimal('123.45') // true
String.isSafeDecimal('123.45e6') // false

// special values
String.isSafeDecimal(null) // false
String.isSafeDecimal(undefined) // false
String.isSafeDecimal('') // false
String.isSafeDecimal(' ') // false
String.isSafeDecimal(NaN) // false
String.isSafeDecimal(Infinity) // false

// big number
String.isSafeDecimal('9007199254740991') // true, within safe range
String.isSafeDecimal('9007199254740992') // false, out of safe range
```

# Ecosystem

## Similar Features in Other Languages

| Language | Method                  | Safe Integer Handling                    | Documentation                                                                                     |
| -------- | ----------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Python   | `str.isdecimal()`       | Unlimited precision integers by default  | [Link](https://docs.python.org/3/library/stdtypes.html#str.isdecimal)                             |
| Java     | `Long.parseLong()`      | Throws exception for out-of-range values | [Link](https://docs.oracle.com/javase/8/docs/api/java/lang/Long.html#parseLong-java.lang.String-) |
| C#       | `Int64.TryParse()`      | Returns false for out-of-range values    | [Link](https://learn.microsoft.com/en-us/dotnet/api/system.int64.tryparse)                        |
| Rust     | `str::parse::<i64>()`   | Returns Err for out-of-range values      | [Link](https://doc.rust-lang.org/std/primitive.str.html#method.parse)                             |
| Go       | `strconv.ParseInt()`    | Returns error for out-of-range values    | [Link](https://pkg.go.dev/strconv#ParseInt)                                                       |
| Swift    | `Int64(string:)`        | Returns nil for out-of-range values      | [Link](<https://developer.apple.com/documentation/swift/int64/init(_:)>)                          |
| Kotlin   | `String.toLongOrNull()` | Returns null for out-of-range values     | [Link](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.text/to-long-or-null.html)             |

Each language provides built-in ways to safely handle numeric strings, with clear handling of out-of-range values.

## Popular JavaScript Libraries

Many libraries implement similar functionality, but most don't handle safe integers properly:

| Library                                                                | Method                  | Safe Integer Check | NPM Weekly Downloads |
| ---------------------------------------------------------------------- | ----------------------- | ------------------ | -------------------- |
| [is-safe-integer](https://www.npmjs.com/package/is-safe-integer)       | `isSafeInteger()`       | ✅                 | 150K                 |
| [is-number](https://www.npmjs.com/package/is-number)                   | `isNumber()`            | ❌                 | 80.8M                |
| [jQuery](https://api.jquery.com/jQuery.isNumeric/)                     | `$.isNumeric()`         | ❌                 | 12.4M                |
| [validator.js](https://github.com/validatorjs/validator.js#validators) | `validator.isNumeric()` | ❌                 | 11.9M                |

This demonstrates the need for a standardized way to validate safe decimal strings in JavaScript.

### `String.isSafeNumber`

Pros:

- More intuitive and general name
- Doesn't conflict with TC39 Decimal proposal ([tc39/proposal-decimal](https://github.com/tc39/proposal-decimal))

Cons:

- Less specific about decimal validation
- Could imply support for non-decimal formats

## Specification

- [Ecmarkup source](spec.emu)
- [HTML version](https://lxxyx.github.io/proposal-string-issafedecimal/)

## Implementations

_No implementations yet_

## Acknowledgements

[List contributors and references here]

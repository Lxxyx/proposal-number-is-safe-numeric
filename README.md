# `String.isSafeDecimal`

A TC39 proposal to add `String.isSafeDecimal`: a method that tests if a string can be safely converted to a JavaScript number without precision loss.

## Status

**Stage:** 0  
**Champion:** WIP  
**Authors:** [ZiJian Liu](@lxxyx) / [YiLong Li](@umuoy1)  
**Last Presented:** (unpresented)

## Motivation

In web development, we often need to validate if strings can safely convert to numbers, especially for:

- User input(form, input, etc.)
- API responses(JSON, etc.)
- Data processing(regex matching, parsing, etc.)

However, JavaScript numbers (IEEE 754) have key limitations:

1. No standard way to validate string-to-number conversion safety, which leads to many non-intuitive behaviors

```javascript
console.log(Number('')) //=> 0
console.log(Number(null)) //=> 0
console.log(Number(undefined)) //=> NaN
console.log(+[]) //=> 0
console.log(+'') //=> 0
console.log(+'   ') //=> 0
console.log(typeof NaN) //=> 'number'
```

2. Silent precision loss for values outside safe range

```javascript
console.log(Number('9007199254740992') + 1) //=> 9007199254740992, precision loss
console.log(Number('9007199254740991.1')) //=> 9007199254740991, precision loss
console.log(Number('0.1234567890123456789')) //=> 0.12345678901234568, precision loss
```

## The Solution

```javascript
String.isSafeDecimal(input)
```

Returns `true` if the input string represents a valid decimal number that can be safely converted to a JavaScript number without precision loss, `false` otherwise.

### Safety Definition

A decimal string is considered "safe" if it meets ALL of the following criteria:

1. It is a valid decimal string (contains only digits, at most one decimal point, and optionally a leading minus sign)
2. Its integer part is within the safe integer range (±2^53-1)
3. When converted to a JavaScript number and back to a string, the result exactly matches the original input
4. The number has no special formatting (no scientific notation, no separators, no unicode numbers, etc)

Note: While numbers with more than 15 significant digits are often unsafe, the actual safety depends on the specific value. This method performs an exact conversion test rather than using a fixed digit limit.

Examples:

```javascript
// Integers within safe range
String.isSafeDecimal('0') // true
String.isSafeDecimal('123') // true
String.isSafeDecimal('-123') // true
String.isSafeDecimal('9007199254740991') // true (Number.MAX_SAFE_INTEGER)
String.isSafeDecimal('-9007199254740991') // true (Number.MIN_SAFE_INTEGER)

// Integers outside safe range
String.isSafeDecimal('9007199254740992') // false (exceeds MAX_SAFE_INTEGER)
String.isSafeDecimal('-9007199254740992') // false (exceeds MIN_SAFE_INTEGER)

// Valid floating point numbers
String.isSafeDecimal('0.0') // true
String.isSafeDecimal('123.456') // true
String.isSafeDecimal('-123.456') // true
String.isSafeDecimal('0.123456789012345') // true (15 digits precision)
String.isSafeDecimal('-0.123456789012345') // true (15 digits precision)

// Invalid floating point numbers (precision loss)
String.isSafeDecimal('0.1234567890123456') // false (16 digits, exceeds safe precision)
String.isSafeDecimal('9007199254740991.1') // false (integer part at limit + decimal)
String.isSafeDecimal('1.234567890123456789') // false (19 digits after decimal)

// Invalid formats
String.isSafeDecimal('1e5') // false (scientific notation)
String.isSafeDecimal('1,000') // false (contains separator)
String.isSafeDecimal('１２３') // false (unicode numbers)
String.isSafeDecimal('0x123') // false (hexadecimal)
String.isSafeDecimal('.123') // false (missing leading zero)
String.isSafeDecimal('123.') // false (trailing decimal point)

// Non-numeric inputs
String.isSafeDecimal(null) // false
String.isSafeDecimal(undefined) // false
String.isSafeDecimal('') // false
String.isSafeDecimal(' ') // false
String.isSafeDecimal('abc') // false
String.isSafeDecimal('12a34') // false
String.isSafeDecimal('+-123') // false
String.isSafeDecimal('123..456') // false
```

# Prior art

## JavaScript Libraries

Many libraries implement similar functionality, but most don't handle safe integers properly:

| Library                                                                | Method                  | Safe Integer Check | NPM Weekly Downloads |
| ---------------------------------------------------------------------- | ----------------------- | ------------------ | -------------------- |
| [is-number](https://www.npmjs.com/package/is-number)                   | `isNumber()`            | ❌                 | 80.8M                |
| [jQuery](https://api.jquery.com/jQuery.isNumeric/)                     | `$.isNumeric()`         | ❌                 | 12.4M                |
| [validator.js](https://github.com/validatorjs/validator.js#validators) | `validator.isNumeric()` | ❌                 | 11.9M                |

## Other Languages

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

## Specification

- [Ecmarkup source](spec.emu)
- [HTML version](https://lxxyx.github.io/proposal-string-issafedecimal/)

## Implementations

_No implementations yet_

## Acknowledgements

[List contributors and references here]

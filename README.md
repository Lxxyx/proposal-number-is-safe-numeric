# `String.prototype.isNumeric`

A TC39 proposal to add `String.prototype.isNumeric`: a method that determines if a string represents a valid numeric value.

## Status

**Stage:** 0  
**Champion:** WIP  
**Authors:** [ZiJian Liu](@lxxyx) / [YiLong Li](@umuoy1)  
**Last Presented:** (unpresented)

## Motivation

When working with strings, developers frequently need to determine if a string represents a numeric value. Currently, there's no standardized way to perform this validation, leading to:

1. Inconsistent implementations across projects
2. Complex validation logic or external library dependencies
3. Potential bugs from loose type coercion
4. Varying handling of edge cases (scientific notation, Unicode numbers, etc.)

### User Questions from `is-number`(~80.8M weekly downloads) ([#39](https://github.com/jonschlinkert/is-number/issues/39))

Q: Why does this even exist?  \
A: The `is-number` library is useful because of JavaScript's type coercion system, where different data types, like `strings` or `objects`, can sometimes be interpreted as numbers. JavaScript's implicit type conversion can result in unexpected outcomes, **especially when checking if a value is numeric**.

## Proposed Solution

`String.prototype.isNumeric()` would validate if a string represents a valid decimal number that can be converted to a JavaScript Number or BigInt. The method focuses on practical numeric validation while excluding certain numeric representations.

### Integer Numbers
**Examples:**

```js
"123".isNumeric()        // true
"-123".isNumeric()       // true
"0".isNumeric()          // true
```
**Convert to Number:**

```js
Number("123")            // 123
Number("-123")          // -123
Number("0")             // 0
```

### Decimal Points
**Examples:**

```js
"3.14".isNumeric()       // true
"-0.123".isNumeric()     // true
".5".isNumeric()         // true
```
**Convert to Number:**

```js
Number("3.14")          // 3.14
Number("-0.123")        // -0.123
Number(".5")            // 0.5
```

### Scientific Notation
**Examples:**

```js
"1e-10".isNumeric()      // true
"1E5".isNumeric()        // true
"1.23e+4".isNumeric()    // true
```
**Conversion to Number:**

```js
Number("1e-10")         // 0.0000000001
Number("1E5")           // 100000
Number("1.23e+4")       // 12300
```

### Large Numbers (BigInt Range)
**Examples:**

```js
"9007199254740991".isNumeric()     // true (MAX_SAFE_INTEGER)
"-9007199254740991".isNumeric()    // true
"9007199254740992".isNumeric()     // true (Beyond MAX_SAFE_INTEGER)
```
**Conversion to Number/BigInt:**

```js
BigInt("9007199254740991")        // 9007199254740991n
BigInt("-9007199254740991")       // -9007199254740991n
BigInt("9007199254740992")        // 9007199254740992n
```

### Invalid Cases

#### Empty/Whitespace
**Examples:**

```js
"".isNumeric()           // false
" ".isNumeric()          // false
```
**Current Behavior:**

```js
Number("")              // 0 (problematic!)
Number(" ")            // 0 (problematic!)
```

#### Non-decimal Notations
**Examples:**

```js
"0xFF".isNumeric()       // false (hex)
"0b11".isNumeric()       // false (binary)
"0o7".isNumeric()        // false (octal)
```
**Current Behavior:**

```js
Number("0xFF")          // 255 (converts hex)
Number("0b11")          // 3 (converts binary)
Number("0o7")           // 7 (converts octal)
```

#### Special Number Values
**Examples:**

```js
"NaN".isNumeric()        // false
"Infinity".isNumeric()   // false
"-Infinity".isNumeric()  // false
```
**Current Behavior:**

```js
Number("NaN")           // NaN
Number("Infinity")      // Infinity
Number("-Infinity")     // -Infinity
```

#### Invalid Formats
**Examples:**

```js
"1,234".isNumeric()      // false (thousands separator)
"1.2.3".isNumeric()      // false (multiple dots)
"12px".isNumeric()       // false (mixed content)
"1_000".isNumeric()      // false (numeric separator)
```
**Current Behavior:**

```js
Number("1,234")         // NaN
Number("1.2.3")         // NaN
Number("12px")          // NaN
Number("1_000")         // NaN
```

#### Unicode Numbers
**Examples:**

```js
"٥".isNumeric()          // false (Arabic-Indic digit)
"二".isNumeric()         // false (Han numeric)
"½".isNumeric()          // false (fraction)
```
**Current Behavior:**

```js
Number("٥")             // NaN
Number("二")            // NaN
Number("½")             // NaN
```

### Scope Definition
1. **Includes**:
   - Decimal integers (via `Number()`)
   - Floating-point numbers (via `Number()`)
   - Scientific notation (via `Number()`)
   - Numbers within BigInt range (via `BigInt()`)
   - Leading decimal point (via `Number()`)

2. **Excludes**:
   - Non-decimal number representations
   - Special values (NaN, Infinity)
   - Formatted numbers (with separators)
   - Unicode numeric characters
   - Mixed alphanumeric strings
   - Empty strings or whitespace

This scope aligns with common numeric validation needs while maintaining clear, predictable behavior.

## Current Challenges

### 1. Inconsistent Type Coercion

JavaScript's loose type system leads to unexpected results:

```js
Number("")        // 0 (not NaN!)
Number(" ")       // 0 (not NaN!)
Number(null)      // 0 (not NaN!)
Number("0x11")    // 17 (converts hex)
Number("12.3.4")  // NaN
```

### 2. Inconsistent Validation Methods

Different approaches give different results:

```js
// Using Number/isNaN
!isNaN("")             // true (problematic!)
!isNaN(" ")            // true (problematic!)

// Using parseFloat
!isNaN(parseFloat(""))     // false
!isNaN(parseFloat("abc"))  // false

// Using regex
/^-?\d*\.?\d+$/.test("")   // false
/^-?\d*\.?\d+$/.test("1e5") // false (doesn't handle scientific notation)
```

### 3. NaN Propagation Issues

```js
const userInput = "invalid";
const number = Number(userInput);  // NaN
const total = number + 100;        // NaN silently propagates
element.style.width = total + "px";  // "NaNpx"
```

## Current Workarounds

Developers typically implement validation using one of these three approaches:

### 1. Regex Approach

```js
function isNumeric(str) {
    return /^-?\d*\.?\d+$/.test(str);
}

// ✅ Good cases
isNumeric("123")    // true
isNumeric("-123")   // true
isNumeric("12.34")  // true

// ❌ Edge cases it fails to handle
isNumeric("1e5")    // false - doesn't handle scientific notation
isNumeric("٥")      // false - doesn't handle Unicode digits
isNumeric("½")      // false - doesn't handle numeric fractions
isNumeric(".5")     // false - doesn't handle leading decimal
```

### 2. Type Conversion Approach

```js
function isNumeric(str) {
    return !isNaN(str) && !isNaN(parseFloat(str));
}

// ✅ Good cases
isNumeric("123")    // true
isNumeric("-123")   // true
isNumeric("1e5")    // true
isNumeric(".5")     // true

// ❌ Problematic cases
isNumeric("")       // true - empty string converts to 0
isNumeric(" ")      // true - whitespace converts to 0
isNumeric("0x11")   // true - handles hex (may be unwanted)
isNumeric("123abc") // true - partial parsing
```

### 3. Comprehensive Approach

```js
function isNumeric(str) {
    if (typeof str !== 'string') return false;
    const num = Number(str.trim());
    return !isNaN(num) && 
           typeof num === 'number' && 
           str.trim() !== '';
}

// ✅ Good cases
isNumeric("123")     // true
isNumeric("-123")    // true
isNumeric("1e5")     // true
isNumeric(".5")      // true
isNumeric("٥")       // true

// ❌ Still has edge cases
isNumeric("0x11")    // true - handles hex
isNumeric("123,456") // false - doesn't handle locale formats
isNumeric("1.2.3")   // false - invalid number format
```

Each approach has its trade-offs, and developers must choose based on their specific needs. This inconsistency in implementation and handling of edge cases is one of the main motivations for adding `String.prototype.isNumeric` to the language.

## Similar Features in Other Languages

| Language | Method | Documentation |
|----------|---------|--------------|
| Python | `str.isnumeric()` | [Link](https://docs.python.org/3/library/stdtypes.html#str.isnumeric) |
| PHP | `is_numeric()` | [Link](https://www.php.net/manual/en/function.is-numeric.php) |
| Java | `Character.isDigit()` | [Link](https://docs.oracle.com/javase/8/docs/api/java/lang/Character.html#isDigit-char-) |
| C# | `Double.TryParse()` | [Link](https://learn.microsoft.com/en-us/dotnet/api/system.double.tryparse) |
| Swift | `Character.isNumber` | [Link](https://developer.apple.com/documentation/swift/character/3127017-isnumber) |
| Ruby | `String#match?` | [Link](https://ruby-doc.org/core-3.0.0/String.html#method-i-match-3F) |
| Go | `unicode.IsDigit()` | [Link](https://pkg.go.dev/unicode#IsDigit) |
| Rust | `str::parse::<f64>()` | [Link](https://doc.rust-lang.org/std/primitive.str.html#method.parse) |
| Kotlin | `String.toDoubleOrNull()` | [Link](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.text/to-double-or-null.html) |
| Perl | `isdigit()` | [Link](https://perldoc.perl.org/functions/isdigit) |

Each language provides built-in ways to validate numeric strings, demonstrating the widespread need for such functionality across programming languages.

## Popular JavaScript Libraries

Many libraries implement similar functionality:

| Library | Method | NPM Weekly Downloads |
|---------|---------|-----------------|
| [is-number](https://www.npmjs.com/package/is-number) | `isNumber()` | 80.8M |
| [jQuery](https://api.jquery.com/jQuery.isNumeric/) | `$.isNumeric()` | 12.4M |
| [validator.js](https://github.com/validatorjs/validator.js#validators) | `validator.isNumeric()` | 11.9M |
| [is-number-like](https://www.npmjs.com/package/is-number-like) | `isNumberLike()` | 1.2M |
| [isnumeric](https://www.npmjs.com/package/isnumeric) | `isNumeric()` | 227K |
| [fast-isnumeric](https://www.npmjs.com/package/fast-isnumeric) | `isNumeric()` | 162.9K |


## Alternative Names Considered

### `String.prototype.isDigit`

**Pros:**
- More specific (digit-only strings)
- Aligns with similar methods in other languages
- Clear distinction from `Number.isInteger`/`Number.isFinite`

**Cons:**
- Limited scope (digits only)
- Doesn't handle decimals, negatives, or scientific notation
- Potential confusion with Unicode categories
- Less flexible for general numeric validation

## Specification

- [Ecmarkup source](spec.emu)
- [HTML version](https://lxxyx.github.io/proposal-string-isnumeric/)

## Implementations

_No implementations yet_

## Acknowledgements

[List contributors and references here]

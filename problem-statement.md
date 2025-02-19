The `Number.isSafeNumeric` receives many feedbacks from TC39 conference and Matrix discussion. Thanks for everyone's feedbacks and suggestions.

Here is the problem statement of `Number.isSafeNumeric`.

## Motivation

`Number.isSafeNumeric` contains 2 parts:

1. Format rules
  - Validate input is satisfies ECMAScript StringNumericLiteral format, which can be correctly parsed by `Number()`.
  - Unify type coercion traps solved by this method. (`null`, `undefined`, `''`) -> `0`, `123abc` -> `123` etc.

After ensure input is numeric string. This method will check about value safety.

2. Value Safety
  - Validate the interger part is within `±Number.MAX_SAFE_INTEGER`, and with the `integer component & the fractional component`, approximately `15-17 decimal digits of precision` (This range due to IEEE 754 double-precision format, only 52 bits are used to store the number).
  - Ensure the string's real number value will not be changed in parsing process, due to IEEE 754 double-precision format limits.
  - Also notify developers, if this method returns `false`, you should use correct number parsing method to handle this input. (BigInt, Decimal.js, etc.)

## Examples (just for value safety part)

### Valid

```javascript
// Integer
"123" // true
"9007199254740991" // true, smaller than `Number.MAX_SAFE_INTEGER`

// Float
"0.1" // true, although it's stored as 0.10000000000000000555, but within double precision format, it's 0.1
"1234.000000000000000000000000" // true, within double precision format, it's 1234, same as above
"1234.5678" // true, within double precision format, it's 1234.5678
"0.0000000000000000000000001" // true, 1e-25, within 15-17 significant digits
"1e-25" // true, same as above
```

### Invalid

```javascript
// Integer
"9007199254740993" // false, larger than `Number.MAX_SAFE_INTEGER`, when parsed to number is 9007199254740992
"100000000000000000000" // false, it's a special case can be displayed and parsed correctly, but exceeds range of Number.MAX_SAFE_INTEGER, this case should be handled by BigInt, exclude this case can unify the mental model of developers.

// Float
"0.12345678901234567891" // false, when parsed to number is 0.12345678901234568
"1234.5678901234567891" // false, when parsed to number is 1234.567890123457
```

## Real World Use Cases

### Format Rules

#### E-commerce website shopping cart

The backend api may not always return number with string type, it may be empty or invalid due to some part of system issues(like traffic limit of this sub-system).

```javascript
const count = await fetchShoppingCartItemsCount();
if (typeof count !== 'string' || Number.isNaN(parseInt(count)) || !/^\d+$/.test(count)) {
  reportError('Invalid count');
  return
}

// Also for sub-subsequent operations(user create new order or delete order record)
renderShoppingCartItemsCountUI(parseInt(count));

userShoppingCart.onAdd(count => {
  count += 1
  renderShoppingCartItemsCountUI(count)
  saveToDatabase(count)
})

userShoppingCart.onDelete(count => {
  count -= 1
  renderShoppingCartItemsCountUI(count)
  saveToDatabase(count)
})
```
### Value Safety

#### Sheets application

For number type column, when user input is a string, we need to do those things by sequence:

1. Validate the format is correct
2. Parse the string to number, and save it to the database
3. Display the number to user(this step use Number.prototype.toString())

For this usecase, if user input is "9007199254740993", when save to the database, it will be 9007199254740992, and when display to user, it will be 9007199254740992.

This becomes a real problem we are facing.

## FAQ

### Why use strict format rules by default?

Both of them are works. and now I think this problem may belong to stage 1. (The validation rules should be strict by default or align with ECMAScript StringNumericLiteral format?).

If we align with ECMAScript StringNumericLiteral format, we can accept scientific notation string, like `1e-25`.

### Validating string but not transform to number?

There are many use cases that we need validate the string before using it.

- Render Web Sheets, especially for number type column, we need to validate the string before using it.
- Get shopping cart items count(original value type is string, because our backend system is java, for avoid java.Long overflow, so every number value is converted to string type), display to user, when user add new items, we need to transform string to numbers, and save it to the database.
- User inputs, like collect age, height, weight, etc.

### When calculation with safely numeric string number value, this result still not correct?

Yes. This is the problem bring by IEEE 754 double-precision format, I think we can't solve this problem and it's also not the scope of this method.

For example:

```javascript
const a = "0.1"
const b = "0.2"
const c = a + b
console.log(c) // 0.30000000000000004
```

And we just want to clarify, without any calculation, just transform numeric string to number, the result is maybe incorrect(`Number("9007199254740993") -> 9007199254740992`), that's why we need to use `Number.isSafeNumeric`.

The method is for reduce error, the issues brought by IEEE 754 double-precision format can't be solved by this method.

### Why use `Number.MAX_SAFE_INTEGER`?

Because the `Number.MAX_SAFE_INTEGER` is the maximum number that can be safely represented in JavaScript.

Although the case like `100000000000000000000` is bigger than `Number.MAX_SAFE_INTEGER` and can by parsed correctly, but it's exceeds the range of `Number.MAX_SAFE_INTEGER`, when do calculation, it's unsafe.

So, `Number.MAX_SAFE_INTEGER` is a clear and safe boundary for us to check, and it's also tell deveopers, if you value exceed this boundary, you should use `BigInt` or other libraries.

### The floating number store in javascript is not the real number value of numeric string?

Yes, but we need to clarify about numeric string / number store in javascript / IEEE 754 double-precision format.

Just use `0.1`.

- numeric string: `0.1`, the real number value is `0.1`
- number stored in javascript: `Number('0.1').toFixed(25)` -> `0.1000000000000000055511151`, if you want you can get more digits.
- IEEE 754 double-precision number displayed in decimal: **due to the 52-bit mantissa limit, the closest representable value to 0.1 is rounded to approximately `0.1000000000000000` in decimal.** And javascript ToString() method will choose the shortest string to represent the number, it's `0.1`.

So due to the float number's store behavior, **problems exist**. But we need to care about string's numeric value and IEEE 754 double-precision format of Number type, understanding the relationship and potential precision differences between them.


### Does this method going to create a numeric string for every number?

No, this input is already a numeric string, this means it's have fixed digits, which means a real number.

### How about a better name?

Yes, actually I'm already consider about this.

Some history:

- `String.prototype.isDigit`
- `String.isSafeDecimal`
- `[NOW] Number.isSafeNumeric`

Some names won't be used but in the discussion:

- `Number.isSafeParseable`
- `Number.isPreciseNumeric`

For what reason, if there exists better name, we could use it(discussion welcome).


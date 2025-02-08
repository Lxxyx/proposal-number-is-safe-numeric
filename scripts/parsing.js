// Test cases from the README table
const testCases = [
  ['Empty string', '', Number(''), parseInt(''), parseFloat(''), isFinite('')],
  ['Space', ' ', Number(' '), parseInt(' '), parseFloat(' '), isFinite(' ')],
  ['123.45', '123.45', Number('123.45'), parseInt('123.45'), parseFloat('123.45'), isFinite('123.45')],
  ['.123', '.123', Number('.123'), parseInt('.123'), parseFloat('.123'), isFinite('.123')],
  ['123.', '123.', Number('123.'), parseInt('123.'), parseFloat('123.'), isFinite('123.')],
  ['00123', '00123', Number('00123'), parseInt('00123'), parseFloat('00123'), isFinite('00123')],
  ['1e5', '1e5', Number('1e5'), parseInt('1e5'), parseFloat('1e5'), isFinite('1e5')],
  ['0x123', '0x123', Number('0x123'), parseInt('0x123'), parseFloat('0x123'), isFinite('0x123')],
  ['9007199254740993', '9007199254740993', Number('9007199254740993'), parseInt('9007199254740993'), parseFloat('9007199254740993'), isFinite('9007199254740993')],
  ['0.1234567890123456789', '0.1234567890123456789', Number('0.1234567890123456789'), parseInt('0.1234567890123456789'), parseFloat('0.1234567890123456789'), isFinite('0.1234567890123456789')],
  ['Infinity', 'Infinity', Number('Infinity'), parseInt('Infinity'), parseFloat('Infinity'), isFinite('Infinity')],
  ['-Infinity', '-Infinity', Number('-Infinity'), parseInt('-Infinity'), parseFloat('-Infinity'), isFinite('-Infinity')]
]

// Print table header
console.log('Input String | Number() | parseInt() | parseFloat() | isFinite()')
console.log('------------|----------|------------|--------------|------------')

// Print results
testCases.forEach(([label, input, num, int, float, finite]) => {
  console.log(`'${input}' | ${num} | ${int} | ${float} | ${finite}`)
}) 

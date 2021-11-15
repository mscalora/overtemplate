
const exprEval = require('expr-eval');
const nodeUtil = require('util');
const makeTemplate = require('../src/overtemplate.js');
const {expect} = require('chai');

function customEval (data, exp) {
  return (new exprEval.Parser()).evaluate(exp, data);
}

function customLoggingEval (data, exp, def, settings) {
  let value = settings.defaultExpressionEvaluator(data, exp, def, settings);
  console.log(`${new Date().toISOString()} ${exp} ${nodeUtil.inspect(value)}`);
  return value;
}

const NOW = new Date(),
    FRUITS = [ 'apples', 'oranges', 'bananas' ],
    COLORS = ['red', 'green', 'blue', 'orange'];

const FLINTSTONES_DATA = {
  people: [
    { first: 'Fred', last: 'Flintstone', age: 31, percent: 1/3, when: NOW},
    { first: 'Barney', last: 'Rubble', age: 29, percent: 2/3, when: new Date(2000, 4, 1, 1,11,0)},
  ]
};

const RESERVED_CHAR_RAW = '"&<>',
      RESERVED_CHAR_ESCAPED = '&quot;&amp;&lt;&gt;',
      RESERVED_CHAR_DATA = {
        reserved: RESERVED_CHAR_RAW,
        padded1: ` ${RESERVED_CHAR_RAW} `,
        padded2: `  ${RESERVED_CHAR_RAW}  `,
        padded3: `\t\t  ${RESERVED_CHAR_RAW}\t \t\t\n`,
      };

function one(tmpl, exp, data, settings) {
  let compiled = makeTemplate(tmpl, settings);

  expect(compiled(data)).to.eql(exp);
}

function exception(tmpl, message, data) {
  function make() {
    let compiled = makeTemplate(tmpl);

    return compiled(data);
  }
  expect(make).to.throw(message);
}


module.exports = {
  customEval: customEval,
  customLoggingEval: customLoggingEval,
  FRUITS: FRUITS,
  COLORS: COLORS,
  FLINTSTONES_DATA: FLINTSTONES_DATA,
  RESERVED_CHAR_RAW: RESERVED_CHAR_RAW,
  RESERVED_CHAR_ESCAPED: RESERVED_CHAR_ESCAPED,
  RESERVED_CHAR_DATA: RESERVED_CHAR_DATA,
  NOW: NOW,
  one: one,
  exception: exception,

};

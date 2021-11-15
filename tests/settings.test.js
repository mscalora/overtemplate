/* eslint-disable no-unused-vars */
'use strict';

const expect = require('chai').expect,
    makeTemplate = require('../src/overtemplate.js'),
    _ = require('lodash'),
    nodeUtil = require('util'),
    testUtils = require('./test-utils'),
    customEval = testUtils.customEval,
    customLoggingEval = testUtils.customLoggingEval;

const FRUITS = testUtils.FRUITS,
    COLORS = testUtils.COLORS,
    FLINTSTONES_DATA = testUtils.FLINTSTONES_DATA,
    RESERVED_CHAR_RAW = testUtils.RESERVED_CHAR_RAW,
    RESERVED_CHAR_ESCAPED = testUtils.RESERVED_CHAR_ESCAPED,
    RESERVED_CHAR_DATA = testUtils.RESERVED_CHAR_DATA,
    NOW = testUtils.NOW,
    one = testUtils.one,
    exception = testUtils.exception;

describe('debug test', function() {
  let altSettings = {altSyntax:true};
});


function generalRegression (settings) {

  function putAround (str, before, after) {
    return `${before}${str}${after}`;
  }

  it('escaped output tag', function () {
    one('<%- people[1].last %>, <%- people[1].first %>',
        'Rubble, Barney', FLINTSTONES_DATA, settings);
    one('<%- raw %>',
        RESERVED_CHAR_ESCAPED, {raw: RESERVED_CHAR_RAW}, settings);
    one('<%- "Mom & Pop" %>',
        'Mom &amp; Pop', null, settings);
    one('<%- "Mom & Pop" | upperCase %>',
        'MOM &amp; POP', null, settings);
    one('$<%- 123.456 | fixed(2) %>',
        '$123.46', null, settings);
    one('<%- text | normalize | capitalize %>',
        'I feel spaced out, man!',
        {text: '   i feel  spaced\tout,\n\n\t \tman!\n  '}, settings);
    let updatedSettings = Object.assign({}, settings || {});
    updatedSettings.filters = Object.assign({}, updatedSettings.filters || {}, {putAround: putAround});
    one('<%- now | putAround("-"; "-") | putAround(before; after) %>',
        'history-contemporary-future',
        {now: 'contemporary', after: 'future', before: 'history'},
        updatedSettings)
  });

  it('unescaped output tag', function () {
    one('<%= people[1].last %>, <%- people[1].first %>',
        'Rubble, Barney', FLINTSTONES_DATA, settings);
    one('<%= raw %>',
        RESERVED_CHAR_RAW, {raw: RESERVED_CHAR_RAW}, settings);
    one('<%= "Mom & Pop" %>',
        'Mom & Pop', null, settings);
    one('<%= url | htmlLink(text[2];"_blank")%>',
        '<a href="https://google.com/" target="_blank">search</a>',
        {url: 'https://google.com/', text: ['submit', 'query', 'search']},
        settings);
  });

  it('conditional tag', function () {
    one('<% if (yes) %><%- on %><% else %><%- off %><% end %>',
        'orange', {yes: 1, no: 0, on: "orange", off: "banana"}, settings);
    one('<% if (no) %><%- on %><% else %><%- off %><% end %>',
        'banana', {yes: 1, no: 0, on: "orange", off: "banana"}, settings);
  });

  it('loop tag', function () {
    one('<% for (fruits; fruit) %><%- fruit %> <% end %>',
        'apples oranges bananas ', {fruits:FRUITS}, settings);
    one('<% for (fruits; fruit) %><%- fruit %> <% end %>',
        'apples oranges bananas ', {fruits:FRUITS}, settings);
  });

  let altSettings = Object.assign({}, settings, {altSyntax: true})

  it('escaped output tag', function () {
    one('«- people[1].last », «- people[1].first »',
        'Rubble, Barney', FLINTSTONES_DATA, altSettings);
    one('«- raw »',
        RESERVED_CHAR_ESCAPED, {raw: RESERVED_CHAR_RAW}, altSettings);
    one('«- "Mom & Pop" »',
        'Mom &amp; Pop', null, altSettings);
    one('«- "Mom & Pop" ~ upperCase »',
        'MOM &amp; POP', null, altSettings);
    one('$«- 123.456 ~ fixed(2) »',
        '$123.46', null, altSettings);
    one('«- text ~ normalize ~ capitalize »',
        'I feel spaced out, man!',
        {text: '   i feel  spaced\tout,\n\n\t \tman!\n  '}, altSettings);
    let updatedSettings = Object.assign({}, altSettings || {});
    updatedSettings.filters = Object.assign({}, updatedSettings.filters || {}, {putAround: putAround});
    one('«- now ~ putAround("-"• "-") ~ putAround(before• after) »',
        'history-contemporary-future',
        {now: 'contemporary', after: 'future', before: 'history'},
        updatedSettings)
  });

  it('unescaped output tag', function () {
    one('«= people[1].last », «- people[1].first »',
        'Rubble, Barney', FLINTSTONES_DATA, altSettings);
    one('«= raw »',
        RESERVED_CHAR_RAW, {raw: RESERVED_CHAR_RAW}, altSettings);
    one('«= "Mom & Pop" »',
        'Mom & Pop', null, altSettings);
    one('«= url ~ htmlLink(text[2]•"_blank")»',
        '<a href="https://google.com/" target="_blank">search</a>',
        {url: 'https://google.com/', text: ['submit', 'query', 'search']},
        altSettings);
  });

  it('conditional tag', function () {
    one('« if (yes) »«- on »« else »«- off »« end »',
        'orange', {yes: 1, no: 0, on: "orange", off: "banana"}, altSettings);
    one('« if (no) »«- on »« else »«- off »« end »',
        'banana', {yes: 1, no: 0, on: "orange", off: "banana"}, altSettings);
  });

  it('loop tag', function () {
    one('« for (fruits• fruit) »«- fruit » « end »',
        'apples oranges bananas ', {fruits:FRUITS}, altSettings);
    one('« for (fruits• fruit) »«- fruit » « end »',
        'apples oranges bananas ', {fruits:FRUITS}, altSettings);
  });

}

describe('OverTemplate settings regression without default settings', function() {
  generalRegression({});
});

describe('OverTemplate settings: namedGroups', function() {
  it('works with namedGroups: true', function() {
    generalRegression({namedGroups: true});
  });

  it('works with ordered capture and a custom escape regexp', function() {
    one('&{message}', 'test &amp; verify', { message: 'test & verify' },
        {namedGroups: false, escape: /&{([^}]+?)}/g }
    );
  });
  it('works with ordered capture and a custom interpolate regexp', function() {
    one('&{message}', 'test & verify', { message: 'test & verify' },
        {namedGroups: false, interpolate: /&{([^}]+?)}/g }
    );
  });
  it('works with ordered capture using loop and end regexp', function() {
    one('«loop items as item»"<%-item%>", «end»', '"A", "B", "C", ', { items: Array.from('ABC') },
        { loop: /«\s*loop\s*([^»]+?) as ([^»]+?)»/g, terminate: /«\s*(end)\s*»/g }
    );
  });
  it('works with ordered capture using if and end regexp', function() {
    one('## IF test THEN ##True## ELSE ##False## END ##', 'False', { test: false },
        { conditional: /##\s*IF\s([^#]+?)\sTHEN\s*##/g, alternative: /##\s*(ELSE)\s*##/g, terminate: /##\s*(END)\s*##/g }
    );
  });

  it('works with named capture and a custom escape regexp', function() {
    one('&{message}', 'test &amp; verify', { message: 'test & verify' },
        {namedGroups: true, escape: /&{(?<escape>[^}]+?)}/g }
    );
  });
  it('works with named capture and a custom interpolate regexp', function() {
    one('&{message}', 'test & verify', { message: 'test & verify' },
        {namedGroups: true, interpolate: /&{(?<interpolate>[^}]+?)}/g }
    );
  });
  it('works with named capture using loop & end regexp', function() {
    one('«loop items as item»"<%-item%>", «end»', '"A", "B", "C", ', { items: Array.from('ABC') },
        {namedGroups: true, loop: /«\s*loop\s*(?<loopArray>[^»]+?) as (?<loopAlias>[^»]+?)»/g, terminate: /«\s*(?<terminate>end)\s*»/g }
    );
    // try reversing order of array & alias for a real test of named capture
    one('«loop item in items»"<%-item%>", «end»', '"A", "B", "C", ', { items: Array.from('ABC') },
        {namedGroups: true, loop: /«\s*loop\s*(?<loopAlias>[^»]+?) in (?<loopArray>[^»]+?)»/g, terminate: /«\s*(?<terminate>end)\s*»/g }
    );
  });
  it('works with named group capture using if and end regexp', function() {
    one('## IF test THEN ##True## ELSE ##False## END ##', 'False', { test: false },
        {namedGroups: true, conditional: /##\s*IF\s(?<conditional>[^#]+?)\sTHEN\s*##/g, alternative: /##\s*(?<alternative>ELSE)\s*##/g, terminate: /##\s*(?<terminate>END)\s*##/g }
    );
  });

  describe('more named group capture tests', function() {

    it('works with named group capture replacing all tag regexp', function() {

      const settings = {
        namedGroups: true,
        escape: /«-(?<escape>[^»]+?)»/g,
        interpolate: /«=(?<interpolate>[^»]+?)»/g,
        conditional: /«\s*if\s*\((?<conditional>[^»]+?)\)\s*»/g,
        loop: /«\s*for\s*\((?<loopAlias>[^»]+?)\sof\s(?<loopArray>[^»]+?)\)\s*»/g,
        terminate: /«\s*(?<terminate>end)\s*»/g,
        alternative: /«\s*(?<alternative>else)\s*»/g,
      };

      const template = 'There are « if (fruits.length) »«- fruits.length »« else »no« end » fruit\n' +
          '« for (fruit of fruits) »' +
          '  «- fruit_count ». «- fruit »\n' +
          '« end »';

      const data = {
        fruits: FRUITS,
      };

      const expected = 'There are 3 fruit\n' + FRUITS.map((f, i) => `  ${i+1}. ${f}\n`).join('');

      one(template, expected, data, settings);
    });

    it('works with parameterSeparator settings of a comma', function() {
      one('I like<% for (fruits, fruit) %> <%-fruit%>,<% end %>',
          'I like apples, oranges, bananas,',
          { fruits: FRUITS },
          {parameterSeparator: ','});
    });

    it('works with parameterSeparator settings of a special char: π', function() {
      one('I like<% for (fruits π fruit) %> <%-fruit%>,<% end %>',
          'I like apples, oranges, bananas,',
          { fruits: FRUITS },
          {parameterSeparator: 'π'});
    });

  });


});

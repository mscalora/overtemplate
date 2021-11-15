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
    NOW = testUtils.NOW;

describe('OverTemplate', function() {

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

  describe('Built-in Filters', function() {

    const RESERVED_CHAR_RAW = '"&<>',
        RESERVED_CHAR_ESCAPED = '&quot;&amp;&lt;&gt;',
        RESERVED_CHAR_DATA = {
          reserved: RESERVED_CHAR_RAW,
          padded1: ` ${RESERVED_CHAR_RAW} `,
          padded2: `  ${RESERVED_CHAR_RAW}  `,
          padded3: `\t\t  ${RESERVED_CHAR_RAW}\t \t\t\n`,
        };

    it('works with escape filter', function() {
      one(`<%= '${RESERVED_CHAR_RAW}' | escape %>`,
          RESERVED_CHAR_ESCAPED);
      one(`<%- '${RESERVED_CHAR_RAW}' %>`,
          RESERVED_CHAR_ESCAPED);
      one(`<%= reserved | escape %>`,
          RESERVED_CHAR_ESCAPED, RESERVED_CHAR_DATA);
      one(`<%= padded1 | escape %>`,
          ` ${RESERVED_CHAR_ESCAPED} `, RESERVED_CHAR_DATA);
      one(`<%- reserved %>`,
          RESERVED_CHAR_ESCAPED, RESERVED_CHAR_DATA);
    });

    it('works with trim filter', function() {
      one(`<%= '${RESERVED_CHAR_RAW}' | trim %>`,
          RESERVED_CHAR_RAW);
      one(`<%- '${RESERVED_CHAR_RAW}' | trim %>`,
          RESERVED_CHAR_ESCAPED);
      for (let key of Object.keys(RESERVED_CHAR_DATA)) {
        let str = RESERVED_CHAR_DATA[key];
        one(`<%= value | trim %>`,
            RESERVED_CHAR_RAW,{value:str});
        one(`<%- value | trim %>`,
            RESERVED_CHAR_ESCAPED,{value:str});
      }
    });

    const SENTENCES = [
          "Animals include giant panda, elephant, lion, horse, cow, lamb, pig, monkey and teddy bears.",
          " Animals include giant panda, elephant, lion, horse, cow, lamb, pig, monkey and teddy bears. ",
          "    Animals include giant panda, elephant, lion, horse, cow, lamb, pig, monkey and teddy bears.    ",
          "Animals include  giant panda,  elephant, lion, horse,  cow, lamb,  pig, monkey   and teddy bears.",
          " Animals include  giant   panda, elephant,  lion,  horse, cow,  lamb, pig,  monkey and  teddy bears. ",
          "    Animals  include  giant panda, elephant,   lion, horse, cow,  lamb, pig, monkey and teddy bears.    ",
          "\t  \t\t Animals\t include \tgiant\t\t panda, \t\telephant,\t \tlion,\t\t \t\thorse, cow,\t\t\t \t\t\tlamb,\n pig,\n\n monkey \n\n\nand \n\t\t\nteddy bears. \t\t \t  ",
        ],
        SENTENCES_UC = SENTENCES.map(s => s.toLocaleUpperCase()),
        SENTENCES_LC = SENTENCES.map(s => s.toLocaleLowerCase()),
        SENTENCE_WORDS = SENTENCES[0].split(/\s+/),
        SENTENCE_WORDS_UC = SENTENCE_WORDS.map(s => s.toLocaleLowerCase()),
        SENTENCE_WORDS_LC = SENTENCE_WORDS.map(s => s.toLocaleUpperCase()),
        SENTENCE_WORDS_CAP = SENTENCE_WORDS.map(_.capitalize);

    it('works with normalize filter', function() {
      one(`<%= "normal" | normalize %>`,
          "normal");
      one(`<%= "  normal   " | normalize %>`,
          "normal");
      one(`<%= "  \t\tnormal \t\t  " | normalize %>`,
          "normal");
      for (let key of Object.keys(SENTENCES)) {
        let str = SENTENCES[key];
        one(`<%= value | normalize %>`,
            SENTENCES[0],{value:str});
        one(`<%- value | normalize %>`,
            SENTENCES[0],{value:str});
      }
    });

    it('works with upperCase filter', function() {
      one('<% for (fruits; fruit) %><%- fruit | upperCase %>, <% end %>',
          'APPLES, ORANGES, BANANAS, ',
          {fruits: FRUITS});
      for (let key of Object.keys(SENTENCES)) {
        let str1 = SENTENCES[key],
            str2 = SENTENCES_UC[key],
            str3 = SENTENCES_LC[key],
            exp = SENTENCES[key].toLocaleUpperCase();
        one(`<%= value | upperCase %>`,
            exp,{value:str1});
        one(`<%= value | upperCase %>`,
            exp,{value:str2});
        one(`<%= value | upperCase %>`,
            exp,{value:str3});
      }
    });

    it('works with lowerCase filter', function() {
      one('<% for (fruits; fruit) %><%- fruit | lowerCase %>, <% end %>',
          'apples, oranges, bananas, ',
          {fruits: FRUITS});
      for (let key of Object.keys(SENTENCES)) {
        let str1 = SENTENCES[key],
            str2 = SENTENCES_UC[key],
            str3 = SENTENCES_LC[key],
            exp = SENTENCES[key].toLocaleLowerCase();
        one(`<%= value | lowerCase %>`,
            exp,{value:str1});
        one(`<%= value | lowerCase %>`,
            exp,{value:str2});
        one(`<%= value | lowerCase %>`,
            exp,{value:str3});
      }
    });

    it('works with capitalize filter', function() {
      one('<% for (fruits; fruit) %><%- fruit | capitalize %>, <% end %>',
          'Apples, Oranges, Bananas, ',
          {fruits: FRUITS});
      one(`<%= value | capitalize %>`,
          'Apples oranges bananas',{value:FRUITS.join(' ')});
      for (let key of Object.keys(SENTENCE_WORDS)) {
        let str1 = SENTENCE_WORDS[key],
            str2 = SENTENCE_WORDS_UC[key],
            str3 = SENTENCE_WORDS_LC[key],
            exp = _.capitalize(str1.toLocaleLowerCase());
        one(`<%= value | capitalize %>`,
            exp,{value:str1});
      }
      one('<%= "test" | capitalize %>',
          'Test');
      one('<%= "test" | capitalize(true) %>',
          'Test');
      one('<%= " test  " | capitalize(true) %>',
          'Test');
      one('<%= "TEST" | capitalize %>',
          'TEST');
      one('<%= "TEST" | lowerCase | capitalize %>',
          'Test');
      one('<%= "TEST" | capitalize(true) %>',
          'TEST');
      one('<%= " TEST " | capitalize(true) %>',
          'TEST');
      one('<%= "\t\tTEST  " | capitalize(true) %>',
          'TEST');
      one('<%= "test" | capitalize %>',
          'Test');
    });

    it('works with htmlWrap filter', function() {
      one('<% for (fruits; fruit) %><%= fruit | htmlWrap("b") %>, <% end %>',
          '<b>apples</b>, <b>oranges</b>, <b>bananas</b>, ',
          {fruits: FRUITS});
      one('<% for (fruits; fruit) %><%= fruit | htmlWrap("b"; "active") %>, <% end %>',
          '<b class="active">apples</b>, <b class="active">oranges</b>, <b class="active">bananas</b>, ',
          {fruits: FRUITS});
      one('<%= value | htmlWrap("span") %>',
          `<span>${RESERVED_CHAR_ESCAPED}</span>`, {value: RESERVED_CHAR_RAW});
      one('<%= "test" | htmlWrap("b"; "active bee-bop") %>',
          '<b class="active bee-bop">test</b>');
      one('<%= "test" | htmlWrap("b"! null! "color: red;") %>',
          '<b style="color: red;">test</b>', {}, {parameterSeparator: '!'});
      one('<%= value | htmlWrap("div"; null; null; true) %>',
          `<div>${RESERVED_CHAR_RAW}</div>`, {value: RESERVED_CHAR_RAW});
    });

    it('works with colorWrap filter', function() {
      one('<% for (fruits; fruit) %><%= fruit | colorWrap("purple"; "div") %>, <% end %>',
          '<div style="color:purple;">apples</div>, <div style="color:purple;">oranges</div>, <div style="color:purple;">bananas</div>, ',
          {fruits: FRUITS});
      one('<%= "foo" | colorWrap("brown"; "p") %>',
          '<p style="color:brown;">foo</p>');
      one('<%= "foo" | colorWrap("brown"• "section"• "special"• "background: #a00;"• false• "main-one") %>',
          '<section id="main-one" class="special" style="background: #a00; color:brown;">foo</section>', {}, {parameterSeparator: '•'});
      one('<%= text | colorWrap(color; tag; classes; css; false; id) %>',
          '<body id="main-content" class="active" style="text-align: center; color:yellow;"></body>', {color: "yellow", tag: "body", classes: "active", css:"text-align: center;", id:"main-content"});
    });

    it('works with htmlLink filter', function() {
      one('<%= url | htmlLink %>',
          '<a href="https://google.com/">https://google.com/</a>',
          {url: 'https://google.com/'});
      one('<%= url | htmlLink("search") %>',
          '<a href="https://google.com/">search</a>',
          {url: 'https://google.com/'});
      one('<%= url | htmlLink("search";"_blank";"underline-on-hover";false;"main-link") %>',
          '<a href="https://google.com/" target="_blank" class="underline-on-hover" id="main-link">search</a>',
          {url: 'https://google.com/'});
      one('<% for (sites;site) %><%= site.url | htmlLink(site.name;"_blank") %>\n<% end %>',
          '<a href="https://apple.com/" target="_blank">Apple</a>\n' +
          '<a href="https://google.com/" target="_blank">Google</a>\n' +
          '<a href="https://amazon.com/" target="_blank">Amazon</a>\n',
          {sites:[
              {url:"https://apple.com/",name:"Apple"},
              {url:"https://google.com/",name:"Google"},
              {url:"https://amazon.com/",name:"Amazon"},
            ]});
    });

    it('works with the pad built-in filters', function() {
      one('<%= "abcdef" | pad(3) %>', 'abcdef', {});
      one('<%= "abcdef" | pad(6) %>', 'abcdef', {});
      one('<%= "abcdef" | pad(10) %>', 'abcdef    ', {});
      one('<%= "abcdef" | pad(10; " "; "end") %>', 'abcdef    ', {});
      one('<%= "abcdef" | pad(10; " "; "start") %>', '    abcdef', {});
      one('<%= "abcdef" | pad(10; " "; "both") %>', '  abcdef  ', {});
      one('<%= "abcdef" | pad(10; " "; "center") %>', '  abcdef  ', {});
      one('<%= "abcdef" | pad(12; "-"; "end") %>', 'abcdef------', {});
      one('<%= "abcdef" | pad(7; "#"; "start") %>', '#abcdef', {});
      one('<%= "abcdef" | pad(14; "@"; "both") %>', '@@@@abcdef@@@@', {});
      one('<%= "abcdef" | pad(15; "@"; "both") %>', '@@@@abcdef@@@@@', {});
      one('<%= "abcdef" | pad(4; "?"; "center") %>', 'abcdef', {});
      one('<%= "abcdef" | pad(20; " ."; "end") %>', 'abcdef . . . . . . .', {});
      one('<%= "abcdef" | pad(21; " ."; "end") %>', 'abcdef . . . . . . . ', {});
      one('<%= "abcdef" | pad(20; " ."; "start") %>', ' . . . . . . .abcdef', {});
      one('<%= "abcdef" | pad(21; " ."; "start") %>', ' . . . . . . . abcdef', {});
      one('<%= "abcdef" | pad(20; ". "; "start") %>', '. . . . . . . abcdef', {});
      one('<%= "abcdef" | pad(21; ". "; "start") %>', '. . . . . . . .abcdef', {});
      one('<%= "abcdef" | pad(20; " ."; "both") %>', ' . . . abcdef . . . ', {});
      one('<%= "abcdef" | pad(21; " ."; "both") %>', ' . . . abcdef . . . .', {});
      one('<%= "abcdef" | pad(20; ". "; "both") %>', '. . . .abcdef. . . .', {});
      one('<%= "abcdef" | pad(21; ". "; "both") %>', '. . . .abcdef. . . . ', {});
      exception('<%= "abcdef" | pad(11; "-"; "not this") %>', 'side parameter expected to be one of: start, end, center or both', {});
    });

    it('works with the trunc built-in filters', function() {
      one('<%= "abcdef" | trunc(3) %>', 'abc', {});
      one('<%= "abcdef" | trunc(3; "") %>', 'abc', {});
      one('<%= "abcdef" | trunc(3; "start") %>', 'def', {});
      one('<%= "abcdef" | trunc(3; "end") %>', 'abc', {});
      one('<%= "abcdef" | trunc(3; "both") %>', 'bcd', {});
      one('<%= "abcdef" | trunc(3; "center") %>', 'bcd', {});
      one('<%= "abcdef" | trunc(4; "center") %>', 'bcde', {});
      one('<%= "abcdef" | trunc(5; "center") %>', 'abcde', {});
      one('<%= "abcdef" | trunc(6) %>', 'abcdef', {});
      one('<%= "abcdef" | trunc(10) %>', 'abcdef', {});
      exception('<%= "abcdef" | trunc(3; "-"; "not this") %>', 'side parameter expected to be one of: start, end, center, both or ellipsis', {});
    });

    it('works with the fit built-in filters', function() {
      one('<%= "abcdef" | fit(3) %>', 'abc', {});
      one('<%= "abcdef" | fit(3; "="; "both") %>', 'bcd', {});
      one('<%= "abcdef" | fit(10; "="; "both") %>', '==abcdef==', {});
      one('<%= "abcdef" | fit(6) %>', 'abcdef', {});
      one('<%= "abcdef" | fit(10) %>', 'abcdef    ', {});
    });

    it('works with the round and fixed built-in filters', function() {
      one('<%= 123 | round %>', '123', {});
      one('<%= 123.456 | round %>', '123', {});
      one('<%= 123.123 | round(1) %>', '123.1', {});
      one('<%= 123.456 | round(1) %>', '123.5', {});
      one('<%= 123.401 | round(2) %>', '123.4', {});
      one('<%= 123 | round(2) %>', '123', {});
      one('<%= 123.456 | fixed %>', '123', {});
      one('<%= 123.123 | fixed(1) %>', '123.1', {});
      one('<%= 123.456 | fixed(1) %>', '123.5', {});
      one('<%= 123 | fixed(2) %>', '123.00', {});
    });

    it('works with custom filters', function() {

      function custom_reverse_filter (s) {
        return Array.from(s).reverse().join('');
      }

      one('<% for (fruits; fruit) %><%- fruit | reverse | upperCase %>, <% end %>',
          'SELPPA, SEGNARO, SANANAB, ',
          {fruits: FRUITS},
          {filters:{reverse: custom_reverse_filter}});

      const ROT_CHAR = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
          ROT_INDEXES = Array.from(ROT_CHAR).reduce((m, c, i) => {m[c] = i; return m;},{});

      function rotate_string (str, num) {
        let s = Array.from(str).map(c => ROT_CHAR[(ROT_INDEXES[c] + num)% ROT_CHAR.length]).join('');
        return s;
      }

      one('<% for (fruits; fruit) %><%- fruit | rot(rotation_value) %>, <% end %>',
          'nCCyrF, BEnAtrF, onAnAnF, ',
          {fruits: FRUITS, rotation_value: 13},
          {filters:{rot: rotate_string}});
    });

    const ROT_CHAR = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
        ROT_INDEXES = Array.from(ROT_CHAR).reduce((m, c, i) => {m[c] = i; return m;},{});

    function rotate_string (str, num) {
      let s = Array.from(str).map(c => ROT_CHAR[(ROT_INDEXES[c] + num)% ROT_CHAR.length]).join('');
      return s;
    }

    it('works with custom filters', function() {

      function custom_reverse_filter (s) {
        return Array.from(s).reverse().join('');
      }

      one('<% for (fruits; fruit) %><%- fruit | reverse | upperCase %>, <% end %>',
          'SELPPA, SEGNARO, SANANAB, ',
          {fruits: FRUITS},
          {filters:{reverse: custom_reverse_filter}});

      one('<% for (fruits; fruit) %><%- fruit | rot(rotation_value) %>, <% end %>',
          'nCCyrF, BEnAtrF, onAnAnF, ',
          {fruits: FRUITS, rotation_value: 13},
          {filters:{rot: rotate_string}});
    });

    it('works with custom filters and custom expression evaluation', function() {

      one('<% for (["such", "simple", "stuff"]; it) %><%= it | rot(rotation_value + 37) | htmlWrap("div") %>'+
          '<% if (not it_last) %>, <% end %><% end %>',
          '<div>qsaf</div>, <div>qgknjc</div>, <div>qrsdd</div>',
          {rotation_value: 13},
          {
            expressionEvaluator: customEval,
            filters:{rot: rotate_string}
          });

    });
  });
});

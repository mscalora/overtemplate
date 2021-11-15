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


describe('OverTemplate formatters', function() {

  function datesAsISO (date, _, __) {
    return date.toISOString();
  }

  function percentFormatter (num, _, __, path) {
    return path.includes('percent') ? `${Math.round(num*1000)/10}%` : `${num}`;
  }

  it('works with default formatters', function() {

    one('Who: <%- people[0].first %>, What: <%- people[0].percent %>, When: <%- people[0].when %>',
        `Who: Fred, What: 0.3333333333333333, When: ${NOW.toLocaleString()}`, FLINTSTONES_DATA);

  });

  it('works with custom data formatter', function() {

    one('Who: <%- people[0].first %>, What: <%- people[0].percent %>, When: <%- people[0].when %>',
        `Who: Fred, What: 0.3333333333333333, When: ${NOW.toISOString()}`, FLINTSTONES_DATA, {dateFormatter: datesAsISO});

  });

  it('works with custom number formatter', function() {

    one('Who: <%- people[0].first %>, What: <%- people[0].percent %>, When: <%- people[0].when %>',
        `Who: Fred, What: 33.3%, When: ${NOW.toLocaleString()}`, FLINTSTONES_DATA, {numberFormatter: percentFormatter});

  });

  it('works with custom data and number formatters', function() {

    one('Who: <%- people[1].first %>, What: <%- people[1].percent %>, When: <%- people[1].when %>',
        `Who: Barney, What: 66.7%, When: ${FLINTSTONES_DATA.people[1].when.toISOString()}`, FLINTSTONES_DATA,
        {numberFormatter: percentFormatter, dateFormatter: datesAsISO});

  });

  it('works with all three types of custom formatters', function() {

    function customFormatter (v, d, s, e) {
      if (_.isDate(v)) {
        return s.dateFormatter(v, d, s, e);
      } else if (_.isNumber(v)) {
        return s.numberFormatter(v, d, s, e);
      } else if (/\.first$/.test(e.trim())) {
        return `${v}`.toUpperCase();
      }
      return v;
    }

    one('Who: <%- people[1].first %>, What: <%- people[1].percent %>, When: <%- people[1].when %>',
        `Who: BARNEY, What: 66.7%, When: ${FLINTSTONES_DATA.people[1].when.toISOString()}`, FLINTSTONES_DATA,
        {numberFormatter: percentFormatter, dateFormatter: datesAsISO, customFormatter: customFormatter});

    one('<% for (people; person) %><%= person %><% end %>',
        '[object Object][object Object]', FLINTSTONES_DATA);

  });

  it('works with a general custom formatter', function() {

    function jsonFormatter (v, d, s, e) {
      if (_.isDate(v)) {
        return s.dateFormatter(v, d, s, e);
      } else if (_.isNumber(v)) {
        return s.numberFormatter(v, d, s, e);
      } else if (_.isPlainObject(v)) {
        return JSON.stringify(v);
      }
      return v;
    }

    one('<% for (people; person) %><%- person_index %><%= person %><% end %>',
        FLINTSTONES_DATA.people.reduce((a, v, i) => a + i + JSON.stringify(v), ''),
        FLINTSTONES_DATA, {customFormatter: jsonFormatter});
  });

});

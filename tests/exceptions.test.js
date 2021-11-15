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


describe('OverTemplate exceptions', function() {
  it('should fail if an unexpected end tag is encountered', function() {
    exception('<%end%>', 'unexpected end of template structure', {});
  });

  it('should fail if an unexpected else tag is encountered', function() {
    exception('<%else%>', 'unexpected else', {});
  });

  it('should fail if an unterminated if tag is encountered', function() {
    exception('<% if (test) %>', 'unterminated if', { test: true });
  });
  it('should fail if an unterminated loop/for tag is encountered', function() {
    exception('<% for (list;_it) %>', 'unterminated loop', { list: [] });
  });
  it('should fail if an unknown filter is encountered', function() {
    exception('<%- "test" | unknownFilter %>', 'unknown filter function: unknownFilter', { list: [] });
  });
});

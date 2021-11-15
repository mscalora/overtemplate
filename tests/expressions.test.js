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

describe('OverTemplate expressions', function() {
  it('works with custom expression evaluators', function() {
    one('Simple with default: <%- people[1].first %>',
        'Simple with default: Barney',
        FLINTSTONES_DATA);

    one('Logging: <%- people[1].first %>',
        'Logging: Barney',
        FLINTSTONES_DATA, {expressionEvaluator: customLoggingEval});

    one('ExprEval: <%- people[1].first %>',
        'ExprEval: Barney',
        FLINTSTONES_DATA, {expressionEvaluator: customEval});
    one('ExprEval Math: <%- 5+7 %>',
        'ExprEval Math: 12',
        FLINTSTONES_DATA, {expressionEvaluator: customEval});
    one('ExprEval Mixed: <% for (people; person) %><%- person.age / 2 %>' +
        '<% if (not person_last) %>,<% end %><% end %>',
        'ExprEval Mixed: 15.5,14.5',
        FLINTSTONES_DATA, {expressionEvaluator: customEval});
    one('ExprEval Beyond JS: <% for (people; person) %>' +
        '<%= person_first ? "[" : "" %>' +
        '<%- person.age^2 %>:<%- roundTo(person.percent,2) %>%' +
        '<%= person_last ? "]" : "," %><% end %>',
        'ExprEval Beyond JS: [961:0.33%,841:0.67%]',
        FLINTSTONES_DATA, {expressionEvaluator: customEval});

  });
});

'use strict';

/* eslint-disable no-unused-vars */

const _ = require('./lodash'); // our local, smaller version

/** @type OverTemplateSettings */
const DEFAULT_ORDERED_PARSING = {
  namedGroups: false,
  escape: /<%-([\s\S]+?)%>/g,
  interpolate: /<%=([\s\S]+?)%>/g,
  terminate: /<%\s*?(end)\s*?%>/g,
  conditional: /<%\s*?if\s*?\(((?:.(?!%>))+?)\)\s*?%>/g,
  alternative: /<%\s*?(else)\s*?%>/g,
  loop: /<%\s*?for\s*?\(((?:.(?!%>))+?);((?:.(?!%>))+?)\)\s*?%>/g,
};

/** @type OverTemplateSettings */
const DEFAULT_NAMED_CAPTURE_PARSING = {
  namedGroups: true,
  escape: /<%-(?<escape>[\s\S]+?)%>/g,
  interpolate: /<%=(?<interpolate>[\s\S]+?)%>/g,
  terminate: /<%\s*?(?<terminate>end)\s*?%>/g,
  conditional: /<%\s*?if\s*?\((?<conditional>(?:.(?!%>))+?)\)\s*?%>/g,
  alternative: /<%\s*?(?<alternative>else)\s*?%>/g,
  loop: /<%\s*?for\s*?\((?<loopArray>(?:.(?!%>))+?);(?<loopAlias>(?:.(?!%>))+?)\)\s*?%>/g,
};

const BUILT_IN_LOGIC = {
  defaultNumberFormatter: function (n, _, __) { return `${n}`; },
  defaultDateFormatter: function (d, _, __) { return d.toLocaleString(); },
  defaultFormatter: defaultFormatter,
  defaultExpressionEvaluator: _.get,
};

const DEFAULT_LOGIC = {
  numberFormatter: BUILT_IN_LOGIC.defaultNumberFormatter,
  dateFormatter: BUILT_IN_LOGIC.defaultDateFormatter,
  expressionEvaluator: BUILT_IN_LOGIC.defaultExpressionEvaluator,
};

const ESCAPE_ENTITIES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;', // eslint-disable-line quotes
  '`': '&#x60;',
};

/**
 * evaluate interpolatable expression/path
 * @param {string} expression
 * @param {Object} data
 * @param {OverTemplateSettings} [settings]
 * @returns {any}
 * @private
 */
function getValue(expression, data, settings, ) {
  return settings.expressionEvaluator(data, `${expression}`.trim(), '', settings);
}

/**
 * evaluate interpolatable expression/path to formatted value
 * @param {string} expression
 * @param {Object} data
 * @param {OverTemplateSettings} [settings]
 * @returns {any}
 * @private
 */
function getFormattedValue(expression, data, settings) {
  let value = getValue(expression, data, settings);
  if (settings.customFormatter) {
    return settings.customFormatter(value, data, settings, expression);
  }
  return defaultFormatter(value, data, settings, expression);
}

function defaultFormatter (value, data, settings, expression) {
  if (_.isNumber(value)) {
    return settings.numberFormatter(value, data, settings, expression);
  } else if (_.isDate(value)) {
    return settings.dateFormatter(value, data, settings, expression);
  }
  return `${value}`;
}

/**
 * convert special characters in a string to HTML entities
 * @param {String} str
 * @returns {String}
 * @private
 */
function escapeHTML(str) {
  let pattern = '(?:' + Object.keys(ESCAPE_ENTITIES).join('|') + ')',
      testRegExp = new RegExp(pattern),
      replaceRegExp = new RegExp(pattern, 'g');

  if (testRegExp.test(str)) {
    return str.replace(replaceRegExp, function(match) {
      return ESCAPE_ENTITIES[match];
    });
  }

  return str;
}

/**
 * @callback OverTemplateFunction
 * @param {Object} data
 * @returns {string}
 * */

/**
 * @callback OverTemplateNumberFormatterType
 * @param {String} expression
 * @param {Object} data
 * @param {OverTemplateSettings} [settings]
 * @returns {string}
 */

/**
 * @callback ExpressionEvaluatorType
 * @param {Object} data
 * @param {String} expression
 * @param {any} defaultValue
 * @param {OverTemplateSettings} [settings]
 * @returns {any}
 */

/** @typedef {Object} OverTemplateSettings
 *  @property {boolean} namedGroups
 *  @property {RegExp} escape
 *  @property {RegExp} interpolate
 *  @property {RegExp} terminate
 *  @property {RegExp} conditional
 *  @property {RegExp} alternative
 *  @property {RegExp} loop
 *  @property {ExpressionEvaluatorType} [expressionEvaluator]
 *  @property {OverTemplateNumberFormatter} [numberFormatter]
 *  @property {OverTemplateDateFormatter} [dateFormatter]
 *  @property {OverTemplateCustomFormatter|null} [customFormatter]
 *  @property {string} [parameterSeparator] use alternate parameter separator (e.g. for tag)
 */

/** @typedef {OverTemplateNumberFormatterType} OverTemplateNumberFormatter */
/** @typedef {OverTemplateNumberFormatterType} OverTemplateDateFormatter */
/** @typedef {OverTemplateNumberFormatterType} OverTemplateCustomFormatter */

function getParsingSettings (settings, useNamedParsing) {
  let parsing = {},
      defaultParsers = useNamedParsing ? DEFAULT_NAMED_CAPTURE_PARSING : DEFAULT_ORDERED_PARSING;
  for (let item of Object.keys(defaultParsers)) {
    if (settings[item]) {
      parsing[item] = settings[item];
    } else if (settings.parameterSeparator && defaultParsers[item].source) {
      parsing[item] = new RegExp(defaultParsers[item].source.replace(/;/g,settings.parameterSeparator));
    } else {
      parsing[item] = defaultParsers[item];
    }
    settings[item] = parsing[item];
  }
  return parsing;
}

/**
 * compile template string into template function
 * @param {String} text
 * @param {OverTemplateSettings} [userSettings]
 * @returns {OverTemplateFunction}
 */
function compile(text, userSettings) {
  let parts = [],
      settings = Object.assign({}, BUILT_IN_LOGIC, DEFAULT_LOGIC, userSettings || {}),
      regExpPattern,
      matcher,
      match,
      position = 0;

  const ESCAPE = 1,
      INTERPOLATE = 2,
      TERMINATE = 3,
      CONDITIONAL = 4,
      ALTERNATIVE = 5,
      LOOP = 6,
      resolvedRegExp = getParsingSettings(settings, _.get(userSettings, 'namedGroups', false))

  regExpPattern = [
    resolvedRegExp.escape.source,
    resolvedRegExp.interpolate.source,
    resolvedRegExp.terminate.source,
    resolvedRegExp.conditional.source,
    resolvedRegExp.alternative.source,
    resolvedRegExp.loop.source,
  ];
  matcher = new RegExp(regExpPattern.join('|') + '|(?<eos>$)', 'g');

  while ((match = matcher.exec(text)) !== null) {
    let groups = match.groups || {},
        param;

    parts.push(text.slice(position, match.index));
    position = matcher.lastIndex;

    if ((param = !settings.namedGroups ? match[ESCAPE] : groups.escape)) {
      parts.push((data) => escapeHTML(getFormattedValue(param, data, settings)));
    } else if ((param = !settings.namedGroups ? match[INTERPOLATE] : groups.interpolate)) {
      parts.push((data) => getFormattedValue(param, data, settings));
    } else if (!settings.namedGroups ? match[TERMINATE] : groups.terminate) {
      parts.push(['end']);
    } else if (!settings.namedGroups ? match[ALTERNATIVE] : groups.alternative) {
      parts.push(['else']);
    } else if ((param = !settings.namedGroups ? match[CONDITIONAL] : groups.conditional)) {
      parts.push(['if', param]);
    } else if ((param = !settings.namedGroups ? match[LOOP] : groups.loopArray)) {
      parts.push(['loop', param, (groups.loopAlias || match[LOOP+1] || '_item').trim()]);
    } else {
      break;
    }
  }

  return function(data) {
    let str = '',
        pos = 0,
        stack = [],
        suppress = false;

    while (pos < parts.length) {
      let part = parts[pos];

      if (_.isFunction(part)) {
        str += suppress ? '' : part(data);
      } else if (_.isArray(part)) {
        let top = stack[stack.length - 1],
            structure = top && top.structure;

        switch (part[0]) {
          case 'end': {
            if (!structure) {
              throw new Error('unexpected end of template structure');
            } else if (structure === 'if') {
              stack.pop();
              suppress = top.suppressed; // restore suppression value
              break;
            } else if (structure === 'loop') {
              top.index += 1;
              if (top.index < top.collection.length && !top.suppressed) {
                data[top.alias] = top.collection[top.index];
                data[top.alias + '_index'] = top.index;
                data[top.alias + '_count'] = top.index + 1;
                data[top.alias + '_first'] = top.index === 0;
                data[top.alias + '_last'] = top.index === top.collection.length - 1;
                pos = top.position;
              } else {
                stack.pop();
                delete data[top.alias];
                delete data[top.alias + '_index'];
                delete data[top.alias + '_count'];
                delete data[top.alias + '_length'];
                delete data[top.alias + '_first'];
                delete data[top.alias + '_last'];
              }
            } else {
              throw new Error('end of unexpected template structure: ' + part[0]);
            }
            break;
          }
          case 'loop': {
            let collection = getValue(part[1], data, settings),
                alias = part[2];

            stack.push({ structure: 'loop', collection: collection, alias: part[2], index: 0, position: pos, suppressed: suppress });
            if (!collection.length) {
              suppress = true;
            }
            if (!suppress) {
              data[alias] = collection[0];
              data[alias + '_index'] = 0;
              data[alias + '_count'] = 1;
              data[alias + '_length'] = collection.length;
              data[alias + '_first'] = true;
              data[alias + '_last'] = collection.length === 1;
            }
            break;
          }
          case 'if': {
            let condition = getValue(part[1], data, settings);

            stack.push({ structure: 'if', condition: condition, suppressed: suppress });
            suppress = suppress || !condition; // suppress appropriately is not currently suppressed
            break;
          }
          case 'else': {
            if (structure !== 'if') {
              throw new Error('unexpected else');
            }
            suppress = top.suppressed || !suppress; // toggle suppress if suppress wasn't turned on before the if
            break;
          }
          default: {
            throw new Error('unimplemented structure');
          }
        }
      } else {
        str += suppress ? '' : part;
      }
      pos += 1;
    }
    if (stack.length) {
      let top = stack.pop();

      throw new Error('unterminated ' + top.structure);
    }
    return str;
  };
}

module.exports = compile;

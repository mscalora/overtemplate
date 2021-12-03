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

/** @type OverTemplateSettings */
const DEFAULT_ALT_ORDERED_PARSING = {
  namedGroups: false,
  escape: /«-([\s\S]+?)»/g,
  interpolate: /«=([\s\S]+?)»/g,
  terminate: /«\s*?(end)\s*?»/g,
  conditional: /«\s*?if\s*?\(((?:.(?!»))+?)\)\s*?»/g,
  alternative: /«\s*?(else)\s*?»/g,
  loop: /«\s*?for\s*?\(((?:.(?!»))+?);((?:.(?!»))+?)\)\s*?»/g,
};

/** @type OverTemplateSettings */
const DEFAULT_ALT_NAMED_CAPTURE_PARSING = {
  namedGroups: true,
  escape: /«-(?<escape>[\s\S]+?)»/g,
  interpolate: /«=(?<interpolate>[\s\S]+?)»/g,
  terminate: /«\s*?(?<terminate>end)\s*?»/g,
  conditional: /«\s*?if\s*?\((?<conditional>(?:.(?!»))+?)\)\s*?»/g,
  alternative: /«\s*?(?<alternative>else)\s*?»/g,
  loop: /«\s*?for\s*?\((?<loopArray>(?:.(?!»))+?)•(?<loopAlias>(?:.(?!»))+?)\)\s*?»/g,
};

const DEFAULT_FILTER_SEPARATOR = '|',
    DEFAULT_PARAMETER_SEPARATOR = ';',
    PARAMETER_SEPARATOR_REGEXP = new RegExp(DEFAULT_PARAMETER_SEPARATOR, 'g'),
    DEFAULT_ALT_FILTER_SEPARATOR = '~',
    DEFAULT_ALT_PARAMETER_SEPARATOR = '•',
    ALT_PARAMETER_SEPARATOR_REGEXP = new RegExp(DEFAULT_PARAMETER_SEPARATOR, 'g');

const BUILTIN_LOGIC = {
  defaultNumberFormatter: function (n, _, __) { return `${n}`; },
  defaultDateFormatter: function (d, _, __) { return d.toLocaleString(); },
  defaultFormatter: defaultFormatter,
  defaultExpressionEvaluator: slightlySmarterGet,
};

const BUILTIN_SYNTAX = {
  parameterSeparator: DEFAULT_PARAMETER_SEPARATOR,
  filterSeparator: DEFAULT_FILTER_SEPARATOR,
  altSyntax: false,
};

const BUILTIN_ALT_SYNTAX = {
  parameterSeparator: DEFAULT_ALT_PARAMETER_SEPARATOR,
  filterSeparator: DEFAULT_ALT_FILTER_SEPARATOR,
  altSyntax: true,
};

const DEFAULT_LOGIC = {
  numberFormatter: BUILTIN_LOGIC.defaultNumberFormatter,
  dateFormatter: BUILTIN_LOGIC.defaultDateFormatter,
  expressionEvaluator: BUILTIN_LOGIC.defaultExpressionEvaluator,
};

const ESCAPE_ENTITIES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;', // eslint-disable-line quotes
  '`': '&#x60;',
};

const LITERAL_KEYWORDS = {
      'true': true,
      'false': false,
      'null': null,
      'undefined': undefined,
    };

const BUILTIN_FILTERS = {
  escape: escapeHTML,
  trim: trim,
  normalize: normalize,
  pad: pad,
  trunc: trunc,
  fit: fit,
  lowerCase: (s) => s.toLocaleLowerCase(),
  upperCase: (s) => s.toLocaleUpperCase(),
  capitalize: capitalize,
  wrapWith: wrapWith,
  htmlWrap: htmlWrap,
  colorWrap: htmlColorWrap,
  htmlLink: htmlLink,
  round: (value, digits) => Number(Number(value).toFixed(digits || 0)),
  fixed: (value, digits) => Number(value).toFixed(digits || 0),
  hex: hex,
  rot13 : rot13,
  slice: (a,s,e) => Array.from(a).slice(s,e),
  join: join,
  substr: (s,p,l) => String(s).substr(p, l),
  pick: pick,
  toNumber: (value) => Number(value),
  toFloat: (value) => parseFloat(value),
  toInteger: (value, radix) => parseInt(value, radix),
  toDate: (value) => new Date(value),
  asDate: (value) => new Date(value).toDateString(),
  asTime: (value) => new Date(value).toTimeString(),
  msToDate: (value, radix) => new Date(parseInt(value, radix)),
};

/**
 * check for string or numeric literals otherwise use _.get to evaluate expression/path
 * @param {Object} data
 * @param {string} expression
 * @param {any} defaultValue
 * @return {any}
 */
function slightlySmarterGet (data, expression, defaultValue) {
  let match = /^\s*([`'"])(.*?)\1\s*$|^\s*((?:[-.+][0-9]|[0-9]).*?)\s*$|^\s*(true|false|null|undefined)\s*$/.exec(expression);
  if (match) {
    if (match[2]) {
      return match[2];
    } else if (match[3]) {
      return parseFloat(match[3]);
    } else if (match[4]) {
      return LITERAL_KEYWORDS[match[4]];
    }
  }
  return _.get(data, expression, defaultValue);
}

/**
 * evaluate interpolatable expression/path
 * @param {string} expression
 * @param {Object} data
 * @param {OverTemplateSettings} [settings]
 * @returns {any}
 * @private
 */
function getValue(expression, data, settings) {
  return settings.expressionEvaluator(data, `${expression}`.trim(), '', settings);
}

function parseFilter(filterString, data, settings, expression) {
  let match = /^\s*([^(]+)\s*\((.+)\)\s*$/.exec(filterString),
      filter = [(match && match[1] || filterString).trim()];
  if (!match) {
    return filter;
  }
  return filter.concat(match[2].split(settings.parameterSeparator).map(v => v.trim()).filter(v => !!v));
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
  let parts = settings.filterSeparator ? expression.split(settings.filterSeparator) : [expression],
      expr = parts.shift().trim(),
      value = getValue(expr, data, settings);
  for (let filter of parts) {
    let filterParts = parseFilter(filter, data, settings, expression),
        filterName = filterParts.shift(),
        filterFunc = settings.filters[filterName];
    if (!filterFunc) {
      throw new Error(`unknown filter function: ${filterName}`);
    }
    let params = filterParts.map((param) => settings.expressionEvaluator(data, param, null, settings));
    value = filterFunc.apply({settings: settings, data: data, expression: expression}, [value].concat(params));
  }
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
  return `${value === undefined ? '' : value}`;
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
 * @param {OverTemplateSettings} settings
 * @param {string} expression
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

/**
 * filter output
 * @callback OverTemplateFilter
 * @param {any} value
 * @param {Object} data
 * @param {OverTemplateSettings} settings
 * @param {String} expression
 * @return {any}
 */

/** @typedef {Object} OverTemplateSettings
 *  @property {boolean} namedGroups
 *  @property {boolean} altSyntax
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
 *  @property {string} [parameterSeparator] use alternate parameter separator (e.g. for tag) default: ;
 *  @property {string} [filterSeparator] use alternate filter separator (e.g. for tag) default: #
 *  @property {Object<string,OverTemplateFilter>} [filters]
 */

/** @typedef {OverTemplateNumberFormatterType} OverTemplateNumberFormatter */
/** @typedef {OverTemplateNumberFormatterType} OverTemplateDateFormatter */
/** @typedef {OverTemplateNumberFormatterType} OverTemplateCustomFormatter */

function getParsingSettings (settings, useNamedParsing) {
  let parsing = {},
      defaultParsers = settings.altSyntax ?
          useNamedParsing ? DEFAULT_ALT_NAMED_CAPTURE_PARSING : DEFAULT_ALT_ORDERED_PARSING :
          useNamedParsing ? DEFAULT_NAMED_CAPTURE_PARSING : DEFAULT_ORDERED_PARSING;
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
function overtemplate (text, userSettings) {
  let parts = [],
      builtInSyntax = userSettings && userSettings.altSyntax ? BUILTIN_ALT_SYNTAX : BUILTIN_SYNTAX,
      settings = Object.assign({}, builtInSyntax, BUILTIN_LOGIC, DEFAULT_LOGIC, userSettings || {}),
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

  settings.filters = Object.assign({}, BUILTIN_FILTERS, userSettings && userSettings.filters || {});

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

    data = data || {};

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

function trim (str, side) {
  if (side === 'side') {
    return String(str).replace(/^\s+/, '');
  } else if (side === 'end') {
    return String(str).replace(/\s+$/, '');
  } else if (!side || side === 'both') {
    return String(str).trim();
  } else {
    throw new Error('side parameter expected to be one of: start, end or both')
  }
}

function normalize (str, sub) {
  return String(str).trim().split(/\s+/).join(sub === undefined ? ' ' : sub);
}

function capitalize (str, trim, force) {
  let s = String(str);
  if (trim) {
    s = s.trim();
  }
  if (force) {
    s = s.toLocaleLowerCase();
  }
  if (s.length) {
    return s[0].toLocaleUpperCase() + s.substr(1);
  }
  return s;
}

function wrapWith (str, start, end, between) {
  return `${start || ''}${start && between || ''}${str}${end && between || ''}${end || ''}`
}

function htmlWrap (str, tag, classes, style, raw, id) {
  return `<${tag || 'div'}` +
      `${id ? ` id="${id}"` : ''}`+
      `${classes ? ` class="${classes}"` : ''}`+
      `${style ? ` style="${(''+style).replace(/%3B/ig,';')}"` : ''}`+
      `>${raw ? str : escapeHTML(str)}</${tag || 'div'}>`;
}

function htmlColorWrap (str, color, tag, classes, style, raw, id) {
  let c = `color:${color || 'red'};`,
      css = style ? `${style} ${c}` : c;
  return htmlWrap(str, tag || 'span', classes, css, raw, id);
}

function htmlLink (url, linkText, target, classes, raw, id) {
  return `<a href="${url}"` +
      `${target ? ` target="${target}"` : ''}`+
      `${classes ? ` class="${classes}"` : ''}`+
      `${id ? ` id="${id}"` : ''}`+
      `>${escapeHTML(linkText || url)}</a>`;
}

function pad (str, len, char, side) {
  let delta = len - str.length;
  if (delta <= 0) {
    return str;
  } else if (side === 'start') {
    return ((str.length < len) ? new Array(delta + 1).join(char || ' ') : '').substr(0, delta) + str;
  } else if (side === 'both' || side === 'center') {
    return new Array(Math.trunc(delta/2) + 1).join(char || ' ').substr(0, Math.trunc(delta/2)) +
        str + new Array(Math.ceil(delta/2) + 1).join(char || ' ').substr(0, Math.ceil(delta/2));
  } else if (side === 'end' || !side) {
    return str + ((str.length < len) ? new Array(delta + 1).join(char || ' ') : '').substr(0, delta);
  } else {
    throw new Error('side parameter expected to be one of: start, end, center or both');
  }
}

function trunc (str, len, side, ellipsis) {
  let s = `${str}`;
  if (s.length <= len) {
    return s;
  } else if (side === 'start') {
    return s.substr(s.length - len);
  } else if (side === 'both' || side === 'center') {
    return s.substr(Math.trunc((str.length - len)/2), len)
  } else if (side === 'end' || !side) {
    return s.substr(0, len);
  } else if (side === 'ellipsis') {
    return s.substr(0, len-1) + (ellipsis || '…');
  } else {
    throw new Error('side parameter expected to be one of: start, end, center, both or ellipsis');
  }
}

function fit (str, len, char, side, ellipsis) {
  if (`${str}`.length > len) {
    return trunc(str, len, side, ellipsis);
  }
  return pad(str, len, char, side==='ellipsis' ? 'end' : side);
}

function hex (value, prefix, upperCase) {
  let val = _.isNumber(value) ? value : parseFloat(value);
  if (upperCase) {
    return `${prefix || ''}${val.toString(16).toLocaleUpperCase()}`;
  }
  return `${prefix || ''}${val.toString(16)}`;
}

function pick (value, index, defaultValue) {
  let val = value[index];
  return val === undefined ? defaultValue : val;
}

function join (value, separator, lastSeparator) {
  let a = Array.from(value),
      s = separator === undefined || separator === null ? ' ': separator,
      l = lastSeparator === undefined || lastSeparator === null ? s : lastSeparator;
  if (l !== s && a.length>1) {
    return [a.slice(0,-1).join(s), a.slice(-1)].join(l);
  }
  return a.join(l);
}

function rot13 (value) {
  return Array.from(`${value}`).map(c =>
      String.fromCharCode(c.charCodeAt(0) + [-13,0,13][c.replace(/([a-m])|[n-z]/i, '$1$1').length])
  ).join('');
}

overtemplate .builtinFilters = Object.assign({}, BUILTIN_FILTERS);
overtemplate .builtinFilterNames = Object.keys(BUILTIN_FILTERS);

if (typeof window === 'object') {
  window.overtemplate = overtemplate ;
  window.__overtemplate = overtemplate ;
}
if (typeof module !== 'undefined') {
  module.exports = overtemplate ;
}

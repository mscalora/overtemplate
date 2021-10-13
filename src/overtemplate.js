'use strict';

/*global module*/

const _ = require('./lodash'); // our local, smaller version

const DEFAULT_SETTINGS = {
  namedGroups: false,
  escape: /<%-([\s\S]+?)%>/g,
  interpolate: /<%=([\s\S]+?)%>/g,
  terminate: /<%\s*?(end)\s*?%>/g,
  conditional: /<%\s*?if\s*?\(([^)]+?)\)\s*?%>/g,
  alternative: /<%\s*?(else)\s*?%>/g,
  loop: /<%\s*?for\s*?\(([^)]+?),([^)]+?)\)\s*?%>/g,
};

const DEFAULT_NAMED_CAPTURE_SETTINGS = {
  namedGroups: true,
  escape: /<%-(?<escape>[\s\S]+?)%>/g,
  interpolate: /<%=(?<interpolate>[\s\S]+?)%>/g,
  terminate: /<%\s*?(?<terminate>end)\s*?%>/g,
  conditional: /<%\s*?if\s*?\((?<conditional>[^)]+?)\)\s*?%>/g,
  alternative: /<%\s*?(?<alternative>else)\s*?%>/g,
  loop: /<%\s*?for\s*?\((?<loopArray>[^)]+?),(?<loopAlias>[^)]+?)\)\s*?%>/g,
};

const ESCAPE_ENTITIES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;', // eslint-disable-line quotes
  '`': '&#x60;',
};

function getValue(path, data) {
  return _.get(data, _.trim(path), '');
}

function escapeHTML(str) {
  let pattern = '(?:' + _.keys(ESCAPE_ENTITIES).join('|') + ')',
      testRegExp = new RegExp(pattern),
      replaceRegExp = new RegExp(pattern, 'g');

  if (testRegExp.test(str)) {
    return str.replace(replaceRegExp, function(match) {
      return ESCAPE_ENTITIES[match];
    });
  }

  return str;
}

function compile(text, userSettings) {
  let parts = [],
      settings = _.defaults({}, userSettings),
      regExpPattern,
      matcher,
      match,
      position = 0;

  const ESCAPE = 1,
      INTERPOLATE = 2,
      TERMINATE = 3,
      CONDITIONAL = 4,
      ALTERNATIVE = 5,
      LOOP = 6;

  _.defaults(settings, settings.namedGroups ? DEFAULT_NAMED_CAPTURE_SETTINGS : DEFAULT_SETTINGS);

  regExpPattern = [
    settings.escape.source,
    settings.interpolate.source,
    settings.terminate.source,
    settings.conditional.source,
    settings.alternative.source,
    settings.loop.source,
  ];
  matcher = new RegExp(regExpPattern.join('|') + '|(?<eos>$)', 'g');

  while ((match = matcher.exec(text)) !== null) {
    let groups = match.groups || {},
        param;

    parts.push(text.slice(position, match.index));
    position = matcher.lastIndex;

    if ((param = !settings.namedGroups ? match[ESCAPE] : groups.escape)) {
      parts.push((data) => escapeHTML(getValue(param, data)));
    } else if ((param = !settings.namedGroups ? match[INTERPOLATE] : groups.interpolate)) {
      parts.push((data) => getValue(param, data));
    } else if (!settings.namedGroups ? match[TERMINATE] : groups.terminate) {
      parts.push(['end']);
    } else if (!settings.namedGroups ? match[ALTERNATIVE] : groups.alternative) {
      parts.push(['else']);
    } else if ((param = !settings.namedGroups ? match[CONDITIONAL] : groups.conditional)) {
      parts.push(['if', param]);
    } else if ((param = !settings.namedGroups ? match[LOOP] : groups.loopArray)) {
      parts.push(['loop', param, _.trim(groups.loopAlias || match[LOOP+1] || '_item')]);
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
            let collection = getValue(part[1], data),
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
            let condition = getValue(part[1], data);

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

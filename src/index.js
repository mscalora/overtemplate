'use strict';

/*global module*/

const _ = require('./lodash'); // our local, smaller version

const DEFAULT_SETTINGS = {
   escape: /<%-([\s\S]+?)%>/g,
   interpolate: /<%=([\s\S]+?)%>/g,
   terminate: /<%\s*?(end)\s*?%>/g,
   loop: /<%\s*?for\s*?\(([^)]+?),([^)]+?)\)\s*?%>/g,
   conditional: /<%\s*?if\s*?\(([^)]+?)\)\s*?%>/g,
   alternative: /<%\s*?(else)\s*?%>/g,
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
       index = 0,
       settings = _.defaults({}, userSettings, DEFAULT_SETTINGS),
       regExpPattern, matcher;

   regExpPattern = [
      settings.escape.source,
      settings.interpolate.source,
      settings.terminate.source,
      settings.loop.source,
      settings.conditional.source,
      settings.alternative.source,
   ];
   matcher = new RegExp(regExpPattern.join('|') + '|$', 'g');

   // eslint-disable-next-line max-params
   text.replace(matcher, function(match, escape, interpolate, terminate, loopArray, loopAlias, conditional, alternative, offset) {
      parts.push(text.slice(index, offset));
      index = offset + match.length;

      if (escape) {
         parts.push(function(data) {
            return escapeHTML(getValue(escape, data));
         });
      } else if (interpolate) {
         parts.push(getValue.bind(null, interpolate));
      } else if (terminate) {
         parts.push([ 'end' ]);
      } else if (loopArray) {
         parts.push([ 'loop', _.trim(loopArray), _.trim(loopAlias) ]);
      } else if (conditional) {
         parts.push([ 'if', _.trim(conditional) ]);
      } else if (alternative) {
         parts.push([ 'else' ]);
      }
   });

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

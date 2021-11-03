/* eslint-disable no-unused-vars */
'use strict';

const expect = require('chai').expect,
      makeTemplate = require('../src/overtemplate.js'),
      _ = require('lodash'),
      nodeUtil = require('util');

const FRUITS = [ 'apples', 'oranges', 'bananas' ],
      COLORS = ['red', 'green', 'blue', 'orange'];

describe('OverTemplate', function() {

   it('returns a function when making a template', function() {
      expect(makeTemplate('Hello <%= name %> there <%= name %> end')).to.be.a('function');
   });

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

   function testSuite(t, p, exp) {
      it('works with single simple value', function() {
         one('Hello ' + t + ' name %>', exp, {
            name: (p.firstName + ' ' + p.lastName),
         });
      });
      it('works with multiple simple values', function() {
         one('Hello ' + t + ' firstName %> ' + t + ' lastName %>', exp, p);
      });
      it('works with nested objects', function() {
         one('Hello ' + t + ' person.firstName %> ' + t + ' person.lastName %>', exp, { person: p });
      });
      it('works with arrays', function() {
         one('Hello ' + t + ' people[0].firstName %> ' + t + ' people[0].lastName %>', exp, { people: [ p ] });
      });
      it('works with deeply nested objects', function() {
         one('Hello ' + t + ' data.people[0].firstName %> ' + t + ' data.people[0].lastName %>', exp, { data: { people: [ p ] } });
      });
   }

   describe('basic operation', function() {
      testSuite('<%=', { firstName: 'John', lastName: 'Smith' }, 'Hello John Smith');
   });

   describe('does not escape interpolated', function() {
      testSuite('<%=', { firstName: 'John<br>', lastName: 'Smith' }, 'Hello John<br> Smith');
   });

   describe('escapes interpolated', function() {
      testSuite('<%-', { firstName: 'John<br>', lastName: 'Smith' }, 'Hello John&lt;br&gt; Smith');
   });

   describe('conditional sub-template', function() {
      it('works with simple if and false condition', function() {
         one('A<%if(test)%>B<%end%>C', 'AC', { test: false });
      });
      it('works with simple if and true condition', function() {
         one('A<%if(test)%>B<%end%>C', 'ABC', { test: true });
      });
      it('works with simple if with else and false condition', function() {
         one('A<%if(test)%>B<%else%>C<%end%>D', 'ACD', { test: false });
      });
      it('works with simple if with else and true condition', function() {
         one('A<%if(test)%>B<%else%>C<%end%>D', 'ABD', { test: true });
      });

      it('works with white space', function() {
         one(' A <% if\t ( test\t\t) %> B <%      else %> C <%\tend\t%> D ', ' A  C  D ', { test: false });
      });

      it('works with multiple conditionals', function() {
         one('A<%if(test)%>B<%else%>C<%end%>D-1<% if (another) %>2<% else %>3<% end %>4', 'ABD-134', { test: true, another: false });
      });
      it('works with nested conditionals', function() {
         one('A<%if(test)%>-1<% if (another) %>2<% else %>3<% end %>4-<%else%>-5<% if (another) %>6<% else %>7<% end %>8-<%end%>D',
            'A-134-D',
            { test: true, another: false }
         );
      });
      it('works with another nested conditionals', function() {
         one('A<%if(test)%>-1<% if (another) %>2<% else %>3<% end %>4-<%else%>-5<% if (another) %>6<% else %>7<% end %>8-<%end%>D',
            'A-568-D',
            { test: false, another: true });
      });
      it('works with conditional containing loops containing conditionals', function() {
         one('Letters: <%if(test)%><%for(word;letter)%><%if(letter_index)%>-<%end%><%-letter%><%end%>' +
              '<%else%><%for(word;letter)%><%if(letter_index)%>_<%end%><%-letter%><%end%><%end%>',
         'Letters: S-P-E-C-I-A-L',
         { test: true, word: Array.from('SPECIAL') });
      });
   });

   describe('loop sub-template', function() {
      let SCORES_DATA;

      SCORES_DATA = [
         { name: 'Larry', score: 74, pass: true },
         { name: 'Moe', score: 92, pass: true },
         { name: 'Curly', score: 51, pass: false },
      ];

      it('works with simple loop', function() {
         one('I like<% for (fruits; fruit) %> <%-fruit%>,<% end %>',
            'I like apples, oranges, bananas,',
            { fruits: FRUITS });
      });

      it('works with simple loop over empty array', function() {
         one('I like<% for (fruits; fruit) %> <%-fruit%>,<% end %>',
            'I like',
            { fruits: [] });
      });

      it('works with loop over collection of objects', function() {
         one('Test Scores<br>\n<% for (results; rec) %> <%- rec.name %>: <%- rec.score %>%<br>\n<% end %>',
            'Test Scores<br>\n Larry: 74%<br>\n Moe: 92%<br>\n Curly: 51%<br>\n',
            { results: SCORES_DATA });
      });

      it('works with loop containing conditionals', function() {
         one('Test Scores<br>\n<% for (results; $rec) %> <%- $rec.name %>: <%- $rec.score %>% ' +
            '<% if ($rec.pass) %>PASS<% else %>FAIL<% end %><br>\n<% end %>',
         'Test Scores<br>\n Larry: 74% PASS<br>\n Moe: 92% PASS<br>\n Curly: 51% FAIL<br>\n',
         { results: SCORES_DATA });
      });
   });
   describe('exceptions', function() {
      it('expect the simple unexpected end', function() {
         exception('<%end%>', 'unexpected end of template structure', {});
      });

      it('expect the simple unexpected else', function() {
         exception('<%else%>', 'unexpected else', {});
      });

      it('fails with unending if', function() {
         exception('<% if (test) %>', 'unterminated if', { test: true });
      });
      it('fails with unending loop', function() {
         exception('<% for (list;_it) %>', 'unterminated loop', { list: [] });
      });
   });

   describe('settings', function() {
      it('works with escape regexp', function() {
         one('&{message}', 'test &amp; verify', { message: 'test & verify' },
            { escape: /&{([^}]+?)}/g }
         );
      });

      it('works with interpolate regexp', function() {
         one('${message}', 'test & verify', { message: 'test & verify' },
            { interpolate: /\${([^}]+?)}/g }
         );
      });

      it('works with loop and end regexp', function() {
         one('«loop items as item»"<%-item%>", «end»', '"A", "B", "C", ', { items: Array.from('ABC') },
            { loop: /«\s*loop\s*([^»]+?) as ([^»]+?)»/g, terminate: /«\s*(end)\s*»/g }
         );
      });

      it('works with if and end regexp', function() {
         one('## IF test THEN ##True## ELSE ##False## END ##', 'False', { test: false },
            { conditional: /##\s*IF\s([^#]+?)\sTHEN\s*##/g, alternative: /##\s*(ELSE)\s*##/g, terminate: /##\s*(END)\s*##/g }
         );
      });

      it('works with named group capture enabled', function() {

         const template = '<%if(title)%><%-title%>/<%=title%><%else%>-none-<%end%>:<%for(colors;c)%> <%=c%><%end%>';

         const data = {
            title: 'Colors & colors',
            colors: COLORS,
         };

         const expected = 'Colors &amp; colors/Colors & colors: red green blue orange';

         one(template, expected, data, {namedGroups: true});
      });



      it('works with named group capture if & loop regexp', function() {

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

      const NOW = new Date(),
         FLINTSTONES_DATA = {
            people: [
               { first: 'Fred', last: 'Flintstone', age: 31, percent: 1/3, when: NOW},
               { first: 'Barney', last: 'Rubble', age: 29, percent: 2/3, when: new Date(2000, 4, 1, 1,11,0)},
            ]
         };

      function datesAsISO (date, _, __) {
         return date.toISOString();
      }

      function percentFormatter (num, _, __, path) {
         return path.includes('percent') ? `${Math.round(num*1000)/10}%` : `${num}`;
      }

      it('works with custom formatters', function() {

         one('Who: <%- people[0].first %>, What: <%- people[0].percent %>, When: <%- people[0].when %>',
             `Who: Fred, What: 0.3333333333333333, When: ${NOW.toLocaleString()}`, FLINTSTONES_DATA);

         one('Who: <%- people[0].first %>, What: <%- people[0].percent %>, When: <%- people[0].when %>',
             `Who: Fred, What: 0.3333333333333333, When: ${NOW.toISOString()}`, FLINTSTONES_DATA, {dateFormatter: datesAsISO});

         one('Who: <%- people[0].first %>, What: <%- people[0].percent %>, When: <%- people[0].when %>',
             `Who: Fred, What: 33.3%, When: ${NOW.toLocaleString()}`, FLINTSTONES_DATA, {numberFormatter: percentFormatter});

         one('Who: <%- people[1].first %>, What: <%- people[1].percent %>, When: <%- people[1].when %>',
             `Who: Barney, What: 66.7%, When: ${FLINTSTONES_DATA.people[1].when.toISOString()}`, FLINTSTONES_DATA,
             {numberFormatter: percentFormatter, dateFormatter: datesAsISO});

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

      const exprEval = require('expr-eval');

      function customEval (data, exp, _, __) {
         return (new exprEval.Parser()).evaluate(exp, data);
      }

      function customLoggingEval (data, exp, def, settings) {
         let value = settings.defaultExpressionEvaluator(data, exp, def, settings);
         console.log(`${new Date().toISOString()} ${exp} ${nodeUtil.inspect(value)}`);
         return value;
      }

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

# OverTemplate

## What is it?

A fairly simple templating system that combines the escaped and interpolated parts of Lodash/Underscore templates with simple conditional and looping over an array while conforming to Content Security
Policy (CSP).

Based on Silvermine UnderTemplate which is a _simple replacement for `_.template` from either [Underscore][utmpl] or [Lodash][ltmpl]
that removes the features that make those libraries incompatible with Content Security
Policy (CSP)._

## How do I use it?

Similar to templates in Underscore's `_.template`:

```
let overtemplate = require('@mscalora/overtemplate'),
    compiled = overtemplate('Hello <%= name %>');

console.log(compiled({ name: 'John Smith' }));
```

Template Language:

   * `<%= … %>`: interpolate a value
   * `<%- … %>`: interpolate and HTML escape a value
   * `<% for (_array_;_alias_) %> … <% end %>`: loop over an array value
   * `<% if (_condition_) %> … <% end %>`: conditional on a truthy value
   * `<% if (_condition_) %> … <% else %> … <% end %>`: conditional with alternate on a truthy value

### Conditional (if)

The condition must be a reference (path) to a value in data passed when template is rendered. The Lodash _.get method is used to retrieve the value with a default of '' and then tested for _truthyness_.

### Loops (for)

> **_NOTE:_** Version 2.0.0 introduced a breaking change in the syntax of the loop construct, the parameter separator in the **_for_** tag will be a semicolon by default instead of a comma. A new option parameterSeparator has been added to allow for separators like comma or other characters that may function better with custom expression evaluators. Passing a comma character for the parameterSeparator setting will effectively revert the syntax to be 1.x compatible.

Loops iterate over array-like properties of the supplied data. The _array_ parameter must be a reference (path) to an array-like value in the data passed when the template function is called to render. The _alias_ is used to reference the current item in the template fragment between the loop (for) and _end_ template marker. The template fragment is rendered once for each item in the array. In addition to the current item, the following values are accessable:

* ___array___**_index** - zero based index of the current item
* ___array___**_count** - one based index of the current item
* ___array___**_first** - boolean is the first item of the array
* ___array___**_last** - boolean is the last item of the array
* ___array___**_length** - number of items in the array (same as .length on array)

Note: **_first** and **_last** will both be true for one item arrays. For example, to emit a comma ***between*** all items, use the else clause of of a conditional:

    const overtemplate = require('@mscalora/overtemplate');
      template = '<% for (letters;item)%><%- item %><% if (item_last) %><% else %>, <% end %><% end %>',
      compiled = overtemplate(template);

    console.log(compiled({letters: Array.from('abc')}));

    > a, b, c

## Replaceable Formatter Callbacks

By default, expressions resulting in Date objects are converted to a string using the .toLocaleString() method and 'Numbers' are converted to a string using template literals `${n}`. You can replace either or both of these 'formatters' in the user setings like:

    function two_digit_fixed (value, data, settings, expression) {
      return (Math.round(value * 100) / 100).toFixed(2);
    }
    
    const overtemplate = require('@mscalora/overtemplate');
      template = '<%- num %>',
      compiled = overtemplate(template, {numberFormatter: two_digit_fixed});
    
    console.log(compiled({num: 2/3}));

### Formatter functions receive four parameters:

# value - value resolved from expression and data; date formatters should always receive a Date object, number formatters should always receive a value where _.isNumber returns true 
# data - current data object (e.g. with loop values in scope)
# settings - current settings (see settings for callbacks section)
# expression - raw expression string

Formatter functions are expected to return a string value

Clients can provide a customFormatter callback which is used for _ALL_ expression values. If a customFormatter is passed in user settings numberFormatter and dateFormatter are not called directly but can be used in your customFormatter implementation. 

Settings for callbacks:

* defaultDateFormatter - buit-in, default data formatter
* defaultNumberFormatter - buit-in, default number formatter
* defaultFormatter - buit-in, default formatter for all expressions

Note: The built-in defaultFormatter will call the dateFormatter and numberFormatter in the current settings object so custom implementations of these formatters should not use this function or infinite recursion may occur. It can however be safely used by customFormatter implementations.

#### Example Custom Formatter:

    function pwObfuscator (v, d, s, e) {
      if (/(\W|^)(password|passwd)(\W|$)/i.test(e)) {
        return `${v}`.replace(/./g, '*');
      }
      return s.defaultFormatter(v, d, s, e);
    }



#### Example Date Formatter:



## Custom Expression Evaluator


#### Example Expression Evaluator using expr-eval

    const exprEval = require('expr-eval');
    
    function customEval (data, exp, _, __) {
       return (new exprEval.Parser()).evaluate(exp, data);
    }
    
    const overtemplate = require('@mscalora/overtemplate'),
      template = '<%- 17^3 + v[2].x %>',
      compiled = overtemplate(template, {expressionEvaluator: customEval});
    
    console.log(compiled({v:[1,2,{x:11.7}]}));

#### Example Expression Evaluator using expr-eval with a custom function

The expr-eval module supports custom javascript extension functions attached to the __functions__ object of the Parser class in addition to overriding the module provided functions and operators.

    const exprEval = require('expr-eval'),
      exprParser = new exprEval.Parser();
    
    // returns a dynamicly created array of counting numbers
    exprParser.functions.counting = function (len) {
      return Array.from({length:len},(_,i)=>i+1);
    }
    
    const overtemplate = require('@mscalora/overtemplate'),
      template = '<% for (counting(n);c) %><%- c %>\n<% end %>',
      customEval = (data, exp, _, __) => exprParser.evaluate(exp, data),
      compiled = overtemplate(template, {expressionEvaluator: customEval});
    
    console.log(compiled({n:5}));

## A Couple Notes

Templating in Underscore/Lodash was operating by building up a JS function as a string.
This meant that if your template referred to a variable that did not exist, you would get
a JS error thrown. In this library, however, undefined variables in the template will
result in an empty string being placed in that location.

We rely on Lodash to provide a number of convenience functions that would require
polyfills to support a wide array of browsers. To help reduce bloat, we do two things:

   1. Rely on a fairly loose version of Lodash: `4.x`, meaning that if you already have it
      as a dependency, we'll use your version.
   2. Only `require('lodash/foo')` for each `foo` function we need. This helps if you're
      using UnderTemplate in a browserify-style environment since only the files from
      Lodash that are actually needed will be included in your bundle.


## How do I contribute?

Pull requests with tests and documentation updates as needed

## License

This software is released under the MIT license. See [the license file](LICENSE) for more
details.

Copyrighted by Mike Scalora and original Silvermine UnderTemplate code was copyrited by Jeremy Thomerson 2018
[utmpl]: http://underscorejs.org/#template
[ltmpl]: https://lodash.com/docs/#template

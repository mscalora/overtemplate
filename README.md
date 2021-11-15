# OverTemplate

## What is it?

A fairly simple templating system that combines the escaped and interpolated parts of Lodash/Underscore templates with simple conditional and looping over an array while conforming to Content Security
Policy (CSP).

Based on Silvermine UnderTemplate which is a _simple replacement for `_.template` from either [Underscore][utmpl] or [Lodash][ltmpl]
that removes the features that make those libraries incompatible with Content Security
Policy (CSP)._

## History
* 1.0 2021-10-11 initial release of OverTemplate
** loop and conditional structures
* 2.0 2021-11-03 major upgrade
** custom expression evaluation
** custom formatters
* 2.1 2021-11-05 minor upgrade
** filters

> **_NOTE:_** Version 2.0.0 introduced a breaking change in the syntax of the loop construct, the parameter separator in the **_for_** tag will be a semicolon by default instead of a comma. A new option parameterSeparator has been added to allow for separators like comma or other characters that may function better with custom expression evaluators. Passing a comma character for the parameterSeparator setting will effectively revert the syntax to be 1.x compatible.

## How do I use it?

Similar to templates in Underscore's `_.template`:

    let overtemplate = require('@mscalora/overtemplate'),
        compiled = overtemplate('Hello <%= name %>');

    console.log(compiled({ name: 'John Smith' }));

### Documentation

* (Index)[https://mscalora.github.io/overtemplate/]
<!--  * (Examples)[https://mscalora.github.io/overtemplate/examples.html] -->
  * (Template Language Syntax)[https://mscalora.github.io/overtemplate/syntax.html]
<!--  * (Settings)[https://mscalora.github.io/overtemplate/settings.html] -->
  * (Expressions)[https://mscalora.github.io/overtemplate/expressions.html]
  * (Formatters)[https://mscalora.github.io/overtemplate/formatters.html]
  * (Filters)[https://mscalora.github.io/overtemplate/filters.html]

### Default Syntax

>Note: syntax of tags is customizable, default syntax shown below

#### HTML Escaped Interpolated Output

>Syntax: ```<%- expression [ | filter ... ] %>```

#### Raw Interpolated Output

>Syntax: ```<%= expression [ | filter ... ] %>```

#### Conditional Structure if-else-end

>Syntax: ```<% if ( expression ) %>```

>Syntax: ```<% else %>```

>Syntax: ```<% end %>```

#### Loops for-end structure

>Syntax: ```<% for ( expression ; alias ) %>```

>Syntax: ```<% end %>```

The portion of the template between the ```for``` tag and the ```end``` tag is rendered once for each item on the collection represented by the expression value. The expression value is expected to be 'array like'. The current item from the collection is set using the alias parameter as the property name. In addition, the following properties are set in the current data model:

* ___alias___**_index** - zero based index of the current item
* ___alias___**_count** - one based index of the current item
* ___alias___**_first** - boolean is the first item of the array
* ___alias___**_last** - boolean is the last item of the array
* ___alias___**_length** - number of items in the array (same as .length on array)

Note: **_first** and **_last** will both be true for one item arrays. For example, to emit a comma ***between*** all items, use the else clause of a conditional:

    const overtemplate = require('@mscalora/overtemplate');
      template = '<% for (letters;item)%><%- item %><% if (item_last) %><% else %>, <% end %><% end %>',
      compiled = overtemplate(template);

    console.log(compiled({letters: Array.from('abc')}));

    > a, b, c

### Alternate Syntax \[Reduced Conflict]

The alternate syntax is provided for use when separator characters used in the default syntax might cause conflicts with template data. 

#### HTML Escaped Interpolated Output

>Syntax: ```«- expression [ ~ filter ... ] »```

#### Raw Interpolated Output

>Syntax: ```«= expression [ ~ filter ... ] »```

#### Conditional Structure if-else-end

>Syntax: ```« if ( expression ) »```

>Syntax: ```« else »```

>Syntax: ```« end »```

#### Loops for-end structure

>Syntax: ```« for ( expression • alias ) »```

>Syntax: ```« end »```

See the loop documentation of the default syntax section documents for usage information.

>**Note:** The default parameter separator character for the alternate syntax is the bullet character (Mac keystroke: _option-8_) and the filter separator is a tilde character. The tag beginning and end characters are accessed from a typical US-EN keyboard layout with _option-\\_ and _option-shift-\\_.

## Replaceable Formatter Callbacks

By default, expressions resulting in Date objects are converted to a string using the .toLocaleString() method and 'Numbers' are converted to a string using template literals `${n}`. You can replace either or both of these 'formatters' in the user settings like:

    function two_digit_fixed (value, data, settings, expression) {
      return (Math.round(value * 100) / 100).toFixed(2);
    }
    
    const overtemplate = require('@mscalora/overtemplate');
      template = '<%- num %>',
      compiled = overtemplate(template, {numberFormatter: two_digit_fixed});
    
    console.log(compiled({num: 2/3}));

### Formatter functions receive four parameters:

* value - value resolved from expression and data; date formatters should always receive a Date object, number formatters should always receive a value where _.isNumber returns true 
* data - current data object (e.g. with loop values in scope)
* settings - current settings (see settings for callbacks section)
* expression - raw expression string

Formatter functions are expected to return a string value

Clients can provide a customFormatter callback which is used for _ALL_ expression values. If a customFormatter is passed in user settings numberFormatter and dateFormatter are not called directly but can be used in your customFormatter implementation.

Settings for callbacks:

* defaultDateFormatter - built-in, default data formatter
* defaultNumberFormatter - built-in, default number formatter
* defaultFormatter - built-in, default formatter for all expressions

Note: The built-in defaultFormatter will call the dateFormatter and numberFormatter in the current settings object so custom implementations of these formatters should not use this function or infinite recursion may occur. It can however be safely used by customFormatter implementations.

#### Example Custom Formatter:

    function pwObfuscator (v, d, s, e) {
      if (/(\W|^)(password|passwd)(\W|$)/i.test(e)) {
        return `${v}`.replace(/./g, '*');
      }
      return s.defaultFormatter(v, d, s, e);
    }

#### Example Date Formatter:

    function simple_date (v, d, s, e) {
      if (v.getFullYear() < 1970) {
        return '-invalid-';
      }
      return `${v.getFullYear()}-${v.getMonth()}-${v.getDate()}`;
    }

#### Example Number Formatter:

    function price_formatter (v, d, s, e) {
      if (/price/.exec(e) && v.toFixed) {
        return `$$${v.toFixed(2)}`;
      }
      return s.defaultFormatter(v, d, s, e);
    }

## Custom Expression Evaluator

Custom expression evaluators are functions with the signature:

    function (expression, data, [defaultValue], [settings])

### Example Expression Evaluator using expr-eval

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

### Output Filters

Filters are a way to process interpolation tag expression values by specifying filter names in interpolation and escape tags.

##### Example of converting a string value to uppercase

    <%- author.name | upperCase %>

### Filters vs Formatters

Formatters are oriented towards global processing by data type. Since they have visibility to the raw expression text, you can create formatters to handle serialization (converting to a string) by field name, see the **pwObfuscator** example above.

Filters are specified in output tags in the template so more oriented to use of a value in a template. 

## A Couple Notes

Templating in Underscore/Lodash was operating by building up a JS function as a string.
This meant that if your template referred to a variable that did not exist, you would get
a JS error thrown. In this library, however, undefined variables in the template will
result in an empty string being placed in that location.

By default, expression evaluation is limited to "paths" supported by the lodash get method and literal values for strings and numbers. The module is tested with custom expression evaluation using the expr-eval module. This module provides rich algebraic expressions with numbers, strings and arrays with many built-in operators and functions well beyond what's available in javascript. Expression syntax and semantics are similar to javascript but incompatible in several ways. For example, the addition operator only supports numeric values, string concatenation requires the use of a different operator. Visit the modules github page for more info: https://github.com/silentmatt/expr-eval

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

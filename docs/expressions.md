## Expressions

**Expressions** used in template tags are resolved using the currently active expression evaluator. By default, the expression evaluator supports string literals surrounded by single or double quotes, numeric literals which must begin with a decimal digit or a decimal point followed by at least one decimal digit or a 'path' supported by the lodash **get** method. A custom expression evaluator can be used by passing a function in the expressionEvaluator function.

### Example Expressions (for default/built-in expression evaluator)

    17
    "foo"
    description
    person.name.first
    books[4].description

### Expressions With Filters

Expressions can be followed by filters which allow tag specific transformation, formatting, processing. See documentation for (filters)[filters.md]

### Example Expressions With Filters

    3.333333 | round(2)
    person.name.first | capitalize
    item.price | fixed(2) | wrapWith("$";"US")
    book.isbn | wrapWith("https://www.amazon.com/dp/") | htmlLink(book.title;"_blank","lookup-link")

### Custom Expression Evaluator

The built-in expression evaluator is very fast and small but quite limited. Filters can enhance the expressiveness to a point. If you need more complex expression evaluation you can provide your own callback that can take the raw expression string and use the data (model) and settings to perform whatever expression evaluation you need.

#### Custom Expression Evaluator Function Signature

    function (expression, data, defaultValue, settings)

Custom expression evaluator functions should resolve the value of the expression string using the data parameter (current data model). It may use the defaultValue parameter and current settings and return a value of any type. The expression string will have filters removed, the returned value will be passed to the first filter if any.

#### The expr-eval Module

For a very rich, algebraic expression evaluation plug-in the [**expr-eval**](https://github.com/silentmatt/expr-eval) NPM module is recommended. The syntax of these expressions is similar to javascript but even more powerful and very extensible with a richer set of operators and functions. Note though, they are not totally compatible with javascript expressions so existing lodash templates need checking. For example, the plus (addition) operator only works with numbers and will often return NaN if you try to use it to concatenate strings, furthermore the || operator is used for string concatenation instead of logical or.

##### How to plug in the expr-eval module

The **expr-eval** modules evaluate method is almost a perfect fit for replacing **_.get**. 

##### Example:
<!-- <example> exprEval -->

    const exprEval = require('expr-eval');
    
    function customEval (data, exp, _, __) {
      return (new exprEval.Parser()).evaluate(exp, data);
    }
    
    let settings = {expressionEvaluator: customEval}
      tmpl = overtemplate('Growth factor: <%- numerator / (base.prime^2 + adjustments[3]) | fixed(3) %>', settings);
    
    console.log(tmpl({base:{prime: 6, alternate: 11}, numerator:29, adjustments:[11,0,-31,6,-15]}));

<!-- </example> -->
###### Example output:
<!-- <output> exprEval -->

    Growth factor: 0.690

<!-- </output> -->

The simplistic mapping above meets most needs and more closely mimics the behaviour of **lodash** templates in that an exception is thrown if any of the data model references are undefined. If you like the default value of empty string that the built-in expression evaluator (inherited from the [undertemplate](https://github.com/silvermine/undertemplate) module) provides a slightly more defensive implementation can help:

<!-- <example> customEval2 -->

    const exprEval = require('expr-eval');
    
    function customEval2 (data, exp, defaultValue, __) {
      try {
        return (new exprEval.Parser()).evaluate(exp, data);
      } catch (e) {
        if (e.message && e.message.includes('undefined variable:')) {
          return defaultValue;
        }
        throw e;
      }
    }
    
    let settings2 = {expressionEvaluator: customEval2},
      tmpl2 = overtemplate('Answer: "<%- not_in_data %>"', settings2);
    
    console.log(tmpl2({}));

<!-- </example> -->
###### Example output:
<!-- <output> customEval2 -->

    Answer: ""

<!-- </output> -->

This will return the default value of empty string for the entire expression if **expr-eval** thinks any reference to the data model (variable) is undefined.




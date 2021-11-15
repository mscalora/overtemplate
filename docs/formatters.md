## Formatters

Formatters are global mechanisms to process template values. There are two replaceable datatype formatters, one for numbers and one for Date objects. There is also a setting that has a chance to transform all expression values.

All three replaceable formatters have the following signature:

    function (value, data, settings, rawExpression)

In general formatters can return any data type but generally a string is expected.

### Example Number Formatter

If you wish all values of integer numbers to be rendered in decimal, hex and octal notation you could use a number formatter like this:
<!-- <example> polyNotationNumberFormatter -->

    function polyNotationNumberFormatter (value, data, settings, expression) {
      if (typeof value === 'number' && Math.floor(value) === value) {
        return `${value.toString(10).toLocaleUpperCase()}` +
            `/0x${value.toString(16).toLocaleUpperCase()}` +
            `/o${value.toString(8).toLocaleUpperCase()}`;
      }
      // if not an integer fall back to the built-in number formatter
      return settings.defaultNumberFormatter(value);
    }
    
    let template = '<%= i %> or <%= f %> never <%= s %>',
        compiled = overtemplate(template, {numberFormatter: polyNotationNumberFormatter});
    console.log(compiled({i: 123456789, f: 123456.789, s: "12345"}));

<!-- </example> -->
outputs:
<!-- <output> polyNotationNumberFormatter -->

    123456789/0x75BCD15/o726746425 or 123456.789 never 12345

<!-- </output> -->

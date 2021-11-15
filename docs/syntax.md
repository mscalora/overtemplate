## OverTemplate Template Language Syntax

The template language syntax is highly customizable. The default syntax is intended to make transition from lodash templates as simple as possible for escaping and non-escaping interpolation tags. An alternate syntax is described below or can be replaced entirely.

### Default Syntax

All tags are based on opening and closing sequences of ```<%``` and ```%>```.

#### HTML Escaped Interpolated Output

>Syntax: ```<%- expression [ | filter ... ] %>```

#### Raw Interpolated Output

>Syntax: ```<%= expression [ | filter ... ] %>```

#### Conditional Structure if-else-end

>Syntax: ```<% if ( expression ) %>```

>Syntax: ```<% else %>```

>Syntax: ```<% end %>```

#### Loop structure

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

#### Loop structure

>Syntax: ```« for ( expression • alias ) »```

>Syntax: ```« end »```

See the loop documentation of the default syntax section documents for usage information.

>**Note:** The default parameter separator character for the alternate syntax is the bullet character (Mac keystroke: _option-8_) and the filter separator is a tilde character. The tag beginning and end characters are accessed from a typical US-EN keyboard layout with _option-\\_ and _option-shift-\\_.

### Syntax Customization

Syntax customization is achieved by replacing one or more built-in regular expressions. You should be familiar with non-greedy quantifiers, non-capturing groups, negative assertions and the _**capture**_ features of regular expressions. The following settings are customizable:

* **escape** - the HTML Escaped Interpolated Output tag
* **interpolate** - the Raw Interpolated Output tag
* **conditional** - the **if** tag of the Conditional Structure 
* **alternative** - the **else** tag of the Conditional Structure 
* **terminate** - the **end** tag of the Conditional Structure and Loop Structure
* **loop** - the **for** tag of the Loop Structure

For syntax customization, using the Named Groups option is recommended by setting the **namedGroups** to **_true_**

Here's an example of replacing the entire tag syntax to replace ```<%``` and ```%>``` with ```{$``` and ```$}```

    const DEFAULT_ALT_NAMED_CAPTURE_PARSING = {
      namedGroups: true,
      escape: /\{\$-(?<escape>[\s\S]+?)\$}/g,
      interpolate: /\{\$=(?<interpolate>[\s\S]+?)\$}/g,
      terminate: /\{\$\s*?(?<terminate>end)\s*?\$}/g,
      conditional: /\{\$\s*?if\s*?\((?<conditional>(?:.(?!\$}))+?)\)\s*?\$}/g,
      alternative: /\{\$\s*?(?<alternative>else)\s*?\$}/g,
      loop: /\{\$\s*?for\s*?\((?<loopArray>(?:.(?!\$}))+?);(?<loopAlias>(?:.(?!\$}))+?)\)\s*?\$}/g,
    };

Also, if you wanted to change the loop structure to:

```{$ loop``` _alias_ ```in``` _array_ ```$}```

      loop: /\{\$\s*?loop\s+?(?<loopAlias>(?:.(?!\$}))+?)\s+?in\s+?(?<loopArray>(?:.(?!\$}))+?)\s+?\$}/g

You would use:

    settings = {
      escape: /\[#(?<escape>(?:.(?!%>))+?.)#]/g,
      interpolate: /\[\$(?<interpolate>(?:.(?!\$>))+?.)\$]/g,
    }

Each regexp must capture its settings key except for the **loop** which must capture **loopArray** and **loopAlias**.

>```Note:``` Named group capture is a feature that was introduced in ECMAScript 2018, it is only used by this module if you use the setting ```namedGroups``` set to **true**.

If named group capture is _NOT_ in use, then each syntax parsing regexp must have exactly one capturing group except for the loop tag which must have exactly two capturing groups with the **array** before the **alias**. Any missing or extra captures will break parsing and reversing the loop parameters like the example above is not possible.


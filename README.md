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
let overtemplate = require('overtemplate'),
    compiled = overtemplate('Hello <%= name %>');

console.log(compiled({ name: 'John Smith' }));
```

Template Language:

   * `<%= … %>`: interpolate a value
   * `<%- … %>`: interpolate and HTML escape a value
   * `<% for (_array_,_alias_) %> … <% end %>`: loop over an array value
   * `<% if (_condition_) %> … <% end %>`: conditional on a truthy value
   * `<% if (_condition_) %> … <% else %> … <% end %>`: conditional with alternate on a truthy value

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

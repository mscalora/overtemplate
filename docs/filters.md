# Filters

## Built-in Filter Reference Index

* [escape](#escape) - encode characters as HTML entities as needed
* [trim](#trim) - remove leading and trailing whitespace
* [normalize](#normalize) - convert all sequences of whitespace to a single space or other string
* [pad](#pad) - pad a string to a character length
* [trunc](#trunc) - truncate a string to a character length
* [fit](#fit) - pad or truncate a string to a character length
* [lowerCase](#lowerCase) - convert all uppercase characters to lowercase
* [upperCase](#upperCase) - convert all lowercase characters to uppercase
* [capitalize](#capitalize) - convert the first character of a string to uppercase
* [htmlWrap](#htmlWrap) - wrap string with an HTML tag
* [colorWrap](#colorWrap) - wrap string with an HTML colored span tag
* [htmlLink](#htmlLink) - wrap a URL in a html anchor tag 
* [round](#round) - round a number to whole values or number of decimal digits
* [fixed](#fixed) - round a number to a number of decimal digits and zero pad
* [hex](#hex) - convert a numeric value to a hexadecimal string
* [rot13](#rot13) - encrypt string value with rot13 algorithm
* [slice](#slice) - perform a javascript slice method on the array-like value
* [join](#join) - perform a join operation on the array-like value
* [substr](#substr) - perform a javascript substr method on the string value

> **Note:** ```null``` may be substituted for optional parameters, parentheses are optional if no parameters are needed.<br>
> **Note:** Literal strings like ```"this"``` are used as the expression for the examples in the following sections. Any valid expression is equally suitable such as ```person.name``` or ```list[4].description```

### escape <a name="escape"></a>

Converts the input to a string and encode the four critical entities characters ```&```, ```<```, ```>``` and ```"``` into entities.

Template: ```"Mom & Pop" | escape```<br>
Output: ```Mom &amp; Pop```

Normally used in the non-encoding interpolation tag (```<%=```) since the escape tag already will encode HTML entities.

### trim <a name="trim"></a>

Removes leading and trailing.

Template: ```"  has space around it   " | trim```<br>
Output: ```has space around it```

Whitespace as defined by the javascript RegExp ```\s``` assertion. See: Whitespace as defined by the javascript RegExp ```\s``` assertion. See: [ECMAScript 2022 Language Specification](https://tc39.es/ecma262/#sec-white-space)

### normalize <a name="normalize"></a>

Syntax: ```normalize([sub])```

* ```sub``` - \[optional] character to use in place of whitespace sequences, default: ``` ``` (_space_)

Remove leading and trailing space and reduce any sequences of consecutive whitespace into a single space character or other string if specified.

Template: ```"   has    space         around it   " | normalize```<br>
Output: ```has space around it```

Template: ```"   has    space         around it   " | normalize("⎡GLUE⎤")```<br>
Output: ```has⎡GLUE⎤space⎡GLUE⎤around⎡GLUE⎤it```

Whitespace as defined by the javascript RegExp ```\s``` assertion. See: [ECMAScript 2022 Language Specification](https://tc39.es/ecma262/#sec-white-space)

### pad <a name="pad"></a>

Syntax: ```pad( length; [char]; [side])```

* ```length``` - \[required] desired length of string
* ```char``` - \[optional] character(s) to be added to string if needed, default: ```' '```
* ```side``` - \[optional] ```start```, ```end```, ```both``` or ```center``` default: ```'end'```

Lengthen a string to the specified length by concatenating characters, by default a space, to the start, end or both sides of the input string to a specified length. `char` is a space by default and characters are added to the ```end``` (right side) of the string. If the input string already ```length``` characters long or longer, no change is made. ```both``` and ```center``` are synonymous.

Template: <code>"blue" | pad(10)</code><br>
Output: <code>blue&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</code>

Template: <code>"apple" | pad(15;" -";"both")</code><br>
Output: <code> - - apple - - </code>

### trunc <a name="trunc"></a>

Syntax: ```trunc( length; [side]; [ellipsis-char])```

* ```length``` - \[required] desired length of string
* ```side``` - \[optional] ```start```, ```end```, ```both```, ```center``` or ```ellipsis```default: ```'end'```
* ```ellipsis-char``` - \[optional] character appended to indicate truncation occurred, default: ```…```

Shorten a string to the specified length by removing characters from the start, end or both sides of the input string to a specified length. By default, characters are removed from the ```end``` (right side) of the string. A side value of ```ellipsis``` is similar to ```end``` but replaces the last character with the ellipsis character or other specified character if the string is truncated.   ```both``` and ```center``` are synonymous.

Template: <code>"abcdefghijklmnopqrstuvwxyz" | trunc(16)</code><br>
Output: <code>abcdefghijklmnop</code>

Template: <code>"whitespace is preserved" | trunc(13;"center")</code><br>
Output: <code>space is pres</code>

Template: <code>"whitespace is preserved" | trunc(13;"ellipsis")</code><br>
Output: <code>whitespace i…</code>

Template: <code>"whitespace is preserved" | trunc(13;"ellipsis";"@")</code><br>
Output: <code>whitespace i@</code>

### fit <a name="fit"></a>

Make a string fit a specific length adding or removing characters as needed. ```fit``` is equivalent to using both pad and trim with the same length.

Syntax: ```fit( length; [char]; [side]; [ellipsis-char])```

* ```length``` - \[required] desired length of string
* ```char``` - \[optional] character(s) to be added to string if needed, default: ```' '```
* ```side``` - \[optional] ```start```, ```end```, ```both```, ```center``` or ```ellipsis```default: ```'end'```
* ```ellipsis-char``` - \[optional] character appended to indicate truncation occurred, default: ```…```

Template: <code>"whitespace is preserved" | fit(13;null;"center")</code><br>
Output: <code>space is pres</code>

Template: <code>"whitespace is preserved" | fit(32;"#";"center")</code><br>
Output: <code>####whitespace is preserved#####</code>

Template: <code>"whitespace is preserved" | fit(13;null;"ellipsis";"Ⓧ")</code><br>
Output: <code>whitespace iⓍ</code>

### lowerCase <a name="lowerCase"></a>

Convert characters in a string to lowercase according to the current locale. See: [toLocaleLowerCase on MDN](https://developer.mozilla.org/search?q=toLocaleLowerCase)

Template: ```"Are you for SCUBA?" | lowerCase```
Output: ```are you for scuba?```

### upperCase <a name="upperCase"></a>

Convert characters in a string to uppercase according to the current locale. See: [toLocaleLowerCase on MDN](https://developer.mozilla.org/search?q=toLocaleUpperCase)

Template: ```"we're not going to take it!" | upperCase```
Output: ```WE'RE NOT GOING TO TAKE IT!```

### capitalize <a name="capitalize"></a>

Convert the first character of a string to uppercase and optionally convert the other characters of a string to lowercase.

Syntax: ```capitalize``` or ```capitalize( [force])``` 

* ```force``` - \[optional] a truthy value causes lowercasing of characters after the first

Template: <code>"billieBob is COOL" | capitalize</code><br>
Output: <code>BillieBob is COOL</code>

Template: <code>"  billieBob is COOL  " | capitalize(true;true)</code><br>
Output: <code>Billiebob is cool</code>

### wrapWith <a name="wrapWith"></a>

Concatenate strings to the start, end or both sides of a string optionally inserting another string (```glue```) in between.

Syntax: ```wrapWith([start]; [end]; [glue])```

* ```start``` - \[optional] string to prepend, default: _empty string_
* ```end``` - \[optional] string to append, default: _empty string_
* ```glue``` - \[optional] string to place between input and non-empty concatenated strings

Template: <code>"blue" | wrapWith("light")</code><br>
Output: <code>lightblue</code>

Template: <code>"blue" | wrapWith(null; "green")</code><br>
Output: <code>bluegreen</code>

Template: <code>"Amsterdam" | wrapWith("New"; null; " ")</code><br>
Output: <code>New Amsterdam</code>

Template: <code>"person" | wrapWith("parent"; "child"; ".")</code><br>
Output: <code>parent.person.child</code>

Normally used in the non-encoding interpolation tag (```<%=```) since the escape tag already will encode HTML entities.

### htmlWrap <a name="htmlWrap"></a>

Place input string in a properly formatted HTML tag.

Syntax: ```htmlWrap([tag]; [classes]; [style]; [raw]; [id])```

* ```tag``` - \[optional] html tag name, default: ```div```
* ```classes``` - \[optional] contents of class attribute, default: _empty string_
* ```style``` - \[optional] contents of style attribute, default: _empty string_
* ```raw``` - \[optional] truthy value prevents HTML entity escaping, default: ```false```
* ```id``` - \[optional] contents of id attribute, default: _empty string_

>**Note:** because css styles often contain a semicolon characters and those conflict with the default parameter separator any ```%3B``` character sequences will be replaced with semicolon characters in the style parameter value.

Template: <code>"Mom & Pop" | htmlWrap</code><br>
Output: ```<div>Mom &amp; Pop</div>```

Template: <code>"Mom & Pop" | htmlWrap("p";"active special";"color: blue";false;"primary")</code><br>
Output: ```<p id="primary" class="active special" style="color: blue">Mom &amp; Pop</p>```

Template: <code>"contents" | htmlWrap("p") | htmlWrap("section"; false; false; true)</code>
Output: ```<section><p>contents</p></section>```

Template: <code>"bold and green" | htmlWrap("span";null;"font-weight: bold%3b color: green%3B")</code><br>
Output: ```<span style="font-weight: bold; color: green;">bold and green</span>```

Normally used in the non-encoding interpolation tag (```<%=```) since the escape tag already will encode HTML entities.

### colorWrap <a name="colorWrap"></a>

A convenience function similar to htmlWrap for creating an HTML tag with a color style.

Syntax: ```colorWrap([color]; [tag]; [classes]; [style]; [raw]; [id])```

* ```color``` - CSS color style property value
* _see htmlWrap for other parameter info_

Template: <code>errors[0].message | colorWrap('red';'p')</code><br>
Data: <code>{errors:[{code:17,message:"Error: unexpected failure"},{code:4,message:"Error: none"}]}</code><br>
Output: ```<p style="color:red;">Error: unexpected failure</p>```

Normally used in the non-encoding interpolation tag (```<%=```) since the escape tag already will encode HTML entities.

### htmlLink <a name="htmlLink"></a>

A convenience function similar to htmlWrap for creating an HTML anchor tag, the input string is used as the URL (href) for the anchor.

Syntax: ```htmlLink([linkText]; [target]; [classes]; [style]; [raw]; [id])```

* ```linkText``` - text used as the content on the anchor tag, if ```null``` or undefined the URL is used instead
* ```target``` - string used as the target attribute of the anchor tag
* _see htmlWrap for other parameter info_

Template: <code>search_engines[0].url | htmlLink(search_engines[0].name)</code><br>
Data: ```{search_engines:[{url:"https://google.com",name:"Google"},{url:"https://bing.com",name:"Bing"}]}```
Output: ```<a href="https://google.com">Google</a>```

Normally used in the non-encoding interpolation tag (```<%=```) since the escape tag already will encode HTML entities.

### round <a name="round"></a>

Round input number to specified number of decimal digits.

Syntax: ```round(digits)```

* ```digits``` - number of decimal digits to the right of the decimal point

Template: ```123.7002107 | round(3)```
Output: ```123.7```

### fixed <a name="fixed"></a>

Round input number to specified number of decimal digits and format as a string with 0 padding to the right of the decimal point.

Syntax: ```fixed(digits)```

* ```digits``` - number of decimal digits to the right of the decimal point

Template: ```123.7002107 | fixed(3)```
Output: ```123.700```


### pick <a name="pick"></a>

Return an item from a string, array or object by index or property name.

Syntax: ```pick(index)```

Examples:
Data: ```{n: 3, list: [101,102,103,104,105], obj: {d:'Dog', c:'Cat', m: 'Monkey'}}```

Template: ```"ABCDEFGHIJKLM" | pick(10)```<br>
Output: ```K```

Template: ```"ABCDEFGHIJKLM" | pick(30; "n/a")```<br>
Output: ```n/a```

Template: ```list | pick(n)```<br>
Output: ```104```

Template: ```obj | pick("m";"Bird")```<br>
Output: ```Monkey```

### toNumber <a name="toNumber"></a>

Coerce value to a number using the ```Number``` constructor. 

Template: ```"123.5670000" | toNumber```<br>
Output: ```123.567```

See: [Number constructor on MDN](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number/Number)

### toFloat <a name="toFloat"></a>

Coerce value to a number using the ```parseFloat``` function.

Template: ```"123.5670000" | toFloat```<br>
Output: ```123.567```

Template: ```"  71.39 ft " | toFloat```<br>
Output: ```71.39```

> ```Note:``` 

See: [Number constructor on MDN](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/parseFloat)

### toInteger <a name="toInteger"></a>

Coerce value to a number using the ```parseInt``` function.

Template: ```"123.5670000" | toInteger```<br>
Output: ```123```

Template: ```"177.3 hours" | toInteger```<br>
Output: ```177```

Template: ```"  71.39 mm " | toInteger```<br>
Output: ```71```

See: See: [Number constructor on MDN](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/parseInt)

### toDate <a name="toDate"></a>

Coerce value into a date using the Date constructor.

#### Examples:

Template: ```1234567890000 | toDate```
Output: ```2/13/2009, 4:31:30 PM```

Template: ```'1980/2/25' | toDate```
Output: ```2/25/1980, 12:00:00 AM```

See: [Date Constructor](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Date/Date)

### msToDate <a name="msToDate"></a>

Shorthand for ``` | toInteger | toDate```

Syntax: msToDate(radix)

* ```radix``` - number base used to interpret numeric string, default: 10 (decimal)

Examples:

Template: ```"1234567890000" | msToDate```
Output: ```2/13/2009, 4:31:30 PM```

Template: ```"11f71fb0450" | msToDate(16)```
Output: ```2/13/2009, 4:31:30 PM```

### asDate <a name="asDate"></a>

Convert a Date object to a string as the ```Date``` method ```toDateString()``` would. The ```Date``` constructor is used to coerce values to a ```Date``` object.

Examples:

Template: ```'1980/2/25' | toDate | asDate```
Output: ```Mon Feb 25 1980```

See: [toDateString on MDN](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Date/toDateString)

### asTime <a name="asTime"></a>

Convert a Date object to a string as the ```Date``` method ```toTimeString()``` would. The ```Date``` constructor is used to coerce values to a ```Date``` object.

Examples:

Template: ```'1980/2/25 1:12:11 pm' | toDate | asTime```
Output: ```13:12:11 GMT-0700 (Mountain Standard Time)```

See: [toDateString on MDN](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Date/toTimeString)

### hex <a name="hex"></a>

Convert numeric value to hexadecimal as a string with an optional prefix.

Syntax: ```hex([prefix]; [upperCase])```

* ```prefix``` - string to concatenate on the front (prepend) to the hexadecimal digits
* ```upperCase``` - truthy values cause the hexadecimal digits to be uppercase

Template: ```3833585 | hex```<br>
Output: ```3a7ef1```

Template: ```3833585 | hex("0x"; true)```<br>
Output: ```0x3A7EF1```

### rot13 <a name="rot13"></a>

Encrypt string value with rot13 algorithm

Syntax: ```rot13```

Template: ```"Abracadabra" | rot13```<br>
Output: ```Noenpnqnoen```

Template: ```"Uryc! V'z orvat uryq cevfbare va n sbeghar pbbxvr snpgbel!" | rot13```<br>
Output: ```Help! I'm being held prisoner in a fortune cookie factory!```

### slice <a name="slice"></a>

Perform a slice operation on an array-like value

Syntax: ```slice(start; [end])```

* ```start``` - index to start extraction, negative values from the end, default: 0
* ```end``` - index to end extraction, negative values from the end, null for all items, default: null 

Template: ```items | slice(5;9)```
Data: ```{items: ['a','b','c','d','f','g','h','i','j']}```
Output: ```g,h,i,j```

Template: ```items | slice(-5)```
Data: ```{items: ['a','b','c','d','f','g','h','i','j']}```
Output: ```f,g,h,i,j```

See: [slice on MDN](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array/slice)

### join <a name="join"></a>

Perform a join operation on an array-like value returning a string

Syntax: ```join([separator];[last-separator])```

* ```separator``` - string to place between items
* ```last-separator``` - string to place between the last two items
 
Template: ```items | join('-')```
Data: ```{items: ['a','b','c','d']}```
Output: ```a-b-c-d```

Template: ```items | join('•')```
Data: ```{items: ["red", "white", "blue"]}```
Output: ```red•white•blue```

Template: ```items | join(', '; ' and ')```
Data: ```{items: ["red", "white", "blue"]}```
Output: ```red, white and blue```

### substr <a name="substr"></a>

Perform a slice operation on an array-like value

Template: ```"not kidding" | substr(4;3)```
Output: ```kid```

Template: ```"not kidding" | substr(4)```
Output: ```kidding```

See: [slice on MDN](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String/substr)

## Custom Filters

Custom filters can be implemented with a javascript function. The first parameter passed to the filter function is the value form the expression or the output of the previous filter. The filter function is also bound (as ```this```) to an object with the following properties:

* ```value``` - the original expression value (before being transformed by any previous filters)
* ```data``` - the current data model passed to the template function with changes from any loops in scope
* ```settings``` - the current settings
* ```expression``` - the raw text of the expression excluding any filters

### Example Custom Filters

#### Simple Example
<!-- <example> custom bold --> 

    function bold (str) {
        return `<b>${str}</b>`;
    }
    
    template = '<%= v | bold %>',
    compiled = overtemplate(template, {filters: {bold: bold}});
    console.log(compiled({v: 'test'}));

<!-- </example> -->
####### Simple Example Output
<!-- <output> custom bold -->

    <b>test</b>

<!-- </output> --> 
#### Example With Parameter
<!-- <example> custom copies --> 

    function copies (value, count) {
      return Array((count || 10) + 1).join(`${value}`);
    }

    template = '<%= char | copies(values[2]) %>';
    compiled = overtemplate(template, {filters: {copies: copies}});
    console.log(compiled({char: '=', values: [13,22,11,17,8]}));

<!-- </example> -->
####### Simple Example Output
<!-- <output> custom copies -->

    ===========

<!-- </output> --> 
#### Complex Example
<!-- <example> custom showExpression -->

    const ESCAPE_ENTITIES = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;', // eslint-disable-line quotes
        '`': '&#x60;',
    };
    
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
    
    function showExpression (str, showData) {
        let html = '<table><tr><th>Type</th><th>Value</th></tr>\n';
        html += `<tr><td>Expression</td><td>${escapeHTML(this.expression)}</td></tr>\n`;
        if (showData) {
            let data = escapeHTML(JSON.stringify(this.data, null, 2));
            html += `<tr><td>Data</td><td>${data}</td></tr>\n`;
        }
        html += `<tr><td>Value</td><td>${escapeHTML(str)}</td></tr>\n`;
        html += '</table>';
        return html;
    }
    
    template = '<%= people[1].name | show %>';
    compiled = overtemplate(template, {filters: {show: showExpression}});
    console.log(compiled({people:[{name:"Bob",age:31},{name:"Sally",age:27}]}));

<!-- </example> -->
See: [ROT13 on wikipedia](https://en.wikipedia.org/wiki/ROT13)

####### Simple Example Output
<!-- <output> custom showExpression -->

    <table><tr><th>Type</th><th>Value</th></tr>
    <tr><td>Expression</td><td> people[1].name | show </td></tr>
    <tr><td>Value</td><td>Sally</td></tr>
    </table>

<!-- </output> --> 

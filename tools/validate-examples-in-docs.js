#! /usr/bin/env node

const fs = require('fs'),
    util = require('util'),
    chalk = require('chalk'),
    path = require('path'),
    glob = require('glob'),
    { program } = require('commander');

const overtemplate = require('../src/overtemplate.js'),
    hasExampleMap = overtemplate.builtinFilterNames.reduce((l,n) => (l[n] = false, l), {});

program.version('1.0.0')
    .option('-v, --verbose', 'verbosity that can be increased', increaseVerbosity, 0)
    .parse();

let projectPath = path.join(__dirname, '..'),
    files = program.args && program.args.length ? program.args : glob.sync(path.join(projectPath, 'docs', '**/*.md')),
    fileNameMaxWidth = Math.max(...(files || []).map(f => path.basename(f).length)),
    filterExamples = [];

const cleaner = /^\s*(Syntax|Template|Data|Output):\s*(```|<code>)|(```|<\/code>)\s*(<br>\s*)?$/g;

for (let file of files) {
  if (fs.existsSync(file)) {
    let text = fs.readFileSync(file, 'utf8'),
        lines = text.split('\n'),
        template, dataSrc, data, output,
        exampleLineNum = null, exampleSrc = '', exampleCapture = false,
        exampleOutput = null, exampleNum = 0, exampleName = '',
        outputLineNum = 1, outputCapture = false,
        outputText = '', match,
        i = 0,
        filename = path.basename(file);
    vpl(`${lines.length} ${filename}`);
    while (i < lines.length) {
      if (lines[i] && lines[i].trim().startsWith('Template:')) {
        let lineNum = i + 1,
            tmplLine = lines[i],
            dataLine = lines[i+1].trim().startsWith('Data:') ? lines[1+i++] : null,
            outputLine = lines[i+1].trim().startsWith('Output:') ? lines[1+i++] : null;
        exampleLineNum = i;
        template = tmplLine.replace(cleaner, '');
        dataSrc = dataLine && dataLine.replace(cleaner, '');
        output = outputLine.replace(cleaner, '').replace(/&nbsp;/g, ' ');
        if (dataSrc) {
          try {
            eval('data = ' + dataSrc);
            filterExamples.push({name: exampleName || '', template: template, data: data, output: outputLine});
          } catch (e) {
            cpl('red', 'Error:', e.message);
          }
        } else {
          filterExamples.push({name: exampleName || '', template: template, output: outputLine});
        }
        try {
          let tmpl1 = overtemplate('<%-' + template + '%>'),
              tmpl2 = overtemplate('<%=' + template + '%>'),
              result1 = tmpl1(data || {}),
              result2 = tmpl2(data || {}),
              outputMatches = result1 === output || result2 === output;
          if (outputMatches) {
            vpl('Line:', lineNum, 'of', filename);
            vpl('Template:', template);
            vpl('Data:', dataSrc);
            vpl('Output:', output);
            vpl('');
          } else {
            cpl('red', 'Error on line:', lineNum, 'of', filename);
            cpl('red', 'Template:', template);
            cpl('red', 'Data:', dataSrc);
            cpl('red', 'Output:', output);
            cpl('green', 'Expected:', result1);
            cpl('green', 'Expected:', result2);
            pl('');
          }
          let rawMsg = `${outputMatches ? 'PASS' : 'FAIL'} ${exampleName || `example-${exampleNum}`}`,
              msg = outputMatches ? chalk.green(rawMsg) : chalk.red(rawMsg);
          hasExampleMap[exampleName] = true;
          pl(`${filename.padEnd(fileNameMaxWidth)} ${String(exampleLineNum).padStart(3)} ${msg}`);
        } catch (e) {
          cpl('red', 'Exception running template on line:', lineNum, 'of', filename);
          cpl('red', 'Template:', template);
          cpl('red', 'Data:', data);
          cpl('red', 'Output:', output);
          cpl('green', 'Exception:', e.message);
          pl('');
        }
      } else if (lines[i] && lines[i].trim().startsWith('Data:')) {
        dataSrc = lines[i].replace(cleaner, '');
        if (dataSrc) {
          try {
            eval('data = ' + dataSrc);
          } catch (e) {
            cpl('red', 'Error:', e.message);
          }
        }
      } else if ((match = isTag(lines[i], /<a.*name="(.*)".*>/))) {
        exampleName = match[1];
      } else if (isTag(lines[i], '<example>')) {
        exampleCapture = true;
        exampleLineNum = i;
        exampleSrc = '';
        exampleNum++;
        exampleName = lines[i].replace(/.*<example>\s*|\s*-->.*/g, '');
      } else if (isTag(lines[i], '</example>')) {
        exampleName = exampleName || `num-${exampleNum}`;
        exampleOutput = runExampleSync(exampleSrc, exampleName, filename, i);
        exampleSrc = '';
        exampleCapture = false;
      } else if (exampleCapture && lines[i].startsWith('    ')) {
        exampleSrc += '\n' + lines[i].substr(4);
      } else if (isTag(lines[i], '<output>')) {
        outputCapture = true;
        outputLineNum = i;
        outputText = '';
      } else if (isTag(lines[i], '</output>')) {
        let match = exampleOutput.trim() === outputText.trim(),
            rawMsg = `${match ? 'PASS' : 'FAIL'} ${exampleName}`,
            msg = match ? chalk.green(rawMsg) : chalk.red(rawMsg);

        pl(`${filename.padEnd(fileNameMaxWidth)} ${String(exampleLineNum).padStart(3)} ${msg}`);

        outputCapture = false;
        if (!match) {
          cpl('red', `Example output mismatch ${exampleNum} on line ${exampleLineNum} of ${filename}`);
          cpl('blue', `Expected output from line ${outputLineNum}:`);
          cpl('white',  outputText.trim());
          cpl('blue', 'Actual output:');
          cpl('white', exampleOutput.trim());
        }
        outputText = '';
      } else if (outputCapture && lines[i].startsWith('    ')) {
        outputText += lines[i].substr(4) + '\n';
      } else if (lines[i] && lines[i].trim().startsWith('### ')) {
        data = null;
      }
      i++
    }
  } else {
    pl(chalk.red(`Error: DOES NOT EXIST ${file}`));
  }
}

let packageJson = fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'),
    package = JSON.parse(packageJson),
    keys = ["name", "description", "version", "author", "repository", "author"],
    metadata = Object.keys(package).reduce((o,k) => {
      if (keys.includes(k)) {
        o[k] = package[k];
      }
      return o;
    }, {examples: filterExamples});

if (filterExamples.length) {
  let exampleLines = JSON.stringify(metadata, null, 2),
      examplesPath = path.join(__dirname, '../docs', "metadata.json"),
      existingText = fs.existsSync(examplesPath) ? fs.readFileSync(examplesPath, 'utf8') : '',
      needsUpdating = exampleLines !== existingText;

  if (needsUpdating) {
    fs.writeFileSync(examplesPath, exampleLines);
  }
}

for (let filter of Object.keys(hasExampleMap)) {
  if (!hasExampleMap[filter]) {
    pl(`Example for filter ${chalk.red(filter)} not found`);
  }
}

function isTag(line, tag) {
  return line && (util.types.isRegExp(tag) ? tag.exec(line) : line.includes(tag));
}

function runExampleSync (nodeSrc, name, srcFileName, srcLineNum) {
  const modPath = fs.realpathSync(path.join(__dirname, '..')),
      preamble = `#! /usr/bin/env node
const overtemplate = require('${modPath}');
`;

  const { execFileSync } = require('child_process'),
      testPath = path.join(__dirname, '.temp-files'),
      fileName = `example-${name ? slug(name) : Date.now()}.js`,
      filePath = path.join(testPath, fileName),
      wd = path.join(__dirname, '..');

  if (!fs.existsSync(testPath)) {
    fs.mkdirSync(testPath);
  }
  vpl(`\n=== ${srcFileName}(${srcLineNum}) === ${fileName} === `);

  fs.writeFileSync(filePath, preamble + nodeSrc, 'utf8');
  fs.chmodSync(filePath, fs.constants.S_IRUSR | fs.constants.S_IWUSR | fs.constants.S_IXUSR);

  const output = execFileSync(filePath, {cwd: wd, stdio: "pipe", encoding: 'utf8'});

  return output;
}

function pl () {
  process.stdout.write(Array.from(arguments).map(s => `${s}`).join(' ') + '\n');
}

function vpl () {
  if (program.verbose) {
    pl.call(this, Array.from(arguments));
  }
}

function cpl (color, ...args) {
  pl.apply(this, args.map(s => chalk[color](s)));
}

function increaseVerbosity(dummyValue, previous) {
  return previous + 1;
}

function slug (s) {
  return `${s}`.replace(/[^-_$a-z]/gi, '-').replace(/-{3,}/g, '--');
}

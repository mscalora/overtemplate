/* eslint-disable no-unused-vars */
'use strict';

const expect = require('chai').expect,
    _ = require('lodash'),
    testUtils = require('./test-utils'),
    path = require('path'),
    fs = require('fs');

describe('documentation examples', function () {
  it('all documentation examples tests should PASS', function () {

    const cp = require('child_process'),
        execFileSync = cp.execFileSync,
        filePath = fs.realpathSync(path.join(__dirname, '..', 'tools/validate-examples-in-docs.js')),
        wd = fs.realpathSync(path.join(__dirname, '../tools'));

    console.log(filePath);

    const output = execFileSync(filePath, {cwd: wd, stdio: "pipe", encoding: 'utf8'});

    expect(output).to.not.match(/FAIL/);
  });
});

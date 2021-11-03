'use strict';

// We simply require the specific functions we need from lodash to create a smaller bundle
// in browserify-style environments.
/* eslint-disable global-require */
module.exports = {
   get: require('lodash/get'),
   isArray: require('lodash/isArray'),
   isNumber: require('lodash/isNumber'),
   isDate: require('lodash/isDate'),
   isFunction: require('lodash/isFunction'),
};

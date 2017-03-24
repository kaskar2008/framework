'use strict';

const Console = require('.');

singleton('Ivy/Console', function () {
    return new Console;
});

let console = use('Ivy/Console');

require('./Commands/Help');
require('./Commands/CreateMiddleware');

console.addCommand('Ivy/Command/Help');
console.addCommand('Ivy/Command/CreateMiddleware');
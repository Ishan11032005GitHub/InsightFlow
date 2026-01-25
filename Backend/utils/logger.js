// Simple logger wrapper. Beginners can swap this for winston if desired.
const util = require('util');

function info(...args) {
  console.log('[INFO]', ...args.map(a => (typeof a === 'object' ? util.inspect(a, { depth: 2 }) : a)));
}

function error(...args) {
  console.error('[ERROR]', ...args.map(a => (typeof a === 'object' ? util.inspect(a, { depth: 2 }) : a)));
}

module.exports = { info, error };

// Wrapper that redirects console.log to stderr so stdout stays clean for MCP JSON-RPC
const path = require('path');
process.chdir(path.join(__dirname));

console.log = (...args) => process.stderr.write(args.join(' ') + '\n');
console.info = (...args) => process.stderr.write(args.join(' ') + '\n');
console.warn = (...args) => process.stderr.write(args.join(' ') + '\n');

require(path.join(__dirname, 'dist', 'server.js'));

// This is a workaround to make the plugin available on examples
// without requiring an actual node module install as eslint
// does not allow importing local plugins

const plugin = require('./src/eslint');
module.exports = plugin;

// This is a workaround to make the plugin available on examples
// using eslint-plugin-local we load the di rules (see ../.eslintplugin.js)

module.exports = {
  plugins: ['local'],
  rules: {
    'local/order': ['error'],
    'local/no-duplicate': ['error'],
    'local/no-extraneous': ['error'],
    'local/no-restricted-injectable': ['error', { paths: [{ name: 'react' }] }],
    'local/sort-dependencies': ['error'],
  },
};

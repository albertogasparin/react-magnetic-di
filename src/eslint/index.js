const order = require('./rules/order');
const noDuplicate = require('./rules/no-duplicate');
const noExtraneous = require('./rules/no-extraneous');
const noRestrictedInjectable = require('./rules/no-restricted-injectable');
const sortDependencies = require('./rules/sort-dependencies');

module.exports = {
  rules: {
    order: order,
    'no-duplicate': noDuplicate,
    'no-extraneous': noExtraneous,
    'no-restricted-injectable': noRestrictedInjectable,
    'sort-dependencies': sortDependencies,
  },
};

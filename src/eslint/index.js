const order = require('./rules/order');
const exhaustiveInject = require('./rules/exhaustive-inject');
const noDuplicate = require('./rules/no-duplicate');
const noExtraneous = require('./rules/no-extraneous');
const sortDependencies = require('./rules/sort-dependencies');

module.exports = {
  rules: {
    order: order,
    'exhaustive-inject': exhaustiveInject,
    'no-duplicate': noDuplicate,
    'no-extraneous': noExtraneous,
    'sort-dependencies': sortDependencies,
  },
};

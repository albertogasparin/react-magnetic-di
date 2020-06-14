const order = require('./rules/order');
const exhaustiveInject = require('./rules/exhaustive-inject');
const noDuplicate = require('./rules/no-duplicate');

module.exports = {
  rules: {
    order: order,
    'exhaustive-inject': exhaustiveInject,
    'no-duplicate': noDuplicate,
  },
};

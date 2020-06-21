const { getDiIdentifier, isDiStatement } = require('../utils');

module.exports = {
  meta: {
    type: 'problem',
    // fixable: 'code',
    schema: [],
    messages: {
      wrongOrder:
        'Injectables should be defined at the top of their scope ' +
        'to avoid partial replacements and variables clashing',
    },
  },
  create: function (context) {
    let diIdentifier = null;

    return {
      ImportDeclaration(node) {
        if (!diIdentifier) diIdentifier = getDiIdentifier(node);
      },
      BlockStatement(node) {
        if (!diIdentifier) return;

        node.body.forEach((statement, i) => {
          if (!isDiStatement(statement, diIdentifier) || i === 0) return;

          const prev = node.body[i - 1];
          if (!isDiStatement(prev, diIdentifier)) {
            context.report({
              node: statement,
              messageId: 'wrongOrder',
            });
          }
        });
      },
    };
  },
};

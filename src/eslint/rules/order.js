const { getDiIdentifier, isDiStatement } = require('../utils');

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce di() call expression at the top of the block',
      category: 'Possible Errors',
      recommended: true,
    },
    // fixable: 'code',
    schema: [],
    messages: {
      wrongOrder:
        'di() calls should be defined at the top of their scope ' +
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

        (node.body || []).forEach((statement, i) => {
          if (!isDiStatement(statement, diIdentifier) || i === 0) return;

          // collect all nodes before the current one that are not directives
          const prevNodes = node.body.filter(
            (s, index) => index < i && !s.directive
          );
          if (prevNodes.length && !isDiStatement(prevNodes[0], diIdentifier)) {
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

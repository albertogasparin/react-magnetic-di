const { getDiIdentifier, getDiStatements, getDiVars } = require('../utils');

module.exports = {
  meta: {
    type: 'problem',
    // fixable: 'code',
    schema: [],
    messages: {
      duplicatedInjectable:
        "The dependency '{{name}}' has been marked as injectable more than once. " +
        'Please ensure it is listed only on one di(...) call',
    },
  },
  create: function (context) {
    let diIdentifier;

    const report = (node) =>
      context.report({
        node,
        messageId: 'duplicatedInjectable',
        data: { name: node.name },
      });

    return {
      ImportDeclaration(node) {
        if (!diIdentifier) diIdentifier = getDiIdentifier(node);
      },

      BlockStatement(node) {
        if (!diIdentifier) return;

        const diStatements = getDiStatements(node, diIdentifier);
        // ignore locations where di was not explicitly set
        if (!diStatements.length) return;

        const dupeDiVars = getDiVars(diStatements).filter(
          (id, i, arr) => arr.findIndex((n) => n.name === id.name) !== i
        );

        dupeDiVars.forEach(report);
      },
    };
  },
};

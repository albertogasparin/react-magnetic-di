const { getDiIdentifier, getDiStatements } = require('../utils');

module.exports = {
  meta: {
    type: 'problem',
    fixable: 'code',
    schema: [],
    messages: {
      duplicatedInjectable:
        "The dependency '{{name}}' has been marked injectable more than once. " +
        'Please ensure it is only on one di(...)',
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

        const dupeDiVars = diStatements
          .reduce((acc, s) => acc.concat(s.expression.arguments), [])
          .filter(
            (id, i, arr) => arr.findIndex((n) => n.name === id.name) !== i
          );

        dupeDiVars.forEach(report);
      },
    };
  },
};

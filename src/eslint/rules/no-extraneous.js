const {
  getDiIdentifier,
  getDiStatements,
  getParentDiBlock,
  getDiVars,
} = require('../utils');

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow injecting dependencies not being used',
      category: 'Possible Errors',
      recommended: true,
    },
    // fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          ignore: { type: 'array', items: { type: 'string' } },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      extraneousInjectable:
        "Extraneous dependency: '{{name}}'. " +
        'If it is not being used, remove it from the injectable list',
    },
  },
  create: function (context) {
    let diIdentifier;
    const blockReferences = new WeakMap();

    const report = (node) =>
      context.report({
        node,
        messageId: 'extraneousInjectable',
        data: { name: node.name },
        // fix(fixer) {
        //   const lastArg = diStatement.expression.arguments.slice(-1)[0];
        //   return fixer.insertTextAfter(lastArg, `, ${node.name}`);
        // },
      });

    return {
      ImportDeclaration(node) {
        if (!diIdentifier) diIdentifier = getDiIdentifier(node);
      },

      // this is to handle hooks and components recognised as used variables
      // it does not cover JSX variables
      BlockStatement(node) {
        if (!diIdentifier) return;

        const diStatements = getDiStatements(node, diIdentifier);
        // ignore locations where di was not explicitly set
        if (!diStatements.length) return;

        const diVars = getDiVars(diStatements);

        blockReferences.set(node, {
          di: diVars,
          through: context.sourceCode
            .getScope(node)
            .through.map((v) => v.identifier),
        });
      },

      // as JSX elements are not treated as variables, for each JSX tag
      // we check if there is a block with di() above and collect the tag as var
      'JSXOpeningElement:exit'(node) {
        if (!diIdentifier) return;

        let varNode;
        switch (node.name.type) {
          case 'JSXIdentifier': {
            varNode = node.name;
            break;
          }
          case 'JSXNamespacedName':
            // TODO handle foo:Bar
            return;
          case 'JSXMemberExpression':
            // TODO handle foo.Bar (but ignoring this.Bar)
            return;
          default:
            return;
        }
        const parentBlock = getParentDiBlock(varNode, diIdentifier);
        const blockVars = blockReferences.get(parentBlock);
        if (!blockVars) return;
        blockVars.through.push(varNode);
      },

      'BlockStatement:exit'(node) {
        if (!diIdentifier) return;

        const blockVars = blockReferences.get(node);
        if (!blockVars) return;
        blockVars.di.forEach((varNode) => {
          const occurrences = blockVars.through.filter(
            (v) => v.name === varNode.name
          );
          if (occurrences.length > 1) return;
          report(varNode);
        });
      },
    };
  },
};

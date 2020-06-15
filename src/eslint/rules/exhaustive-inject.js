const {
  getDiIdentifier,
  getDiStatements,
  getParentDiStatements,
  getDiVars,
  isHookName,
  isComponentName,
} = require('../utils');

const getReactIdentifiers = (node) => {
  if (node.source.value === 'react') {
    return node.specifiers
      .map((s) => s.local)
      .filter(
        (n) => !['useState', 'useContext', 'useReducer'].includes(n.name)
      );
  }
};

module.exports = {
  meta: {
    type: 'suggestion',
    fixable: 'code',
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
      missingInject:
        "di(...) has a missing dependency: '{{name}}'. " +
        'Either include it or remove the dependency injection call',
    },
  },
  create: function (context) {
    let diIdentifier;
    let reactVars;
    const userOptions = Object.assign({ ignore: [] }, context.options[0]);

    const isInjected = (vars, n) => vars.some((v) => v.name === n.name);
    const isReactIgnored = (n) => reactVars.some((v) => v.name === n.name);
    const isOptionsIgnored = (n) => userOptions.ignore.includes(n.name);

    const report = (node, diStatement) =>
      context.report({
        node: diStatement,
        messageId: 'missingInject',
        data: { name: node.name },
        fix(fixer) {
          const lastArg = diStatement.expression.arguments.slice(-1)[0];
          return fixer.insertTextAfter(lastArg, `, ${node.name}`);
        },
      });

    return {
      ImportDeclaration(node) {
        if (!diIdentifier) diIdentifier = getDiIdentifier(node);
        if (!reactVars) reactVars = getReactIdentifiers(node);
      },

      // this is to handle hooks and components recognised as used variables
      // it does not cover JSX variables
      BlockStatement(node) {
        if (!diIdentifier) return;

        const throughVars = context
          .getScope()
          .through.map((v) => v.identifier)
          .filter((v) => v.name !== diIdentifier.name);

        const diStatements = getDiStatements(node, diIdentifier);
        // ignore locations where di was not explicitly set
        if (!diStatements.length) return;

        const diVars = getDiVars(diStatements);

        throughVars.forEach((varNode) => {
          const isInjectable = isHookName(varNode) || isComponentName(varNode);
          if (
            !isInjectable ||
            isInjected(diVars, varNode) ||
            isReactIgnored(varNode) ||
            isOptionsIgnored(varNode)
          )
            return;
          report(varNode, diStatements[diStatements.length - 1]);
        });
      },

      // as JSX elements are not treated as variables, for each JSX tag
      // we check if there is a block with di() above and if that includes it
      'JSXOpeningElement:exit'(node) {
        let varNode;
        switch (node.name.type) {
          case 'JSXIdentifier': {
            varNode = node.name;
            const isInjectable = isComponentName(varNode);
            if (
              !isInjectable ||
              isReactIgnored(varNode) ||
              isOptionsIgnored(varNode)
            )
              return;
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
        const diStatements = getParentDiStatements(varNode, diIdentifier);
        // ignore locations where di was not explicitly set
        if (!diStatements.length) return;

        const diVars = getDiVars(diStatements);
        if (isInjected(diVars, varNode)) return;

        report(varNode, diStatements[diStatements.length - 1]);
      },
    };
  },
};

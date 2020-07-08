const {
  getDiIdentifier,
  getDiStatements,
  getParentDiStatements,
  getDiVars,
  isHookName,
  isComponentName,
  isLocalVariable,
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

const isDefaultProp = (node, diStatement) => {
  // we assume order rule is enabled, so if the variable is used in an assignment
  // defined before our di() statements, then it's probably default props
  return (
    node.parent.type === 'AssignmentPattern' &&
    node.range[0] < diStatement.range[0]
  );
};

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Requires external components/hooks to be marked as injectable',
      category: 'Best Practices',
      recommended: false,
    },
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
        "Dependency '{{name}}' has not being marked as injectable. " +
        'Add it to the list of the injectable dependencies',
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
          const isInjectable = isHookName(varNode);
          if (
            !isInjectable ||
            isInjected(diVars, varNode) ||
            isReactIgnored(varNode) ||
            isOptionsIgnored(varNode) ||
            isDefaultProp(varNode, diStatements[0])
          )
            return;
          report(varNode, diStatements[diStatements.length - 1]);
        });
      },

      // as JSX elements are not treated as variables, for each JSX tag
      // we check if there is a block with di() above and if that includes it
      'JSXOpeningElement:exit'(node) {
        if (!diIdentifier) return;

        // ignore if the component is declared locally
        if (isLocalVariable(node.name, context.getScope(), diIdentifier))
          return;

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

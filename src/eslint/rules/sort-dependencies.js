const { getDiIdentifier, getDiStatements } = require('../utils');

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Require injectable dependencies to be sorted',
      category: 'Stylistic Issues',
      recommended: false,
    },
    fixable: 'code',
    schema: [],
    messages: {
      unsortedInjectable:
        'Expected dependencies to be ordered by name. ' +
        "'{{name}}' should be before '{{prevName}}'.",
    },
  },
  create: function (context) {
    let diIdentifier;

    const report = (node, prevNode, args, sortedArgs) =>
      context.report({
        node,
        messageId: 'unsortedInjectable',
        data: { name: node.name, prevName: prevNode.name },
        fix(fixer) {
          // grab whatever between 1st arg end / 2nd arg start as separator
          const separator = context
            .getSourceCode()
            .text.slice(args[0].range[1], args[1].range[0]);
          const start = args[0].range[0];
          const end = args[args.length - 1].range[1];
          const sorted = sortedArgs.map((n) => n.name).join(separator);
          // fixes all order issues at once
          // so avoids the need of multiple saves
          return fixer.replaceTextRange([start, end], sorted);
        },
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

        diStatements.forEach((statement) => {
          const args = statement.expression.arguments;
          // sort uppercase first, lowercase after
          // so we get components and hooks grouped
          const sortedArgs = args
            .slice()
            .sort((a, b) => a.name.localeCompare(b.name));

          args.forEach((arg, i) => {
            const prevArg = args[i - 1];
            if (prevArg && arg.name.localeCompare(prevArg.name) < 0) {
              report(arg, prevArg, args, sortedArgs);
            }
          });
        });
      },
    };
  },
};

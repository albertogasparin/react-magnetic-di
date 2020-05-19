const PACKAGE_NAME = 'react-magnetic-di';
const PACKAGE_FUNCTION = 'di';

module.exports = function(babel) {
  const { types: t } = babel;

  return {
    visitor: {
      ImportDeclaration(path) {
        const importSource = path.node.source.value;
        const [importSpecifier] = path.node.specifiers.filter(
          (s) => s.imported && s.imported.name === PACKAGE_FUNCTION
        );

        if (importSource !== PACKAGE_NAME || !importSpecifier) return;

        const localIdentifier = importSpecifier.local.name;

        const binding = path.scope.getBinding(localIdentifier);
        const references = binding.referencePaths || [];

        references.forEach((ref) => {
          const args = ref.container.arguments;
          const statement = ref.getStatementParent();
          if (args.length > 0) {
            const depsCall = t.callExpression(ref.node, [
              t.arrayExpression(args),
            ]);
            const depsVars = t.arrayPattern(args);
            statement.replaceWith(
              t.variableDeclaration('const', [
                t.variableDeclarator(depsVars, depsCall),
              ])
            );
          } else {
            statement.remove();
          }
        });
      },
    },
  };
};

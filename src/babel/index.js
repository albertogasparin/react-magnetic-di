const PACKAGE_NAME = 'react-magnetic-di';
const PACKAGE_FUNCTION = 'di';

module.exports = function(babel) {
  const { types: t } = babel;

  const isValidReference = (ref) => {
    return (
      t.isCallExpression(ref.container) && ref.container.arguments.length > 0
    );
  };

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
        const references = (binding.referencePaths || []).filter(
          isValidReference
        );
        const allDependencies = new Set();

        references.forEach((ref) => {
          const args = ref.container.arguments;
          const statement = ref.getStatementParent();

          const depsCall = t.callExpression(ref.node, [
            t.arrayExpression(args),
          ]);
          const newIds = args.map((v) => t.identifier(v.name));

          ref.scope.push({
            id: t.arrayPattern(newIds),
            init: depsCall,
          });

          newIds.forEach((id) => {
            ref.scope.moveBindingTo(id, ref.scope);
            allDependencies.add(id.name);
          });

          statement.remove();
        });

        Array.from(allDependencies).forEach((name) => {
          const newId = path.scope.generateUidIdentifier(name);
          path.scope.rename(name, newId.name);
          references.forEach((ref) => {
            ref.container.arguments.forEach((arg) => {
              if (arg.name === name) arg.name = newId.name;
            });
          });
        });
      },
    },
  };
};

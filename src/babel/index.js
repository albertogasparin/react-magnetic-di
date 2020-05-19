const PACKAGE_NAME = 'react-magnetic-di';
const PACKAGE_FUNCTION = 'di';

module.exports = function(babel) {
  const { types: t } = babel;

  const isValidReference = (ref) => {
    const isValidBlock = [
      'FunctionDeclaration',
      'ArrowFunctionExpression',
      'ClassMethod',
    ].includes(ref.scope.block.type);
    return isValidBlock && t.isCallExpression(ref.container);
  };

  return {
    visitor: {
      ImportDeclaration(path) {
        // first we look at the imports:
        // if not our package and not the right function, ignore
        const importSource = path.node.source.value;
        const importSpecifier = path.node.specifiers.find(
          (s) => s.imported && s.imported.name === PACKAGE_FUNCTION
        );
        if (importSource !== PACKAGE_NAME || !importSpecifier) return;

        // then we locate all usages of the method
        // ensuring we affect on lications where it is called
        const methodIdentifier = importSpecifier.local.name;
        const binding = path.scope.getBinding(methodIdentifier);
        const references = binding.referencePaths.filter(isValidReference);

        // for each of that location we apply a tranformation
        references.forEach((ref) => {
          // from the arguments of the method we generate the list of dependency identifiers
          const args = ref.container.arguments;
          const dependencyIdentifiers = args.map((v) => t.identifier(v.name));
          const statement = ref.getStatementParent();

          // generating variable declarations with array destructuring
          // assigning them the result of the method call, with arguments
          // now wrapped in an array
          ref.scope.push({
            id: t.arrayPattern(dependencyIdentifiers),
            init: t.callExpression(ref.node, [t.arrayExpression(args)]),
          });

          args.forEach((argIdentifier) => {
            // for each argument we get the dependency variable name
            // then we rename it locally so we get a new unique identifier.
            // Then we manually revert just the argument identifier name back,
            // so it still points to the original dependency identifier name
            const name = argIdentifier.name;
            ref.scope.rename(name);
            argIdentifier.name = name;
          });

          // remove the original statement
          statement.remove();
        });
      },
    },
  };
};

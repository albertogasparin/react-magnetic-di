const PACKAGE_NAME = 'react-magnetic-di';
const PACKAGE_FUNCTION = 'di';
const ENABLED_ENVS = ['development', 'test'];

const assert = {
  isValidBlock(t, ref) {
    const { block } = ref.scope;
    if (
      !t.isFunctionDeclaration(block) &&
      !t.isFunctionExpression(block) &&
      !t.isArrowFunctionExpression(block) &&
      !t.isClassMethod(block)
    ) {
      throw ref.buildCodeFrameError(
        'Invalid di(...) call. Must be inside a render function of a component. '
      );
    }
  },
  isValidCall(t, ref) {
    if (!ref.container.arguments.length) {
      throw ref.buildCodeFrameError(
        'Invalid di(...) arguments. Must be called with at least one argument. '
      );
    }
    if (!ref.container.arguments.every((node) => t.isIdentifier(node))) {
      throw ref.buildCodeFrameError(
        'Invalid di(...) arguments. Must be called with plain identifiers. '
      );
    }
  },
};

const getComponentDeclaration = (t, scope) => {
  // function declarations
  if (scope.parentBlock.declaration) return scope.parentBlock.declaration.id;
  if (scope.getBlockParent().block.id) return scope.getBlockParent().block.id;
  // variable declaration
  if (scope.parentBlock.id) return scope.parentBlock.id;
  // class declarations
  if (scope.parentBlock.type.includes('Class')) return scope.parent.block.id;
};

module.exports = function (babel) {
  const { types: t } = babel;
  const isEnabledEnv = babel.env(ENABLED_ENVS);

  return {
    visitor: {
      ImportDeclaration(path, { opts = {} }) {
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
        const references = binding.referencePaths.filter((ref) =>
          t.isCallExpression(ref.container)
        );

        const isEnabled = isEnabledEnv || Boolean(opts.forceEnable);

        // for each of that location we apply a tranformation
        references.forEach((ref) => {
          assert.isValidBlock(t, ref);
          assert.isValidCall(t, ref);

          // from the arguments of the method we generate the list of dependency identifiers
          const args = ref.container.arguments;
          const dependencyIdentifiers = args.map((v) => t.identifier(v.name));
          const statement = ref.getStatementParent();

          // if should not be enabled, just remove the statement and exit
          if (!isEnabled) {
            statement.remove();
            return;
          }

          // generating variable declarations with array destructuring
          // assigning them the result of the method call, with arguments
          // now wrapped in an array
          ref.scope.push({
            id: t.arrayPattern(dependencyIdentifiers),
            init: t.callExpression(ref.node, [
              t.arrayExpression(args),
              getComponentDeclaration(t, ref.scope) || t.nullLiteral(),
            ]),
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

const { assert, getComponentDeclaration } = require('./utils');

function getSelfName(path) {
  return path.node.id?.name || path.parentPath.node.id?.name;
}

function buildDepsArray(t, ref, args) {
  const diNames = new Set();
  const selfName = getSelfName(ref.getFunctionParent());
  const parentBlock = ref.findParent((path) => path.isBlockStatement());

  parentBlock.traverse({
    CallExpression(path) {
      assert.isValidLocation(t, ref, path);

      const { name } = path.node.callee;

      if (
        name &&
        // not di()
        name !== ref.node.name &&
        // not self
        name !== selfName &&
        // not manually set
        !args.some((v) => v.name === name) &&
        // not built-ins
        !globalThis[name] &&
        // not locally defined
        !ref.scope.hasOwnBinding(name) &&
        // but defined in parent scope
        ref.scope.hasBinding(name)
      ) {
        diNames.add(name);
      }
    },
    JSXOpeningElement(path) {
      const { name } = path.node.name;
      if (
        name &&
        // not self
        name !== selfName &&
        // not manually set
        !args.some((v) => v.name === name) &&
        // not tag name
        name[0] === name[0].toUpperCase() &&
        // not locally defined
        !ref.scope.hasOwnBinding(name) &&
        // but defined in parent scope
        ref.scope.hasBinding(name)
      ) {
        diNames.add(name);
      }
    },
  });

  return Array.from(diNames).map((v) => t.identifier(v));
}

function processReference(t, ref, isEnabled) {
  assert.isValidBlock(t, ref);
  assert.isValidCall(t, ref);

  // from the arguments of the method we generate the list of dependency identifiers
  let args = ref.container.arguments;
  if (isEnabled) {
    args = buildDepsArray(t, ref, args)
      .concat(args)
      .sort((a, b) => (a.name > b.name ? 1 : -1));
  }

  const dependencyIdentifiers = args.map((v) => t.identifier(v.name));
  const statement = ref.getStatementParent();

  // if should not be enabled, just remove the statement and exit
  if (!isEnabled || dependencyIdentifiers.length === 0) {
    statement.remove();
    return;
  }

  // generating variable declarations with array destructuring
  // assigning them the result of the method call, with arguments
  // now wrapped in an array
  statement.replaceWith(
    t.variableDeclaration('const', [
      t.variableDeclarator(
        t.arrayPattern(dependencyIdentifiers),
        t.callExpression(ref.node, [
          t.arrayExpression(args),
          getComponentDeclaration(t, ref.scope) || t.nullLiteral(),
        ])
      ),
    ])
  );

  ref.scope.registerDeclaration(statement);

  args.forEach((argIdentifier) => {
    // for each argument we get the dependency variable name
    // then we rename it locally so we get a new unique identifier.
    // Then we manually revert just the argument identifier name back,
    // so it still points to the original dependency identifier name
    const name = argIdentifier.name;
    ref.scope.rename(name);
    argIdentifier.name = name;
  });
}

module.exports = processReference;

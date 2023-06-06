const { assert, getComponentDeclaration } = require('./utils');

function getSelfName(path) {
  return path.node.id?.name || path.parentPath.node.id?.name;
}

function isDefinedOutside(scope, name) {
  // not locally defined but defined in parent scope
  return !scope.hasOwnBinding(name) && scope.hasBinding(name);
}

function buildDepsArray(t, ref) {
  const diNames = new Set();
  const selfName = getSelfName(ref.getFunctionParent());
  const parentBlock = ref.findParent((path) => path.isBlockStatement());

  const locallyRenamed = new Map();

  parentBlock.traverse({
    VariableDeclarator(path) {
      const { id, init } = path.node;
      if (!init) return; // var declared undefined
      if (t.isConditionalExpression(init)) {
        locallyRenamed.set(id.name, []);
        if (
          t.isIdentifier(init.consequent) &&
          isDefinedOutside(ref.scope, init.consequent.name)
        )
          locallyRenamed.get(id.name).push(init.consequent.name);
        if (
          t.isIdentifier(init.alternate) &&
          isDefinedOutside(ref.scope, init.alternate.name)
        )
          locallyRenamed.get(id.name).push(init.alternate.name);
        return;
      }
    },
    CallExpression(path) {
      assert.isValidLocation(t, ref, path);

      const { name } = path.node.callee;
      if (
        !name ||
        // is di()
        name === ref.node.name ||
        // is self
        name === selfName ||
        // built-ins
        globalThis[name]
      )
        return;

      if (isDefinedOutside(ref.scope, name)) {
        diNames.add(name);
      }

      if (locallyRenamed.has(name)) {
        locallyRenamed.get(name).forEach((v) => diNames.add(v));
      }
    },
    JSXOpeningElement(path) {
      const { name } = path.node.name;
      if (
        !name ||
        // is di()
        name === ref.node.name ||
        // is self
        name === selfName ||
        // not tag name
        name[0] !== name[0].toUpperCase()
      )
        return;

      if (
        // not locally defined
        !ref.scope.hasOwnBinding(name) &&
        // but defined in parent scope
        ref.scope.hasBinding(name)
      ) {
        diNames.add(name);
      }

      if (locallyRenamed.has(name)) {
        locallyRenamed.get(name).forEach((v) => diNames.add(v));
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
      .sort((a, b) => (a.name > b.name ? 1 : -1))
      .filter((v, i, arr) => v.name !== arr[i + 1]?.name);
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

  console.log(ref);
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

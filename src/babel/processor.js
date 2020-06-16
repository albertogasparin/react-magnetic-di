const { assert, getComponentDeclaration } = require('./utils');

function processReference(t, ref, isEnabled) {
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
}

module.exports = processReference;

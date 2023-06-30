const { assert, getComponentDeclaration } = require('./utils');

function processReference(t, path, state) {
  const locationValue = state.getValueForPath(path);
  const self = getComponentDeclaration(t, path.scope);

  // Build list of dependencies
  // combining used imports/exports in this function block
  // with existing di expression (if any)
  const depNames = [];
  Array.from(locationValue.dependencyRefs).forEach((p) => {
    if (!depNames.includes(p.node.name)) depNames.push(p.node.name);
  });
  locationValue.diRef?.container?.arguments?.forEach((n) => {
    assert.isValidArgument(t, n, locationValue.diRef, self);
    if (!depNames.includes(n.name)) depNames.push(n.name);
  });
  depNames.sort();

  const elements = depNames.map((v) => t.identifier(v));
  const args = depNames.map((v) => t.identifier(v));
  // add di there
  const declaration = t.variableDeclaration('const', [
    t.variableDeclarator(
      t.arrayPattern(elements),
      t.callExpression(state.diIdentifier, [
        t.arrayExpression(args),
        self || t.nullLiteral(),
      ])
    ),
  ]);

  // We inject the new declaration either by replacing existing di
  // or by replacing and adding the statement at the top.
  // We need replacing to ensure we get a path so that registerDeclaration works
  let declarationPath;
  if (locationValue.diRef) {
    declarationPath = locationValue.diRef.getStatementParent();
    declarationPath.replaceWith(declaration);
  } else {
    path
      .get('body.body.0')
      .replaceWithMultiple([declaration, path.get('body.body.0').node]);
    declarationPath = path.get('body.body.0');
  }

  path.get('body').scope.registerDeclaration(declarationPath);

  args.forEach((argIdentifier) => {
    // For each argument we get the dependency variable name
    // then we rename it locally so we get a new unique identifier.
    // Then we manually revert just the argument identifier name back,
    // so it still points to the original dependency identifier name
    const name = argIdentifier.name;
    const { scope } = path.get('body');
    scope.rename(name, state.getAlias(name, scope));
    argIdentifier.name = name;
  });
}

module.exports = processReference;

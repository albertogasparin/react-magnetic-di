const { assert, getComponentDeclaration } = require('./utils');

function processReference(t, path, locationValue, state) {
  const self = getComponentDeclaration(t, path.scope);
  const bodyPath = path.get('body');

  // Build list of dependencies
  // combining used imports/exports in this function block
  // with existing di expression (if any)
  const depNames = [];
  Array.from(locationValue.dependencyRefs).forEach((n) => {
    const name = n.node?.name;
    // quick check that the path is not detached
    if (!name || !n.parentPath) return;
    // Some babel plugins might rename imports (eg emotion) and references break
    // For now we skip, but ideally we would refresh the reference
    if (!bodyPath.scope.getBinding(name)) return;
    // Ensure we do not duplicate and di() self name
    if (depNames.includes(name) || name === self?.name) return;

    depNames.push(name);
  });
  locationValue.diRef?.container?.arguments?.forEach((n) => {
    assert.isValidArgument(t, n, locationValue.diRef, self);
    if (!depNames.includes(n.name)) depNames.push(n.name);
  });
  depNames.sort();

  // if there are no valid candidates, exit
  if (!depNames.length) return;

  const elements = depNames.map((v) => t.identifier(v));
  const args = depNames.map((v) => t.identifier(v));
  // add di there
  const declaration = t.variableDeclaration('const', [
    t.variableDeclarator(
      t.arrayPattern(elements),
      t.callExpression(t.identifier(state.diIdentifier.name), [
        t.arrayExpression(args),
        self ? t.identifier(self.name) : t.nullLiteral(),
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
    bodyPath.unshiftContainer('body', declaration);
    declarationPath = bodyPath.get('body.0');
  }

  bodyPath.scope.registerDeclaration(declarationPath);

  const argsPaths = declarationPath.get(
    'declarations.0.init.arguments.0.elements'
  );
  argsPaths.forEach((argPath) => {
    // For each argument we get the dependency variable name
    // then we rename it locally so we get a new unique identifier.
    // Then we manually revert just the argument identifier name back,
    // so it still points to the original dependency identifier name
    const name = argPath.node.name;
    bodyPath.scope.rename(name, state.getAlias(name, bodyPath.scope));
    argPath.replaceWith(t.identifier(name));
  });

  // ensure we add di import
  state.addDiImport(t);
}

module.exports = processReference;

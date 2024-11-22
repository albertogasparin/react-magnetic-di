const { assert, getComponentDeclaration } = require('./utils');

function processReference(t, path, locationValue, state) {
  const self = getComponentDeclaration(t, path.scope);
  const bodyPath = path.get('body');

  let shadowsOwnName = false;
  if (self) {
    const selfShadow = bodyPath.scope.getBinding(self.name);
    if (
      selfShadow &&
      selfShadow.scope === bodyPath.scope &&
      selfShadow.path.node.id !== self
    ) {
      shadowsOwnName = true;
    }
  }
  // Build list of dependencies
  // combining used imports/exports in this function block
  // with existing di expression (if any)
  const depNames = [];

  locationValue.dependencyRefs.forEach((n) => {
    const name = n.node?.name;
    // quick check that the path is not detached
    if (!name || !n.parentPath) return;
    // Some babel plugins might rename imports (eg emotion) and references break
    // For now we skip, but ideally we would refresh the reference
    if (!bodyPath.scope.getBinding(name)) return;
    // Ensure we do not di() self name
    if (name === self?.name) {
      shadowsOwnName = true;
      return;
    }
    // Ensure we do not duplicate
    if (depNames.includes(name)) return;

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
        self && !shadowsOwnName ? t.identifier(self.name) : t.nullLiteral(),
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
    const newName = state.getAlias(name, bodyPath.scope);
    bodyPath.scope.rename(name, newName);
    argPath.replaceWith(t.identifier(name));

    // this is ugly but scope also renames dynamic object computed props
    // so we revert that change too
    if (bodyPath.parentPath?.node?.computed) {
      const key = bodyPath.parentPath.get('key');
      if (key.isIdentifier() && key.node.name === newName) {
        // get [foo] ()
        key.replaceWith(t.identifier(name));
      } else {
        // get [foo()] {} / get [foo.bar] {} / ...
        key.traverse({
          Identifier(keyPath) {
            if (keyPath.node.name === newName) {
              keyPath.replaceWith(t.identifier(name));
            }
          },
        });
      }
    }
  });

  // ensure we add di import
  state.prependDiImport(t);
}

module.exports = processReference;

const { isMatchingAny } = require('./utils');

function processInjectable(t, path, state, opts) {
  const [depPath, , configPath] = path.get('arguments');
  if (
    !depPath ||
    !state?.injectIdentifier ||
    path.get('callee').node.name !== state.injectIdentifier?.name
  ) {
    return;
  }

  // check if third argument is not an object with module: false
  const moduleFlag = configPath?.node.properties?.find(
    (n) => n.key?.name === 'module'
  )?.value?.value;

  const depName = depPath.node.name;
  const importSource = state.imports.specifiers.get(depName);

  // There are several conditions under which we should mock:
  // - if the import source matches any defaultMockedModules regexp
  //   and not consuming multiple exports or module flag is false
  // - if injectable is called with explicit module: true
  const isSourceAllowed =
    isMatchingAny(opts.defaultMockedModules.include, importSource) &&
    !isMatchingAny(opts.defaultMockedModules.exclude, importSource);

  if ((!isSourceAllowed && !moduleFlag) || moduleFlag === false) return;

  const allSpecifiers = state.imports.sources.get(importSource);
  const remainingSpecifiers = moduleFlag
    ? []
    : allSpecifiers?.filter((s) => s !== depName);
  state.imports.sources.set(importSource, remainingSpecifiers);

  if (remainingSpecifiers?.length !== 0 || allSpecifiers?.length === 0) {
    return;
  }

  const statement = t.expressionStatement(
    t.callExpression(
      t.memberExpression(t.identifier('jest'), t.identifier('mock')),
      [t.stringLiteral(importSource)]
    )
  );

  // add statement var to programPath body after all imports but before variables
  state.programPath.get('body').some((n, i) => {
    if (!t.isImportDeclaration(n)) {
      state.programPath.get('body')[i].insertBefore(statement);
      return true;
    }
  });
}
module.exports = processInjectable;

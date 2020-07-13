const PACKAGE_NAME = 'react-magnetic-di';
const PACKAGE_FUNCTION = 'di';

const isDiStatement = (stm, spec) =>
  stm.type === 'ExpressionStatement' &&
  stm.expression &&
  stm.expression.callee &&
  stm.expression.callee.name === spec.name;

const isHookName = (node) => /^use[A-Z0-9].*$/.test(node.name);

const isComponentName = (node) => !/^[a-z]/.test(node.name);

const isLocalVariable = (node, scope, diIdentifier) => {
  do {
    // if we reach module/global scope then is not local
    if (scope.type === 'module' || scope.type === 'global') return false;

    const isLocal = scope.variables.some((v) => v.name === node.name);
    if (isLocal) return true;

    // if we got to the scope containing di() and was not found in variables yet
    // we presume it is not local
    if (scope.references.some((r) => r.identifier.name === diIdentifier.name))
      return false;
    // eslint-disable-next-line no-cond-assign
  } while ((scope = scope.upper));

  return false;
};

const getDiIdentifier = (node) => {
  const importSource = node.source.value;
  const importSpecifier = node.specifiers.find(
    (s) => s.imported && s.imported.name === PACKAGE_FUNCTION
  );
  if (importSource.startsWith(PACKAGE_NAME) && importSpecifier) {
    return importSpecifier.local;
  }
};

const getDiStatements = (node, diIdentifier) =>
  (node.body || []).reduce(
    (acc, statement) =>
      isDiStatement(statement, diIdentifier) ? acc.concat(statement) : acc,
    []
  );

const getParentDiBlock = (node, diIdentifier) => {
  // eslint-disable-next-line no-cond-assign
  while ((node = node.parent)) {
    if (node.type === 'BlockStatement') {
      if (getDiStatements(node, diIdentifier).length) return node;
    }
  }
  return null;
};

const getParentDiStatements = (node, diIdentifier) => {
  const parentBlock = getParentDiBlock(node, diIdentifier);
  if (parentBlock) return getDiStatements(parentBlock, diIdentifier);
  return [];
};

const getDiVars = (statements) =>
  statements.reduce((acc, s) => acc.concat(s.expression.arguments), []);

module.exports = {
  isDiStatement,
  isHookName,
  isComponentName,
  isLocalVariable,
  getDiIdentifier,
  getDiStatements,
  getParentDiBlock,
  getParentDiStatements,
  getDiVars,
};

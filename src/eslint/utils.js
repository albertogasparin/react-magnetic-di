const PACKAGE_NAME = 'react-magnetic-di';
const PACKAGE_FUNCTION = 'di';
const INJECT_FUNCTION = 'injectable';

const isDiStatement = (stm, spec) =>
  stm.type === 'ExpressionStatement' &&
  stm.expression &&
  stm.expression.callee &&
  stm.expression.callee.name === spec.name;

const isHookName = (node) => /^use[A-Z0-9].*$/.test(node.name);

const isComponentName = (node) => !/^[a-z]/.test(node.name);

const isLocalVariable = (node, scope) => {
  do {
    // if we reach module/global scope then is not local
    if (scope.type === 'module' || scope.type === 'global') return false;

    const isLocal = scope?.variables.some((v) => v.name === node.name);
    if (isLocal) return true;

    // eslint-disable-next-line no-cond-assign
  } while ((scope = scope.upper));

  return false;
};

const getImportIdentifiers = (node, pkgName, impNames) => {
  const importSource = node.source.value;
  const importSpecifiers = node.specifiers.filter(
    (s) => s.imported && (!impNames || impNames.includes(s.imported.name))
  );
  if (importSource.startsWith(pkgName) && importSpecifiers.length) {
    return importSpecifiers.map((s) => s.local);
  }
  return null;
};

const getDiIdentifier = (n) =>
  getImportIdentifiers(n, PACKAGE_NAME, [PACKAGE_FUNCTION])?.[0];
const getInjectIdentifier = (n) =>
  getImportIdentifiers(n, PACKAGE_NAME, [INJECT_FUNCTION])?.[0];

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
  getImportIdentifiers,
  getInjectIdentifier,
  getDiStatements,
  getParentDiBlock,
  getParentDiStatements,
  getDiVars,
};

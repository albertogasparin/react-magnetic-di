const PACKAGE_NAME = 'react-magnetic-di';
const PACKAGE_FUNCTION = 'di';
const INJECT_FUNCTION = 'injectable';

const isDiStatement = (stm, spec) =>
  stm.type === 'ExpressionStatement' &&
  stm.expression &&
  stm.expression.callee &&
  stm.expression.callee.name === spec.name;

const calcImportSource = (src) => {
  const [ns, value = ''] = src.split('/');
  return ns.startsWith('@') ? ns + '/' + value : ns;
};

const getImportIdentifiers = (node, pkgName, impNames) => {
  const importSource = calcImportSource(node.source.value);
  const importSpecifiers = node.specifiers.filter(
    (s) => s.imported && (!impNames || impNames.includes(s.imported.name))
  );

  if (importSource === pkgName && importSpecifiers.length) {
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

const getDiVars = (statements) =>
  statements.reduce((acc, s) => acc.concat(s.expression.arguments), []);

module.exports = {
  isDiStatement,
  getDiIdentifier,
  getImportIdentifiers,
  getInjectIdentifier,
  getDiStatements,
  getParentDiBlock,
  getDiVars,
};

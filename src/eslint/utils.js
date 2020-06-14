const PACKAGE_NAME = 'react-magnetic-di';
const PACKAGE_FUNCTION = 'di';

const isDiStatement = (stm, spec) =>
  stm.type === 'ExpressionStatement' &&
  stm.expression &&
  stm.expression.callee.name === spec.name;

const isHookName = (node) => /^use[A-Z0-9].*$/.test(node.name);

const isComponentName = (node) => !/^[a-z]/.test(node.name);

const getDiIdentifier = (node) => {
  const importSource = node.source.value;
  const importSpecifier = node.specifiers.find(
    (s) => s.imported && s.imported.name === PACKAGE_FUNCTION
  );
  if (importSource === PACKAGE_NAME && importSpecifier) {
    return importSpecifier.local;
  }
};

const getDiStatements = (node, diIdentifier) =>
  (node.body || []).reduce(
    (acc, statement) =>
      isDiStatement(statement, diIdentifier) ? acc.concat(statement) : acc,
    []
  );

const getParentDiStatements = (node, diIdentifier) => {
  // eslint-disable-next-line no-cond-assign
  while ((node = node.parent)) {
    if (node.type === 'BlockStatement') {
      const statements = getDiStatements(node, diIdentifier);
      if (statements.length) return statements;
    }
  }
  return [];
};

module.exports = {
  isDiStatement,
  isHookName,
  isComponentName,
  getDiIdentifier,
  getDiStatements,
  getParentDiStatements,
};

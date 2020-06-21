const { createMacro } = require('babel-plugin-macros');

const { PACKAGE_NAME, PACKAGE_FUNCTION } = require('./constants');
const processReference = require('./processor');
const { createNamedImport, isEnabledEnv } = require('./utils');

const diMacro = ({ references, babel, config = {} }) => {
  const { types: t } = babel;
  const isEnabled = isEnabledEnv() || Boolean(config.forceEnable);

  const importedMethods = Object.keys(references).filter(
    (v) => references[v].length
  );
  const diImport = references[PACKAGE_FUNCTION] || [];
  // process all di calls
  diImport.forEach((ref) => processReference(t, ref, isEnabled));

  // if not enabled and only di was imported, let import to be stripped
  if (
    importedMethods.length === 1 &&
    importedMethods[0] === PACKAGE_FUNCTION &&
    !isEnabled
  )
    return;

  // add named imports
  const { scope: methodScope } = references[importedMethods[0]][0];
  const statement = createNamedImport(
    t,
    PACKAGE_NAME,
    importedMethods,
    importedMethods.map((k) => references[k][0].node)
  );

  const programPath = methodScope.getProgramParent().path;

  const targetPath = programPath
    .get('body')
    .find(
      (p) =>
        p.node &&
        p.node.source &&
        p.node.source.value === PACKAGE_NAME + '/macro'
    );

  if (targetPath) {
    // if we find the macro import, we add the clean import right before
    // should always be the case, but we handle exception
    targetPath.insertBefore(statement);
  } else {
    // we add the import at the top of the program body
    programPath.unshiftContainer('body', statement);
  }
};

module.exports = createMacro(diMacro, {
  configName: 'reactMagneticDi',
});

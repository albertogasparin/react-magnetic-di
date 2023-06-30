const { createMacro } = require('babel-plugin-macros');

const { PACKAGE_NAME, HOC_FUNCTION } = require('./constants');
const processHOCReference = require('./processor-hoc');
const { createNamedImport, isEnabledEnv } = require('./utils');

const diMacro = ({ references, babel, config = {} }) => {
  const { types: t } = babel;
  const isEnabled = isEnabledEnv() || Boolean(config.forceEnable);

  const importedMethods = Object.keys(references).filter(
    (v) => references[v].length
  );

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

  if (isEnabled) {
    if (targetPath) {
      // if we find the macro import, we add the clean import right before
      // should always be the case, but we handle exception
      targetPath.insertBefore(statement);
    } else {
      // we add the import at the top of the program body
      programPath.unshiftContainer('body', statement);
    }
  }

  const hocImports = references[HOC_FUNCTION] || [];

  // process all HOC calls
  hocImports.forEach((ref) => processHOCReference(t, ref));
};

module.exports = createMacro(diMacro, {
  configName: 'reactMagneticDi',
});

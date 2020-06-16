const { PACKAGE_NAME, PACKAGE_FUNCTION } = require('./constants');
const processReference = require('./processor');
const { isEnabledEnv } = require('./utils');

module.exports = function (babel) {
  const { types: t } = babel;

  return {
    visitor: {
      ImportDeclaration(path, { opts = {} }) {
        // first we look at the imports:
        // if not our package and not the right function, ignore
        const importSource = path.node.source.value;
        const importSpecifier = path.node.specifiers.find(
          (s) => s.imported && s.imported.name === PACKAGE_FUNCTION
        );
        if (importSource !== PACKAGE_NAME || !importSpecifier) return;

        // then we locate all usages of the method
        // ensuring we affect on lications where it is called
        const methodIdentifier = importSpecifier.local.name;
        const binding = path.scope.getBinding(methodIdentifier);

        if (!binding) return;
        const references = binding.referencePaths.filter((ref) =>
          t.isCallExpression(ref.container)
        );

        const isEnabled = isEnabledEnv() || Boolean(opts.forceEnable);

        // for each of that location we apply a tranformation
        references.forEach((ref) => processReference(t, ref, isEnabled));
      },
    },
  };
};

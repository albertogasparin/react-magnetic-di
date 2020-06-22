const { PACKAGE_NAME, PACKAGE_FUNCTION, HOC_FUNCTION } = require('./constants');
const processDIReference = require('./processor-di');
const processHOCReference = require('./processor-hoc');
const { isEnabledEnv } = require('./utils');

module.exports = function (babel) {
  const { types: t } = babel;

  return {
    visitor: {
      ImportDeclaration(path, { opts = {} }) {
        // first we look at the imports:
        // if not our package and not the right function, ignore
        const importSource = path.node.source.value;
        const importDISpecifier = path.node.specifiers.find(
          (s) => s.imported && s.imported.name === PACKAGE_FUNCTION
        );
        const importHOCSpecifier = path.node.specifiers.find(
          (s) => s.imported && s.imported.name === HOC_FUNCTION
        );
        if (importSource !== PACKAGE_NAME) return;

        if (importDISpecifier) {
          // then we locate all usages of the method
          // ensuring we affect only locations where it is called
          const methodIdentifier = importDISpecifier.local.name;
          const binding = path.scope.getBinding(methodIdentifier);

          if (!binding) return;
          const references = binding.referencePaths.filter((ref) =>
            t.isCallExpression(ref.container)
          );

          const isEnabled = isEnabledEnv() || Boolean(opts.forceEnable);

          // for each of that location we apply a tranformation
          references.forEach((ref) => processDIReference(t, ref, isEnabled));
        }

        if (importHOCSpecifier) {
          // then we locate all usages of the method
          // ensuring we affect only locations where it is called
          const methodIdentifier = importHOCSpecifier.local.name;
          const binding = path.scope.getBinding(methodIdentifier);

          if (!binding) return;
          const references = binding.referencePaths.filter((ref) =>
            t.isCallExpression(ref.container)
          );

          // for each of that location we apply a tranformation
          references.forEach((ref) => processHOCReference(t, ref));
        }
      },
    },
  };
};

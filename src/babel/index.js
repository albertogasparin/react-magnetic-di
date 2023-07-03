const {
  PACKAGE_NAME,
  INJECT_FUNCTION,
  PACKAGE_FUNCTION,
  HOC_FUNCTION,
} = require('./constants');
const processDiDeclaration = require('./processor-di');
const processHOCReference = require('./processor-hoc');
const {
  isEnabledEnv,
  createNamedImport,
  assert,
  collectDiReferencePaths,
  collectDepsReferencePaths,
} = require('./utils');

class State {
  paths = new WeakMap();
  aliases = new Map();
  diIdentifier = null;
  shouldAddImport = false;

  findDiIndentifier(t, body, scope) {
    const diImportNode = body.find(
      (n) => t.isImportDeclaration(n) && n.source.value === PACKAGE_NAME
    );

    const diImportSpecifier = diImportNode?.specifiers.find(
      (s) => s.imported && s.imported.name === PACKAGE_FUNCTION
    );

    this.diIdentifier =
      diImportSpecifier?.local || scope.generateUidIdentifier(PACKAGE_FUNCTION);
  }

  getValueOrInit(fnPath) {
    if (!this.paths.has(fnPath)) {
      this.paths.set(fnPath, {
        diRef: null,
        dependencyRefs: new Set(),
      });
    }
    return this.paths.get(fnPath);
  }

  addDi(diRef) {
    const parentFnPath = diRef.getFunctionParent();
    assert.isValidLocation(parentFnPath, diRef);
    const value = this.getValueOrInit(parentFnPath);
    value.diRef = diRef;
  }

  addDependency(depRef) {
    const parentFnPath = depRef.findParent(
      (p) =>
        p.isFunction() &&
        !p.getFunctionParent() &&
        p.parentPath?.node?.callee?.name !== INJECT_FUNCTION
    );
    if (!parentFnPath) return;
    const value = this.getValueOrInit(parentFnPath);
    // store node instead of path as path might mutate!
    value.dependencyRefs.add(depRef.node);
  }

  getValueForPath(fnPath) {
    return this.paths.get(fnPath);
  }

  getAlias(name, scope) {
    if (!this.aliases.has(name)) {
      this.aliases.set(name, scope.generateUid(name));
    }
    return this.aliases.get(name);
  }
}

module.exports = function (babel) {
  const { types: t } = babel;
  let state;

  return {
    visitor: {
      Program: {
        enter(path, { opts = {} }) {
          // Currenrly we only enable di for imported/exported members
          // given creating injectables requires source declarations.
          // We do not support creating injectables in the same file as dep declaration
          const isEnabled = isEnabledEnv() || Boolean(opts.forceEnable);
          state = new State();
          state.findDiIndentifier(t, path.node.body, path.scope);

          collectDiReferencePaths(t, state.diIdentifier, path.scope).forEach(
            (p) => {
              if (isEnabled) state.addDi(p);
              else p.parentPath.remove();
            }
          );

          if (!isEnabled) return;

          collectDepsReferencePaths(t, path.get('body')).forEach((p) =>
            state.addDependency(p)
          );
        },
        exit(path) {
          // if we ended up adding any di(), let's add the import at the top
          if (state.shouldAddImport) {
            const statement = createNamedImport(
              t,
              PACKAGE_NAME,
              [PACKAGE_FUNCTION],
              [state.diIdentifier]
            );
            path.unshiftContainer('body', statement);
          }
          // reset state vars
          state = null;
        },
      },
      Function(path) {
        // process only if function is a candidate to host di
        if (!state || !state.getValueForPath(path)) return;

        // convert arrow function returns as di needs a block
        if (!t.isBlockStatement(path.node.body)) {
          // convert arrow function return to block
          path
            .get('body')
            .replaceWith(t.blockStatement([t.returnStatement(path.node.body)]));
        }

        // create di declaration
        processDiDeclaration(t, path, state);

        // console.log(
        //   path.parentPath
        //     .toString()
        //     .replace(/(\w+)[\s\S]+di\(\[([^\]]+)[\s\S]+/, '$1: $2')
        // );
      },

      ImportDeclaration(path) {
        // first we look at the imports:
        // if not our package and not the right function, ignore
        if (path.node.source.value !== PACKAGE_NAME) return;

        const importHOCSpecifier = path.node.specifiers.find(
          (s) => s.imported && s.imported.name === HOC_FUNCTION
        );

        if (!importHOCSpecifier) return;

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
      },
    },
  };
};

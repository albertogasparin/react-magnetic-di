const {
  PACKAGE_NAME,
  INJECT_FUNCTION,
  PACKAGE_FUNCTION,
  HOC_FUNCTION,
} = require('./constants');
const processDiDeclaration = require('./processor-di');
const processHOCReference = require('./processor-hoc');
const {
  assert,
  createNamedImport,
  collectDiReferencePaths,
  collectDepsReferencePaths,
  isExcluded,
} = require('./utils');

class State {
  paths = new WeakMap();
  aliases = new Map();
  diIdentifier = null;
  programPath = null;

  constructor(path) {
    this.programPath = path;
  }

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

  getValueForPath(fnPath) {
    return this.paths.get(fnPath);
  }

  getAlias(name, scope) {
    if (!this.aliases.has(name)) {
      this.aliases.set(name, scope.generateUid(name));
    }
    return this.aliases.get(name);
  }

  removeValueForPath(fnPath) {
    return this.paths.delete(fnPath);
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

  addDiImport(t) {
    if (this.diIdentifier.loc) return;

    const statement = createNamedImport(
      t,
      PACKAGE_NAME,
      [PACKAGE_FUNCTION],
      [this.diIdentifier]
    );
    this.programPath.unshiftContainer('body', statement);
    // after adding, make this function a noop
    this.addDiImport = () => {};
  }
}

module.exports = function (babel) {
  const { types: t } = babel;
  let state = null;

  return {
    visitor: {
      Program: {
        enter(path, { opts, file }) {
          if (isExcluded(opts.exclude, file.opts.filename)) return;

          state = new State(path);
          state.findDiIndentifier(t, path.node.body, path.scope);

          collectDiReferencePaths(t, state.diIdentifier, path.scope).forEach(
            (p) => state.addDi(p)
          );

          collectDepsReferencePaths(t, path.get('body')).forEach((p) =>
            state.addDependency(p)
          );
        },
        exit() {
          // reset state so if babel processes the function again, we do not add another di
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

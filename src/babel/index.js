const {
  PACKAGE_NAME,
  INJECT_FUNCTION,
  PACKAGE_FUNCTION,
  HOC_FUNCTION,
} = require('./constants');
const processDiDeclaration = require('./processor-di');
const processHOCReference = require('./processor-hoc');
const processInjectable = require('./processor-inj');
const {
  assert,
  createNamedImport,
  collectReferencePaths,
  collectDepsReferencePaths,
  isMatchingAny,
  isEnabledEnv,
  hasDisableComment,
  parseOptions,
} = require('./utils');

class State {
  locations = new WeakMap();
  imports = null;
  aliases = new Map();
  diIdentifier = null;
  injectIdentifier = null;
  programPath = null;

  constructor(path, isExcluded = false) {
    this.programPath = path;
    this.isExcluded = isExcluded;
  }

  findPkgIndentifiers(t, body, scope) {
    const diImportNode = body.find(
      (n) => t.isImportDeclaration(n) && n.source.value === PACKAGE_NAME
    );

    const diImportSpecifier = diImportNode?.specifiers.find(
      (s) => s.imported && s.imported.name === PACKAGE_FUNCTION
    );
    this.diIdentifier =
      diImportSpecifier?.local || scope.generateUidIdentifier(PACKAGE_FUNCTION);

    const injectImportSpecifier = diImportNode?.specifiers.find(
      (s) => s.imported && s.imported.name === INJECT_FUNCTION
    );
    this.injectIdentifier = injectImportSpecifier?.local;
  }

  getValueForPath(fnPath) {
    return this.locations.get(fnPath) || this.locations.get(fnPath.node);
  }

  setValueForPath(fnPath, value) {
    this.locations.set(fnPath, value);
    this.locations.set(fnPath.node, value);
  }

  getValueOrInit(fnPath) {
    // we need both node and path as either might get replaced
    if (!this.locations.has(fnPath) && !this.locations.has(fnPath.node)) {
      this.setValueForPath(fnPath, { diRef: null, dependencyRefs: new Set() });
    }
    return this.getValueForPath(fnPath);
  }

  moveValueForPath(fnPath, newFnPath) {
    if (newFnPath && newFnPath.isFunction()) {
      this.setValueForPath(newFnPath, this.getValueForPath(fnPath));
    }
  }

  removeValueForPath(fnPath) {
    this.locations.delete(fnPath);
    this.locations.delete(fnPath.node);
  }

  getAlias(name, scope) {
    if (!this.aliases.has(name)) {
      this.aliases.set(name, scope.generateUid(name));
    }
    return this.aliases.get(name);
  }

  addDi(diRef) {
    const parentFnPath = diRef.getFunctionParent();
    assert.isValidLocation(parentFnPath, diRef);
    const value = this.getValueOrInit(parentFnPath);
    value.diRef = diRef;
  }

  addDependency(depRef) {
    depRef.findParent((p) => {
      // avoid dynamyc object getters/setters `get [dep]() {}` to be marked as dependencies
      // on their created scope (odd behaviour of scope.getBinding)
      const isComputedSelfPath =
        p.node?.computed &&
        (depRef.parentPath === p || depRef.parentPath?.parentPath === p);
      if (
        p.isFunction() &&
        p.parentPath?.node?.callee?.name !== INJECT_FUNCTION &&
        !isComputedSelfPath
      ) {
        // add ref for every function scope up to the root one
        this.getValueOrInit(p).dependencyRefs.add(depRef);
      }
    });
  }

  addImports(imports) {
    this.imports = imports;
  }

  prependDiImport(t) {
    if (this.diIdentifier.loc) return;

    const statement = createNamedImport(
      t,
      PACKAGE_NAME,
      [PACKAGE_FUNCTION],
      [this.diIdentifier]
    );
    this.programPath.unshiftContainer('body', statement);
    // after adding, make this function a noop
    this.prependDiImport = () => {};
  }
}

module.exports = function (babel) {
  const { types: t } = babel;
  let stateCache = new WeakMap();
  let parsedOpts;

  return {
    name: PACKAGE_NAME,
    pre({ opts }) {
      if (!parsedOpts) {
        const pluginOpts = opts.plugins.find(
          (p) => p.key === PACKAGE_NAME
        ).options;
        parsedOpts = parseOptions(pluginOpts);
      }
    },
    visitor: {
      Program(path, { file }) {
        const isEnabled = isEnabledEnv(parsedOpts.enabledEnvs);
        const isExcluded = isMatchingAny(
          parsedOpts.exclude,
          file.opts.filename
        );
        const state = new State(path, isExcluded);

        state.findPkgIndentifiers(t, path.node.body, path.scope);

        // Find all di() calls and store the arguments (to allow di custom vars)
        // and then remove the di call as it's quicker than trying to manipilate
        const diRefPaths = collectReferencePaths(
          t,
          state.diIdentifier,
          path.scope
        );
        diRefPaths.forEach((p, i, arr) => {
          const hasMulti =
            p.getFunctionParent() === arr[i + 1]?.getFunctionParent();
          if (isEnabled && !hasMulti) state.addDi(p);
          else p.parentPath.remove();
        });

        const alreadyProcessed = diRefPaths.some((p) =>
          p.parentPath?.parentPath?.isVariableDeclarator()
        );
        if (!isEnabled || alreadyProcessed) return;

        const { references, imports } = collectDepsReferencePaths(
          t,
          path.get('body')
        );
        references.forEach((p) => state.addDependency(p));
        state.addImports(imports);

        // TODO
        // Should we add collection of globals to di via path.scope.globals?

        // If we have injectables and we should mock modules, let's find them all
        // and add relevat jest.mock() calls, before jest babel plugin looks for them
        if (parsedOpts.mockModules && state.injectIdentifier) {
          collectReferencePaths(t, state.injectIdentifier, path.scope).forEach(
            (p) => processInjectable(t, p.parentPath, state, parsedOpts)
          );
        }

        stateCache.set(file, state);
      },

      Function(path, { file }) {
        const state = stateCache.get(file);
        const locationValue = state?.getValueForPath(path);
        const shouldDi =
          (!state?.isExcluded && !hasDisableComment(path)) ||
          locationValue?.diRef;

        // process only if function is a candidate to host di
        if (!state || !locationValue || !shouldDi) return;

        // convert arrow function returns as di needs a block
        if (!t.isBlockStatement(path.node.body)) {
          const bodyPath = path.get('body');
          // convert arrow function return to block
          bodyPath.replaceWith(
            t.blockStatement([t.returnStatement(path.node.body)])
          );
          // we make sure that if body was a function that needs di()
          // we update the reference as new function path has been created
          state.moveValueForPath(bodyPath, path.get('body.body.0.argument'));
        }

        // create di declaration
        processDiDeclaration(t, path, locationValue, state);
        // once done, remove from cache so if babel calls function again we do not reprocess
        state.removeValueForPath(path);
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

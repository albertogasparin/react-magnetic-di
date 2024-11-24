const { PACKAGE_NAME } = require('./constants');

const getComponentDeclaration = (t, scope) => {
  // function declarations
  if (scope.parentBlock.declaration) return scope.parentBlock.declaration.id;
  if (scope.getBlockParent().block.id) return scope.getBlockParent().block.id;
  // variable declaration
  if (scope.parentBlock.id) return scope.parentBlock.id;
  // class declarations
  if (scope.parentBlock.type.includes('Class')) return scope.parent.block.id;
  return null;
};

const assert = {
  isValidArgument(t, node, ref, self) {
    if (!t.isIdentifier(node)) {
      throw ref.buildCodeFrameError(
        'Invalid di(...) arguments: must be called with plain identifiers. '
      );
    }
    if (node.name === self?.name) {
      throw ref.buildCodeFrameError(
        'Invalid di(...) call: cannot inject self.'
      );
    }
  },
  isValidLocation(path, ref) {
    if (!path) {
      throw ref.buildCodeFrameError(
        'Invalid di(...) call: must be inside a render function of a component. '
      );
    }
  },
};

const createNamedImport = (t, pkgName, pkgFns, localNames) => {
  const statement = t.importDeclaration([], t.stringLiteral(pkgName));
  statement.specifiers = pkgFns.map((v, i) =>
    t.importSpecifier(t.identifier(localNames[i].name), t.identifier(v))
  );
  return statement;
};

function collectDepsReferencePaths(t, bodyPaths) {
  const references = [];
  const imports = { sources: new Map(), specifiers: new Map() };

  function addRef(path, importSource = null) {
    const { referencePaths = [] } = path.scope.getBinding(path) || {};
    references.push(...referencePaths);
    if (importSource) {
      imports.specifiers.set(path.node.name, importSource);
      imports.sources.set(
        importSource,
        (imports.sources.get(importSource) || []).concat(path.node.name)
      );
    }
  }

  // we could use scope.bindings to get all top level bindings
  // but it is hard to track local only vs later exported values
  bodyPaths.forEach((path) => {
    if (path.isImportDeclaration()) {
      if (path.node.importKind === 'type') return;
      if (path.node.source.value === PACKAGE_NAME) return;
      path.get('specifiers').forEach((sp) => {
        if (sp.node.importKind === 'type') return;
        if (sp.isImportDefaultSpecifier() || sp.isImportSpecifier()) {
          addRef(sp.get('local'), path.node.source.value);
        }
      });
    }
    if (path.isExportNamedDeclaration()) {
      if (path.node.exportKind === 'type') return;
      if (path.node.declaration) {
        if (path.get('declaration.id').isIdentifier()) {
          addRef(path.get('declaration.id'));
        } else {
          path.get('declaration.declarations').forEach((dp) => {
            if (dp.get('id').isIdentifier()) {
              addRef(dp.get('id'));
            }
          });
        }
      } else {
        path.get('specifiers').forEach((sp) => {
          if (sp.node.exportKind === 'type') return;
          if (sp.get('local').isIdentifier()) {
            addRef(sp.get('local'));
          }
        });
      }
    }
    if (path.isExportDefaultDeclaration()) {
      if (path.node.exportKind === 'type') return;
      const ref = path.get('declaration').isIdentifier()
        ? path.get('declaration')
        : path.get('declaration.id');
      addRef(ref);
    }
  });
  return { references, imports };
}

function collectReferencePaths(t, identifier, scope) {
  // we locate all usages of the method
  const { referencePaths = [] } = scope.getBinding(identifier.name) || {};

  return referencePaths.filter((ref) => t.isCallExpression(ref.container));
}

const parsePathsToRegexp = (paths = []) => {
  return paths.map((v) =>
    v instanceof RegExp
      ? v
      : new RegExp(v.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&'))
  );
};

const parseOptions = (opts) => ({
  ...opts,
  exclude: parsePathsToRegexp(opts.exclude),
  defaultMockedModules: {
    include: parsePathsToRegexp(
      Array.isArray(opts.defaultMockedModules)
        ? opts.defaultMockedModules
        : opts.defaultMockedModules?.include
    ),
    exclude: parsePathsToRegexp(opts.defaultMockedModules?.exclude),
  },
});

const isMatchingAny = (regexes, value) => regexes.some((rx) => rx.test(value));

const isEnabledEnv = (enabledEnvs = ['development', 'test']) => {
  return (
    enabledEnvs.includes(process.env.BABEL_ENV) ||
    enabledEnvs.includes(process.env.NODE_ENV)
  );
};

const hasDisableComment = (path) => {
  return [
    ...(path.node?.body?.leadingComments || []),
    ...(path.node?.body?.body?.[0]?.leadingComments || []),
  ].some((c) => c.value.includes('di-ignore'));
};

module.exports = {
  assert,
  createNamedImport,
  collectReferencePaths,
  collectDepsReferencePaths,
  getComponentDeclaration,
  isEnabledEnv,
  isMatchingAny,
  hasDisableComment,
  parseOptions,
};

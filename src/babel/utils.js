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

  function addRef(path) {
    const { referencePaths = [] } = path.scope.getBinding(path) || {};
    references.push(...referencePaths);
  }

  bodyPaths.forEach((path) => {
    if (path.isImportDeclaration()) {
      if (path.node.importKind === 'type') return;
      if (path.node.source.value === PACKAGE_NAME) return;
      path.get('specifiers').forEach((sp) => {
        if (sp.node.importKind === 'type') return;
        if (sp.isImportDefaultSpecifier() || sp.isImportSpecifier()) {
          addRef(sp.get('local'));
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
  return references;
}

function collectDiReferencePaths(t, identifier, scope) {
  // we locate all usages of the method
  const { referencePaths = [] } = scope.getBinding(identifier.name) || {};

  return referencePaths.filter((ref) => t.isCallExpression(ref.container));
}

const isExcluded = (exclude = [], filename) => {
  const excludes = []
    .concat(exclude)
    .map((v) =>
      v instanceof RegExp
        ? v
        : new RegExp(v.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&'))
    );
  return excludes.some((rx) => rx.test(filename));
};

module.exports = {
  assert,
  createNamedImport,
  collectDiReferencePaths,
  collectDepsReferencePaths,
  getComponentDeclaration,
  isExcluded,
};

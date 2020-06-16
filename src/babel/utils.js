const getComponentDeclaration = (t, scope) => {
  // function declarations
  if (scope.parentBlock.declaration) return scope.parentBlock.declaration.id;
  if (scope.getBlockParent().block.id) return scope.getBlockParent().block.id;
  // variable declaration
  if (scope.parentBlock.id) return scope.parentBlock.id;
  // class declarations
  if (scope.parentBlock.type.includes('Class')) return scope.parent.block.id;
};

const assert = {
  isValidBlock(t, ref) {
    const { block } = ref.scope;
    if (
      !t.isFunctionDeclaration(block) &&
      !t.isFunctionExpression(block) &&
      !t.isArrowFunctionExpression(block) &&
      !t.isClassMethod(block)
    ) {
      throw ref.buildCodeFrameError(
        'Invalid di(...) call: must be inside a render function of a component. '
      );
    }
  },
  isValidCall(t, ref) {
    if (!ref.container.arguments.length) {
      throw ref.buildCodeFrameError(
        'Invalid di(...) arguments: must be called with at least one argument. '
      );
    }
    if (!ref.container.arguments.every((node) => t.isIdentifier(node))) {
      throw ref.buildCodeFrameError(
        'Invalid di(...) arguments: must be called with plain identifiers. '
      );
    }
    const decl = getComponentDeclaration(t, ref.scope);
    if (decl && ref.container.arguments.some((v) => v.name === decl.name)) {
      throw ref.buildCodeFrameError(
        'Invalid di(...) call: cannot inject self.'
      );
    }
  },
};

const createNamedImport = (t, pkgName, pkgFn, localName) => {
  const statement = t.importDeclaration([], t.stringLiteral(pkgName));
  statement.specifiers = [t.importSpecifier(localName, t.identifier(pkgFn))];
  return statement;
};

module.exports = { getComponentDeclaration, assert, createNamedImport };

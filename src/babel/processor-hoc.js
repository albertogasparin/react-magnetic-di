const processReference = (t, ref) => {
  const container = ref.parentPath.container;
  if (container.type !== 'VariableDeclarator') return;

  const containerID = container.id;

  // check if display name already set by someone else right after def
  const nextSibling = ref.getStatementParent().getNextSibling();
  if (
    nextSibling.isExpressionStatement() &&
    nextSibling.node.expression?.left?.property?.name == 'displayName'
  ) {
    return;
  }

  ref
    .getStatementParent()
    .insertAfter(
      t.expressionStatement(
        t.assignmentExpression(
          '=',
          t.memberExpression(containerID, t.identifier('displayName')),
          t.stringLiteral(containerID.name)
        )
      )
    );
};

module.exports = processReference;

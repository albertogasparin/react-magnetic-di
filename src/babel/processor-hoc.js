const processReference = (t, ref) => {
  const container = ref.parentPath.container;
  if (container.type !== 'VariableDeclarator') return;

  const containerID = container.id;

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

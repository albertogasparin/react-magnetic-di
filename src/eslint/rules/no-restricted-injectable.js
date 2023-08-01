const { getInjectIdentifier, getImportIdentifiers } = require('../utils');

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Restrict certain dependencies from being injected',
      category: 'Possible Errors',
      recommended: true,
    },
    // fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          paths: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                importNames: { type: 'array' },
                message: { type: 'string' },
                allowTargeted: { type: 'boolean' },
              },
            },
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      restricted:
        'This dependency should not be injected because too generic, ' +
        'not needing mocking or already mocked. {{message}}',
    },
  },
  create: function (context) {
    let injectIdentifier = null;

    const userOptions = Object.assign({ paths: [] }, context.options[0]);
    const restrictedVars = new Map();

    return {
      ImportDeclaration(node) {
        if (!injectIdentifier) injectIdentifier = getInjectIdentifier(node);
        for (let p of userOptions.paths) {
          const ids = getImportIdentifiers(node, p.name, p.importNames) || [];
          for (let id of ids) {
            restrictedVars.set(id.name, {
              message: p.message || '',
              allowTargeted: p.allowTargeted,
            });
          }
        }
      },
      'CallExpression[callee.type="Identifier"]'(node) {
        if (node.callee.name !== injectIdentifier?.name) return;

        const [firstArg, , thirdArg] = node.arguments || [];
        const restrictedValue = restrictedVars.get(firstArg?.name);
        const enabledTarget =
          restrictedValue?.allowTargeted &&
          thirdArg?.properties?.some((n) => n?.key?.name === 'target');

        if (restrictedValue && !enabledTarget) {
          context.report({
            node,
            messageId: 'restricted',
            data: { message: restrictedValue.message },
          });
        }
      },
    };
  },
};

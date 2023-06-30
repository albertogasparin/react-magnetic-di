/* eslint-env jest */
import { transform } from '@babel/core';
import plugin from 'babel-plugin-macros';

const moduleAlias = {
  alias: { 'react-magnetic-di/macro': './src/babel/macro.js' },
};

const babel = (code, { options, env } = {}) =>
  transform(code, {
    filename: 'noop.js',
    presets: [['@babel/preset-react', { development: false, pragma: '__jsx' }]],
    plugins: [
      ['module-resolver', moduleAlias],
      [plugin, options],
    ],
    babelrc: false,
    configFile: false,
    sourceType: 'module',
    caller: { name: 'tests', supportsStaticESM: true },
    envName: env,
  }).code;

describe('macro plugin', () => {
  it('should process withDi', () => {
    const input = `
      import { withDi } from 'react-magnetic-di/macro';

      const Example = withDi(() => null, []);
    `;
    expect(babel(input)).toMatchInlineSnapshot(`
      "import { withDi } from "react-magnetic-di";
      const Example = withDi(() => null, []);
      Example.displayName = "Example";"
    `);
  });
});

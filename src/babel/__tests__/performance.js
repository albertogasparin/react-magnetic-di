const { transform } = require('@babel/core');
const plugin = require('../index');

const code = `
  import React, { memo, forwardRef } from 'react';
  import { Modal } from 'modal';

  function MyComponentFn() {
    return <Modal />;
  }

  const MyComponentWr = memo(function MyComponent() {
    return <Modal />;
  });

  const MyComponentA = () => <Modal />;

  const MyComponentAw = memo(() => <Modal />);

  const MyComponentTr = true ? (() => <Modal />) : memo(forwardRef(() => <Modal />));

  class Foo {
    renderModal = () => <Modal />;
    render() {
      return <Modal />;
    }
  }
`;

transform(code, {
  filename: 'noop.js',
  presets: [['@babel/preset-react', { development: false, pragma: '__jsx' }]],
  plugins: [plugin],
  babelrc: false,
  configFile: false,
  sourceType: 'module',
  caller: { name: 'tests', supportsStaticESM: true },
});

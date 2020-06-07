# react-magnetic-di

[![npm](https://img.shields.io/npm/v/react-magnetic-di.svg)](https://www.npmjs.com/package/react-magnetic-di)
[![npm bundle size (minified + gzip)](https://img.shields.io/bundlephobia/minzip/react-magnetic-di.svg)](https://bundlephobia.com/result?p=react-magnetic-di)
[![License](https://img.shields.io/:license-MIT-blue.svg)](http://albertogasparin.mit-license.org)
[![CircleCI](https://circleci.com/gh/albertogasparin/react-magnetic-di.svg?style=shield&circle-token=cc7bd7e07aae2bb3fcde0a2bfb148b5c2208af84)](https://circleci.com/gh/albertogasparin/react-magnetic-di)
[![codecov](https://codecov.io/gh/albertogasparin/react-magnetic-di/branch/master/graph/badge.svg)](https://codecov.io/gh/albertogasparin/react-magnetic-di)

A new take for dependency injection in React for your tests, storybooks and even experiments in production.

- Close-to-zero performance overhead on dev/testing
- Compiles to nothing on production (unless explicitly enabled)
- Works with any kind of functions/classes (not only components) and in both class and functional components
- Replaces dependencies anywhere deep in the React tree
- Allows selective injection
- Enforces separation of concerns
- Just uses Context, it does not mess up with React internals

## Philosophy

Dependency injection and component injection for testing purposes is not a new topic. Indeed, the ability to provide a custom implementation of a component/hook while testing or writing storybooks and examples it is extremely valuable.

A common pattern to solve this problem is injecting those "dependencies" in the component via props or using mocking libraries at import/require level. However those approaches have some of downsides, like leaking internal implementation details, being quite fragile or introducing additional complexity when typing.

`react-magnetic-di` takes inspiration from decorators, and with a touch of Babel magic and React Context allows you to optionally override such dependencies, with nearly-zero performance overhead while developing/testing (it's basically a function call and a map lookup) and it is fully removed by default on production builds.

## Usage

```sh
npm i react-magnetic-di
# or
yarn add react-magnetic-di
```

### Adding babel plugin

Edit your Babel config file (`.babelrc` / `babel.config.js` / ...) and add:

```js
  // ... other stuff like presets
  plugins: [
    // ... other plugins
    'react-magnetic-di/babel',
  ],
```

### Using dependency injection in your components

Given a component with complex UI interaction or data dependencies, like a Modal or an Apollo Query, we want to be able integration test it without necessarily test those other dependencies.
To achieve that, we mark such dependencies in the `render` function of the class component:

```jsx
import React, { Component } from 'react';
import { di } from 'react-magnetic-di';
import { Modal } from 'material-ui';
import { Query } from 'react-apollo';

class MyComponent extends Component {
  render() {
    // that's all is needed to "mark" these variables as injectable
    di(Modal, Query);

    return (
      <Modal>
        <Query>{({ data }) => data && 'Done!'}</Query>
      </Modal>
    );
  }
}
```

Or on our functional component with hooks:

```jsx
import React, { Component } from 'react';
import { di } from 'react-magnetic-di';
import { Modal } from 'material-ui';
import { useQuery } from 'react-apollo-hooks';

function MyComponent() {
  // "mark" any type of function/class as injectable
  di(Modal, useQuery);

  const { data } = useQuery();
  return <Modal>{data && 'Done!'}</Modal>;
}
```

### Leveraging dependency injection in tests and storybooks

In the unit/integration tests or storybooks we can create a mock implementation and wrap the component with `DiProvider` to override any dependency:

```jsx
import React from 'react';
import { DiProvider, di } from 'react-magnetic-di';
import { Modal } from 'material-ui';
import { useQuery } from 'react-apollo-hooks';

// mock() accepts the original implementation as first argument
// and the replacement implementation as second
const ModalOpen = di.mock(Modal, () => <div />);
const useQueryMock = di.mock(useQuery, () => ({ data: null }));

// test-enzyme.js
it('should render with enzyme', () => {
  const container = mount(<MyComponent />, {
    wrappingComponent: DiProvider,
    wrappingComponentProps: { use: [ModalOpen, useQuery] },
  });
  expect(container).toMatchSnapshot();
});

// test-testing-library.js
it('should render with react-testing-library', () => {
  const { container } = render(<MyComponent />, {
    wrapper: (p) => <DiProvider use={[ModalOpen, useQuery]} {...p} />,
  });
  expect(container).toMatchSnapshot();
});

// story.js
storiesOf('Modal content', module).add('with text', () => (
  <DiProvider use={[ModalOpen, useQuery]}>
    <MyComponent />
  </DiProvider>
));
```

In the example above we replace all `Modal` and `useQuery` dependencies across all components in the tree with the custom versions. If you want to replace dependencies **only** for a specific component (or set of components) you can use the `target` prop:

```jsx
// story.js
storiesOf('Modal content', module).add('with text', () => (
  <DiProvider target={[MyComponent, MyOtherComponent]} use={[ModalOpen]}>
    <DiProvider target={MyComponent} use={[useQuery]}>
      <MyComponent />
      <MyOtherComponent>
    </DiProvider>
  </DiProvider>
));
```

In the example above `MyComponent` will have both `ModalOpen` and `useQuery` replaced while `MyOtherComponent` only `ModalOpen`. Be aware that `target` needs an actual component declaration to work, so will not work in cases where the component is fully anonymous (eg: `export default () => ...` or `forwardRef(() => ...)`).

### Configuration Options

#### Enable depepndency injection on production (or custom env)

By default dependency injection is enabled on `development` and `test` environments only, which means `di(...)` is removed on production builds. If you want to allow depepency injection on production too (or on a custom env) you can use the `forceEnable` option:

```
// In your .babelrc / babel.config.js
  // ... other stuff like presets
  plugins: [
    // ... other plugins
    ['react-magnetic-di/babel', { forceEnable: true }],
  ],
```

## Contributing

To test your changes you can run the examples (with `npm run start`).
Also, make sure you run `npm run preversion` before creating you PR so you will double check that linting, types and tests are fine.

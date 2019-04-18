# react-magnetic-di

[![npm](https://img.shields.io/npm/v/react-magnetic-di.svg)](https://www.npmjs.com/package/react-magnetic-di)
[![npm bundle size (minified + gzip)](https://img.shields.io/bundlephobia/minzip/react-magnetic-di.svg)](https://bundlephobia.com/result?p=react-magnetic-di)
[![License](https://img.shields.io/:license-MIT-blue.svg)](http://albertogasparin.mit-license.org)
[![CircleCI](https://circleci.com/gh/albertogasparin/react-magnetic-di.svg?style=shield&circle-token=17a5f372d198e27098226779bc1afd8fd6a2fb3a)](https://circleci.com/gh/albertogasparin/react-magnetic-di)
[![codecov](https://codecov.io/gh/albertogasparin/react-magnetic-di/branch/master/graph/badge.svg)](https://codecov.io/gh/albertogasparin/react-magnetic-di)

A new take for dependency injection in React for your tests, storybooks and even experiments in production.

- Nearly-zero performane overhead
- Enforces separation of concerns
- Targets components at any level of the tree
- Allows selective injection
- Can be enabled also in prod (off by default)

## Philosophy

Dependency injection and component injection for testing purposes is not a new topic. Indeed, the ability to provide a custom implementation of a component/hook while testing or writing storybooks and examples it is extremely valuable.

A common pattern to solve this problem is injecting those "dependencies" in the component via props. However, that approach has a some of downsides:

1. We are leaking internal implementation details. Props are the public API of a component and we are polluting them with keys that are not relevant for actual consumers, and we are doing that just for our testing needs

2. Our dependencies are mixed together with other props, which makes them hard to recognise, analyse and might introduce naming conflicts

3. It introduces additional complexity, for instance when we have spread props down, as we probably don't want pass the dependencies down too

`react-magnetic-di` takes inspiration from React PropTypes, forcing you to declare the dependencies statically and then using React Context to optionally override those dependencies, with nearly-zero performane overhead when the injection system is off.

## Basic usage

```sh
npm i react-magnetic-di
# or
yarn add react-magnetic-di
```

Given a component with complex UI interation or data dependencies, like a Modal or a Apollo Query, we want to be able integration test it without necessarily test those other dependencies.
To achieve that, we define the dependencies on the class component:

```js
import React, { Component } from 'react';
import { provideDependencies } from 'react-magnetic-di';
import { Modal as ModalDI } from 'material-ui';
import { Query as QueryDI } from 'react-apollo';

class MyComponent extends Component {
  static dependencies = provideDependencies({
    Modal: ModalDI,
    Query: QueryDI,
  });

  render() {
    const { Modal, Query } = MyComponent.dependencies();
    return (
      <Modal>
        <Query>{({ data }) => data && 'Done!'}</Query>
      </Modal>
    );
  }
}
```

Or on our functional component with hooks:

```js
import React, { Component } from 'react';
import { provideDependencies } from 'react-magnetic-di';
import { Modal as ModalDI } from 'material-ui';
import { useQuery as useQueryDI } from 'react-apollo-hooks';

function MyComponent() {
  const { Modal, useQuery } = MyComponent.dependencies();
  const { data } = useQuery();
  return <Modal>{data && 'Done!'}</Modal>;
}

MyComponent.dependencies = provideDependencies({
  Modal: ModalDI,
  useQuery: useQueryDI,
});
```

Finally, in the integration tests and storybooks we wrap the component with `DependencyProvider` to override any dependency:

```js
import React from 'react';
import { DependencyProvider } from 'react-magnetic-di';

import { ModalOpen, useQueryMock } from './examples';

storiesOf('Modal content', module).add('with text', () => (
  <DependencyProvider use={{ Modal: ModalOpen, useQuery: useQueryMock }}>
    <MyComponent />
  </DependencyProvider>
));
```

In the example above we replace all `Modal` dependencies across all components in the tree with the open version, but that might be wrong for `useQuery`, as we might want to provide different data to different components. `DependencyProvider` enables targeted dependency injection via `target` prop. Together with providers composition it allows multiple, explicit dependency injections:

```js
storiesOf('App', module).add('with text', () => (
  /* replace Modal on all components */
  <DependencyProvider use={{ Modal: ModalOpen }}>
    {/* in MyComponent use one set of data */}
    <DependencyProvider target={MyComponent} use={{ useQuery: useQueryMock }}>
      {/* in MyOtherComponent use a different set of data */}
      <DependencyProvider
        target={MyOtherComponent}
        use={{ useQuery: useQueryOtherMock }}
      >
        <MyApp />
      </DependencyProvider>
    </DependencyProvider>
  </DependencyProvider>
));
```

## Settings

#### enabled

Defines whenever context replacement is allowed or not. By default is `NODE_ENV !== 'production'`. It can be enabled also in prod, but it is not recommended.

```js
import { settings } from 'react-magnetic-di';
// only enable during testing
setting.enabled = process.env.NODE_ENV === 'test';
```

## Contributing

To test your changes you can run the examples (with `npm run start`).
Also, make sure you run `npm run preversion` before creating you PR so you will double check that linting, types and tests are fine.

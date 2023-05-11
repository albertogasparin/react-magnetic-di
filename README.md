<p align="center">
  <img src="https://user-images.githubusercontent.com/84136/83958267-1c8f7f00-a8b3-11ea-9725-1d3530af5f8d.png" alt="magnetic-di logo" height="150" />
</p>
<h1 align="center">magnetic-di</h1>
<p align="center">
  <a href="https://www.npmjs.com/package/react-magnetic-di"><img src="https://img.shields.io/npm/v/react-magnetic-di.svg"></a>
  <a href="https://bundlephobia.com/result?p=react-magnetic-di"><img src="https://img.shields.io/bundlephobia/minzip/react-magnetic-di.svg" /></a>
  <a href="https://codecov.io/gh/albertogasparin/react-magnetic-di"><img src="https://codecov.io/gh/albertogasparin/react-magnetic-di/branch/master/graph/badge.svg" />
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg"></a>
  <!--a href="CONTRIBUTING"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" /></a-->
</p>

A new take for dependency injection / dependency replacement for your tests, storybooks and even experiments in production.

- Close-to-zero performance overhead on dev/testing
- **Zero** performance overhead on production (code gets stripped unless told otherwise)
- Works with any kind of functions/classes (not only React components) and in both class and functional React components
- Replaces dependencies at any depth of the React tree / call chain
- Allows selective injection (React only)
- Enforces separation of concerns, keeps your component API clean
- Just uses smart variable assignments, it does not mess up with React internals or modules/require

## Philosophy

Dependency injection and component injection is not a new topic. Especially the ability to provide a custom implementation of a component/hook while testing or writing storybooks and examples it is extremely valuable. `react-magnetic-di` takes inspiration from decorators, and with a touch of Babel magic and React Context / globals allows you to optionally override "marked" dependencies inside your components so you can swap implementations only when needed.

## Usage

```sh
npm i react-magnetic-di
# or
yarn add react-magnetic-di
```

### Adding babel plugin (or using macro)

Edit your Babel config file (`.babelrc` / `babel.config.js` / ...) and add:

```js
  // ... other stuff like presets
  plugins: [
    // ... other plugins
    'react-magnetic-di/babel-plugin',
  ],
```

If you are using Create React App or babel macros, you don't need the babel plugin: just import the methods from `react-magnetic-di/macro` (see next example).

### Using injection replacement in your components

Given a component with complex UI interaction or data dependencies, like a Modal or an Apollo Query, we want to easily be able to integration test it. To achieve that, we "mark" such dependencies in the `render` function of the class component:

```jsx
import React, { Component } from 'react';
import { di } from 'react-magnetic-di';
// or
import { di } from 'react-magnetic-di/macro';

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
function MyComponent() {
  // "mark" any type of function/class as injectable
  di(Modal, useQuery);

  const { data } = useQuery();
  return <Modal>{data && 'Done!'}</Modal>;
}
```

### Leveraging dependency replacement in tests and storybooks

In the unit/integration tests or storybooks we can create a new injectable implementation and wrap the component with `DiProvider` to override such dependency:

```jsx
import React from 'react';
import { DiProvider, injectable } from 'react-magnetic-di';
import { Modal } from 'material-ui';
import { useQuery } from 'react-apollo-hooks';

// injectable() needs the original implementation as first argument
// and the replacement implementation as second
const ModalOpenDi = injectable(Modal, () => <div />);
const useQueryDi = injectable(useQuery, () => ({ data: null }));

// test-enzyme.js
it('should render with enzyme', () => {
  const container = mount(<MyComponent />, {
    wrappingComponent: DiProvider,
    wrappingComponentProps: { use: [ModalOpenDi, useQueryDi] },
  });
  expect(container.html()).toMatchSnapshot();
});

// test-testing-library.js
it('should render with react-testing-library', () => {
  const { container } = render(<MyComponent />, {
    wrapper: (p) => <DiProvider use={[ModalOpenDi, useQueryDi]} {...p} />,
  });
  expect(container).toMatchSnapshot();
});

// story.js
storiesOf('Modal content', module).add('with text', () => (
  <DiProvider use={[ModalOpenDi, useQueryDi]}>
    <MyComponent />
  </DiProvider>
));
```

In the example above we replace all `Modal` and `useQuery` dependencies across all components in the tree with the custom versions.
If you want to replace dependencies **only** for a specific component (or set of components) you can use the `target` prop:

```jsx
// story.js
storiesOf('Modal content', module).add('with text', () => (
  <DiProvider target={[MyComponent, MyOtherComponent]} use={[ModalOpenDi]}>
    <DiProvider target={MyComponent} use={[useQueryDi]}>
      <MyComponent />
      <MyOtherComponent>
    </DiProvider>
  </DiProvider>
));
```

In the example above `MyComponent` will have both `ModalOpen` and `useQuery` replaced while `MyOtherComponent` only `ModalOpen`. Be aware that `target` needs an **actual component** declaration to work, so will not work in cases where the component is fully anonymous (eg: `export default () => ...` or `forwardRef(() => ...)`).

The library also provides a `withDi` HOC in case you want to export components with dependencies already injected:

```jsx
import React from 'react';
import { withDi, injectable } from 'react-magnetic-di';
import { Modal } from 'material-ui';
import { MyComponent } from './my-component';

const ModalOpenDi = injectable(Modal, () => <div />);

export default withDi(MyComponent, [ModalOpenDi]);
```

`withDi` supports the same API and capabilities as `DiProvider`, where `target` is the third argument of the HOC `withDi(MyComponent, [Modal], MyComponent)` in case you want to limit injection to a specific component only.

When you have the same dependency replaced multiple times, there are two behaviours that determine which injectable will "win":

- the one defined on the closest `DiProvider` wins. So you can declare more specific replacements by wrapping components with `DiProvider` or `withDi` and those will win over same type injectables on other top level `DiProvider`s
- the injectable defined last in the `use` array wins. So you can define common injectables but still override each type case by case (eg: `<DiProvider use={[...commonDeps, specificInjectable]}>`

### Using injection replacement outside of React

The usage outside React is not much different, aside from the different way of clearing the replacements.

```js
import { fetchApi } from './fetch';

export async function myApiFetcher() {
  // "mark" any type of function/class as injectable
  di(fetchApi);

  const { data } = await fetchApi();
  return data;
}
```

In the tests, you can use `runWithDi`, which will setup and clear the replacements for you after function execution is terminated. Such util also handles async code, but might require you to wrap the entire test to work effectively with scheduled code paths, or event driven implementations.

```js
import { injectable, runWithDi } from 'react-magnetic-di';
import { myApiFetcher, fetchApi } from '.';

it('should call the API', async () => {
  const fetchApiDi = injectable(
    fetchApi,
    jest.mock().mockResolvedValue('mock')
  );

  const result = await runWithDi(() => myApiFetcher(), [fetchApiDi]);

  expect(fetchApiDi).toHaveBeenCalled();
  expect(result).toEqual('mock');
});
```

### Tracking unused injectables

By default `magnetic-di` does not complain if an injectable is not used or if a dependency has not being replaced. In large codebases however, that might led to issues with stale, unused injectables or with lack of knowledge in what could be replaced. To ease introspection, the library provides a `stats` API that returns `unused` injectables.

- `stats.unused()` returns an array of entries `{ get(), error() }` for all injectables that have not been used since `stats.reset()` has been called

This is an example of stats guard implementation using the returned `error()` helper:

```js
import { stats } from 'react-magnetic-di';

beforeEach(() => {
  // it's important to reset the stats after each test
  stats.reset();
});
afterEach(() => {
  stats.unused().forEach((entry) => {
    // throw an error pointing at the test with the unused injectable
    throw entry.error();
  });
});
```

### Configuration Options

#### Enable dependency replacement on production (or custom env)

By default dependency replacement is enabled on `development` and `test` environments only, which means `di(...)` is removed on production builds. If you want to allow injection on production too (or on a custom env) you can use the `forceEnable` option:

```js
// In your .babelrc / babel.config.js
  // ... other stuff like presets
  plugins: [
    // ... other plugins
    ['react-magnetic-di/babel-plugin', { forceEnable: true }],
  ],
```

In case of babel macro (eg for use with CRA), the `configName` key is `reactMagneticDi`.

## ESLint plugin and rules

In order to enforce better practices, this package exports some ESLint rules:

| rule                | description                                                                              | options                  |
| ------------------- | ---------------------------------------------------------------------------------------- | ------------------------ |
| `order`             | enforces `di(...)` to be the top of the block, to reduce chances of partial replacements | -                        |
| `exhaustive-inject` | enforces all external components/hooks being used to be marked as injectable.            | `ignore`: array of names |
| `no-duplicate`      | prohibits marking the same dependency as injectable more than once in the same block     | -                        |
| `no-extraneous`     | enforces dependencies to be consumed in the scope, to prevent unused variables           | -                        |
| `sort-dependencies` | require injectable dependencies to be sorted                                             | -                        |

The rules are exported from `react-magnetic-di/eslint-plugin`. Unfortunately ESLint does not allow plugins that are not npm packages, so rules needs to be imported via other means for now.

## Current limitations

- Does not support Enzyme shallow ([due to shallow not fully supporting context](https://github.com/enzymejs/enzyme/issues/2176)). If you wish to shallow anyway, you could mock `di` and manually return the array of mocked dependencies, but it is not recommended.
- Does not support dynamic `use` and `target` props (changes are ignored)
- Officially supports injecting only functions/classes. If you need to inject some other data types, create a simple getter and use that as dependency.
- Does not replace default props (or default parameters in general): so dependencies provided as default parameters (eg `function MyComponent ({ modal = Modal }) { ... }`) will be ignored. If you accept the dependency as prop/argument you should inject it via prop/argument, as having a double injection strategy is just confusing.

## FAQ

#### Can it be used without Babel plugin?

Yes, but you will have to handle variable assignment yourself, which is a bit verbose. In this mode `di` needs an array of dependencies as first argument and the component, or `null`, as second (to make `target` behaviour work). Moreover, `di` won't be removed on prod builds and ESLint rules are not currently compatible with this mode.

```js
import React, { Component } from 'react';
import { di } from 'react-magnetic-di';
import { Modal as ModalInj } from 'material-ui';
import { useQuery as useQueryInj } from 'react-apollo';

function MyComponent() {
  const [Modal, useQuery] = di([ModalInj, useQueryInj], MyComponent);

  const { data } = useQuery();
  return <Modal>{data && 'Done!'}</Modal>;
}
```

## Contributing

To test your changes you can run the examples (with `npm run start`).
Also, make sure you run `npm run preversion` before creating you PR so you will double check that linting, types and tests are fine.

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
- Promotes type safety for mocks
- Works with any kind of value (functions, objects, strings) and in all closures / React components
- Replaces dependencies at any depth of the call chain / React tree
- Allows selective injection
- Enforces separation of concerns, keeps your component API clean
- Proper ES Modules support, as it does not mess up with modules/require or React internals

## Philosophy

Dependency injection and component injection is not a new topic. Especially the ability to provide a custom implementation of a component/hook while testing or writing storybooks and examples it is extremely valuable. `magnetic-di` takes inspiration from decorators, and with a touch of Babel magic allows you to optionally override imported/exported values in your code so you can swap implementations only when needed.

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
    'react-magnetic-di/babel-plugin',
  ],
```

This is where the magic happens: we safely rewrite the code to prepend `di(...)` in every function scope, so that the dependency value can be swapped. We recommend to only add the plugin in development/test environments to avoid useless const assignment in production. You can either do that via multiple babel environment configs or by using `enabledEnvs` option.

### Using dependency replacement

Once babel is configured, in your tests you can create type safe replacements via `injectable` and then use `runWithDi` , which will setup and clear the replacements for you after function execution is terminated. Such util also handles async code, but might require you to wrap the entire test to work effectively with scheduled code paths, or event driven implementations.

Assuming your source is:

```js
import { fetchApi } from './fetch';

export async function myApiFetcher() {
  const { data } = await fetchApi();
  return data;
}
```

Then in the test you can write:

```js
import { injectable, runWithDi } from 'react-magnetic-di';
import { fetchApi } from './fetch';
import { myApiFetcher } from '.';

it('should call the API', async () => {
  // injectable() needs the original implementation as first argument
  // and the replacement implementation as second
  const fetchApiDi = injectable(
    fetchApi,
    jest.fn().mockResolvedValue({ data: 'mock' })
  );

  const result = await runWithDi(() => myApiFetcher(), [fetchApiDi]);

  expect(fetchApiDi).toHaveBeenCalled();
  expect(result).toEqual('mock');
});
```

### Using dependency replacement in React tests and storybooks

For React, we provide a specific `DiProvider` to enable replacements across the entire tree. Given a component with complex UI interaction or data dependencies, like a Modal or an Apollo Query, we want to easily be able to integration test it:

```jsx
import React from 'react';
import { DiProvider, injectable } from 'react-magnetic-di';
import { Modal } from 'material-ui';
import { useQuery } from 'react-apollo-hooks';

// injectable() needs the original implementation as first argument
// and the replacement implementation as second
const ModalOpenDi = injectable(Modal, () => <div />);
const useQueryDi = injectable(useQuery, () => ({ data: null }));

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

Here `MyComponent` will have both `ModalOpen` and `useQuery` replaced while `MyOtherComponent` only `ModalOpen`. Be aware that `target` needs an **actual component** declaration to work, so will not work in cases where the component is fully anonymous (eg: `export default () => ...` or `forwardRef(() => ...)`).

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

### Other replacement patterns

#### Allowing globals (variables) replacement

Currently the library does not enable automatic replacement of globals. To do that, you need to manually "tag" a global for replacement with `di(myGlobal)` in the function scope. For instance:

```js
import { di } from 'react-magnetic-di';

export async function myApiFetcher() {
  // explicitly allow fetch global to be injected
  di(fetch);
  const { data } = await fetch();
  return data;
}
```

Alternatively, you can create a "getter" so that the library will pick it up:

```js
export const fetchApi = (...args) => fetch(...args);

export async function myApiFetcher() {
  // now injection will automatically work
  const { data } = await fetchApi();
  return data;
}
```

#### Ignoring a function scope

Other times, there might be places in code where auto injection is problematic and might cause infinite loops. It might be the case if you are creating an injectable that then imports the replacement source itself.

For those scenarios, you can add a comment at the top of the function scope to tell the Babel plugin to skip that scope:

```js
import { fetchApi } from './fetch';

export async function myApiFetcher() {
  // di-ignore
  const { data } = await fetchApi();
  return data;
}
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

#### Babel plugin options

The plugin provides a couple of options to explicitly disable auto injection for certain paths, automatically mock modules in tests and overall enable/disable replacements on specific environments:

```js
  // In your .babelrc / babel.config.js
  // ... other stuff like presets
  plugins: [
    // ... other plugins
    ['react-magnetic-di/babel-plugin', {
      // List of paths to ignore for auto injection. Recommended for mocks/tests/storybooks
      exclude: ['mocks', /test\.tsx?/],
      // List of Babel or Node environment names where the plugin should be enabled
      enabledEnvs: ['development', 'test'],
      // Mock injectables imports to improve test performance
      // Currently supports only jest
      mockModules: 'jest',
      // Automatically mock injectables imports (needs mockModules set)
      // For instance mock all injectables imports that are 1st party @app/foo
      defaultMockedModules: ['@app/'],
    }],
  ],
```

#### injectables options

When creating injectables you can provide a configuration object to customise some of its behaviour.
• `displayName`: provide a custom name to make debugging easier:

```js
const fetchApiDi = injectable(fetchApi, jest.fn(), { displayName: 'fetchApi' });
```

• `target`: allows a replacement to only apply to specific function(s):

```js
const fetchApiDi = injectable(fetchApi, jest.fn(), { target: fetchProjects });
```

• `track`: skip reporting it in `stats.unused()` (handy if you provide default injectables across tests):

```js
const fetchApiDi = injectable(fetchApi, jest.fn(), { track: false });
```

• `global`: allows a replacement to be available everywhere, at any point, until `DiProvider` unmounts (alternatively use `global` prop on `DiProvider` to make all `use` replacements act globally):

```js
const fetchApiDi = injectable(fetchApi, jest.fn(), { global: true });
```

• `module`: explicitly mocks the module (eg adding `jest.mock('...')`) to improve test performance when dealing with large import trees. It requires the `babel-plugin` `mockModules` option set to `jest`. In case `defaultMockedModules` is also set, setting it to `false` allows to opt out a module even if it should be mocked by default (otherwise defaults to `false`).

```js
const fetchApiDi = injectable(fetchApi, jest.fn(), { module: true });
```

#### DiProvider props

• `use`: required prop, it is an array of replacements
• `target`: allows a replacement to only apply to specific components(s)
• `global`: boolean, allows replacements to be available outside the render phase

## ESLint plugin and rules

In order to enforce better practices, this package exports some ESLint rules:

| rule                       | description                                                                                                         |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `order`                    | enforces `di(...)` to be the top of the block, to reduce chances of partial replacements                            |
| `no-duplicate`             | prohibits marking the same dependency as injectable more than once in the same scope                                |
| `no-extraneous`            | enforces dependencies to be consumed in the scope, to prevent unused variables                                      |
| `no-restricted-injectable` | prohibits certain values from being injected: `paths: [{ name: string, importNames?: string[], message?: string }]` |
| `sort-dependencies`        | require injectable dependencies to be sorted                                                                        |

The rules are exported from `react-magnetic-di/eslint-plugin`.

## Current limitations

- `DiProvider` does not support dynamic `use` and `target` props (changes are ignored)
- Does not replace default props (or default parameters in general): so dependencies provided as default parameters (eg `function MyComponent ({ modal = Modal }) { ... }`) will be ignored. If you accept the dependency as prop/argument you should inject it via prop/argument, as having a double injection strategy is just confusing.
- Injecting primitive values (strings, booleans, numbers, ...) can be unreliable as we only have the actual value as reference, and so the library might not exactly know what to replace. In cases where multiple values might be replaced, a warning will be logged and we recommend you declare an inject a getter instead of the value itself.
- Targeting only works on named functions/classes, so it won't work on anonymous scopes (eg `export default () => { ... }` or `memo(() => { ... })`)
- If you define an injectable as `global` then you lose the ability to "scope" that injectable to a section of the tree, so the override will apply "globally". As a result, when defining multiple global replacements for the same dependency, only the last one evaluated will apply. So be careful when using it in a multi `DiProvider` tree.
- `module: true` is is a per-module setting that affects the entire test file. It leverages `jest.mock` and so it will mock all exports from the same module (even if you inject only one of them) and you cannot toggle it between tests in the same file. We recommend to set it on injectables defined outside individual tests to make it easier to discover.

## FAQ

#### Cannot seem to make injectable work

A way to check if some dependency has been tagged for injection is to use the `debug` util, as it will print all values that are available for injection:

```js
import { debug } from 'react-magnetic-di';
// ...
console.log(debug(myApiFetcher));
// It will print 'fetchApi'
```

One possible reason for it to happen is that the context has been lost. Typical occurrences are async or deeply nested functions (especially in React).
The solution is setting the prop `global` on `DiProvider` (or the same injectable config) to better handle those scenarios (but refrain from abusing it).

#### How do I provide a custom mock module implementation when using mockModules?

There are two ways: either via having an external definition in `__mocks__` (see Jest docs) or by not using `magnetic-di` module mocking (setting `module: false` on the injectable) and defining your own `jest.mock(...)` implementation.

#### I get strange errors (specially TypeError ones) when using mockModules

`module: true` (or when `defaultMockedModules` matches) uses `jest.mock` internally, so it will replace the entire module exports with mocks for the entire test file. It means you might get errors when accessing exported members that are not injected or their mock implementation in not specified.

## Contributing

To test your changes you can run the examples (with `npm run start`).
Also, make sure you run `npm run preversion` before creating you PR so you will double check that linting, types and tests are fine.

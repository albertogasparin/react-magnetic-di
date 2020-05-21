// @flow
import React from 'react';
import ReactDOM from 'react-dom';
import { DiProvider } from 'react-magnetic-di';

import { Section } from './components/section';

import {
  InputExample,
  useThemeInputExample,
  useThemeLabelExample,
} from './examples';

/**
 * Main App
 */
const App = () => (
  <div>
    <h1>Usage examples</h1>
    <main>
      <Section title="No injection" />
      <hr />
      <DiProvider use={[InputExample]}>
        <Section title="Single dependency injection" />
      </DiProvider>
      <hr />
      <DiProvider use={[useThemeLabelExample, useThemeInputExample]}>
        <Section title="Multiple dependency injection" />
      </DiProvider>
    </main>
  </div>
);

// $FlowFixMe
ReactDOM.render(<App />, document.getElementById('root'));

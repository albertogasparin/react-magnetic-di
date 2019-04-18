// @flow
import React from 'react';
import ReactDOM from 'react-dom';
import { DependencyProvider } from 'react-magnetic-di';

import { Section } from './components/section';
import { Label } from './components/label';
import { Input } from './components/input';

import { InputExample, useThemeExample, useThemeExample2 } from './examples';

/**
 * Main App
 */
const App = () => (
  <div>
    <h1>Usage examples</h1>
    <main>
      <Section title="No injection" />
      <hr />
      <DependencyProvider use={{ Input: InputExample }}>
        <Section title="Global dependency injection" />
      </DependencyProvider>
      <hr />
      <DependencyProvider target={Label} use={{ useTheme: useThemeExample }}>
        <DependencyProvider target={Input} use={{ useTheme: useThemeExample2 }}>
          <Section title="Targeted dependency injection" />
        </DependencyProvider>
      </DependencyProvider>
    </main>
  </div>
);

// $FlowFixMe
ReactDOM.render(<App />, document.getElementById('root'));

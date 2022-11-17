// @flow
import React from 'react';
import { createRoot } from 'react-dom/client';
import { DiProvider, withDi } from 'react-magnetic-di';

import { Section } from './components/section';

import {
  InputExample,
  useThemeInputExample,
  useThemeLabelExample,
} from './examples';

const SectionWithDi = withDi(Section, [InputExample]);

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
      <hr />
      <SectionWithDi title="HOC injection" />
    </main>
  </div>
);

// @ts-expect-error
const root = createRoot(document.getElementById('root'));
root.render(<App />);

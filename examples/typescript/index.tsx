import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { DiProvider, di, withDi, injectable } from 'react-magnetic-di';

const useOpen = () => useState(false);

const useOpenDi = injectable(useOpen, () => useState(true));

const MyComponent = () => {
  di(useOpen);
  const [open, setOpen] = useOpen();
  return (
    <button onClick={() => setOpen(!open)}>{open ? 'open' : 'closed'}</button>
  );
};

const MyComponentWithDi = withDi(MyComponent, [useOpenDi]);

/**
 * Main App
 */
const App = () => (
  <div>
    <h1>Usage examples</h1>
    <main>
      <MyComponent />
      <hr />
      <DiProvider use={[useOpenDi]}>
        <MyComponent />
      </DiProvider>
      <hr />
      <MyComponentWithDi />
    </main>
  </div>
);

ReactDOM.render(<App />, document.getElementById('root'));

import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { di, DiProvider, injectable, withDi } from 'react-magnetic-di/macro';

const useStateDi = injectable(useState, () => useState(true));

const MyComponent = () => {
  di(useState);
  const [open, setOpen] = useState(false);
  return (
    <button onClick={() => setOpen(!open)}>{open ? 'open' : 'closed'}</button>
  );
};

const MyComponentWithDi = withDi(MyComponent, [useStateDi]);

/**
 * Main App
 */
const App = () => (
  <div>
    <h1>Usage examples</h1>
    <main>
      <MyComponent />
      <hr />
      <DiProvider use={[useStateDi]} target={MyComponent}>
        <MyComponent />
      </DiProvider>
      <hr />
      <MyComponentWithDi />
    </main>
  </div>
);

ReactDOM.render(<App />, document.getElementById('root'));

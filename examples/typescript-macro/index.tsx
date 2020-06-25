import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { di, DiProvider, mock, withDi } from 'react-magnetic-di/macro';

const useStateMock = mock(useState, () => useState(true));

const MyComponent = () => {
  di(useState);
  const [open, setOpen] = useState(false);
  return (
    <button onClick={() => setOpen(!open)}>{open ? 'open' : 'closed'}</button>
  );
};

const MyComponentWithDi = withDi(MyComponent, [useStateMock]);

/**
 * Main App
 */
const App = () => (
  <div>
    <h1>Usage examples</h1>
    <main>
      <MyComponent />
      <hr />
      <DiProvider use={[useStateMock]} target={MyComponent}>
        <MyComponent />
      </DiProvider>
      <hr />
      <MyComponentWithDi />
    </main>
  </div>
);

ReactDOM.render(<App />, document.getElementById('root'));

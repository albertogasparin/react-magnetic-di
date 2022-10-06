import React, { useState, FunctionComponent } from 'react';
import ReactDOM from 'react-dom';
import { di, DiProvider, injectable, withDi } from 'react-magnetic-di/macro';

const useOpen = () => useState(false);
const Button: FunctionComponent<any> = (props) => <button {...props} />;

const useOpenDi = injectable(useOpen, () => useState(true));
const ButtonDi = injectable(Button, (props) => <a {...props} />);

const MyComponent = () => {
  di(Button, useOpen);
  const [open, setOpen] = useOpen();
  return (
    <Button onClick={() => setOpen(!open)}>{open ? 'open' : 'closed'}</Button>
  );
};

const MyComponentWithDi = withDi(MyComponent, [ButtonDi, useOpenDi]);

/**
 * Main App
 */
const App = () => (
  <div>
    <h1>Usage examples</h1>
    <main>
      <MyComponent />
      <hr />
      <DiProvider use={[ButtonDi, useOpenDi]} target={MyComponent}>
        <MyComponent />
      </DiProvider>
      <hr />
      <MyComponentWithDi />
    </main>
  </div>
);

ReactDOM.render(<App />, document.getElementById('root'));

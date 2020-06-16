declare module 'react-magnetic-di/babel.macro' {
  type Dependency = Function;

  function di(...dependencies: Dependency[]): void;

  export = di;
}

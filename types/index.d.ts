declare module 'react-magnetic-di' {
  import { ComponentType, ReactNode, Component } from 'react';

  type Dependency = Function;

  class DiProvider extends Component<
    {
      use: Dependency[];
      target?: ComponentType<any> | ComponentType<any>[];
      children?: ReactNode;
    },
    { getDependencies: (deps: Dependency[]) => Dependency[] }
  > {}

  function withDi<T extends ComponentType<any>>(
    component: T,
    dependencies: Dependency[],
    target?: ComponentType<any> | ComponentType<any>[]
  ): T;

  /** @deprecated use injectable instead */
  function mock<T extends Dependency>(original: T, mock: T): T;

  function injectable<T extends Dependency>(from: T, implementation: T): T;

  function di(...dependencies: Dependency[]): void;
  /** allow using di without Babel */
  function di<T extends Dependency>(
    dependencies: T[],
    self: ComponentType<any> | null
  ): T[];

  class di {
    /** @deprecated use injectable instead */
    static mock: typeof mock;
  }
}

declare module 'react-magnetic-di/macro' {
  export * from 'react-magnetic-di';
}

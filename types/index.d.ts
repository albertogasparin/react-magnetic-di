declare module 'react-magnetic-di' {
  import { ComponentType, ReactNode, Component } from 'react';

  type Dependency = Function;

  class DiProvider extends Component<
    { use: Dependency[]; children: ReactNode },
    { getDependencies: (deps: Dependency[]) => Dependency[] }
  > {}

  function withDi(
    component: ComponentType<any>,
    dependencies: Dependency[]
  ): void;

  function mock<T extends Dependency>(original: T, mock: T): T;

  function di(...dependencies: Dependency[]): void;
  class di {
    static mock: typeof mock;
  }
}

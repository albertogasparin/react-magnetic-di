declare module 'react-magnetic-di' {
  import { ComponentType, ReactNode, Component, ComponentProps } from 'react';

  type Dependency = unknown;

  type Injectable<T = Dependency> = T & {
    [di: symbol]: 'Return type of injectable()';
  };

  type DeepPartial<Type> = Type extends (...args: any) => any
    ? (...args: Parameters<Type>) => DeepPartial<ReturnType<Type>>
    : Type extends ReadonlyArray<infer InferredArrayMember>
      ? InferredArrayMember[] extends Type
        ? readonly InferredArrayMember[] extends Type
          ? ReadonlyArray<DeepPartial<InferredArrayMember>> // readonly list
          : Array<DeepPartial<InferredArrayMember>> // mutable list
        : DeepPartialObject<Type> // tuple
      : Type extends object
        ? DeepPartialObject<Type>
        : Type | undefined;

  type DeepPartialObject<Type> = {
    [Key in keyof Type]?: DeepPartial<Type[Key]>;
  };

  type Optional<T> = { [P in keyof T]-?: T[P] };

  type ComponentOrFunction<Type> =
    Type extends ComponentType<any>
      ? ComponentType<ComponentProps<Type>>
      : DeepPartial<Type>;

  class DiProvider extends Component<
    {
      use: Injectable[];
      children?: ReactNode;
      global?: boolean;
      target?: Function | Function[];
    },
    { getDependencies: (deps: Dependency[]) => Dependency[] }
  > {}

  function withDi<T extends ComponentType<any>>(
    component: T,
    dependencies: Injectable[],
    target?: Function | Function[]
  ): T;

  type InjectableOptions = {
    displayName?: string;
    global?: boolean;
    target?: Function | Function[];
    track?: boolean;
    module?: boolean;
  };

  function injectable<T extends Dependency>(
    from: T,
    implementation: ComponentOrFunction<T>,
    options?: InjectableOptions
  ): Injectable<T>;
  function injectable<T extends Dependency>(
    from: T,
    implementation: T,
    options?: InjectableOptions
  ): Injectable<T>;

  function di(...dependencies: Dependency[]): void;
  /** allow using di without Babel */
  function di<T extends Dependency>(
    dependencies: T[],
    self: ComponentType<any> | null
  ): T[];

  function runWithDi<T extends () => any>(
    thunk: T,
    dependencies: Injectable[]
  ): ReturnType<T>;

  function debug<T extends Function>(fn: T): string;

  const stats: {
    /** Returns unused injectables */
    unused(): Array<{ get(): Injectable; error(): Error }>;
    /** Resets stats */
    reset(): void;
  };
}

import { RuleTester } from 'eslint';
import rule from '../exhaustive-inject';
import { genericCases } from './utils';

RuleTester.setDefaultConfig({
  parserOptions: {
    ecmaVersion: 6,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
});

var ruleTester = new RuleTester();
ruleTester.run('exhaustive-inject', rule, {
  valid: [
    // it should pass generic cases
    ...genericCases,

    // it should ignore built-in react components
    `
      import { Fragment } from 'react';
      import { di } from 'react-magnetic-di';
      import { useQuery } from 'react-apollo';

      function MyComponent() {
        di(useQuery);
        useQuery();
        return <Fragment />;
      }
    `,
    // it should ignore not stateful react hooks
    `
      import { useMemo, useContext } from 'react';
      import { di } from 'react-magnetic-di';

      function MyComponent() {
        di(useContext);
        useMemo();
        return useContext();
      }
    `,
    // it should ignore components and hooks defined locally
    `
      import { useState } from 'react';
      import { di } from 'react-magnetic-di';

      function MyComponent() {
        di(useState);
        const ServiceLocal = () => null;
        const useServiceLocal = () => null;

        const [s] = useState();
        useServiceLocal();
        return <ServiceLocal />;
      }
    `,
    // it should ignore components and hooks in props
    `
      import { useState } from 'react';
      import { di } from 'react-magnetic-di';

      function MyComponent({ useServiceProp, ServiceProp }) {
        di(useState);
        const [s] = useState();
        useServiceProp();
        return <ServiceProp />;
      }
    `,
    // it should ignore components and hooks in default props
    `
      import { useState } from 'react';
      import { di } from 'react-magnetic-di';
      import { useDefaultService, DefaultService } from './service';

      const MyComponent = ({ useService = useDefaultService, Service = DefaultService }) => {
        di(useState);
        useState();
        useService();
        return <Service />;
      }
    `,
    // it should ignore components handled in deeper scopes
    `
      import { useState, useMemo } from 'react';
      import { di } from 'react-magnetic-di';
      import { useDefaultService, DefaultService } from './service';

      const MyComponent = ({ Service }) => {
        di(useState);
        useState();
        const Component = useMemo(() => <Service />, [Service]);
        return <Component />;
      }
    `,
    // it should ignore components created in upper scopes
    `
      import React, { forwardRef, useState } from 'react';
      import { di } from 'react-magnetic-di';

      export const MyComponent = (ComponentArg, useArg) => {
        const WithHOC = forwardRef(
          (props) => {
            di(useState);
            useState();
            useArg();
            return <ComponentArg {...props} />;
          }
        );
        return WithHOC;
      };
    `,
    {
      // it should ignore components specified in config options
      code: `
        import { Suspense, useState, useMemo } from 'react';
        import { di } from 'react-magnetic-di';
        import { Query } from 'react-apollo';
  
        function MyComponent() {
          di(useState);
          useState();
          return <Suspense><Query /></Suspense>;
        }
      `,
      options: [{ ignore: ['Query'] }],
    },
    {
      // it should ignore hooks specified in options
      code: `
        import { Suspense, useState, useMemo } from 'react';
        import { di } from 'react-magnetic-di';
        import { Query } from 'react-apollo';
  
        function MyComponent() {
          di(useState);
          useState();
          useMemo();
          return useQuery();
        }
      `,
      options: [{ ignore: ['useQuery'] }],
    },
    // it should ignore recursive components
    `
        import { Suspense, useState, useMemo } from 'react';
        import { di } from 'react-magnetic-di';
  
        function MyComponent({ child }) {
          di(useState);
          useState();
          useMemo();
          return <MyComponent child={child} />
        }
      `,
    // it should ignore recursive arrow function components
    `
        import { Suspense, useState, useMemo } from 'react';
        import { di } from 'react-magnetic-di';
  
        const MyComponent = ({ child }) => {
          di(useState);
          useState();
          useMemo();
          return <MyComponent child={child} />
        };
      `,
    // it should ignore recursive hooks
    `
        import { Suspense, useState } from 'react';
        import { di } from 'react-magnetic-di';
  
        const useX = ({ child }) => {
          di(useState);
          useState();
          if (!child.child) return null;
          return useX(child.child)
        };
      `,
  ],

  invalid: [
    {
      // it should inject imported hooks
      code: `
        import { useState } from 'react';
        import { di } from 'react-magnetic-di';
        import { useQuery } from 'react-apollo';
  
        function MyComponent() {
          di(useState);
          useState();
          return useQuery();
        }
      `,
      errors: [
        {
          messageId: 'missingInject',
          type: 'ExpressionStatement',
        },
      ],
      output: `
        import { useState } from 'react';
        import { di } from 'react-magnetic-di';
        import { useQuery } from 'react-apollo';
  
        function MyComponent() {
          di(useState, useQuery);
          useState();
          return useQuery();
        }
      `,
    },
    {
      // it should inject imported React components
      code: `
        import { Suspense, useState } from 'react';
        import { di } from 'react-magnetic-di';
        import { Query } from 'react-apollo';
  
        function MyComponent() {
          di(useState);
          useState();
          return <Suspense><Query /></Suspense>;
        }
      `,
      errors: [
        {
          messageId: 'missingInject',
          type: 'ExpressionStatement',
        },
      ],
      output: `
        import { Suspense, useState } from 'react';
        import { di } from 'react-magnetic-di';
        import { Query } from 'react-apollo';
  
        function MyComponent() {
          di(useState, Query);
          useState();
          return <Suspense><Query /></Suspense>;
        }
      `,
    },
    {
      // it should inject stateful react hooks
      code: `
        import { Suspense, useState } from 'react';
        import { di } from 'react-magnetic-di';
        import { Query } from 'react-apollo';
  
        function MyComponent() {
          di(Query);
          useState();
          return <Suspense><Query /></Suspense>;
        }
      `,
      errors: [
        {
          messageId: 'missingInject',
          type: 'ExpressionStatement',
        },
      ],
      output: `
        import { Suspense, useState } from 'react';
        import { di } from 'react-magnetic-di';
        import { Query } from 'react-apollo';
  
        function MyComponent() {
          di(Query, useState);
          useState();
          return <Suspense><Query /></Suspense>;
        }
      `,
    },

    {
      // it should fix empty injections
      code: `
        import React, { useState } from 'react';
        import { di } from 'react-magnetic-di';

        const useData = () => {
          di();
          return useState();
        };
      `,
      errors: [{ messageId: 'missingInject', type: 'ExpressionStatement' }],
      output: `
        import React, { useState } from 'react';
        import { di } from 'react-magnetic-di';

        const useData = () => {
          di(useState);
          return useState();
        };
      `,
    },
    {
      // it should fix locally defined component in module scope
      code: `
        import React from 'react';
        import { di } from 'react-magnetic-di';
        const MyLocalComponent = () => null;

        const MyComponent = () => {
          di();
          return <MyLocalComponent />;
        };
      `,
      errors: [{ messageId: 'missingInject', type: 'ExpressionStatement' }],
      output: `
        import React from 'react';
        import { di } from 'react-magnetic-di';
        const MyLocalComponent = () => null;

        const MyComponent = () => {
          di(MyLocalComponent);
          return <MyLocalComponent />;
        };
      `,
    },
    {
      // it should fix locally defined hook in module scope
      code: `
        import React from 'react';
        import { di } from 'react-magnetic-di';
        const useLocal = () => {};

        const useHook = () => {
          di();
          return useLocal();
        };
      `,
      errors: [{ messageId: 'missingInject', type: 'ExpressionStatement' }],
      output: `
        import React from 'react';
        import { di } from 'react-magnetic-di';
        const useLocal = () => {};

        const useHook = () => {
          di(useLocal);
          return useLocal();
        };
      `,
    },
  ],
});

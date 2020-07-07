export const genericCases = [
  // should not trigger when no di imported
  `
    import React from 'react';
    import { Query } from 'react-apollo';

    story('MyStory', () => {
      const tree = shallow(<Query />);
      expect(tree).toMatchSnapshot();
    });
  `,

  // should support functional components
  `
    import React from 'react';
    import { di } from 'react-magnetic-di';
    import { ImportedComponent, useImportedHook } from './imported';

    const ModuleComponent = () => null;
    const useModuleHook = () => null;

    function MyComponent ({ PropComponent, usePropHook }) {
      di(ImportedComponent, ModuleComponent);
      di(useImportedHook, useModuleHook);
      
      const LocalComponent = () => null;
      const useLocalHook = () => null;
      
      useImportedHook();
      useModuleHook();
      usePropHook();
      useLocalHook();

      return (
        <>
          <ImportedComponent />
          <ModuleComponent />
          <PropComponent />
          <LocalComponent />
        </>
      );
    }
  `,

  // should support class components
  `
    import React, { Component } from 'react';
    import { di } from 'react-magnetic-di';
    import { ImportedComponent, useImportedHook } from './imported';

    const ModuleComponent = () => null;
    
    class MyComponent extends Component {
      render() {
        di(ImportedComponent, ModuleComponent);
        const { PropComponent } = this.props;
        const LocalComponent = () => null;

        return (
          <>
            <ImportedComponent />
            <ModuleComponent />
            <PropComponent />
            <LocalComponent />
          </>
        );
      }
    }
  `,
];

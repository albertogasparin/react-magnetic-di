export const genericCases = [
  `
    import React from 'react';
    import { Query } from 'react-apollo';

    story('MyStory', () => {
      const tree = shallow(<Query />);
      expect(tree).toMatchSnapshot();
    });
  `,
];

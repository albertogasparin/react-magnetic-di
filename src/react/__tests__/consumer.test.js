/* eslint-env jest */

import { di } from '../consumer';

describe('di', () => {
  const dependency = () => {};

  it('should return dependencies', () => {
    const result = di(null, dependency);
    expect(result).toEqual([dependency]);
  });
});

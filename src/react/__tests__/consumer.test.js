/* eslint-env jest */

import { di } from '../consumer';

describe('di', () => {
  const dependency = () => {};

  it('should return dependencies', () => {
    const result = di([dependency]);
    expect(result).toEqual([dependency]);
  });
});

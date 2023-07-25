/** @jest-environment jsdom */
/* eslint-env jest */

import { Label, apiHandler } from './common';
import { debug } from '../utils';

describe('debug', () => {
  it('should return di dependencies on functions', () => {
    expect(debug(apiHandler)).toEqual('fetchApi, transformer');
  });

  it('should return di dependencies on class methods', () => {
    expect(debug(Label.prototype.render)).toEqual('Wrapper, Text');
  });
});

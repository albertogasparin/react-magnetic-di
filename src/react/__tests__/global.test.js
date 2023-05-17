/* eslint-env jest */
import { globalDi, runWithDi } from '../global';
import {
  apiHandler,
  transformer,
  processApiDataDi,
  fetchApiDi,
} from './common';

describe('globalDi', () => {
  afterEach(() => {
    globalDi.clear();
  });

  it('should return real dependencies if not set', () => {
    expect(transformer('data')).toEqual('data process');
  });

  it('should override all dependencies of same type', () => {
    globalDi.use([processApiDataDi]);
    expect(transformer('data')).toEqual('data process-di');
  });

  it('should clear injectables when told', () => {
    globalDi.use([processApiDataDi]);
    globalDi.clear();
    expect(transformer('data')).toEqual('data process');
  });

  it('should error when trying to use without having cleared first', () => {
    globalDi.use([processApiDataDi]);
    expect(() => globalDi.use([])).toThrow();
  });

  it('should error when a non injectable is used', () => {
    expect(() => {
      globalDi.use([jest.fn()]);
    }).toThrowError();
  });
});

describe('runWithDi', () => {
  it('should override sync functions', () => {
    const deps = [processApiDataDi];
    const result = runWithDi(() => transformer('data'), deps);
    expect(result).toEqual('data process-di');
  });

  it('should override async functions', async () => {
    const deps = [fetchApiDi, processApiDataDi];
    const result = await runWithDi(() => apiHandler(), deps);
    expect(result).toEqual('fetch-di process-di');
  });
});

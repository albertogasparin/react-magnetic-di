/* eslint-env jest */
import { globalDi, runWithDi } from '../global';
import { di } from '../consumer';
import { injectable } from '../injectable';
import {
  apiHandler,
  fetchApi,
  fetchApiDi,
  processApiData,
  processApiDataDi,
  transformer,
} from './common';

describe('globalDi', () => {
  afterEach(() => {
    globalDi.clear();
  });

  it('should return real dependencies if not set', () => {
    expect(transformer('data')).toEqual('data process-og');
  });

  it('should override all dependencies of same type', () => {
    globalDi.use([processApiDataDi]);
    expect(transformer('data')).toEqual('data process-di');
  });

  it('should override dependencies based on target', async () => {
    globalDi.use([
      injectable(fetchApi, () => 'fetch-di', { target: apiHandler }),
      injectable(transformer, () => 'transf-di', { target: fetchApi }),
    ]);
    expect(await apiHandler()).toEqual('fetch-di process-og');
  });

  it('should clear injectables when told', () => {
    globalDi.use([processApiDataDi]);
    globalDi.clear();
    expect(transformer('data')).toEqual('data process-og');
  });

  it('should remove injectables when told', () => {
    globalDi.use([processApiDataDi, fetchApiDi]);
    globalDi._remove([processApiDataDi]);
    expect(transformer('data')).toEqual('data process-og');
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

  describe('_fromProvider', () => {
    it('should add all injectables with global prop', () => {
      globalDi._fromProvider([injectable(processApiData, () => 'process-di')], {
        global: true,
      });
      expect(transformer('data')).toEqual('process-di');
    });

    it('should add injectables with global config', () => {
      globalDi._fromProvider([
        injectable(processApiData, () => 'process-di', { global: true }),
      ]);
      expect(transformer('data')).toEqual('process-di');
    });
  });

  describe('with various replacement types', () => {
    const cases = [1, 'string', null, Symbol('test'), function () {}];

    test.each(cases)('should hanlde dependency value %p', (value) => {
      globalDi.use([injectable(value, 'replaced')]);
      const result = di(null, value);
      expect(result).toEqual(['replaced']);
    });
  });

  it('should be fast', () => {
    /* prettier-ignore */
    let a=jest.fn(), b=jest.fn(), c=jest.fn(), d=jest.fn(), e=jest.fn(), f=jest.fn(), g=jest.fn(), h=jest.fn(), i=jest.fn(), l=jest.fn(), m=jest.fn(), n=jest.fn(), o=jest.fn(), p=jest.fn(), q=jest.fn(), r=jest.fn(), s=jest.fn();
    const testbed = () => {
      /* prettier-ignore */
      const [_a, _b, _c, _d, _e, _f, _g, _h, _i, _l, _m, _n, _o, _p, _q, _r, _s] = di(null, a, b, c, d, e, f, g, h, i, l, m, n, o, p, q, r, s);
      const testbed2 = () => {
        /* prettier-ignore */
        const [_a2, _b2, _c2, _d2, _e2, _f2, _g2, _h2, _i2, _l2, _m2, _n2, _o2, _p2, _q2, _r2, _s2] = di(null, _a, _b, _c, _d, _e, _f, _g, _h, _i, _l, _m, _n, _o, _p, _q, _r, _s);
        const testbed3 = () => {
          /* prettier-ignore */
          const [_a3, _b3, _c3, _d3, _e3, _f3, _g3, _h3, _i3, _l3, _m3, _n3, _o3, _p3, _q3, _r3, _s3] = di(null, _a2, _b2, _c2, _d2, _e2, _f2, _g2, _h2, _i2, _l2, _m2, _n2, _o2, _p2, _q2, _r2, _s2);
          const testbed4 = () => {
            /* prettier-ignore */
            const [_a4, _b4, _c4, _d4, _e4, _f4, _g4, _h4, _i4, _l4, _m4, _n4, _o4, _p4, _q4, _r4, _s4] = di(null, _a3, _b3, _c3, _d3, _e3, _f3, _g3, _h3, _i3, _l3, _m3, _n3, _o3, _p3, _q3, _r3, _s3);
            const testbed5 = () => {
              /* prettier-ignore */
              const [_a5, _b5, _c5, _d5, _e5, _f5, _g5, _h5, _i5, _l5, _m5, _n5, _o5, _p5, _q5, _r5, _s5] = di(null, _a4, _b4, _c4, _d4, _e4, _f4, _g4, _h4, _i4, _l4, _m4, _n4, _o4, _p4, _q4, _r4, _s4);
              const testbed6 = () => {
                /* prettier-ignore */
                const [_a6, _b6, _c6, _d6, _e6, _f6, _g6, _h6, _i6, _l6, _m6, _n6, _o6, _p6, _q6, _r6, _s6] = di(null, _a5, _b5, _c5, _d5, _e5, _f5, _g5, _h5, _i5, _l5, _m5, _n5, _o5, _p5, _q5, _r5, _s5);
              };
              testbed6();
            };
            testbed5();
          };
          testbed4();
        };
        testbed3();
      };
      testbed2();
    };

    // warmup
    testbed();

    let startTime = performance.now();
    testbed();
    console.log('plain', (performance.now() - startTime) * 100);
    // const result = di([dependency]);
    // expect(result).toEqual([dependency]);
    runWithDi(() => {
      startTime = performance.now();
      testbed();
      console.log('runWithDi', (performance.now() - startTime) * 100);
    }, [injectable(a, jest.fn())]);
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

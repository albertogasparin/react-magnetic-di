/* eslint-env jest */

import { injectable, runWithDi } from 'react-magnetic-di';
import { fetchApi, processApiData, apiHandler, transformer } from '..';

const mockData = { data: [10, 20] };

describe('transformer', () => {
  it('should transform data via processor', () => {
    const processApiDataDi = injectable(processApiData, (v) => [100, 200]);

    const result = runWithDi(() => transformer(mockData), [processApiDataDi]);

    expect(result).toEqual([100, 200]);
  });
});

describe('apiHandler', () => {
  it('should fetch API data', async () => {
    const fetchApiDi = injectable(
      fetchApi,
      jest.fn().mockResolvedValue(mockData)
    );

    const result = await runWithDi(() => apiHandler(), [fetchApiDi]);

    expect(fetchApiDi).toHaveBeenCalled();
    expect(result).toEqual([100, 400]);
  });
});

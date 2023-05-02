import { di } from 'react-magnetic-di';

type Data = { data: number[] };

export const fetchApi = async (): Promise<Data> => ({ data: [1, 2] });
export const processApiData = (data: Data['data']) => data.map((v) => v * v);

export function transformer(response: Data) {
  di(processApiData);
  return processApiData(response.data);
}

export async function apiHandler() {
  di(fetchApi, transformer);
  const data = await fetchApi();
  return transformer(data);
}

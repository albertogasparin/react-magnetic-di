import React, { Component } from 'react';
import { di, injectable } from '../../index';

export const Wrapper = ({ children }) => <wrapper-og>{children}</wrapper-og>;
export const Text = () => <text-og />;

export class Label extends Component {
  render() {
    const [_Wrapper, _Text] = di([Wrapper, Text], Label);
    return (
      <label-og>
        <_Wrapper>
          <_Text />
        </_Wrapper>
      </label-og>
    );
  }
}

export class Input extends Component {
  render() {
    const [_Text] = di([Text], Input);
    return (
      <input-og>
        <_Text />
      </input-og>
    );
  }
}

export const TextDi = injectable(Text, () => <text-di />);
export const WrapperDi = injectable(Wrapper, ({ children }) => (
  <wrapper-di>{children}</wrapper-di>
));

export const fetchApi = async () => 'fetch-og';
export const processApiData = (v) => v + ' process-og';

export function transformer(data) {
  const [_processApiData] = di([processApiData], transformer);
  return _processApiData(data);
}

export async function apiHandler() {
  const [_fetchApi, _transformer] = di([fetchApi, transformer], apiHandler);
  const data = await _fetchApi();
  return _transformer(data);
}

export const fetchApiDi = injectable(fetchApi, async () => 'fetch-di');
export const processApiDataDi = injectable(
  processApiData,
  (v) => v + ' process-di'
);

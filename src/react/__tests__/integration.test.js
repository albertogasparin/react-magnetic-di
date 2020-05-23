/* eslint-env jest */

import React, { Component, Fragment } from 'react';
import { mount } from 'enzyme';
import { di, DiProvider, mock } from '../../index';

const Wrapper = ({ children }) => children;
const Text = () => 'original';

class Label extends Component {
  render() {
    const [_Wrapper, _Text] = di([Wrapper, Text], Label);
    return (
      <_Wrapper>
        <_Text />
      </_Wrapper>
    );
  }
}

class Input extends Component {
  render() {
    const [_Text] = di([Text], Input);
    return <_Text />;
  }
}

const TextMock = mock(Text, () => 'mock');
const WrapperMock = mock(Wrapper, ({ children }) => children);

describe('Integration', () => {
  it('should return real dependencies if provider less', () => {
    const wrapper = mount(
      <Fragment>
        <Label />
        <Input />
      </Fragment>
    );

    expect(wrapper.debug()).toMatchSnapshot();
  });

  it('should override all dependencies of same type', () => {
    const wrapper = mount(
      <DiProvider use={[TextMock]}>
        <Label />
        <Input />
      </DiProvider>
    );

    expect(wrapper.debug()).toMatchSnapshot();
  });

  it('should allow override composition', () => {
    const wrapper = mount(
      <DiProvider use={[WrapperMock]}>
        <DiProvider use={[TextMock]}>
          <Label />
          <Input />
        </DiProvider>
      </DiProvider>
    );

    expect(wrapper.debug()).toMatchSnapshot();
  });

  it('should only override dependencies of specified target', () => {
    const wrapper = mount(
      <DiProvider target={[Input]} use={[WrapperMock]}>
        <DiProvider target={Label} use={[TextMock]}>
          <Label />
          <Input />
        </DiProvider>
      </DiProvider>
    );

    expect(wrapper.debug()).toMatchSnapshot();
  });
});

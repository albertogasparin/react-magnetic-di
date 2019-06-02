/* eslint-env jest */

import React, { Component, Fragment } from 'react';
import { mount } from 'enzyme';
import { provideDependencies, settings, DependencyProvider } from '../index';

jest.mock('../settings');

class Label extends Component {
  static dependencies = provideDependencies({
    Text: () => '',
    Wrapper: ({ children }) => children,
  });
  render() {
    const { Wrapper, Text } = Label.dependencies();
    return (
      <Wrapper>
        <Text />
      </Wrapper>
    );
  }
}

class Input extends Component {
  static dependencies = provideDependencies({
    Text: () => '',
  });
  render() {
    const { Text } = Input.dependencies();
    return <Text />;
  }
}

const TextMock = () => '';
const TextMockAlt = () => '';
const WrapperMock = ({ children }) => children;

describe('Integration', () => {
  it('should return real dependencies if provider less', () => {
    settings.enabled = false;
    const wrapper = mount(
      <Fragment>
        <Label />
        <Input />
      </Fragment>
    );

    expect(wrapper.debug()).toMatchSnapshot();
  });

  it('should return real dependencies if disabled', () => {
    settings.enabled = false;
    const wrapper = mount(
      <DependencyProvider use={{ Text: TextMock }}>
        <Label />
        <Input />
      </DependencyProvider>
    );

    expect(wrapper.debug()).toMatchSnapshot();
  });

  it('should override all dependencies with same name', () => {
    settings.enabled = true;
    const wrapper = mount(
      <DependencyProvider use={{ Text: TextMock }}>
        <Label />
        <Input />
      </DependencyProvider>
    );

    expect(wrapper.debug()).toMatchSnapshot();
  });

  it('should override per type dependencies', () => {
    settings.enabled = true;
    const wrapper = mount(
      <DependencyProvider target={Label} use={{ Text: TextMock }}>
        <Label />
        <Input />
      </DependencyProvider>
    );

    expect(wrapper.debug()).toMatchSnapshot();
  });

  it('should allow override composition', () => {
    settings.enabled = true;
    const wrapper = mount(
      <DependencyProvider use={{ Text: TextMock, Wrapper: WrapperMock }}>
        <DependencyProvider target={Label} use={{ Text: TextMockAlt }}>
          <Label />
          <Input />
        </DependencyProvider>
      </DependencyProvider>
    );

    expect(wrapper.debug()).toMatchSnapshot();
  });
});

/**
 * @jest-environment jsdom
 */
/* eslint-env jest */

import React, { Component, Fragment } from 'react';
import { render } from '@testing-library/react';
import { di, DiProvider, withDi, injectable } from '../../index';

const Wrapper = ({ children }) => <wrapper-og>{children}</wrapper-og>;
const Text = () => <text-og />;

class Label extends Component {
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

class Input extends Component {
  render() {
    const [_Text] = di([Text], Input);
    return (
      <input-og>
        <_Text />
      </input-og>
    );
  }
}

const TextDi = injectable(Text, () => <text-di />);
const WrapperDi = injectable(Wrapper, ({ children }) => (
  <wrapper-di>{children}</wrapper-di>
));

describe('Integration', () => {
  it('should return real dependencies if provider-less', () => {
    const { container } = render(
      <Fragment>
        <Label />
        <Input />
      </Fragment>
    );

    expect(container).toMatchInlineSnapshot(`
      <div>
        <label-og>
          <wrapper-og>
            <text-og />
          </wrapper-og>
        </label-og>
        <input-og>
          <text-og />
        </input-og>
      </div>
    `);
  });

  it('should override all dependencies of same type', () => {
    const { container } = render(
      <DiProvider use={[TextDi]}>
        <Label />
        <Input />
      </DiProvider>
    );

    expect(container).toMatchInlineSnapshot(`
      <div>
        <label-og>
          <wrapper-og>
            <text-di />
          </wrapper-og>
        </label-og>
        <input-og>
          <text-di />
        </input-og>
      </div>
    `);
  });

  it('should allow override composition', () => {
    const { container } = render(
      <DiProvider use={[WrapperDi]}>
        <DiProvider use={[TextDi]}>
          <Label />
          <Input />
        </DiProvider>
      </DiProvider>
    );

    expect(container).toMatchInlineSnapshot(`
      <div>
        <label-og>
          <wrapper-di>
            <text-di />
          </wrapper-di>
        </label-og>
        <input-og>
          <text-di />
        </input-og>
      </div>
    `);
  });

  it('should only override dependencies of specified target', () => {
    const { container } = render(
      <DiProvider target={[Input]} use={[WrapperDi]}>
        <DiProvider target={Label} use={[TextDi]}>
          <Label />
          <Input />
        </DiProvider>
      </DiProvider>
    );

    expect(container).toMatchInlineSnapshot(`
      <div>
        <label-og>
          <wrapper-og>
            <text-di />
          </wrapper-og>
        </label-og>
        <input-og>
          <text-og />
        </input-og>
      </div>
    `);
  });

  it('should get closest dependency if multiple providers using same type', () => {
    const TextDi2 = injectable(Text, () => <text-di2 />);
    const WrappedInput = withDi(Input, [TextDi2]);
    const { container } = render(
      <DiProvider use={[TextDi]}>
        <Label />
        <WrappedInput />
      </DiProvider>
    );

    expect(container).toMatchInlineSnapshot(`
      <div>
        <label-og>
          <wrapper-og>
            <text-di />
          </wrapper-og>
        </label-og>
        <input-og>
          <text-di2 />
        </input-og>
      </div>
    `);
  });
});

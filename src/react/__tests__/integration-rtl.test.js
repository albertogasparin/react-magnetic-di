/** @jest-environment jsdom */
/* eslint-env jest */

import React, { Fragment } from 'react';
import { render } from '@testing-library/react';
import { DiProvider, withDi, injectable } from '../../index';
import { Label, Input, Text, TextDi, Wrapper, WrapperDi } from './common';

describe('Integration: testing-library', () => {
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

  it('should only override dependencies of specified injectable target', () => {
    const deps = [
      injectable(Text, () => <text-di />, { target: Label }),
      injectable(Wrapper, (p) => <wrapper-di>{p.children}</wrapper-di>, {
        target: Input,
      }),
    ];

    const { container } = render(
      <DiProvider use={deps}>
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
          <text-og />
        </input-og>
      </div>
    `);
  });

  it('should get closest dependency if multiple providers using same type', () => {
    const TextDi2 = injectable(Text, () => <text-di2 />);
    TextDi2.displayName = 'di(Text2)';
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

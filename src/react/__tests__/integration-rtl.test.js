/** @jest-environment jsdom */
/* eslint-env jest */

import React, { Fragment } from 'react';
import { act, render } from '@testing-library/react';
import { DiProvider, withDi, injectable } from '../../index';
import {
  Label,
  Input,
  Text,
  TextDi,
  Wrapper,
  WrapperDi,
  processApiDataDi,
  fetchApiDi,
} from './common';

const tick = () => act(() => Promise.resolve());

describe('Integration: testing-library', () => {
  it('should return real dependencies if provider-less', async () => {
    const { container } = render(
      <Fragment>
        <Label />
        <Input />
      </Fragment>
    );

    await tick();

    expect(container).toMatchInlineSnapshot(`
      <div>
        <label-og>
          <wrapper-og>
            <text-og />
          </wrapper-og>
        </label-og>
        <input-og
          value="fetch-og process-og"
        >
          <text-og />
        </input-og>
      </div>
    `);
  });

  it('should override all dependencies of same type', async () => {
    const { container } = render(
      <DiProvider use={[TextDi]}>
        <Label />
        <Input />
      </DiProvider>
    );

    await tick();

    expect(container).toMatchInlineSnapshot(`
      <div>
        <label-og>
          <wrapper-og>
            <text-di />
          </wrapper-og>
        </label-og>
        <input-og
          value="fetch-og process-og"
        >
          <text-di />
        </input-og>
      </div>
    `);
  });

  it('should allow override composition', async () => {
    const { container } = render(
      <DiProvider use={[WrapperDi]}>
        <DiProvider use={[TextDi]}>
          <Label />
          <Input />
        </DiProvider>
      </DiProvider>
    );

    await tick();

    expect(container).toMatchInlineSnapshot(`
      <div>
        <label-og>
          <wrapper-di>
            <text-di />
          </wrapper-di>
        </label-og>
        <input-og
          value="fetch-og process-og"
        >
          <text-di />
        </input-og>
      </div>
    `);
  });

  it('should only override dependencies of specified target', async () => {
    const { container } = render(
      <DiProvider target={[Input]} use={[WrapperDi]}>
        <DiProvider target={Label} use={[TextDi]}>
          <Label />
          <Input />
        </DiProvider>
      </DiProvider>
    );

    await tick();

    expect(container).toMatchInlineSnapshot(`
      <div>
        <label-og>
          <wrapper-og>
            <text-di />
          </wrapper-og>
        </label-og>
        <input-og
          value="fetch-og process-og"
        >
          <text-og />
        </input-og>
      </div>
    `);
  });

  it('should only override dependencies of specified injectable target', async () => {
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

    await tick();

    expect(container).toMatchInlineSnapshot(`
      <div>
        <label-og>
          <wrapper-og>
            <text-di />
          </wrapper-og>
        </label-og>
        <input-og
          value="fetch-og process-og"
        >
          <text-og />
        </input-og>
      </div>
    `);
  });

  it('should only override dependencies of specified injectable targets array', async () => {
    const deps = [
      injectable(Text, () => <text-di />, { target: [Label, Input] }),
    ];

    const { container } = render(
      <DiProvider use={deps}>
        <Label />
        <Input />
      </DiProvider>
    );

    await tick();

    expect(container).toMatchInlineSnapshot(`
      <div>
        <label-og>
          <wrapper-og>
            <text-di />
          </wrapper-og>
        </label-og>
        <input-og
          value="fetch-og process-og"
        >
          <text-di />
        </input-og>
      </div>
    `);
  });

  it('should allow override of same dependency with different targets', async () => {
    const deps = [
      injectable(Text, () => <text-di-label />, { target: Label }),
      injectable(Text, () => <text-di-input />, { target: Input }),
    ];

    const { container } = render(
      <DiProvider use={deps}>
        <Label />
        <Input />
      </DiProvider>
    );

    await tick();

    expect(container).toMatchInlineSnapshot(`
      <div>
        <label-og>
          <wrapper-og>
            <text-di-label />
          </wrapper-og>
        </label-og>
        <input-og
          value="fetch-og process-og"
        >
          <text-di-input />
        </input-og>
      </div>
    `);
  });

  it('should override with target version even when first if dependency has multiple injectables', async () => {
    const deps = [
      injectable(Text, () => <text-di-target />, { target: Input }),
      injectable(Text, () => <text-di />),
    ];

    const { container } = render(
      <DiProvider use={deps}>
        <Label />
        <Input />
      </DiProvider>
    );

    await tick();

    expect(container).toMatchInlineSnapshot(`
      <div>
        <label-og>
          <wrapper-og>
            <text-di />
          </wrapper-og>
        </label-og>
        <input-og
          value="fetch-og process-og"
        >
          <text-di-target />
        </input-og>
      </div>
    `);
  });

  it('should override with target version even when last if dependency has multiple injectables', async () => {
    const deps = [
      injectable(Text, () => <text-di />),
      injectable(Text, () => <text-di-target />, { target: Input }),
    ];

    const { container } = render(
      <DiProvider use={deps}>
        <Label />
        <Input />
      </DiProvider>
    );

    await tick();

    expect(container).toMatchInlineSnapshot(`
      <div>
        <label-og>
          <wrapper-og>
            <text-di />
          </wrapper-og>
        </label-og>
        <input-og
          value="fetch-og process-og"
        >
          <text-di-target />
        </input-og>
      </div>
    `);
  });

  it('should get closest dependency if multiple providers using same type', async () => {
    const TextDi2 = injectable(Text, () => <text-di2 />);
    TextDi2.displayName = 'di(Text2)';
    const WrappedInput = withDi(Input, [TextDi2]);
    const { container } = render(
      <DiProvider use={[TextDi, processApiDataDi /* ignored */]}>
        <Label />
        <WrappedInput />
      </DiProvider>
    );

    await tick();

    expect(container).toMatchInlineSnapshot(`
      <div>
        <label-og>
          <wrapper-og>
            <text-di />
          </wrapper-og>
        </label-og>
        <input-og
          value="fetch-og process-og"
        >
          <text-di2 />
        </input-og>
      </div>
    `);
  });

  it('should get global injectable if global prop set', async () => {
    const { container } = render(
      <DiProvider use={[processApiDataDi, fetchApiDi]} global>
        <Input />
      </DiProvider>
    );

    await tick();

    expect(container).toMatchInlineSnapshot(`
      <div>
        <input-og
          value="fetch-di process-di"
        >
          <text-og />
        </input-og>
      </div>
    `);
  });
});

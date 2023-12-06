/* eslint-env jest */
import React, { Fragment } from 'react';
import { act, create } from 'react-test-renderer';
import { DiProvider, withDi, injectable } from '../../index';
import { Label, Input, Text, TextDi, WrapperDi } from './common';

const tick = () => act(() => Promise.resolve());

describe('Integration: react-test-renderer', () => {
  it('should return real dependencies if provider-less', async () => {
    const tree = create(
      <Fragment>
        <Label />
        <Input />
      </Fragment>
    ).toJSON();

    await tick();

    expect(tree).toMatchInlineSnapshot(`
      [
        <label-og>
          <wrapper-og>
            <text-og />
          </wrapper-og>
        </label-og>,
        <input-og
          value=""
        >
          <text-og />
        </input-og>,
      ]
    `);
  });

  it('should override all dependencies of same type', async () => {
    const tree = create(
      <DiProvider use={[TextDi]}>
        <Label />
        <Input />
      </DiProvider>
    ).toJSON();

    await tick();

    expect(tree).toMatchInlineSnapshot(`
      [
        <label-og>
          <wrapper-og>
            <text-di />
          </wrapper-og>
        </label-og>,
        <input-og
          value=""
        >
          <text-di />
        </input-og>,
      ]
    `);
  });

  it('should allow override composition', async () => {
    const tree = create(
      <DiProvider use={[WrapperDi]}>
        <DiProvider use={[TextDi]}>
          <Label />
          <Input />
        </DiProvider>
      </DiProvider>
    ).toJSON();

    await tick();

    expect(tree).toMatchInlineSnapshot(`
      [
        <label-og>
          <wrapper-di>
            <text-di />
          </wrapper-di>
        </label-og>,
        <input-og
          value=""
        >
          <text-di />
        </input-og>,
      ]
    `);
  });

  it('should only override dependencies of specified target', async () => {
    const tree = create(
      <DiProvider target={[Input]} use={[WrapperDi]}>
        <DiProvider target={Label} use={[TextDi]}>
          <Label />
          <Input />
        </DiProvider>
      </DiProvider>
    ).toJSON();

    await tick();

    expect(tree).toMatchInlineSnapshot(`
      [
        <label-og>
          <wrapper-og>
            <text-di />
          </wrapper-og>
        </label-og>,
        <input-og
          value=""
        >
          <text-og />
        </input-og>,
      ]
    `);
  });

  it('should get closest dependency if multiple providers using same type', async () => {
    const TextDi2 = injectable(Text, () => <text-di2 />);
    TextDi2.displayName = 'di(Text2)';
    const WrappedInput = withDi(Input, [TextDi2]);
    const tree = create(
      <DiProvider use={[TextDi]}>
        <Label />
        <WrappedInput />
      </DiProvider>
    ).toJSON();

    await tick();

    expect(tree).toMatchInlineSnapshot(`
      [
        <label-og>
          <wrapper-og>
            <text-di />
          </wrapper-og>
        </label-og>,
        <input-og
          value=""
        >
          <text-di2 />
        </input-og>,
      ]
    `);
  });
});

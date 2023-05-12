/** @jest-environment jsdom */
/* eslint-env jest */

import React from 'react';
import { render } from '@testing-library/react';
import { DiProvider, injectable, runWithDi, stats } from '../../index';
import {
  Label,
  TextDi,
  Wrapper,
  WrapperDi,
  apiHandler,
  fetchApiDi,
  processApiData,
  processApiDataDi,
  transformer,
} from './common';

describe('stats', () => {
  afterEach(() => {
    stats.reset();
  });

  describe('with DiProvider', () => {
    it('should track used injectables', () => {
      const deps = [TextDi, WrapperDi];
      render(
        <DiProvider use={deps}>
          <Label />
        </DiProvider>
      );
      expect(stats.unused()).toHaveLength(0);
    });

    it('should track unused injectables', () => {
      const deps = [TextDi, WrapperDi, fetchApiDi, processApiDataDi];
      render(
        <DiProvider use={deps}>
          <Label />
        </DiProvider>
      );
      expect(stats.unused()).toHaveLength(2);
      expect(stats.unused()[0].get()).toEqual(fetchApiDi);
      expect(stats.unused()[1].get()).toEqual(processApiDataDi);
    });

    it('should not track injectables with tracking false', () => {
      const ignore = injectable(() => {}, jest.fn(), { track: false });
      const deps = [TextDi, WrapperDi, ignore];
      render(
        <DiProvider use={deps}>
          <Label />
        </DiProvider>
      );
      expect(stats.unused()).toHaveLength(0);
    });

    it('should track missing injectables', () => {
      render(
        <DiProvider use={[TextDi]}>
          <Label />
        </DiProvider>
      );
      expect(stats.missing()).toHaveLength(1);
      expect(stats.missing()[0].get()).toEqual(Wrapper);
    });
  });

  describe('with runWithDi', () => {
    it('should track used injectables', async () => {
      const deps = [fetchApiDi, processApiDataDi];
      await runWithDi(() => apiHandler(), deps);
      expect(stats.unused()).toHaveLength(0);
    });

    it('should track unused injectables', async () => {
      const deps = [fetchApiDi, processApiDataDi, TextDi, WrapperDi];
      await runWithDi(() => apiHandler(), deps);
      expect(stats.unused()).toHaveLength(2);
      expect(stats.unused()[0].get()).toEqual(TextDi);
      expect(stats.unused()[1].get()).toEqual(WrapperDi);
    });

    it('should track missing injectables', async () => {
      const deps = [fetchApiDi];
      await runWithDi(() => apiHandler(), deps);
      expect(stats.missing()).toHaveLength(2);
      expect(stats.missing()[0].get()).toEqual(transformer);
      expect(stats.missing()[1].get()).toEqual(processApiData);
    });
  });
});

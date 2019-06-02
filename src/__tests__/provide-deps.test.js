/* eslint-env jest */

import { provideDependencies } from '../provide-deps';
import { readContext } from '../context';
import { settings } from '../settings';

jest.mock('../context');
jest.mock('../settings');

describe('provideDependencies', () => {
  const dependency = () => {};

  it('should return original dependencies if disabled', () => {
    settings.enabled = false;
    const Component = () => {};
    Component.dependencies = provideDependencies({ dependency });

    expect(Component.dependencies()).toEqual({ dependency });
    expect(readContext).not.toHaveBeenCalled();
  });

  it('should return dependencies from context if enabled', () => {
    settings.enabled = true;
    const newDepencency = jest.fn();
    const getDependencies = jest
      .fn()
      .mockReturnValue({ dependency: newDepencency });
    readContext.mockReturnValue({ getDependencies });
    const Component = () => {};
    Component.dependencies = provideDependencies({ dependency });

    expect(Component.dependencies()).toEqual({ dependency: newDepencency });
    expect(getDependencies).toHaveBeenCalledWith(Component);
  });
});

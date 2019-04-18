// @flow
import React, { Component } from 'react';
import { provideDependencies } from 'react-magnetic-di';

import { Label as LabelDI } from './label';
import { Input as InputDI } from './input';

type Props = {| title: string |};

export class Section extends Component<Props> {
  static dependencies = provideDependencies({
    Label: LabelDI,
    Input: InputDI,
  });

  render() {
    const { Label, Input } = Section.dependencies();
    const { title } = this.props;
    return (
      <div>
        <strong>{title}</strong>
        <Label />
        <Input />
      </div>
    );
  }
}

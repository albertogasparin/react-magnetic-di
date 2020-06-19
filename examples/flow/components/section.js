// @flow
import React, { Component } from 'react';
import { di } from 'react-magnetic-di';

import { Label } from './label';
import { Input } from './input';

export type Props = {| title: string |};

export class Section extends Component<Props> {
  render() {
    di(Label, Input);

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

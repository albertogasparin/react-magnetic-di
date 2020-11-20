// @flow
import React, { Component, type Node } from 'react';
import { di } from 'react-magnetic-di';

import { Label } from './label';
import { Input } from './input';

type Props = {|
  title: string,
|};

export class Section extends Component<Props> {
  render(): Node {
    di(Input, Label);

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

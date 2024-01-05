// @flow
import React, { Component, type Node } from 'react';

import { Label } from './label';
import { Input } from './input';

type Props = {|
  title: string,
|};

export class Section extends Component<Props> {
  render(): Node {
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

import * as React from 'react';

import { ExpoDosmonoBleViewProps } from './ExpoDosmonoBle.types';

export default function ExpoDosmonoBleView(props: ExpoDosmonoBleViewProps) {
  return (
    <div>
      <iframe
        style={{ flex: 1 }}
        src={props.url}
        onLoad={() => props.onLoad({ nativeEvent: { url: props.url } })}
      />
    </div>
  );
}

import { requireNativeView } from 'expo';
import * as React from 'react';

import { ExpoDosmonoBleViewProps } from './ExpoDosmonoBle.types';

const NativeView: React.ComponentType<ExpoDosmonoBleViewProps> =
  requireNativeView('ExpoDosmonoBle');

export default function ExpoDosmonoBleView(props: ExpoDosmonoBleViewProps) {
  return <NativeView {...props} />;
}

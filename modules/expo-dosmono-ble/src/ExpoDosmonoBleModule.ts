import { NativeModule, requireNativeModule } from 'expo';

import { ExpoDosmonoBleModuleEvents } from './ExpoDosmonoBle.types';

declare class ExpoDosmonoBleModule extends NativeModule<ExpoDosmonoBleModuleEvents> {
  PI: number;
  hello(): string;
  setValueAsync(value: string): Promise<void>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<ExpoDosmonoBleModule>('ExpoDosmonoBle');

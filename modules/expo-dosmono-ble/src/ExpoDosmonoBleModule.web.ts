import { registerWebModule, NativeModule } from 'expo';

import { ChangeEventPayload } from './ExpoDosmonoBle.types';

type ExpoDosmonoBleModuleEvents = {
  onChange: (params: ChangeEventPayload) => void;
}

class ExpoDosmonoBleModule extends NativeModule<ExpoDosmonoBleModuleEvents> {
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit('onChange', { value });
  }
  hello() {
    return 'Hello world! 👋';
  }
};

export default registerWebModule(ExpoDosmonoBleModule, 'ExpoDosmonoBleModule');

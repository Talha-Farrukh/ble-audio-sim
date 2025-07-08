import type { StyleProp, ViewStyle } from 'react-native';

export type OnLoadEventPayload = {
  url: string;
};

export type ExpoDosmonoBleModuleEvents = {
  onChange: (params: ChangeEventPayload) => void;
};

export type ChangeEventPayload = {
  value: string;
};

export type ExpoDosmonoBleViewProps = {
  url: string;
  onLoad: (event: { nativeEvent: OnLoadEventPayload }) => void;
  style?: StyleProp<ViewStyle>;
};

export interface DosmonoDevice {
  name: string;
  mac: string;
  rssi: number;
}

export interface ConnectionStatus {
  isConnected: boolean;
  connectedDevice: string | null;
}

export interface RecordingInfo {
  fileName: string;
  path: string;
  fileType: number;
}

export interface FileInfo {
  fileName: string;
  fileSize: number;
  createTime: string;
}

export interface FileTransferProgress {
  progress: number;
}

export interface DecodeProgress {
  progress: number;
}

export interface AuthResult {
  success: boolean;
  message: string;
}

export interface ConnectStatusEvent {
  mac: string;
  connected: boolean;
}

export interface ConnectSuccessEvent {
  mac: string;
}

export interface DevicesFoundEvent {
  devices: DosmonoDevice[];
}

export interface CmdReceiveEvent {
  command: string;
  flag: string;
}

export interface FileListEvent {
  files: FileInfo[] | string[];
}

export interface RecordErrorEvent {
  errorCode: number;
}

export type DosmonoCommand = 
  | 'ELECTRICITY'
  | 'MEMORY'
  | 'FILE_LIST'
  | 'DELETE_FILE'
  | 'SN_NUMBER'
  | 'RECORD_STATUS'
  | 'VERSION'
  | 'ACTIVE'
  | 'SYNC_TIME'
  | 'START_RECORD'
  | 'FINISH_RECORD'
  | 'STOP_RECORD'
  | 'STOP_TRANSFER';

export interface DosmonoBleEventMap {
  onAuthResult: AuthResult;
  onSearchStart: {};
  onDevicesFound: DevicesFoundEvent;
  onSearchStop: {};
  onSearchCancel: {};
  onConnectStatus: ConnectStatusEvent;
  onConnectSuccess: ConnectSuccessEvent;
  onConnectFail: {};
  onConnectTimeout: {};
  onRecordStart: RecordingInfo;
  onRecordStop: {};
  onRecordError: RecordErrorEvent;
  onFileTransferProgress: FileTransferProgress;
  onCmdReceive: CmdReceiveEvent;
  onFileList: FileListEvent;
  onDecodeProgress: DecodeProgress;
}

export interface ExpoDosmonoBleModule {
  initialize(accessKey: string, secretKey: string): Promise<boolean>;
  isBluetoothEnabled(): boolean;
  isGpsEnabled(): boolean;
  startDeviceSearch(): Promise<boolean>;
  stopDeviceSearch(): boolean;
  connectDevice(mac: string): Promise<string>;
  disconnectDevice(): boolean;
  sendCommand(command: string, flag: DosmonoCommand): Promise<boolean>;
  initializeRecording(): Promise<boolean>;
  startRecording(): Promise<boolean>;
  stopRecording(): boolean;
  setAudioStoragePath(path: string): boolean;
  transferFile(fileName: string, startPoint: number): Promise<boolean>;
  getConnectionStatus(): ConnectionStatus;
  release(): boolean;
}

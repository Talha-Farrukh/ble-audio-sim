import { useState, useEffect } from 'react';
import { Platform, Alert, PermissionsAndroid } from 'react-native';
import { BleManager } from 'react-native-ble-plx';

export const useBluetooth = () => {
  const [manager] = useState(() => new BleManager());
  const [isPermissionGranted, setIsPermissionGranted] = useState(false);
  const [bluetoothState, setBluetoothState] = useState<string>('Unknown');

  useEffect(() => {
    requestPermissions();
  }, []);

  useEffect(() => {
    if (isPermissionGranted) {
      const subscription = manager.onStateChange((state) => {
        setBluetoothState(state);
      }, true);
      
      return () => subscription.remove();
    }
  }, [isPermissionGranted, manager]);

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const apiLevel = Platform.Version as number;
        
        if (apiLevel >= 31) {
          const permissions = [
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          ];
          
          const granted = await PermissionsAndroid.requestMultiple(permissions);
          
          const allGranted = Object.values(granted).every(
            status => status === PermissionsAndroid.RESULTS.GRANTED
          );
          
          if (allGranted) {
            setIsPermissionGranted(true);
            return true;
          } else {
            Alert.alert('Permissions Required', 'Bluetooth and location permissions are required for smartwatch control.');
            return false;
          }
        } else {
          const granted = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
          ]);
          
          if (granted['android.permission.ACCESS_FINE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED) {
            setIsPermissionGranted(true);
            return true;
          } else {
            Alert.alert('Permission Required', 'Location permission is required for Bluetooth scanning.');
            return false;
          }
        }
      } catch (err) {
        console.error('Permission request error:', err);
        return false;
      }
    } else {
      setIsPermissionGranted(true);
      return true;
    }
  };

  return {
    manager,
    isPermissionGranted,
    bluetoothState,
    requestPermissions,
  };
}; 
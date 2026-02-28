import { Text } from 'react-native';
import Constants from 'expo-constants';

export default function AppVersion() {
  return (
    <Text>Version {Constants.expoConfig?.version}</Text>
  );
}
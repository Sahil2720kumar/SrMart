import { memo, useMemo, useRef, useState} from 'react';
import { SafeAreaView, Text, TouchableOpacity, View } from 'react-native';

export const Container = memo(({ children }: { children: React.ReactNode }) => {
  console.log("Rendering Container"); // Debugging log
  
  return <SafeAreaView className={styles.container}>
    {children}</SafeAreaView>;
});

const styles = {
  container: 'flex flex-1 m-6',
};



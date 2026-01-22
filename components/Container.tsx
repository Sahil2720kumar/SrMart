import { memo, useMemo, useRef, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';


export const Container = memo(({ children }: { children: React.ReactNode }) => {
  console.log("Rendering Container"); // Debugging log

  return (
    <View className={styles.container}>
      <ScrollView>
        {children}
      </ScrollView>
    </View>
  )
});

const styles = {
  container: 'flex flex-1 m-6',
};



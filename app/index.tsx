import { Stack, Link } from 'expo-router';

import { Text, TouchableOpacity, View } from 'react-native';

import { Container } from '@/components/Container';


export default function Home() {
  
  return (
    <View className='flex flex-1 bg-white'>
      <Stack.Screen options={{ title: 'Home' }} />
      <Container> 
        <Text className='text-2xl font-bold'>Home</Text>
        <Link href='/login' className='text-blue-500'>Login</Link>
       </Container>
    </View>
  );
}

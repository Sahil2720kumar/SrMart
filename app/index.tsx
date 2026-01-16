import { Stack, Link } from 'expo-router';

import { Text, TouchableOpacity, View } from 'react-native';

import { Container } from '@/components/Container';


export default function Home() {

  return (
    <View className='flex flex-1 bg-white'>
      <Stack.Screen options={{ title: 'Home' }} />
      <Container>
        <Text className='text-2xl font-bold'>Home</Text>
        <Link href='/auth/login' className='text-blue-500'>Login</Link>
        <Link href='/auth/sign-up' className='text-blue-500'>Sign Up</Link>
        <Link href='/auth/otp-verify' className='text-blue-500'>otp verification</Link>
        <Link href='/auth/forgot-password' className='text-blue-500'>forgot-password</Link>
        <Link href='/auth/reset-password' className='text-blue-500'>reset-password</Link>

        <Text>Customers</Text>
        <Link href={'/(tabs)/customer'} className='text-blue-500'>Customer Home</Link>
        <Link href={'/(tabs)/customer/category/'} className='text-blue-500'>Customer Category</Link>
        <Link href={'/(tabs)/customer/category/250'} className='text-blue-500'>Customer 1 Category</Link>
        <Link href={'/(tabs)/customer/offers/'} className='text-blue-500'>Offers </Link>
        <Link href={'/(tabs)/customer/offers/1'} className='text-blue-500'>Offers 1</Link>
        <Link href={'/(tabs)/customer/search/'} className='text-blue-500'>Search</Link>
        <Link href={'/(tabs)/customer/search/search-results'} className='text-blue-500'>Search Results</Link>
        <Link href={'/(tabs)/customer/products/'} className='text-blue-500'>Products</Link>
        <Link href={'/(tabs)/customer/products/1'} className='text-blue-500'>Specific Product</Link>
      </Container>
    </View>
  );
}

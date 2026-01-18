import { Stack, Link, router } from 'expo-router';

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
        <Link href={'/(tabs)/customer/account'} className='text-blue-500'>Customer Account</Link>
        <Link href={'/(tabs)/customer/category/'} className='text-blue-500'>Customer Category</Link>
        <Link href={'/(tabs)/customer/category/250'} className='text-blue-500'>Customer 1 Category</Link>
        <Link href={'/(tabs)/customer/offers/'} className='text-blue-500'>Offers </Link>
        <Link href={'/(tabs)/customer/offers/1'} className='text-blue-500'>Offers 1</Link>
        <Link href={'/(tabs)/customer/search'} className='text-blue-500'>Search</Link>
        <Link href={'/(tabs)/customer/search/search-results'} className='text-blue-500'>Search Results</Link>
        <Link href={'/(tabs)/customer/products/'} className='text-blue-500'>Products</Link>
        <Link href={'/(tabs)/customer/products/1'} className='text-blue-500'>Specific Product</Link>
        <Link href={"/(tabs)/customer/order/cart"} className='text-blue-500'>Cart</Link>
        <Link href={"/(tabs)/customer/order/checkout"} className='text-blue-500'>checkout</Link>
        <Link href={"/(tabs)/customer/order/payment"} className='text-blue-500'>Payment</Link>
        <Link href={"/(tabs)/customer/order/orders"} className='text-blue-500'>My Orders</Link>
        <Link href={"/(tabs)/customer/order/orders/1"} className='text-blue-500'>Order Specific</Link>

        <Text>Vendor </Text>
        <Link href={"/vendor/(tabs)/dashboard"} className='text-blue-500'>Vendor Dashboard</Link>
        <Link href={"/vendor/(tabs)/orders"} className='text-blue-500'>Vendor Orders</Link>
        <Link href={"/vendor/order/1"} className='text-blue-500'>Vendor Orders Details</Link>
        <Link href={"/vendor/(tabs)/products"} className='text-blue-500'>Vendor Products</Link>
        <Link href={"/vendor/product/1"} className='text-blue-500'>Vendor Products Details</Link>
        <Link href={"/vendor/product/add"} className='text-blue-500'>Vendor Product Add</Link>
        <Link href={"/vendor/product/edit/1"} className='text-blue-500'>Vendor Product Edit</Link>
        <Link href={"/vendor/earnings"} className='text-blue-500'>Vendor Earnings</Link>
        <Link href={"/vendor/inventory"} className='text-blue-500'>Vendor inventory</Link>
      </Container>
    </View>
  );
}

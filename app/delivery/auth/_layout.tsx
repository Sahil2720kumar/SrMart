import { View, Text } from 'react-native'
import React from 'react'
import { Redirect, Slot } from 'expo-router'
import { useAuthStore } from '@/store/authStore'
import { useProfileStore } from '@/store/profileStore'

const DeliveryAuthLayout = () => {
  const {session}=useAuthStore()
  const {getUserRole}=useProfileStore()
  if(session){
    if (getUserRole()==="customer") {
      return <Redirect href={"/customer"}/>
    }else if(getUserRole()==="vendor") {
      return <Redirect href={"/vendor/dashboard"}/>
    }else if(getUserRole()==="delivery_boy") {
      return <Redirect href={"/delivery/home"}/>
    }
  }
  return (
   <Slot/>
  )
}

export default DeliveryAuthLayout
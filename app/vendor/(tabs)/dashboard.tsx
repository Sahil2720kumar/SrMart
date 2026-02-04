import React, { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons, Ionicons, MaterialIcons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient';
import QuickInfoBox from '@/components/QuickInfoBox';
import VendorStatCard from '@/components/VendorStatCard';
import VendorOrderCard from '@/components/VendorOrderCard';
import AlertItem from '@/components/AlertItem';
import QuickActionButton from '@/components/QuickActionButton';
import { router } from 'expo-router';


const { width } = Dimensions.get('window')

// Main Dashboard Component
export default function VendorDashboard() {
  const [isOpen, setIsOpen] = useState(true)
  
  // Verification status - you can fetch this from your backend
  const [verificationStatus, setVerificationStatus] = useState({
    isAdminVerified: true,  // Change to false to see unverified state
    isKycVerified: true,     // Change to false to see unverified state
  })

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1 bg-gray-50"
      >
        {/* HEADER SECTION */}
        <View className="bg-white border-b border-emerald-100 shadow-sm  ">
          <View className="px-4 py-4">
            {/* Shop Name & Toggle */}
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center gap-3">
                <View className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center shadow-md">
                  <Ionicons name="storefront" size={24} color="white" />
                </View>
                <View>
                  <View className="flex-row items-center gap-2 ">
                    <Text className="text-2xl font-bold text-gray-900">Green Mart</Text>
                    {verificationStatus.isAdminVerified && (
                      <View className=" rounded-full p-1 ">
                       <MaterialIcons  name="verified" size={24} color="#10b981" />
                      </View>
                    )}
                  </View>
                  <Text className="text-xs text-gray-500">Vendor Dashboard</Text>
                </View>
              </View>

              {/* Open/Close Toggle */}
              <TouchableOpacity
                onPress={() => setIsOpen(!isOpen)}
                className={`flex-row items-center gap-2 px-4 py-2 rounded-lg border ${isOpen
                  ? 'bg-emerald-50 border-emerald-200'
                  : 'bg-red-50 border-red-200'
                  }`}
              >
                <View className={`w-2 h-2 rounded-full ${isOpen ? 'bg-emerald-500' : 'bg-red-500'}`} />
                <Text className={`text-sm font-semibold ${isOpen ? 'text-emerald-600' : 'text-red-600'}`}>
                  {isOpen ? 'Open' : 'Closed'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Quick Info Bar */}
            <View className="flex-row gap-2">
              <QuickInfoBox
                icon={<Ionicons name="time-outline" size={16} color="#059669" />}
                label="Hours Today"
                value="9:00 - 22:00"
              />
              <QuickInfoBox
                icon={<MaterialCommunityIcons name="map-marker-radius" size={16} color="#059669" />}
                label="Delivery"
                value="5 km"
              />
              <QuickInfoBox
                icon={<Ionicons name="star" size={16} color="#f59e0b" />}
                label="Rating"
                value="4.8"
              />
            </View>
          </View>
        </View>

        {/* VERIFICATION STATUS BANNER */}
        {(!verificationStatus.isAdminVerified || !verificationStatus.isKycVerified) && (
          <View className="px-4 pt-4">
            <View className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <View className="flex-row items-start gap-3">
                <View className="bg-amber-100 rounded-full p-2">
                  <Ionicons name="warning" size={20} color="#f59e0b" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-amber-900 mb-1">
                    Action Required
                  </Text>
                  <Text className="text-xs text-amber-700 mb-3">
                    Complete verification to access all features
                  </Text>
                  <View className="gap-2">
                    {!verificationStatus.isAdminVerified && (
                      <View className="flex-row items-center gap-2">
                        <Ionicons name="close-circle" size={16} color="#dc2626" />
                        <Text className="text-xs text-gray-700">Admin verification pending</Text>
                      </View>
                    )}
                    {!verificationStatus.isKycVerified && (
                      <View className="flex-row items-center gap-2">
                        <Ionicons name="close-circle" size={16} color="#dc2626" />
                        <Text className="text-xs text-gray-700">KYC verification pending</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* VERIFICATION STATUS CARDS */}
        <View className="px-4 pt-4">
          <View className="flex-row gap-3">
            {/* Admin Verification */}
            <View className={`flex-1 rounded-xl p-4 border ${
              verificationStatus.isAdminVerified 
                ? 'bg-blue-50 border-blue-200' 
                : 'bg-gray-50 border-gray-200'
            }`}>
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center gap-2">
                  <Ionicons 
                    name="shield-checkmark" 
                    size={20} 
                    color={verificationStatus.isAdminVerified ? '#3b82f6' : '#9ca3af'} 
                  />
                  <Text className={`text-xs font-semibold ${
                    verificationStatus.isAdminVerified ? 'text-blue-900' : 'text-gray-600'
                  }`}>
                    Admin
                  </Text>
                </View>
                {verificationStatus.isAdminVerified ? (
                  <View className="bg-blue-500 rounded-full px-2 py-0.5">
                    <Text className="text-white text-[10px] font-bold">Verified</Text>
                  </View>
                ) : (
                  <View className="bg-gray-400 rounded-full px-2 py-0.5">
                    <Text className="text-white text-[10px] font-bold">Pending</Text>
                  </View>
                )}
              </View>
              <Text className={`text-[10px] ${
                verificationStatus.isAdminVerified ? 'text-blue-700' : 'text-gray-500'
              }`}>
                {verificationStatus.isAdminVerified 
                  ? 'Your shop is verified' 
                  : 'Awaiting admin approval'}
              </Text>
            </View>

            {/* KYC Verification */}
            <View className={`flex-1 rounded-xl p-4 border ${
              verificationStatus.isKycVerified 
                ? 'bg-green-50 border-green-200' 
                : 'bg-gray-50 border-gray-200'
            }`}>
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center gap-2">
                  <Ionicons 
                    name="document-text" 
                    size={20} 
                    color={verificationStatus.isKycVerified ? '#10b981' : '#9ca3af'} 
                  />
                  <Text className={`text-xs font-semibold ${
                    verificationStatus.isKycVerified ? 'text-green-900' : 'text-gray-600'
                  }`}>
                    KYC
                  </Text>
                </View>
                {verificationStatus.isKycVerified ? (
                  <View className="bg-green-500 rounded-full px-2 py-0.5">
                    <Text className="text-white text-[10px] font-bold">Verified</Text>
                  </View>
                ) : (
                  <View className="bg-gray-400 rounded-full px-2 py-0.5">
                    <Text className="text-white text-[10px] font-bold">Pending</Text>
                  </View>
                )}
              </View>
              <Text className={`text-[10px] ${
                verificationStatus.isKycVerified ? 'text-green-700' : 'text-gray-500'
              }`}>
                {verificationStatus.isKycVerified 
                  ? 'Documents approved' 
                  : 'Submit KYC documents'}
              </Text>
            </View>
          </View>
        </View>

        {/* ORDER SUMMARY STATS */}
        <View className="px-4 py-6">
          <View className="flex-row flex-wrap gap-3 justify-between">
            <VendorStatCard
              width={width}
              label="Total Orders"
              value="42"
              icon={<Ionicons name="receipt-outline" size={28} color="#059669" />}
              bgColor="bg-emerald-50"
            />
            <VendorStatCard
              width={width}
              label="Active Orders"
              value="8"
              icon={<Ionicons name="flash" size={28} color="#f59e0b" />}
              bgColor="bg-amber-50"
            />
            <VendorStatCard
              width={width}
              label="Completed"
              value="34"
              icon={<Ionicons name="checkmark-circle-outline" size={28} color="#10b981" />}
              bgColor="bg-green-50"
            />
            <VendorStatCard
              width={width}
              label="Cancelled"
              value="2"
              icon={<Ionicons name="close-circle-outline" size={28} color="#ef4444" />}
              bgColor="bg-red-50"
            />
          </View>
        </View>

        {/* NEW/ACTIVE ORDERS SECTION */}
        <View className="px-4 pb-6">
          <View className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Header */}
            <View className="bg-gradient-to-r from-emerald-50 to-teal-50 px-6 py-4 border-b border-gray-200">
              <View className="flex-row items-center gap-2">
                <Ionicons name="list" size={20} color="#047857" />
                <Text className="text-lg font-bold text-gray-900">
                  Active Orders
                </Text>
                <View className="bg-emerald-500 rounded-full px-2 py-0.5 ml-2">
                  <Text className="text-white text-xs font-bold">4</Text>
                </View>
              </View>
            </View>

            {/* Orders List */}
            {/* <View>
              <VendorOrderCard
                orderId="#ORD-2024-001"
                customerName="Raj Kumar"
                items="5 items"
                time="15 mins ago"
                total="₹450"
                status="Preparing"
                priority="high"
              />
              <VendorOrderCard
                orderId="#ORD-2024-002"
                customerName="Priya Singh"
                items="3 items"
                time="8 mins ago"
                total="₹280"
                status="Ready for Pickup"
                priority="high"
              />
              <VendorOrderCard
                orderId="#ORD-2024-003"
                customerName="Amit Patel"
                items="7 items"
                time="2 mins ago"
                total="₹620"
                status="Preparing"
                priority="normal"
              />
              <VendorOrderCard
                orderId="#ORD-2024-004"
                customerName="Deepa Sharma"
                items="4 items"
                time="1 min ago"
                total="₹380"
                status="New Order"
                priority="urgent"
              />
            </View> */}

            {/* Footer */}
            <TouchableOpacity onPress={()=>router.push("/vendor/(tabs)/orders")} className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex-row items-center justify-center gap-2">
              <Text className="text-emerald-600 font-medium text-sm">
                View All Orders
              </Text>
              <Feather name="arrow-right" size={14} color="#059669" />
            </TouchableOpacity>
          </View>
        </View>

        {/* EARNINGS SNAPSHOT */}
        <View className="px-4 pb-6 ">
          <LinearGradient

            colors={['#10b981', '#0d9488']}
            className="rounded-2xl p-6 shadow-lg"
            style={{ borderRadius: 16 }}
          >

            <View className="flex-row items-start justify-between mb-4">
              <Text className="text-sm font-semibold text-white opacity-90">
                Today's Earnings
              </Text>
              <View className="bg-white/20 rounded-full p-2">
                <Ionicons name="trending-up" size={20} color="white" />
              </View>
            </View>

            <Text className="text-4xl font-bold text-white mb-2">₹8,450</Text>
            <Text className="text-sm text-white opacity-75 mb-4">
              42 orders completed
            </Text>

            <View className="border-t border-white/20 pt-4 mt-4">
              <Text className="text-xs text-white opacity-75 mb-1">Weekly Total</Text>
              <Text className="text-2xl font-bold text-white">₹52,340</Text>
            </View>
          </LinearGradient>
        </View>

        {/* LOW STOCK ALERTS */}
        <View className="px-4 pb-6">
          <View className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Header */}
            <View className="bg-red-50 px-6 py-4 border-b border-red-200">
              <View className="flex-row items-center gap-2">
                <Ionicons name="alert-circle" size={20} color="#dc2626" />
                <Text className="text-lg font-bold text-red-900">
                  Low Stock Alert
                </Text>
                <View className="bg-red-500 rounded-full px-2 py-0.5 ml-2">
                  <Text className="text-white text-xs font-bold">3</Text>
                </View>
              </View>
            </View>

            {/* Alerts */}
            <View className="p-6 gap-3">
              <AlertItem product="Tomatoes" stock="12 kg" status="Critical" />
              <AlertItem product="Lettuce" stock="8 heads" status="Warning" />
              <AlertItem product="Onions" stock="25 kg" status="Warning" />
            </View>

            {/* Footer */}
            <TouchableOpacity onPress={()=>router.push("/vendor/inventory")} className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex-row items-center justify-center gap-2">
              <Text className="text-red-600 font-medium text-sm">
                Manage Inventory
              </Text>
              <Feather name="arrow-right" size={14} color="#dc2626" />
            </TouchableOpacity>
          </View>
        </View>

        {/* QUICK ACTIONS */}
        <View  className="px-4 pb-10">
          <View className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <Text className="text-lg font-bold text-gray-900 mb-4">Quick Actions</Text>

            <View className="flex-row flex-wrap gap-3 justify-between">
              <QuickActionButton
                icon={<Ionicons name="add-circle-outline" size={24} color="#059669" />}
                label="Add Product"
                route='/vendor/product/add'
              />
              <QuickActionButton
                icon={<MaterialCommunityIcons name="package-variant" size={24} color="#059669" />}
                label="Inventory"
                route='/vendor/inventory'
              />
              {/* <QuickActionButton
                icon={<Ionicons name="bar-chart-outline" size={24} color="#059669" />}
                label="Analytics"
              /> */}
              <QuickActionButton
                icon={<Ionicons name="time-outline" size={24} color="#059669" />}
                label="Shop Hours"
                route='/vendor/(tabs)/profile/edit'
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
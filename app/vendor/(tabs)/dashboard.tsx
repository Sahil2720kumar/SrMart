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
import { Feather, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient';
import QuickInfoBox from '@/components/QuickInfoBox';
import VendorStatCard from '@/components/VendorStatCard';
import VendorOrderCard from '@/components/VendorOrderCard';
import AlertItem from '@/components/AlertItem';
import QuickActionButton from '@/components/QuickActionButton';


const { width } = Dimensions.get('window')

// Main Dashboard Component
export default function VendorDashboard() {
  const [isOpen, setIsOpen] = useState(true)

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
                  <Text className="text-2xl font-bold text-gray-900">Green Mart</Text>
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
            <View>
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
            </View>

            {/* Footer */}
            <TouchableOpacity className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex-row items-center justify-center gap-2">
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
            <TouchableOpacity className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex-row items-center justify-center gap-2">
              <Text className="text-red-600 font-medium text-sm">
                Manage Inventory
              </Text>
              <Feather name="arrow-right" size={14} color="#dc2626" />
            </TouchableOpacity>
          </View>
        </View>

        {/* QUICK ACTIONS */}
        <View className="px-4 pb-10">
          <View className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <Text className="text-lg font-bold text-gray-900 mb-4">Quick Actions</Text>

            <View className="flex-row flex-wrap gap-3 justify-between">
              <QuickActionButton
                icon={<Ionicons name="add-circle-outline" size={24} color="#059669" />}
                label="Add Product"
              />
              <QuickActionButton
                icon={<MaterialCommunityIcons name="package-variant" size={24} color="#059669" />}
                label="Inventory"
              />
              <QuickActionButton
                icon={<Ionicons name="bar-chart-outline" size={24} color="#059669" />}
                label="Analytics"
              />
              <QuickActionButton
                icon={<Ionicons name="time-outline" size={24} color="#059669" />}
                label="Shop Hours"
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}









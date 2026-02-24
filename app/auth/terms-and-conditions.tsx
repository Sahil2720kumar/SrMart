import { useState } from "react"
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { router, Stack } from "expo-router"
import Svg, { Path } from "react-native-svg"
import { Feather } from "@expo/vector-icons"

// Terms & Conditions Screen
export default function TermsAndConditionsScreen() {
  const lastUpdated = '15 January 2025';
  const handleGoBack = () => {
    router.back();
  };
  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* <Stack.Screen options={{ headerShown: false }} /> */}

      {/* Header */}
      <View className="bg-white px-4  border-b border-gray-100">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-3 flex-1">
            <TouchableOpacity onPress={handleGoBack} className="p-2 -ml-2">
              <Feather name="chevron-left" size={24} color="#1f2937" />
            </TouchableOpacity>
            <View className="flex-1">
              <Text className="text-2xl font-bold text-gray-900">Terms & Conditions</Text>
              <Text className="text-xs text-gray-500 mt-1">Last Updated: {lastUpdated}</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        {/* <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={handleDownload}
            className="flex-1 bg-emerald-50 border border-emerald-200 rounded-lg py-2 items-center justify-center active:opacity-70"
          >
            <View className="flex-row items-center gap-1">
              <Feather name="download" size={16} color="#059669" />
              <Text className="text-emerald-700 font-semibold text-xs">Download</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleShare}
            className="flex-1 bg-blue-50 border border-blue-200 rounded-lg py-2 items-center justify-center active:opacity-70"
          >
            <View className="flex-row items-center gap-1">
              <Feather name="share-2" size={16} color="#2563eb" />
              <Text className="text-blue-700 font-semibold text-xs">Share</Text>
            </View>
          </TouchableOpacity>
        </View> */}
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View className="px-6">
          {/* Last Updated */}
          <Text className="text-gray-600 text-sm mb-6">
            Last update: 15/01/2026
          </Text>

          {/* Introduction */}
          <Text className="text-gray-700 text-base leading-6 mb-6">
            Please read these terms of service carefully before using our app operated by us.
          </Text>

          {/* Section 1 */}
          <Text className="text-green-600 text-lg font-bold mb-3">
            1. Acceptance of Terms
          </Text>
          <Text className="text-gray-700 text-base leading-6 mb-6">
            By accessing and using the SrMart mobile application, you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to abide by the above, please do not use this service.
          </Text>

          {/* Section 2 */}
          <Text className="text-green-600 text-lg font-bold mb-3">
            2. Use of Service
          </Text>
          <Text className="text-gray-700 text-base leading-6 mb-6">
            SrMart provides an online grocery delivery platform that allows users to browse, select, and purchase grocery items for delivery. You must be at least 18 years old to use our services. You are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account.
          </Text>

          {/* Section 3 */}
          <Text className="text-green-600 text-lg font-bold mb-3">
            3. Order Placement and Acceptance
          </Text>
          <Text className="text-gray-700 text-base leading-6 mb-6">
            When you place an order through SrMart, you are making an offer to purchase the products at the prices displayed. We reserve the right to accept or reject your order for any reason. Orders are subject to product availability and acceptance by our delivery partners. We will notify you if an item is out of stock or if there are any issues with your order.
          </Text>

          {/* Section 4 */}
          <Text className="text-green-600 text-lg font-bold mb-3">
            4. Pricing and Payment
          </Text>
          <Text className="text-gray-700 text-base leading-6 mb-6">
            All prices are displayed in your local currency and include applicable taxes unless otherwise stated. We reserve the right to modify prices at any time without prior notice. Payment must be made through approved payment methods. You agree to provide accurate payment information and authorize us to charge the total amount of your order.
          </Text>

          {/* Section 5 */}
          <Text className="text-green-600 text-lg font-bold mb-3">
            5. Delivery
          </Text>
          <Text className="text-gray-700 text-base leading-6 mb-6">
            We strive to deliver your orders within the estimated delivery time. However, delivery times may vary due to factors beyond our control such as weather conditions, traffic, or high demand. Delivery is only available to addresses within our service areas. You must provide accurate delivery information and be available to receive your order.
          </Text>

          {/* Section 6 */}
          <Text className="text-green-600 text-lg font-bold mb-3">
            6. Cancellations and Refunds
          </Text>
          <Text className="text-gray-700 text-base leading-6 mb-6">
            You may cancel your order before it is confirmed by our system. Once an order is confirmed and being prepared, cancellation may not be possible. Refunds will be processed for canceled orders, damaged items, or incorrect deliveries within 7-10 business days. Perishable items are non-refundable unless they are damaged or defective.
          </Text>

          {/* Section 7 */}
          <Text className="text-green-600 text-lg font-bold mb-3">
            7. Product Quality and Returns
          </Text>
          <Text className="text-gray-700 text-base leading-6 mb-6">
            We take great care in selecting and delivering fresh, quality products. If you receive damaged, expired, or incorrect items, please contact our customer support within 24 hours of delivery. We reserve the right to verify claims and may request photographic evidence.
          </Text>

          {/* Section 8 */}
          <Text className="text-green-600 text-lg font-bold mb-3">
            8. User Conduct
          </Text>
          <Text className="text-gray-700 text-base leading-6 mb-6">
            You agree not to misuse the SrMart service, including but not limited to: providing false information, placing fraudulent orders, harassing delivery personnel, or attempting to manipulate pricing or promotional offers. We reserve the right to suspend or terminate accounts that violate these terms.
          </Text>

          {/* Section 9 */}
          <Text className="text-green-600 text-lg font-bold mb-3">
            9. Intellectual Property
          </Text>
          <Text className="text-gray-700 text-base leading-6 mb-6">
            All content on the SrMart application, including logos, text, graphics, and software, is the property of SrMart and is protected by intellectual property laws. You may not reproduce, distribute, or create derivative works without our express written permission.
          </Text>

          {/* Section 10 */}
          <Text className="text-green-600 text-lg font-bold mb-3">
            10. Limitation of Liability
          </Text>
          <Text className="text-gray-700 text-base leading-6 mb-6">
            SrMart shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the service. Our total liability shall not exceed the amount paid by you for the specific order in question.
          </Text>

          {/* Section 11 */}
          <Text className="text-green-600 text-lg font-bold mb-3">
            11. Changes to Terms
          </Text>
          <Text className="text-gray-700 text-base leading-6 mb-6">
            We reserve the right to modify these terms at any time. We will notify users of significant changes through the app or via email. Continued use of the service after changes constitutes acceptance of the modified terms.
          </Text>

          {/* Section 12 */}
          <Text className="text-green-600 text-lg font-bold mb-3">
            12. Contact Information
          </Text>
          <Text className="text-gray-700 text-base leading-6 mb-6">
            If you have any questions about these Terms & Conditions, please contact us at:
            {'\n\n'}
            Email: support@srmart.com
            {'\n'}
            Phone: 1-800-SRMART
            {'\n'}
            Address: SrMart Headquarters, [City, Country]
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
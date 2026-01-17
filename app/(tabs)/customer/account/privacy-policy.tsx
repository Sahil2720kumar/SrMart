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




// Privacy Policy Screen
export default function PrivacyPolicyScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* <Stack.Screen options={{ headerShown: false }} /> */}
      
      {/* Header */}

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
            At SrMart, we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, and safeguard your data when you use our grocery delivery service.
          </Text>

          {/* Section 1 */}
          <Text className="text-green-600 text-lg font-bold mb-3">
            1. Information We Collect
          </Text>
          <Text className="text-gray-700 text-base leading-6 mb-3">
            We collect the following types of information:
          </Text>
          <Text className="text-gray-700 text-base leading-6 mb-2">
            • <Text className="font-semibold">Personal Information:</Text> Name, email address, phone number, delivery address, and payment information.
          </Text>
          <Text className="text-gray-700 text-base leading-6 mb-2">
            • <Text className="font-semibold">Order Information:</Text> Details of products purchased, order history, and preferences.
          </Text>
          <Text className="text-gray-700 text-base leading-6 mb-2">
            • <Text className="font-semibold">Device Information:</Text> Device type, operating system, unique device identifiers, and mobile network information.
          </Text>
          <Text className="text-gray-700 text-base leading-6 mb-2">
            • <Text className="font-semibold">Location Data:</Text> GPS location for delivery purposes (with your permission).
          </Text>
          <Text className="text-gray-700 text-base leading-6 mb-6">
            • <Text className="font-semibold">Usage Data:</Text> How you interact with our app, including pages viewed and features used.
          </Text>

          {/* Section 2 */}
          <Text className="text-green-600 text-lg font-bold mb-3">
            2. How We Use Your Information
          </Text>
          <Text className="text-gray-700 text-base leading-6 mb-3">
            We use your information for the following purposes:
          </Text>
          <Text className="text-gray-700 text-base leading-6 mb-2">
            • To process and deliver your grocery orders
          </Text>
          <Text className="text-gray-700 text-base leading-6 mb-2">
            • To communicate with you about your orders and account
          </Text>
          <Text className="text-gray-700 text-base leading-6 mb-2">
            • To improve our services and personalize your experience
          </Text>
          <Text className="text-gray-700 text-base leading-6 mb-2">
            • To send promotional offers and updates (with your consent)
          </Text>
          <Text className="text-gray-700 text-base leading-6 mb-2">
            • To prevent fraud and ensure security
          </Text>
          <Text className="text-gray-700 text-base leading-6 mb-6">
            • To comply with legal obligations
          </Text>

          {/* Section 3 */}
          <Text className="text-green-600 text-lg font-bold mb-3">
            3. Information Sharing
          </Text>
          <Text className="text-gray-700 text-base leading-6 mb-6">
            We do not sell your personal information to third parties. We may share your information with:
            {'\n\n'}
            • <Text className="font-semibold">Delivery Partners:</Text> To facilitate order delivery
            {'\n'}
            • <Text className="font-semibold">Payment Processors:</Text> To process transactions securely
            {'\n'}
            • <Text className="font-semibold">Service Providers:</Text> Who assist us in operating our business
            {'\n'}
            • <Text className="font-semibold">Legal Authorities:</Text> When required by law or to protect our rights
          </Text>

          {/* Section 4 */}
          <Text className="text-green-600 text-lg font-bold mb-3">
            4. Data Security
          </Text>
          <Text className="text-gray-700 text-base leading-6 mb-6">
            We implement industry-standard security measures to protect your personal information from unauthorized access, disclosure, alteration, or destruction. This includes encryption of sensitive data, secure servers, and regular security audits. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
          </Text>

          {/* Section 5 */}
          <Text className="text-green-600 text-lg font-bold mb-3">
            5. Your Rights and Choices
          </Text>
          <Text className="text-gray-700 text-base leading-6 mb-3">
            You have the following rights regarding your personal information:
          </Text>
          <Text className="text-gray-700 text-base leading-6 mb-2">
            • <Text className="font-semibold">Access:</Text> Request a copy of the personal information we hold about you
          </Text>
          <Text className="text-gray-700 text-base leading-6 mb-2">
            • <Text className="font-semibold">Correction:</Text> Update or correct inaccurate information
          </Text>
          <Text className="text-gray-700 text-base leading-6 mb-2">
            • <Text className="font-semibold">Deletion:</Text> Request deletion of your personal information
          </Text>
          <Text className="text-gray-700 text-base leading-6 mb-2">
            • <Text className="font-semibold">Opt-out:</Text> Unsubscribe from marketing communications
          </Text>
          <Text className="text-gray-700 text-base leading-6 mb-6">
            • <Text className="font-semibold">Data Portability:</Text> Receive your data in a structured, commonly used format
          </Text>

          {/* Section 6 */}
          <Text className="text-green-600 text-lg font-bold mb-3">
            6. Cookies and Tracking Technologies
          </Text>
          <Text className="text-gray-700 text-base leading-6 mb-6">
            We use cookies and similar tracking technologies to enhance your experience, analyze usage patterns, and deliver personalized content. You can manage cookie preferences through your device settings, but disabling cookies may affect app functionality.
          </Text>

          {/* Section 7 */}
          <Text className="text-green-600 text-lg font-bold mb-3">
            7. Children's Privacy
          </Text>
          <Text className="text-gray-700 text-base leading-6 mb-6">
            SrMart is not intended for use by individuals under the age of 18. We do not knowingly collect personal information from children. If we become aware that we have collected information from a child, we will take steps to delete it promptly.
          </Text>

          {/* Section 8 */}
          <Text className="text-green-600 text-lg font-bold mb-3">
            8. Data Retention
          </Text>
          <Text className="text-gray-700 text-base leading-6 mb-6">
            We retain your personal information for as long as necessary to provide our services, comply with legal obligations, resolve disputes, and enforce our agreements. When information is no longer needed, we will securely delete or anonymize it.
          </Text>

          {/* Section 9 */}
          <Text className="text-green-600 text-lg font-bold mb-3">
            9. International Data Transfers
          </Text>
          <Text className="text-gray-700 text-base leading-6 mb-6">
            Your information may be transferred to and processed in countries other than your own. We ensure that appropriate safeguards are in place to protect your data in accordance with this Privacy Policy and applicable laws.
          </Text>

          {/* Section 10 */}
          <Text className="text-green-600 text-lg font-bold mb-3">
            10. Changes to Privacy Policy
          </Text>
          <Text className="text-gray-700 text-base leading-6 mb-6">
            We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. We will notify you of significant changes through the app or via email. Your continued use of SrMart after changes indicates your acceptance of the updated policy.
          </Text>

          {/* Section 11 */}
          <Text className="text-green-600 text-lg font-bold mb-3">
            11. Contact Us
          </Text>
          <Text className="text-gray-700 text-base leading-6 mb-6">
            If you have questions, concerns, or requests regarding this Privacy Policy or your personal information, please contact us at:
            {'\n\n'}
            Email: privacy@srmart.com
            {'\n'}
            Phone: 1-800-SRMART
            {'\n'}
            Address: SrMart Privacy Office, [City, Country]
            {'\n\n'}
            We will respond to your inquiry within 30 days.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
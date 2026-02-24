import React from 'react';
import {  ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TermsConditionsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-[#4f46e5]">
      {/* Header */}
      <View className="px-4 py-4">
        <View className="flex-row items-center mb-2">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Feather name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-white text-xl font-bold">Terms & Conditions</Text>
            <Text className="text-indigo-200 text-sm mt-1">
              Please read carefully before using the app
            </Text>
          </View>
        </View>
      </View>

      {/* Content Container */}
      <View className="flex-1 bg-white rounded-t-3xl">
        <ScrollView className="flex-1 px-5 py-6" showsVerticalScrollIndicator={false}>
          
          {/* 1. Acceptance of Terms */}
          <View className="mb-6">
            <View className="flex-row items-center mb-3">
              <Feather name="check-circle" size={20} color="#4f46e5" />
              <Text className="text-[#4f46e5] text-lg font-bold ml-2">
                1. Acceptance of Terms
              </Text>
            </View>
            <Text className="text-gray-700 leading-6 mb-3">
              By downloading, installing, or using this delivery partner application, you agree 
              to be bound by these Terms and Conditions. These terms constitute a legally binding 
              agreement between you and our platform.
            </Text>
            <Text className="text-gray-700 leading-6">
              If you do not agree with any part of these terms, you must not use this app or 
              our services. Continued use of the app signifies your acceptance of these terms 
              and any future modifications.
            </Text>
          </View>

          {/* 2. Eligibility */}
          <View className="mb-6">
            <View className="flex-row items-center mb-3">
              <Feather name="user-check" size={20} color="#4f46e5" />
              <Text className="text-[#4f46e5] text-lg font-bold ml-2">
                2. Eligibility
              </Text>
            </View>
            <Text className="text-gray-700 leading-6 mb-3">
              To become a delivery partner, you must meet the following eligibility criteria:
            </Text>
            
            <View className="ml-3">
              <View className="mb-3">
                <Text className="text-gray-900 font-semibold mb-1">Minimum Age Requirement</Text>
                <Text className="text-gray-700 leading-6">
                  You must be at least 18 years of age to register and work as a delivery partner.
                </Text>
              </View>
              
              <View className="mb-3">
                <Text className="text-gray-900 font-semibold mb-1">Valid Documentation</Text>
                <Text className="text-gray-700 leading-6">
                  You must possess valid government-issued identification documents, including 
                  Aadhaar card, PAN card, and a valid driver's license if using a vehicle.
                </Text>
              </View>
              
              <View className="mb-3">
                <Text className="text-gray-900 font-semibold mb-1">KYC Approval</Text>
                <Text className="text-gray-700 leading-6">
                  Your account will be activated only after successful verification and approval 
                  of your KYC documents by our compliance team.
                </Text>
              </View>
            </View>
          </View>

          {/* 3. Delivery Partner Responsibilities */}
          <View className="mb-6">
            <View className="flex-row items-center mb-3">
              <Feather name="package" size={20} color="#4f46e5" />
              <Text className="text-[#4f46e5] text-lg font-bold ml-2">
                3. Delivery Partner Responsibilities
              </Text>
            </View>
            <Text className="text-gray-700 leading-6 mb-3">
              As a delivery partner, you are expected to fulfill the following responsibilities:
            </Text>
            
            <View className="ml-3">
              <View className="mb-3">
                <Text className="text-gray-900 font-semibold mb-1">Accurate Order Collection</Text>
                <Text className="text-gray-700 leading-6">
                  Collect the correct items from vendors as specified in the order. Verify the 
                  items before leaving the pickup location to ensure accuracy.
                </Text>
              </View>
              
              <View className="mb-3">
                <Text className="text-gray-900 font-semibold mb-1">Safe Delivery</Text>
                <Text className="text-gray-700 leading-6">
                  Deliver orders safely and within the estimated time. Handle all items with care 
                  and maintain proper hygiene standards, especially for food items.
                </Text>
              </View>
              
              <View className="mb-3">
                <Text className="text-gray-900 font-semibold mb-1">OTP Verification</Text>
                <Text className="text-gray-700 leading-6">
                  Always verify the OTP with the customer before marking an order as delivered. 
                  Do not share OTPs or mark deliveries as complete without proper verification.
                </Text>
              </View>
              
              <View className="mb-3">
                <Text className="text-gray-900 font-semibold mb-1">Professional Behavior</Text>
                <Text className="text-gray-700 leading-6">
                  Maintain professional and courteous behavior with customers, vendors, and 
                  support staff at all times. Dress appropriately and represent the platform positively.
                </Text>
              </View>
            </View>
          </View>

          {/* 4. Payments & Earnings */}
          <View className="mb-6">
            <View className="flex-row items-center mb-3">
              <Feather name="dollar-sign" size={20} color="#4f46e5" />
              <Text className="text-[#4f46e5] text-lg font-bold ml-2">
                4. Payments & Earnings
              </Text>
            </View>
            
            <View className="ml-3">
              <View className="mb-3">
                <Text className="text-gray-900 font-semibold mb-1">Earnings Per Order</Text>
                <Text className="text-gray-700 leading-6">
                  You will receive earnings based on the distance, time, and complexity of each 
                  delivery. Earnings may include base pay, distance fees, and promotional bonuses.
                </Text>
              </View>
              
              <View className="mb-3">
                <Text className="text-gray-900 font-semibold mb-1">Payout Processing</Text>
                <Text className="text-gray-700 leading-6">
                  Payouts are processed on a weekly basis, subject to admin approval. You must 
                  have completed KYC verification and linked a valid bank account to receive payments.
                </Text>
              </View>
              
              <View className="mb-3">
                <Text className="text-gray-900 font-semibold mb-1">Service Charges</Text>
                <Text className="text-gray-700 leading-6">
                  The platform reserves the right to deduct service charges, commission fees, or 
                  penalties from your earnings for violations, order cancellations, or service costs.
                </Text>
              </View>
            </View>
          </View>

          {/* 5. Order Issues */}
          <View className="mb-6">
            <View className="flex-row items-center mb-3">
              <Feather name="alert-triangle" size={20} color="#4f46e5" />
              <Text className="text-[#4f46e5] text-lg font-bold ml-2">
                5. Order Issues
              </Text>
            </View>
            
            <View className="ml-3">
              <View className="mb-3">
                <Text className="text-gray-900 font-semibold mb-1">Missing or Wrong Items</Text>
                <Text className="text-gray-700 leading-6">
                  If you discover missing or incorrect items after pickup, immediately contact 
                  the vendor and inform our support team through the app before proceeding with delivery.
                </Text>
              </View>
              
              <View className="mb-3">
                <Text className="text-gray-900 font-semibold mb-1">Reporting Timeline</Text>
                <Text className="text-gray-700 leading-6">
                  All order issues must be reported within 15 minutes of pickup or delivery. 
                  Late reports may not be eligible for resolution or compensation.
                </Text>
              </View>
              
              <View className="mb-3">
                <Text className="text-gray-900 font-semibold mb-1">Evidence Submission</Text>
                <Text className="text-gray-700 leading-6">
                  When reporting issues, provide photographic evidence and detailed descriptions 
                  to help us investigate and resolve the matter promptly.
                </Text>
              </View>
            </View>
          </View>

          {/* 6. Account Suspension */}
          <View className="mb-6">
            <View className="flex-row items-center mb-3">
              <Feather name="x-circle" size={20} color="#4f46e5" />
              <Text className="text-[#4f46e5] text-lg font-bold ml-2">
                6. Account Suspension
              </Text>
            </View>
            <Text className="text-gray-700 leading-6 mb-3">
              Your account may be temporarily suspended or permanently terminated for any of 
              the following violations:
            </Text>
            
            <View className="ml-3">
              <View className="mb-3">
                <Text className="text-gray-900 font-semibold mb-1">Fraudulent Activities</Text>
                <Text className="text-gray-700 leading-6">
                  Engaging in fraud, providing false information, using fake documents, or 
                  manipulating the system for personal gain.
                </Text>
              </View>
              
              <View className="mb-3">
                <Text className="text-gray-900 font-semibold mb-1">Repeated Delivery Failures</Text>
                <Text className="text-gray-700 leading-6">
                  Consistent failure to complete deliveries, excessive order cancellations, or 
                  poor performance ratings from customers and vendors.
                </Text>
              </View>
              
              <View className="mb-3">
                <Text className="text-gray-900 font-semibold mb-1">Fake OTP Verification</Text>
                <Text className="text-gray-700 leading-6">
                  Marking orders as delivered without proper OTP verification or attempting to 
                  bypass the verification process.
                </Text>
              </View>
              
              <View className="mb-3">
                <Text className="text-gray-900 font-semibold mb-1">Document Misuse</Text>
                <Text className="text-gray-700 leading-6">
                  Using another person's documents, sharing your account credentials, or allowing 
                  unauthorized individuals to make deliveries on your behalf.
                </Text>
              </View>
            </View>
          </View>

          {/* 7. Limitation of Liability */}
          <View className="mb-6">
            <View className="flex-row items-center mb-3">
              <Feather name="shield-off" size={20} color="#4f46e5" />
              <Text className="text-[#4f46e5] text-lg font-bold ml-2">
                7. Limitation of Liability
              </Text>
            </View>
            <Text className="text-gray-700 leading-6 mb-3">
              The platform acts as an intermediary connecting delivery partners with customers 
              and vendors. We are not responsible for:
            </Text>
            <View className="ml-3">
              <Text className="text-gray-700 leading-6 mb-2">
                • Accidents, injuries, or damages occurring during delivery operations
              </Text>
              <Text className="text-gray-700 leading-6 mb-2">
                • Disputes between you and customers, vendors, or third parties
              </Text>
              <Text className="text-gray-700 leading-6 mb-2">
                • Loss or damage to your personal property, including vehicles
              </Text>
              <Text className="text-gray-700 leading-6">
                • External factors such as traffic violations, weather conditions, or road accidents
              </Text>
            </View>
          </View>

          {/* 8. Termination */}
          <View className="mb-6">
            <View className="flex-row items-center mb-3">
              <Feather name="log-out" size={20} color="#4f46e5" />
              <Text className="text-[#4f46e5] text-lg font-bold ml-2">
                8. Termination
              </Text>
            </View>
            <Text className="text-gray-700 leading-6 mb-3">
              The company reserves the right to suspend or terminate your account at any time, 
              with or without notice, for any reason including but not limited to:
            </Text>
            <View className="ml-3">
              <Text className="text-gray-700 leading-6 mb-2">
                • Violation of these Terms and Conditions
              </Text>
              <Text className="text-gray-700 leading-6 mb-2">
                • Breach of platform policies or community guidelines
              </Text>
              <Text className="text-gray-700 leading-6 mb-2">
                • Inactive account for an extended period
              </Text>
              <Text className="text-gray-700 leading-6 mb-3">
                • Business or operational reasons
              </Text>
            </View>
            <Text className="text-gray-700 leading-6">
              Upon termination, you will forfeit access to your account and may lose any pending 
              earnings subject to our payout policies and legal obligations.
            </Text>
          </View>

          {/* Agreement Footer */}
          <View className="bg-indigo-50 rounded-2xl p-4 mb-6">
            <Text className="text-gray-900 font-semibold text-center mb-2">
              Agreement Acknowledgment
            </Text>
            <Text className="text-gray-700 text-sm text-center leading-5">
              By continuing to use this app, you acknowledge that you have read, understood, 
              and agree to be bound by these Terms and Conditions.
            </Text>
          </View>

          {/* Footer */}
          <View className="mb-8 pt-4 border-t border-gray-200">
            <Text className="text-gray-500 text-sm mb-2">
              Last updated: January 22, 2026
            </Text>
            <Text className="text-gray-700 text-sm leading-5">
              For questions or concerns regarding these terms, please contact us at{' '}
              <Text className="text-[#4f46e5] font-semibold">
                legal@deliveryapp.com
              </Text>
            </Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
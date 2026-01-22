import React from 'react';
import {  ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PrivacyPolicyScreen() {
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
            <Text className="text-white text-xl font-bold">Privacy Policy</Text>
            <Text className="text-indigo-200 text-sm mt-1">
              Your data safety matters to us
            </Text>
          </View>
        </View>
      </View>

      {/* Content Container */}
      <View className="flex-1 bg-white rounded-t-3xl">
        <ScrollView className="flex-1 px-5 py-6" showsVerticalScrollIndicator={false}>
          
          {/* 1. Introduction */}
          <View className="mb-6">
            <View className="flex-row items-center mb-3">
              <Feather name="shield" size={20} color="#4f46e5" />
              <Text className="text-[#4f46e5] text-lg font-bold ml-2">
                1. Introduction
              </Text>
            </View>
            <Text className="text-gray-700 leading-6 mb-3">
              This Privacy Policy explains how we collect, use, and protect your personal 
              information when you use our delivery partner application. We are committed to 
              ensuring that your privacy is protected and that we handle your data responsibly 
              and transparently.
            </Text>
            <Text className="text-gray-700 leading-6">
              We collect data only to provide you with delivery services, process payments, 
              ensure security, and improve your experience on our platform.
            </Text>
          </View>

          {/* 2. Information We Collect */}
          <View className="mb-6">
            <View className="flex-row items-center mb-3">
              <Feather name="file-text" size={20} color="#4f46e5" />
              <Text className="text-[#4f46e5] text-lg font-bold ml-2">
                2. Information We Collect
              </Text>
            </View>
            <Text className="text-gray-700 leading-6 mb-3">
              To provide our services effectively and ensure compliance with legal requirements, 
              we collect the following types of information:
            </Text>
            
            <View className="ml-3">
              <View className="mb-3">
                <Text className="text-gray-900 font-semibold mb-1">Personal Details</Text>
                <Text className="text-gray-700 leading-6">
                  Your full name, phone number, email address, profile photograph, and 
                  emergency contact information.
                </Text>
              </View>
              
              <View className="mb-3">
                <Text className="text-gray-900 font-semibold mb-1">KYC Documents</Text>
                <Text className="text-gray-700 leading-6">
                  Government-issued identity documents such as Aadhaar card, PAN card, 
                  driver's license, and bank account details for verification and payment purposes.
                </Text>
              </View>
              
              <View className="mb-3">
                <Text className="text-gray-900 font-semibold mb-1">Location Data</Text>
                <Text className="text-gray-700 leading-6">
                  Real-time GPS location data collected only during active delivery sessions 
                  to enable order tracking, route optimization, and customer notifications.
                </Text>
              </View>
              
              <View className="mb-3">
                <Text className="text-gray-900 font-semibold mb-1">Device & App Usage Data</Text>
                <Text className="text-gray-700 leading-6">
                  Device model, operating system version, app version, IP address, and usage 
                  patterns to improve app performance and troubleshoot technical issues.
                </Text>
              </View>
            </View>
          </View>

          {/* 3. How We Use Your Information */}
          <View className="mb-6">
            <View className="flex-row items-center mb-3">
              <Feather name="settings" size={20} color="#4f46e5" />
              <Text className="text-[#4f46e5] text-lg font-bold ml-2">
                3. How We Use Your Information
              </Text>
            </View>
            <Text className="text-gray-700 leading-6 mb-3">
              The information we collect is used for the following purposes:
            </Text>
            
            <View className="ml-3">
              <View className="mb-3">
                <Text className="text-gray-900 font-semibold mb-1">Order Assignment</Text>
                <Text className="text-gray-700 leading-6">
                  To assign delivery orders based on your location, availability, and performance metrics.
                </Text>
              </View>
              
              <View className="mb-3">
                <Text className="text-gray-900 font-semibold mb-1">Identity Verification</Text>
                <Text className="text-gray-700 leading-6">
                  To verify your identity through KYC documents and ensure you meet our 
                  eligibility criteria for becoming a delivery partner.
                </Text>
              </View>
              
              <View className="mb-3">
                <Text className="text-gray-900 font-semibold mb-1">Payment Processing</Text>
                <Text className="text-gray-700 leading-6">
                  To calculate your earnings, process payouts to your bank account, and 
                  maintain transaction records.
                </Text>
              </View>
              
              <View className="mb-3">
                <Text className="text-gray-900 font-semibold mb-1">Fraud Prevention</Text>
                <Text className="text-gray-700 leading-6">
                  To detect and prevent fraudulent activities, unauthorized access, and 
                  policy violations on our platform.
                </Text>
              </View>
              
              <View className="mb-3">
                <Text className="text-gray-900 font-semibold mb-1">Support & Communication</Text>
                <Text className="text-gray-700 leading-6">
                  To provide customer support, send important notifications about orders, 
                  payments, policy updates, and app improvements.
                </Text>
              </View>
            </View>
          </View>

          {/* 4. Data Sharing */}
          <View className="mb-6">
            <View className="flex-row items-center mb-3">
              <Feather name="users" size={20} color="#4f46e5" />
              <Text className="text-[#4f46e5] text-lg font-bold ml-2">
                4. Data Sharing
              </Text>
            </View>
            <Text className="text-gray-700 leading-6 mb-3">
              We respect your privacy and limit data sharing to essential service providers only:
            </Text>
            
            <View className="ml-3">
              <View className="mb-3">
                <Text className="text-gray-900 font-semibold mb-1">Service Partners</Text>
                <Text className="text-gray-700 leading-6">
                  Your name, phone number, and current location are shared with vendors and 
                  customers only when you have an active order assigned to you. This enables 
                  seamless order fulfillment and delivery coordination.
                </Text>
              </View>
              
              <View className="mb-3">
                <Text className="text-gray-900 font-semibold mb-1">Payment Partners</Text>
                <Text className="text-gray-700 leading-6">
                  Bank account details are shared with our payment gateway partners to process 
                  your earnings and payouts securely.
                </Text>
              </View>
              
              <View className="mb-3">
                <Text className="text-gray-900 font-semibold mb-1">No Third-Party Sales</Text>
                <Text className="text-gray-700 leading-6">
                  We never sell, rent, or trade your personal information to third parties for 
                  marketing or advertising purposes.
                </Text>
              </View>
            </View>
          </View>

          {/* 5. Data Security */}
          <View className="mb-6">
            <View className="flex-row items-center mb-3">
              <Feather name="lock" size={20} color="#4f46e5" />
              <Text className="text-[#4f46e5] text-lg font-bold ml-2">
                5. Data Security
              </Text>
            </View>
            <Text className="text-gray-700 leading-6 mb-3">
              We implement industry-standard security measures to protect your data:
            </Text>
            
            <View className="ml-3">
              <View className="mb-3">
                <Text className="text-gray-900 font-semibold mb-1">Encrypted Storage</Text>
                <Text className="text-gray-700 leading-6">
                  All sensitive data, including KYC documents and bank details, are encrypted 
                  using advanced encryption standards both in transit and at rest.
                </Text>
              </View>
              
              <View className="mb-3">
                <Text className="text-gray-900 font-semibold mb-1">Secure Servers</Text>
                <Text className="text-gray-700 leading-6">
                  Our data is stored on secure servers with regular security audits, firewalls, 
                  and intrusion detection systems.
                </Text>
              </View>
              
              <View className="mb-3">
                <Text className="text-gray-900 font-semibold mb-1">Limited Access</Text>
                <Text className="text-gray-700 leading-6">
                  Internal access to your personal data is restricted to authorized personnel 
                  only who need it to perform their job functions.
                </Text>
              </View>
            </View>
          </View>

          {/* 6. Your Rights */}
          <View className="mb-6">
            <View className="flex-row items-center mb-3">
              <Feather name="eye" size={20} color="#4f46e5" />
              <Text className="text-[#4f46e5] text-lg font-bold ml-2">
                6. Your Rights
              </Text>
            </View>
            <Text className="text-gray-700 leading-6 mb-3">
              You have the following rights regarding your personal data:
            </Text>
            
            <View className="ml-3">
              <View className="mb-3">
                <Text className="text-gray-900 font-semibold mb-1">Access Your Data</Text>
                <Text className="text-gray-700 leading-6">
                  You can request a copy of the personal data we hold about you at any time 
                  by contacting our support team.
                </Text>
              </View>
              
              <View className="mb-3">
                <Text className="text-gray-900 font-semibold mb-1">Update Documents</Text>
                <Text className="text-gray-700 leading-6">
                  You can update your personal information and KYC documents through the app's 
                  profile section whenever needed.
                </Text>
              </View>
              
              <View className="mb-3">
                <Text className="text-gray-900 font-semibold mb-1">Request Account Deletion</Text>
                <Text className="text-gray-700 leading-6">
                  You have the right to request permanent deletion of your account and associated 
                  data, subject to legal retention requirements. Contact support to initiate this process.
                </Text>
              </View>
            </View>
          </View>

          {/* 7. Changes to Policy */}
          <View className="mb-6">
            <View className="flex-row items-center mb-3">
              <Feather name="bell" size={20} color="#4f46e5" />
              <Text className="text-[#4f46e5] text-lg font-bold ml-2">
                7. Changes to This Policy
              </Text>
            </View>
            <Text className="text-gray-700 leading-6 mb-3">
              We may update this Privacy Policy from time to time to reflect changes in our 
              practices, legal requirements, or service offerings.
            </Text>
            <Text className="text-gray-700 leading-6">
              When we make significant changes, we will notify you through the app or via email. 
              We encourage you to review this policy periodically to stay informed about how we 
              protect your information.
            </Text>
          </View>

          {/* Footer */}
          <View className="mt-4 mb-8 pt-6 border-t border-gray-200">
            <Text className="text-gray-500 text-sm mb-2">
              Last updated: January 22, 2026
            </Text>
            <Text className="text-gray-700 text-sm leading-5">
              If you have any questions or concerns about this Privacy Policy, please contact 
              our support team at{' '}
              <Text className="text-[#4f46e5] font-semibold">
                privacy@deliveryapp.com
              </Text>
            </Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const mockFAQs = [
  {
    id: 'faq-1',
    question: 'How do I request a cashout?',
    answer: 'Go to Earnings & Wallet > Request Cashout. Minimum amount is ₹1,000. The amount will be transferred within 2 business days after admin approval.',
  },
  {
    id: 'faq-2',
    question: 'What is the settlement cycle?',
    answer: 'Settlement cycle is T+2 business days. This means your money will be credited 2 days after the admin approves your cashout request.',
  },
  {
    id: 'faq-3',
    question: 'How do I update my bank account?',
    answer: 'Go to Profile > Bank & Payout Details > Edit. Note that updating bank details requires admin re-verification.',
  },
  {
    id: 'faq-4',
    question: 'What documents are required for KYC?',
    answer: 'Shop License, PAN Card, Identity Proof, and GST Certificate (optional). All documents must be clear and in color.',
  },
  {
    id: 'faq-5',
    question: 'How long does document verification take?',
    answer: 'Document verification typically takes 24-48 hours. You\'ll receive a notification once the verification is complete.',
  },
];

export default function SupportScreen() {
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [processingAction, setProcessingAction] = useState<string | null>(null);

  const handleGoBack = () => {
    console.log('[v0] Going back to profile overview');
    router.back()
  };

  const handleChatSupport = async () => {
    setProcessingAction('chat');
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('[v0] Opening live chat support');
      Alert.alert('Live Chat', 'Opening chat support window...');
    } catch (error) {
      Alert.alert('Error', 'Failed to open chat support');
    } finally {
      setProcessingAction(null);
    }
  };

  const handleEmailSupport = async () => {
    setProcessingAction('email');
    try {
      await Linking.openURL('mailto:support@vendor.app?subject=Support Request');
    } catch (error) {
      Alert.alert('Error', 'Failed to open email client');
    } finally {
      setProcessingAction(null);
    }
  };

  const handleCallSupport = async () => {
    setProcessingAction('call');
    try {
      await Linking.openURL('tel:+919876543210');
    } catch (error) {
      Alert.alert('Error', 'Failed to open phone dialer');
    } finally {
      setProcessingAction(null);
    }
  };

  const toggleFAQ = (id: string) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 pt-4 pb-4 border-b border-gray-100 flex-row items-center gap-3">
        <TouchableOpacity onPress={handleGoBack} className="p-2 -ml-2">
          <Feather name='chevron-left' size={24} color="#1f2937" />
        </TouchableOpacity>
        <View>
          <Text className="text-2xl font-bold text-gray-900">Help & Support</Text>
          <Text className="text-sm text-gray-600 mt-1">We're here to help you</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {/* Contact Support Section */}
        <View className="px-4 pt-6">
          <Text className="text-lg font-bold text-gray-900 mb-3">Contact Support</Text>

          <View className="gap-3 mb-6">
            {/* Live Chat */}
            {/* <TouchableOpacity
              onPress={handleChatSupport}
              disabled={processingAction === 'chat'}
              className={`bg-white border border-gray-200 rounded-xl p-4 flex-row items-center gap-3 active:opacity-70 ${processingAction === 'chat' ? 'opacity-50' : ''}`}
            >
              <View className="w-12 h-12 bg-blue-100 rounded-xl items-center justify-center">
                <Feather name='message-circle' size={24} color="#2563eb" />
              </View>
              <View className="flex-1">
                <Text className="text-gray-900 font-bold text-base">Live Chat</Text>
                <Text className="text-gray-600 text-xs mt-1">Chat with our support team</Text>
              </View>
              {processingAction === 'chat' ? (
                <ActivityIndicator size="small" color="#2563eb" />
              ) : (
                <Feather name='chevron-right' size={20} color="#9ca3af" />
              )}
            </TouchableOpacity> */}

            {/* Email Support */}
            <TouchableOpacity
              onPress={handleEmailSupport}
              disabled={processingAction === 'email'}
              className={`bg-white border border-gray-200 rounded-xl p-4 flex-row items-center gap-3 active:opacity-70 ${processingAction === 'email' ? 'opacity-50' : ''}`}
            >
              <View className="w-12 h-12 bg-emerald-100 rounded-xl items-center justify-center">
                <Feather name='mail' size={24} color="#059669" />
              </View>
              <View className="flex-1">
                <Text className="text-gray-900 font-bold text-base">Email Support</Text>
                <Text className="text-gray-600 text-xs mt-1">support@vendor.app</Text>
              </View>
              {processingAction === 'email' ? (
                <ActivityIndicator size="small" color="#059669" />
              ) : (
                <Feather name='chevron-right' size={20} color="#9ca3af" />
              )}
            </TouchableOpacity>

            {/* Phone Support */}
            <TouchableOpacity
              onPress={handleCallSupport}
              disabled={processingAction === 'call'}
              className={`bg-white border border-gray-200 rounded-xl p-4 flex-row items-center gap-3 active:opacity-70 ${processingAction === 'call' ? 'opacity-50' : ''}`}
            >
              <View className="w-12 h-12 bg-orange-100 rounded-xl items-center justify-center">
                <Feather name='phone' size={24} color="#f59e0b" />
              </View>
              <View className="flex-1">
                <Text className="text-gray-900 font-bold text-base">Call Support</Text>
                <Text className="text-gray-600 text-xs mt-1">+91 98765 43210</Text>
              </View>
              {processingAction === 'call' ? (
                <ActivityIndicator size="small" color="#f59e0b" />
              ) : (
                <Feather name='chevron-right' size={20} color="#9ca3af" />
              )}
            </TouchableOpacity>
          </View>

          <View className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <Text className="text-blue-900 text-sm font-semibold">Support Hours</Text>
            <Text className="text-blue-800 text-xs mt-2 leading-5">
              Monday - Friday: 9:00 AM - 6:00 PM{'\n'}
              Saturday - Sunday: 10:00 AM - 4:00 PM{'\n'}
              Response time: Usually within 2 hours
            </Text>
          </View>
        </View>

        {/* FAQ Section */}
        <View className="px-4">
          <View className="flex-row items-center gap-2 mb-3">
            <Feather name='help-circle' size={20} color="#059669" />
            <Text className="text-lg font-bold text-gray-900">Frequently Asked Questions</Text>
          </View>

          <View className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {mockFAQs.map((faq, index) => (
              <View key={faq.id} className={`${index !== mockFAQs.length - 1 ? 'border-b border-gray-100' : ''}`}>
                {/* Question */}
                <TouchableOpacity
                  onPress={() => toggleFAQ(faq.id)}
                  className={`px-5 py-4 flex-row items-center justify-between active:opacity-70 ${expandedFAQ === faq.id ? 'bg-emerald-50' : ''}`}
                >
                  <Text className={`font-semibold text-base flex-1 mr-3 ${expandedFAQ === faq.id ? 'text-emerald-700' : 'text-gray-900'}`}>
                    {faq.question}
                  </Text>
                  <View className={`transform transition-transform ${expandedFAQ === faq.id ? 'rotate-180' : 'rotate-0'}`}>
                  <Feather name='chevron-right' size={20} color={expandedFAQ === faq.id ? '#059669' : '#9ca3af'} />
                  </View>
                </TouchableOpacity>

                {/* Answer */}
                {expandedFAQ === faq.id && (
                  <View className="px-5 py-4 bg-emerald-50 border-t border-emerald-200">
                    <Text className="text-gray-800 text-sm leading-6">{faq.answer}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Additional Resources */}
        <View className="px-4 py-6">
          <Text className="text-lg font-bold text-gray-900 mb-3">Additional Resources</Text>

          <View className="bg-white rounded-2xl border border-gray-100 p-5 gap-3">
            <TouchableOpacity className="flex-row items-center justify-between pb-3 border-b border-gray-100 active:opacity-70">
              <Text className="text-gray-900 font-semibold text-base">Read Our Blog</Text>
              <Feather name='chevron-right' size={20} color="#9ca3af" />
            </TouchableOpacity>
            <TouchableOpacity className="flex-row items-center justify-between pb-3 border-b border-gray-100 active:opacity-70">
              <Text className="text-gray-900 font-semibold text-base">Video Tutorials</Text>
              <Feather name='chevron-right' size={20} color="#9ca3af" />
            </TouchableOpacity>
            <TouchableOpacity className="active:opacity-70">
              <Text className="text-gray-900 font-semibold text-base">Community Forum</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

export default function VendorPrivacyPolicyScreen() {
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const lastUpdated = '15 January 2025';

  const handleGoBack = () => {
    router.back()
  };

  const handleDownload = () => {
    Toast.show({
      type: 'info',
      text1: 'Downloading...',
      text2: 'Privacy Policy PDF is being prepared.',
      position: 'top',
    });
  };

  const handleShare = () => {
    Toast.show({
      type: 'info',
      text1: 'Share',
      text2: 'Opening share options...',
      position: 'top',
    });
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const sections = [
    {
      id: 'introduction',
      title: '1. Introduction',
      content:
        'SrMart ("we", "our", "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information. SrMart collects limited vendor data only to operate the platform during the pilot phase. We respect your privacy and are transparent about how your data is handled.',
    },
    {
      id: 'information-collected',
      title: '2. Information We Collect',
      content:
        'We collect the following information from vendors:\n\n• Business or shop name\n• Owner name\n• Phone number and email address\n• Shop address and service area\n• Bank details for settlements\n• Product listings and pricing\n• Order and fulfillment data\n\nThis information is collected when you register, update your profile, or conduct transactions on our platform.',
    },
    {
      id: 'information-usage',
      title: '3. How We Use Vendor Information',
      content:
        'Your information is used for:\n\n• Enable product listing on the platform\n• Process vendor settlements and payouts\n• Share order details with customers and delivery partners\n• Improve platform operations and user experience\n• Communicate important updates and notifications\n• Comply with legal and regulatory requirements',
    },
    {
      id: 'information-sharing',
      title: '4. Information Sharing',
      content:
        'We are committed to protecting your data:\n\n• Vendor data is shared only when necessary for order fulfillment\n• Bank details are NEVER shared with customers or delivery partners\n• No data is sold to third parties\n• Data is only shared with authorized platform partners for operational purposes\n• All third parties are bound by confidentiality agreements',
    },
    {
      id: 'data-security',
      title: '5. Data Security',
      content:
        'We implement reasonable security measures to protect your information:\n\n• Encryption of sensitive data\n• Limited access to vendor information\n• Regular security audits and updates\n• Secure payment processing systems\n• Password protection for vendor accounts\n\nHowever, no system is completely secure, and we cannot guarantee absolute protection.',
    },
    {
      id: 'data-retention',
      title: '6. Data Retention',
      content:
        'We retain vendor data:\n\n• As long as you remain an active vendor on the platform\n• For the duration of any ongoing transactions\n• As required by law and regulatory requirements\n• For dispute resolution and audit purposes\n\nOnce you close your account, data is retained for 2 years and then deleted, except where required by law.',
    },
    {
      id: 'vendor-rights',
      title: '7. Vendor Rights',
      content:
        'You have the following rights:\n\n• Access: Request access to all your personal data\n• Update: Modify or update your information anytime\n• Delete: Request deletion of your data (subject to legal requirements)\n• Portability: Request your data in machine-readable format\n\nTo exercise these rights, contact our support team at support@srmart.app',
    },
    {
      id: 'policy-changes',
      title: '8. Changes to This Policy',
      content:
        'We may update this Privacy Policy as our platform evolves and grows beyond the pilot phase. Changes will be communicated to you via email. Continued use of the platform after updates constitutes acceptance of the revised policy. We recommend reviewing this policy periodically.',
    },
    {
      id: 'contact',
      title: '9. Contact Information',
      content:
        'If you have questions about this Privacy Policy, please contact us:\n\nEmail: support@srmart.app\nPhone: +91 XXXX XXXX XX\nAddress: SrMart Headquarters, City, Country\n\nWe value your feedback and will respond to inquiries within 7 business days.',
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 pt-4 pb-4 border-b border-gray-100">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-3 flex-1">
            <TouchableOpacity onPress={handleGoBack} className="p-2 -ml-2">
              <Feather name='chevron-left' size={24} color="#1f2937" />
            </TouchableOpacity>
            <View className="flex-1">
              <Text className="text-2xl font-bold text-gray-900">Privacy Policy</Text>
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
              <Feather name='download' size={16} color="#059669" />
              <Text className="text-emerald-700 font-semibold text-xs">Download</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleShare}
            className="flex-1 bg-blue-50 border border-blue-200 rounded-lg py-2 items-center justify-center active:opacity-70"
          >
            <View className="flex-row items-center gap-1">
              <Feather name='share-2' size={16} color="#2563eb" />
              <Text className="text-blue-700 font-semibold text-xs">Share</Text>
            </View>
          </TouchableOpacity>
        </View> */}
      </View>

      {/* Content */}
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {/* Intro Banner */}
        <View className="bg-gradient-to-r from-emerald-50 to-teal-50 mx-4 mt-4 rounded-2xl p-5 border border-emerald-200">
          <Text className="text-gray-900 font-semibold text-sm leading-6">
            This Privacy Policy outlines how SrMart collects, uses, and protects your information during our pilot phase. We are committed to maintaining your trust by being transparent about our data practices.
          </Text>
        </View>

        {/* Sections */}
        <View className="px-4 py-6 gap-3">
          {sections.map(section => (
            <View key={section.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              {/* Section Header */}
              <TouchableOpacity
                onPress={() => toggleSection(section.id)}
                className="px-5 py-4 flex-row items-center justify-between active:bg-gray-50"
              >
                <Text className="text-gray-900 font-bold text-base flex-1 pr-3">
                  {section.title}
                </Text>
                <View
                  className={`transform transition-transform ${expandedSections.includes(section.id) ? 'rotate-180' : 'rotate-0'
                    }`}
                >
                  <Feather name='chevron-left' size={20} color="#059669" style={{ transform: [{ rotateY: '180deg' }] }} />
                </View>
              </TouchableOpacity>

              {/* Section Content */}
              {expandedSections.includes(section.id) && (
                <View className="px-5 py-4 bg-gray-50 border-t border-gray-200">
                  <Text className="text-gray-700 text-sm leading-6 font-medium">
                    {section.content}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Footer */}
        <View className="px-4 py-8">
          <View className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
            <Text className="text-emerald-900 font-bold text-sm mb-2">Pilot Phase</Text>
            <Text className="text-emerald-800 text-xs leading-5">
              SrMart is currently in pilot phase. This Privacy Policy may be updated as we scale operations. You will be notified of any material changes via email.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Sticky Button */}
      <View className="bg-white px-4 py-4 border-t border-gray-200 safe-area-bottom">
        <TouchableOpacity className="bg-emerald-500 rounded-xl py-4 items-center justify-center active:opacity-80">
          <Text className="text-white font-bold text-base">I Understand & Agree</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
import { Feather, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

// ─── Reusable Confirmation Modal ─────────────────────────────────────────────

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmDestructive?: boolean;
  icon?: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmDestructive = false,
  icon,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <Pressable
        className="flex-1 bg-black/50 items-center justify-center px-6"
        onPress={onCancel}
      >
        <Pressable className="bg-white w-full rounded-2xl overflow-hidden" onPress={() => {}}>
          <View className="items-center pt-6 pb-2">
            <View
              className={`w-14 h-14 rounded-full items-center justify-center mb-3 ${
                confirmDestructive ? 'bg-red-100' : 'bg-emerald-100'
              }`}
            >
              {icon ?? (
                <Ionicons
                  name="checkmark-circle-outline"
                  size={28}
                  color={confirmDestructive ? '#dc2626' : '#10b981'}
                />
              )}
            </View>
            <Text className="text-lg font-bold text-gray-900 text-center px-4">{title}</Text>
          </View>

          <Text className="text-sm text-gray-500 text-center px-6 pb-6 mt-1">{message}</Text>

          <View className="border-t border-gray-100 flex-row">
            <TouchableOpacity
              onPress={onCancel}
              className="flex-1 py-4 items-center border-r border-gray-100"
            >
              <Text className="text-base font-semibold text-gray-600">{cancelLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onConfirm} className="flex-1 py-4 items-center">
              <Text
                className={`text-base font-bold ${
                  confirmDestructive ? 'text-red-600' : 'text-emerald-600'
                }`}
              >
                {confirmLabel}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function VendorTermsConditionsScreen() {
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreeModalVisible, setAgreeModalVisible] = useState(false);
  const lastUpdated = '15 January 2025';

  const handleGoBack = () => {
    router.back();
  };

  const handleDownload = () => {
    Toast.show({
      type: 'info',
      text1: 'Downloading...',
      text2: 'Terms & Conditions PDF is being prepared.',
      position: 'top',
    });
    // TODO: trigger actual download
  };

  const handleShare = () => {
    Toast.show({
      type: 'info',
      text1: 'Share',
      text2: 'Opening share options...',
      position: 'top',
    });
    // TODO: trigger Share API
  };

  const handleAgreeTerms = () => {
    if (!agreedToTerms) {
      Toast.show({
        type: 'error',
        text1: 'Agreement Required',
        text2: 'Please read and check the box to agree before proceeding.',
        position: 'top',
      });
      return;
    }
    // Show confirmation modal before finalising
    setAgreeModalVisible(true);
  };

  const confirmAgree = () => {
    setAgreeModalVisible(false);
    Toast.show({
      type: 'success',
      text1: 'Terms Accepted',
      text2: 'You have agreed to the Terms & Conditions.',
      position: 'top',
    });
    // TODO: persist agreement to backend / navigate forward
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev =>
      prev.includes(sectionId) ? prev.filter(id => id !== sectionId) : [...prev, sectionId],
    );
  };

  const sections = [
    {
      id: 'vendor-role',
      title: '1. Vendor Role',
      content:
        'You are an independent seller on the SrMart platform. SrMart operates as a marketplace platform only and does not directly provide products or services. As a vendor, you are responsible for all aspects of your products and their delivery to customers. SrMart acts as an intermediary facilitating transactions between vendors and customers.',
    },
    {
      id: 'pilot-phase',
      title: '2. Pilot Phase Disclaimer',
      content:
        'SrMart is currently operating in PILOT PHASE with limited scale operations. Please note:\n\n• Platform features and policies may evolve significantly\n• Some features may change or be discontinued\n• Support availability may be limited\n• This phase is for MVP testing and validation\n• Terms may be updated as we scale beyond pilot phase\n\nYou acknowledge and accept these limitations as an early-stage vendor.',
    },
    {
      id: 'product-responsibility',
      title: '3. Product Responsibility',
      content:
        'As a vendor, you are fully responsible for:\n\n• Product quality and freshness\n• Accurate product descriptions and pricing\n• Correct weight, quantity, and expiry dates\n• Food hygiene and packaging standards\n• Legal compliance with local regulations\n• Safe and hygienic packaging\n• Accuracy of product images\n\nViolations may result in order cancellation, refunds, and account suspension.',
    },
    {
      id: 'commission-fees',
      title: '4. Commission & Fees',
      content:
        'Commission & Payment Terms:\n\n• SrMart may charge a platform commission on orders (currently 8-15%)\n• No GST is charged during the PILOT PHASE\n• Commission structure is transparent and communicated upfront\n• Commission terms may change with 30 days written notice\n• You will have the right to refuse orders if terms change\n\nDetailed commission breakdown is available in your dashboard.',
    },
    {
      id: 'orders-fulfillment',
      title: '5. Orders & Fulfillment',
      content:
        'Order Management Expectations:\n\n• Accept or reject orders within 5 minutes\n• Avoid frequent cancellations (acceptable rate: max 10%)\n• Prepare orders with care and accuracy\n• Deliver orders to handover point on time\n• Communicate delays to customers immediately\n• Maintain 95%+ order accuracy rate\n\nHigh cancellation rates or poor fulfillment may result in account suspension.',
    },
    {
      id: 'payments-settlements',
      title: '6. Payments & Settlements',
      content:
        'Settlement Terms:\n\n• Settlements are processed on T+2 (2 business days) cycle\n• Payouts are credited to your registered bank account\n• Admin verification is required for new bank accounts\n• SrMart is not responsible for bank delays or errors\n• You can request cashouts only after successful document verification\n• Minimum cashout amount is ₹1,000\n\nSettlement history is available in your Earnings dashboard.',
    },
    {
      id: 'compliance-legal',
      title: '7. Compliance & Legal Responsibility',
      content:
        'Legal & Compliance Obligations:\n\n• You are responsible for obtaining GST registration if applicable\n• You must maintain FSSAI license for food products\n• Shop licenses and permits are your responsibility\n• Comply with all local food and safety regulations\n• SrMart does NOT provide tax or legal advice\n• You must comply with all applicable laws\n\nFailure to comply may result in legal action and account termination.',
    },
    {
      id: 'suspension-termination',
      title: '8. Suspension & Termination',
      content:
        'SrMart may suspend or terminate your vendor account for:\n\n• Poor product quality or customer complaints\n• Fraudulent activities or fake listings\n• Repeated order cancellations\n• Safety or hygiene violations\n• Non-compliance with local laws\n• Abusive behavior toward customers\n• Failure to maintain quality standards\n\nSuspension may be temporary or permanent depending on severity.',
    },
    {
      id: 'limitation-liability',
      title: '9. Limitation of Liability',
      content:
        'SrMart Liability Limits:\n\n• SrMart is not liable for vendor product disputes\n• We are not responsible for regulatory issues\n• Liability for platform is limited to amounts paid by vendors\n• We are not liable for delivery partner misconduct\n• Users accept platform "as-is" without warranties\n• Damages liability is capped at monthly settlements\n\nYou are solely responsible for your product quality and legal compliance.',
    },
    {
      id: 'indemnity',
      title: '10. Indemnity',
      content:
        'You agree to indemnify (hold harmless) SrMart against:\n\n• Claims arising from your vendor conduct\n• Product quality issues or customer harm\n• Regulatory violations or fines\n• Intellectual property infringements\n• Breach of these terms by you\n• Disputes between you and customers\n\nThis includes legal fees and damages.',
    },
    {
      id: 'changes-terms',
      title: '11. Changes to Terms',
      content:
        'Term Updates:\n\n• SrMart may update these terms as the platform grows\n• Material changes will be communicated 30 days in advance\n• You will receive email notification of changes\n• Continued platform use after updates means acceptance\n• You can refuse changes and exit the platform\n• Non-material changes may be applied immediately',
    },
    {
      id: 'contact-support',
      title: '12. Contact Information',
      content:
        'Support & Legal Inquiries:\n\nEmail: support@srmart.app\nPhone: +91 XXXX XXXX XX\nAddress: SrMart Headquarters, City, Country\nBusiness Hours: Monday-Friday 9AM-6PM\n\nWe respond to all inquiries within 7 business days. For urgent issues, please call our support team.',
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Agree Confirmation Modal */}
      <ConfirmModal
        visible={agreeModalVisible}
        title="Confirm Agreement"
        message="By confirming, you acknowledge that you have read and agree to all Terms & Conditions of the SrMart Vendor platform."
        confirmLabel="I Agree"
        cancelLabel="Review Again"
        icon={<Ionicons name="document-text-outline" size={28} color="#10b981" />}
        onConfirm={confirmAgree}
        onCancel={() => setAgreeModalVisible(false)}
      />

      {/* Header */}
      <View className="bg-white px-4 pt-4 pb-4 border-b border-gray-100">
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
        <View className="flex-row gap-2">
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
        </View>
      </View>

      {/* Content */}
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {/* Intro Banner */}
        <View className="bg-emerald-50 mx-4 mt-4 rounded-2xl p-5 border border-emerald-200">
          <Text className="text-gray-900 font-semibold text-sm leading-6">
            These Terms & Conditions govern your use of SrMart as a vendor. By using our platform,
            you agree to comply with these terms. Please read carefully, as they outline your
            responsibilities and rights.
          </Text>
        </View>

        {/* Sections */}
        <View className="px-4 py-6 gap-3">
          {sections.map(section => {
            const isExpanded = expandedSections.includes(section.id);
            return (
              <View
                key={section.id}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden"
              >
                <TouchableOpacity
                  onPress={() => toggleSection(section.id)}
                  className="px-5 py-4 flex-row items-center justify-between active:bg-gray-50"
                >
                  <Text className="text-gray-900 font-bold text-base flex-1 pr-3">
                    {section.title}
                  </Text>
                  <Feather
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="#059669"
                  />
                </TouchableOpacity>

                {isExpanded && (
                  <View className="px-5 py-4 bg-gray-50 border-t border-gray-200">
                    <Text className="text-gray-700 text-sm leading-6 font-medium">
                      {section.content}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Footer */}
        <View className="px-4 py-8">
          <View className="bg-orange-50 border border-orange-200 rounded-2xl p-5">
            <Text className="text-orange-900 font-bold text-sm mb-2">Pilot Phase Notice</Text>
            <Text className="text-orange-800 text-xs leading-5">
              SrMart is in pilot phase. These terms may change significantly as we scale. Commission
              rates, policies, and features may evolve. You will be notified of major changes with
              30 days advance notice.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Sticky Section */}
      <View className="bg-white px-4 py-4 border-t border-gray-200 gap-3">
        <TouchableOpacity
          onPress={() => setAgreedToTerms(!agreedToTerms)}
          className="flex-row items-center gap-3 active:opacity-70"
        >
          <View
            className={`w-6 h-6 rounded-lg border-2 items-center justify-center ${
              agreedToTerms ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300 bg-white'
            }`}
          >
            {agreedToTerms && <Text className="text-white font-bold text-sm">✓</Text>}
          </View>
          <Text className="text-gray-700 text-sm font-medium flex-1">
            I have read and agree to the Terms & Conditions
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleAgreeTerms}
          disabled={!agreedToTerms}
          className={`rounded-xl py-4 items-center justify-center ${
            agreedToTerms ? 'bg-emerald-500' : 'bg-gray-300'
          }`}
        >
          <Text className="text-white font-bold text-base">Continue & Proceed</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
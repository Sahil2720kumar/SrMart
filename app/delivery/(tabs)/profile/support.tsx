import { Feather, FontAwesome } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SupportScreen() {
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [ticketForm, setTicketForm] = useState({
    category: '',
    orderId: '',
    message: ''
  });
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const categories = [
    'Order Issues',
    'Earnings & Payments',
    'KYC & Verification',
    'Delivery Issues',
    'App Technical Issues',
    'Other'
  ];

  const tickets = [
    { id: 'TKT001234', category: 'Payment', status: 'In Progress', date: '2 hours ago' },
    { id: 'TKT001189', category: 'KYC', status: 'Resolved', date: '1 day ago' },
    { id: 'TKT001156', category: 'Order', status: 'Open', date: '3 days ago' }
  ];

  const faqs = [
    {
      question: 'How long does KYC verification take?',
      answer: 'KYC verification typically takes 24-48 hours. You\'ll receive a notification once it\'s approved. If rejected, please resubmit correct documents.'
    },
    {
      question: 'When do I receive payouts?',
      answer: 'Payouts are processed every Tuesday and Friday. Money reaches your bank within 1-2 business days after processing.'
    },
    {
      question: 'What if OTP fails during delivery?',
      answer: 'If OTP fails, tap "Call Customer" to verify delivery verbally. You can also use the manual verification option in the app.'
    },
    {
      question: 'How to update bank details?',
      answer: 'Go to Profile > Bank Details > Edit. You\'ll need to reverify with a small deposit confirmation within 3 days.'
    },
    {
      question: 'What if customer is unreachable?',
      answer: 'Try calling twice, then use the "Customer Unreachable" button. Follow the app\'s instructions to complete or return the order safely.'
    }
  ];

  const handleCallSupport = () => {
    Alert.alert('Call Support', 'Calling support team...', [{ text: 'OK' }]);
  };

  const handleEmergency = () => {
    Alert.alert(
      'Emergency Support',
      'This will immediately connect you to our emergency support team. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call Now', onPress: () => console.log('Emergency call') }
      ]
    );
  };

  const handleSubmitTicket = () => {
    if (!ticketForm.category || !ticketForm.message) {
      Alert.alert('Error', 'Please select a category and describe your issue');
      return;
    }
    Alert.alert('Success', 'Support ticket submitted successfully. We\'ll respond within 24 hours.');
    setTicketForm({ category: '', orderId: '', message: '' });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Open': return 'bg-yellow-100 text-yellow-800';
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'Resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#4f46e5]">
      {/* Header */}
      <View className="px-4 py-4 flex-row items-center">
        <TouchableOpacity className="mr-3">
          <Feather name='chevron-left' color="#fff" size={24} />
        </TouchableOpacity>
        <Text className="text-white text-xl font-bold">Support</Text>
      </View>

      <ScrollView className="flex-1">
        <View className="px-4 pb-6">
          {/* Emergency Support Card */}
          <View className="bg-red-50 rounded-2xl p-4 mb-4 border-2 border-red-200">
            <View className="flex-row items-center mb-2">
              <Feather name='alert-circle' color="#dc2626" size={24} />
              <Text className="text-red-900 text-lg font-bold ml-2">Emergency Support</Text>
            </View>
            <Text className="text-red-700 text-sm mb-4">
              Use this only in urgent situations during an active delivery.
            </Text>
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={handleCallSupport}
                className="flex-1 bg-red-600 rounded-xl py-3 flex-row items-center justify-center"
              >
                <Feather name='phone' color="#fff" size={18} />
                <Text className="text-white font-semibold ml-2">Call Support</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleEmergency}
                className="flex-1 bg-red-700 rounded-xl py-3 flex-row items-center justify-center"
              >
                <Feather name='alert-circle' color="#fff" size={18} />
                <Text className="text-white font-semibold ml-2">Emergency</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Contact Support */}
          <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
            <Text className="text-gray-900 text-lg font-bold mb-3">Contact Support</Text>

            <TouchableOpacity
              onPress={handleCallSupport}
              className="flex-row items-center py-3 border-b border-gray-100"
            >
              <View className="bg-indigo-100 p-2 rounded-lg">
                <Feather name='phone' color="#4f46e5" size={20} />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-gray-900 font-semibold">Call Support</Text>
                <Text className="text-gray-500 text-sm">Talk directly to our support team</Text>
              </View>
              <Feather name='chevron-left' color="#9ca3af" size={20} style={{ transform: [{ rotate: '180deg' }] }} />
            </TouchableOpacity>

            {/* <TouchableOpacity className="flex-row items-center py-3 border-b border-gray-100">
              <View className="bg-green-100 p-2 rounded-lg">
                <Feather name='message-circle' color="#10b981" size={20} />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-gray-900 font-semibold">Chat with Support</Text>
                <Text className="text-gray-500 text-sm">Get help via live chat</Text>
              </View>
              <Feather name='chevron-left' color="#9ca3af" size={20} style={{ transform: [{ rotate: '180deg' }] }} />
            </TouchableOpacity> */}

            <TouchableOpacity className="flex-row items-center py-3">
              <View className="bg-blue-100 p-2 rounded-lg">
                <Feather name='mail' color="#3b82f6" size={20} />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-gray-900 font-semibold">Email Support</Text>
                <Text className="text-gray-500 text-sm">support@deliveryapp.com</Text>
              </View>
              <Feather name='chevron-left' color="#9ca3af" size={20} style={{ transform: [{ rotate: '180deg' }] }} />
            </TouchableOpacity>
          </View>

          {/* Quick Help Categories */}
          <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
            <Text className="text-gray-900 text-lg font-bold mb-3">Quick Help</Text>

            <View className="flex-row flex-wrap gap-2">
              <TouchableOpacity
                onPress={() =>
                  setTicketForm(prev => ({
                    ...prev,
                    category: 'Order Issues',
                  }))
                }
                className="flex-1 min-w-[45%] bg-orange-50 rounded-xl p-3 border border-orange-200">
                <Feather name='package' color="#ea580c" size={24} />
                <Text className="text-gray-900 font-semibold mt-2 text-sm">Order Issues</Text>
                <Text className="text-gray-500 text-xs mt-1">Wrong/missing items</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() =>
                  setTicketForm(prev => ({
                    ...prev,
                    category: 'Earnings & Payments',
                  }))
                }
                className="flex-1 min-w-[45%] bg-green-50 rounded-xl p-3 border border-green-200">
                <FontAwesome name="rupee" size={24} color="black" />
                <Text className="text-gray-900 font-semibold mt-2 text-sm">Earnings</Text>
                <Text className="text-gray-500 text-xs mt-1">Payments & payouts</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() =>
                  setTicketForm(prev => ({
                    ...prev,
                    category: 'KYC & Verification',
                  }))
                }
                className="flex-1 min-w-[45%] bg-blue-50 rounded-xl p-3 border border-blue-200">
                <Feather name='credit-card' color="#2563eb" size={24} />
                <Text className="text-gray-900 font-semibold mt-2 text-sm">KYC & Verification</Text>
                <Text className="text-gray-500 text-xs mt-1">Document issues</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() =>
                  setTicketForm(prev => ({
                    ...prev,
                    category: 'Delivery Issues',
                  }))
                }
                className="flex-1 min-w-[45%] bg-purple-50 rounded-xl p-3 border border-purple-200">
                <Feather name='map-pin' color="#9333ea" size={24} />
                <Text className="text-gray-900 font-semibold mt-2 text-sm">Delivery Issues</Text>
                <Text className="text-gray-500 text-xs mt-1">Address/OTP problems</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Raise a Ticket */}
          <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
            <Text className="text-gray-900 text-lg font-bold mb-3">Raise a Ticket</Text>

            {/* Category Picker */}
            <View className="mb-3">
              <Text className="text-gray-700 font-medium mb-2">Issue Category *</Text>
              <TouchableOpacity
                onPress={() => setShowCategoryPicker(!showCategoryPicker)}
                className="border border-gray-300 rounded-xl px-4 py-3 flex-row items-center justify-between"
              >
                <Text className={ticketForm.category ? 'text-gray-900' : 'text-gray-400'}>
                  {ticketForm.category || 'Select category'}
                </Text>
                <Feather name='chevron-down' color="#9ca3af" size={20} />
              </TouchableOpacity>

              {showCategoryPicker && (
                <View className="border border-gray-200 rounded-xl mt-2 overflow-hidden">
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => {
                        setTicketForm({ ...ticketForm, category: cat });
                        setShowCategoryPicker(false);
                      }}
                      className="px-4 py-3 border-b border-gray-100"
                    >
                      <Text className="text-gray-900">{cat}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Order ID */}
            <View className="mb-3">
              <Text className="text-gray-700 font-medium mb-2">Order ID (Optional)</Text>
              <TextInput
                value={ticketForm.orderId}
                onChangeText={(text) => setTicketForm({ ...ticketForm, orderId: text })}
                placeholder="e.g., ORD123456"
                className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900"
              />
            </View>

            {/* Message */}
            <View className="mb-3">
              <Text className="text-gray-700 font-medium mb-2">Describe your issue *</Text>
              <TextInput
                value={ticketForm.message}
                onChangeText={(text) => setTicketForm({ ...ticketForm, message: text })}
                placeholder="Please provide details about your issue..."
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900"
              />
            </View>

            {/* Upload */}
            <TouchableOpacity className="border-2 border-dashed border-gray-300 rounded-xl py-4 mb-4 items-center">
              <Feather name='upload' color="#9ca3af" size={24} />
              <Text className="text-gray-500 text-sm mt-2">Upload screenshot (optional)</Text>
            </TouchableOpacity>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleSubmitTicket}
              className="bg-[#4f46e5] rounded-xl py-4 items-center"
            >
              <Text className="text-white font-bold">Submit Ticket</Text>
            </TouchableOpacity>
          </View>

          {/* My Tickets */}
          <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
            <Text className="text-gray-900 text-lg font-bold mb-3">My Support Tickets</Text>

            {tickets.map((ticket) => (
              <TouchableOpacity
                key={ticket.id}
                className="border border-gray-200 rounded-xl p-3 mb-2"
              >
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-gray-900 font-semibold">{ticket.id}</Text>
                  <View className={`px-3 py-1 rounded-full ${getStatusColor(ticket.status)}`}>
                    <Text className="text-xs font-medium">{ticket.status}</Text>
                  </View>
                </View>
                <Text className="text-gray-600 text-sm mb-1">{ticket.category}</Text>
                <View className="flex-row items-center">
                  <Feather name='clock' color="#9ca3af" size={14} />
                  <Text className="text-gray-400 text-xs ml-1">{ticket.date}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* FAQs */}
          <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
            <Text className="text-gray-900 text-lg font-bold mb-3">Frequently Asked Questions</Text>

            {faqs.map((faq, index) => (
              <View key={index} className="border-b border-gray-100 py-3">
                <TouchableOpacity
                  onPress={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  className="flex-row items-center justify-between"
                >
                  <Text className="text-gray-900 font-medium flex-1 pr-2">{faq.question}</Text>
                  {expandedFaq === index ? (
                    <Feather name='chevron-up' color="#4f46e5" size={20} />
                  ) : (
                    <Feather name='chevron-down' color="#9ca3af" size={20} />
                  )}
                </TouchableOpacity>
                {expandedFaq === index && (
                  <Text className="text-gray-600 text-sm mt-2 leading-5">{faq.answer}</Text>
                )}
              </View>
            ))}
          </View>

          {/* App Info Footer */}
          <View className="bg-white rounded-2xl p-4 items-center">
            <Text className="text-gray-400 text-xs mb-2">App Version 2.4.1</Text>
            <View className="flex-row gap-4">
              <TouchableOpacity>
                <Text className="text-indigo-600 text-xs">Terms & Conditions</Text>
              </TouchableOpacity>
              <TouchableOpacity>
                <Text className="text-indigo-600 text-xs">Privacy Policy</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView >
  );
}
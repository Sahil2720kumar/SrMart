// components/VendorOrderActions.tsx
import { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, TextInput } from 'react-native';
import { supabase } from '@/lib/supabase';

interface VendorOrderActionsProps {
  orderId: string;
  vendorId: string;
  orderStatus: string;
  onStatusChange: () => void;
}

export default function VendorOrderActions({
  orderId,
  vendorId,
  orderStatus,
  onStatusChange,
}: VendorOrderActionsProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const handleAcceptOrder = async () => {
    Alert.alert(
      'Accept Order',
      'Are you sure you want to accept this order?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            setIsProcessing(true);
            try {
              const { error } = await supabase.rpc('vendor_accept_order', {
                p_order_id: orderId,
                p_vendor_id: vendorId,
              });

              if (error) throw error;

              Alert.alert('Success', 'Order accepted successfully!');
              onStatusChange();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ]
    );
  };

  const handleRejectOrder = async () => {
    if (!rejectionReason.trim()) {
      Alert.alert('Error', 'Please provide a rejection reason');
      return;
    }

    setIsProcessing(true);
    try {
      const { error } = await supabase.rpc('vendor_reject_order', {
        p_order_id: orderId,
        p_vendor_id: vendorId,
        p_rejection_reason: rejectionReason,
      });

      if (error) throw error;

      Alert.alert('Success', 'Order rejected. Customer will be notified.');
      setShowRejectModal(false);
      onStatusChange();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Only show actions for pending/confirmed orders
  if (!['pending', 'confirmed'].includes(orderStatus)) {
    return null;
  }

  return (
    <View className="p-4 bg-white border-t border-gray-200">
      <View className="flex-row gap-3">
        {/* Accept Button */}
        <TouchableOpacity
          onPress={handleAcceptOrder}
          disabled={isProcessing}
          className="flex-1 bg-green-500 rounded-xl py-4 items-center"
          style={{ opacity: isProcessing ? 0.6 : 1 }}
        >
          <Text className="text-white font-bold text-base">
            ✓ Accept Order
          </Text>
        </TouchableOpacity>

        {/* Reject Button */}
        <TouchableOpacity
          onPress={() => setShowRejectModal(true)}
          disabled={isProcessing}
          className="flex-1 bg-red-500 rounded-xl py-4 items-center"
          style={{ opacity: isProcessing ? 0.6 : 1 }}
        >
          <Text className="text-white font-bold text-base">
            ✗ Reject Order
          </Text>
        </TouchableOpacity>
      </View>

      {/* Rejection Modal */}
      {showRejectModal && (
        <View className="mt-4 p-4 bg-red-50 rounded-xl">
          <Text className="font-bold text-gray-900 mb-2">
            Reason for rejection:
          </Text>
          <TextInput
            value={rejectionReason}
            onChangeText={setRejectionReason}
            placeholder="e.g., Out of stock, too busy, etc."
            multiline
            numberOfLines={3}
            className="bg-white p-3 rounded-lg border border-gray-200 mb-3"
          />
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => setShowRejectModal(false)}
              className="flex-1 bg-gray-200 rounded-lg py-3"
            >
              <Text className="text-center font-semibold">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleRejectOrder}
              disabled={isProcessing}
              className="flex-1 bg-red-500 rounded-lg py-3"
            >
              <Text className="text-center font-semibold text-white">
                Confirm Reject
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}
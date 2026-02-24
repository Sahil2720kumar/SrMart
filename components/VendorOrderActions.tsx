// components/VendorOrderActions.tsx
import { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Modal, Pressable, ActivityIndicator } from 'react-native';
import { supabase } from '@/lib/supabase';
import Toast from 'react-native-toast-message';

interface VendorOrderActionsProps {
  orderId: string;
  vendorId: string;
  orderStatus: string;
  onStatusChange: () => void;
}

// ---------------------------------------------------------------------------
// Reusable Confirm Modal
// ---------------------------------------------------------------------------
interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmStyle?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  confirmStyle = 'primary',
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmModalProps) {
  const confirmBg = confirmStyle === 'danger' ? 'bg-red-500' : 'bg-emerald-500';
  const accentBg = confirmStyle === 'danger' ? 'bg-red-500' : 'bg-emerald-500';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <Pressable
        className="flex-1 bg-black/50 items-center justify-center px-6"
        onPress={onCancel}
      >
        <Pressable className="w-full bg-white rounded-2xl overflow-hidden shadow-2xl">
          <View className={`h-1 w-full ${accentBg}`} />
          <View className="p-6">
            <Text className="text-gray-900 text-lg font-bold mb-2">{title}</Text>
            <Text className="text-gray-600 text-sm leading-6">{message}</Text>
          </View>
          <View className="flex-row border-t border-gray-100">
            <TouchableOpacity
              onPress={onCancel}
              disabled={loading}
              className="flex-1 py-4 items-center border-r border-gray-100"
            >
              <Text className="text-gray-600 font-semibold text-sm">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onConfirm}
              disabled={loading}
              className={`flex-1 py-4 items-center ${confirmBg} ${loading ? 'opacity-60' : ''}`}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text className="text-white font-bold text-sm">{confirmLabel}</Text>
              )}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export default function VendorOrderActions({
  orderId,
  vendorId,
  orderStatus,
  onStatusChange,
}: VendorOrderActionsProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  // Accept modal
  const [acceptModalVisible, setAcceptModalVisible] = useState(false);

  // Reject flow
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectConfirmModalVisible, setRejectConfirmModalVisible] = useState(false);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handleConfirmAccept = async () => {
    setAcceptModalVisible(false);
    setIsProcessing(true);
    try {
      const { error } = await supabase.rpc('vendor_accept_order', {
        p_order_id: orderId,
        p_vendor_id: vendorId,
      });
      if (error) throw error;

      Toast.show({
        type: 'success',
        text1: 'Order Accepted',
        text2: 'The order has been accepted successfully.',
        position: 'top',
      });
      onStatusChange();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Accept Failed',
        text2: error?.message || 'Failed to accept order. Please try again.',
        position: 'top',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectPress = () => {
    setShowRejectInput(true);
  };

  const handleRejectConfirmPress = () => {
    if (!rejectionReason.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Reason Required',
        text2: 'Please provide a reason for rejection before confirming.',
        position: 'top',
      });
      return;
    }
    setRejectConfirmModalVisible(true);
  };

  const handleConfirmReject = async () => {
    setRejectConfirmModalVisible(false);
    setIsProcessing(true);
    try {
      const { error } = await supabase.rpc('vendor_reject_order', {
        p_order_id: orderId,
        p_vendor_id: vendorId,
        p_rejection_reason: rejectionReason,
      });
      if (error) throw error;

      Toast.show({
        type: 'success',
        text1: 'Order Rejected',
        text2: 'The customer will be notified.',
        position: 'top',
      });
      setShowRejectInput(false);
      setRejectionReason('');
      onStatusChange();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Reject Failed',
        text2: error?.message || 'Failed to reject order. Please try again.',
        position: 'top',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Guard
  // ---------------------------------------------------------------------------
  if (!['pending', 'confirmed'].includes(orderStatus)) {
    return null;
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <View className="p-4 bg-white border-t border-gray-200">
      {/* ── Action Buttons ── */}
      <View className="flex-row gap-3">
        <TouchableOpacity
          onPress={() => setAcceptModalVisible(true)}
          disabled={isProcessing}
          className="flex-1 bg-green-500 rounded-xl py-4 items-center"
          style={{ opacity: isProcessing ? 0.6 : 1 }}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text className="text-white font-bold text-base">✓ Accept Order</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleRejectPress}
          disabled={isProcessing}
          className="flex-1 bg-red-500 rounded-xl py-4 items-center"
          style={{ opacity: isProcessing ? 0.6 : 1 }}
        >
          <Text className="text-white font-bold text-base">✗ Reject Order</Text>
        </TouchableOpacity>
      </View>

      {/* ── Rejection Reason Input ── */}
      {showRejectInput && (
        <View className="mt-4 p-4 bg-red-50 rounded-xl">
          <Text className="font-bold text-gray-900 mb-2">Reason for rejection:</Text>
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
              onPress={() => {
                setShowRejectInput(false);
                setRejectionReason('');
              }}
              className="flex-1 bg-gray-200 rounded-lg py-3"
            >
              <Text className="text-center font-semibold text-gray-700">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleRejectConfirmPress}
              disabled={isProcessing}
              className="flex-1 bg-red-500 rounded-lg py-3"
              style={{ opacity: isProcessing ? 0.6 : 1 }}
            >
              <Text className="text-center font-semibold text-white">Confirm Reject</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── Accept Confirm Modal ── */}
      <ConfirmModal
        visible={acceptModalVisible}
        title="Accept Order"
        message="Are you sure you want to accept this order? The customer will be notified."
        confirmLabel="Accept"
        confirmStyle="primary"
        loading={isProcessing}
        onConfirm={handleConfirmAccept}
        onCancel={() => setAcceptModalVisible(false)}
      />

      {/* ── Reject Confirm Modal ── */}
      <ConfirmModal
        visible={rejectConfirmModalVisible}
        title="Reject Order"
        message={`Reject this order with reason: "${rejectionReason}"? The customer will be notified.`}
        confirmLabel="Reject"
        confirmStyle="danger"
        loading={isProcessing}
        onConfirm={handleConfirmReject}
        onCancel={() => setRejectConfirmModalVisible(false)}
      />
    </View>
  );
}
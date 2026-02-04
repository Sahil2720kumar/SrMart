// components/RejectOrderBottomSheet.tsx
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';

interface RejectOrderBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isLoading?: boolean;
  orderNumber?: string;
}

const QUICK_REASONS = [
  'Out of Stock',
  'Too Busy ',
  'Cannot Deliver',
  'Store Closed',
  'Other',
];

export default function RejectOrderBottomSheet({
  visible,
  onClose,
  onConfirm,
  isLoading = false,
  orderNumber,
}: RejectOrderBottomSheetProps) {
  const [selectedQuickReason, setSelectedQuickReason] = useState<string | null>(null);
  const [customReason, setCustomReason] = useState('');

  const handleConfirm = () => {
    const reason = selectedQuickReason === 'Other' 
      ? customReason.trim() 
      : selectedQuickReason || customReason.trim();
    
    if (!reason) {
      return;
    }

    onConfirm(reason);
    handleClose();
  };

  const handleClose = () => {
    setSelectedQuickReason(null);
    setCustomReason('');
    onClose();
  };

  const isValid = selectedQuickReason 
    ? (selectedQuickReason === 'Other' ? customReason.trim().length >= 10 : true)
    : customReason.trim().length >= 10;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <Pressable className="flex-1 bg-black/50" onPress={handleClose}>
        <Pressable 
          onPress={(e) => e.stopPropagation()}
          className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl"
        >
          {/* Header */}
          <View className="p-4 border-b border-gray-100">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-xl font-bold text-gray-900">
                Reject Order
              </Text>
              <TouchableOpacity
                onPress={handleClose}
                className="w-8 h-8 items-center justify-center rounded-full bg-gray-100"
              >
                <Feather name="x" size={18} color="#374151" />
              </TouchableOpacity>
            </View>
            
            {orderNumber && (
              <Text className="text-sm text-gray-600">#{orderNumber}</Text>
            )}
          </View>

          {/* Content */}
          <View className="p-4">
            {/* Quick Reasons */}
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              Quick reasons
            </Text>
            <View className="flex-row flex-wrap gap-2 mb-4">
              {QUICK_REASONS.map((reason) => (
                <TouchableOpacity
                  key={reason}
                  onPress={() => setSelectedQuickReason(reason)}
                  className={`px-4 py-2 rounded-full border ${
                    selectedQuickReason === reason
                      ? 'bg-red-50 border-red-500'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      selectedQuickReason === reason
                        ? 'text-red-700'
                        : 'text-gray-700'
                    }`}
                  >
                    {reason}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Custom Reason */}
            {(selectedQuickReason === 'Other' || !selectedQuickReason) && (
              <>
                <Text className="text-sm font-semibold text-gray-700 mb-2">
                  {selectedQuickReason === 'Other' ? 'Specify reason' : 'Or type your reason'}
                </Text>
                <TextInput
                  value={customReason}
                  onChangeText={setCustomReason}
                  placeholder="Enter reason for rejection..."
                  multiline
                  numberOfLines={3}
                  maxLength={200}
                  className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900 min-h-[80px]"
                  style={{ textAlignVertical: 'top' }}
                />
                <Text className="text-xs text-gray-500 mt-1 text-right">
                  {customReason.length}/200
                </Text>
              </>
            )}
          </View>

          {/* Actions */}
          <View className="p-4 gap-2 border-t border-gray-100">
            <TouchableOpacity
              onPress={handleConfirm}
              disabled={!isValid || isLoading}
              className={`rounded-xl py-4 items-center ${
                !isValid || isLoading ? 'bg-gray-300' : 'bg-red-500'
              }`}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-base">
                  Confirm Rejection
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleClose}
              disabled={isLoading}
              className="bg-gray-100 rounded-xl py-4 items-center"
            >
              <Text className="text-gray-700 font-semibold text-base">
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
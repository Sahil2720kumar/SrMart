import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

interface DeliveryConfirmationModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  icon?: keyof typeof Feather.glyphMap;
  iconColor?: string;
}

const DeliveryConfirmationModal: React.FC<DeliveryConfirmationModalProps> = ({
  visible,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isLoading = false,
  icon = 'alert-circle',
  iconColor = '#6366f1',
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 items-center justify-center px-4">
        <View className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl">
          {/* Icon Header */}
          <View className="items-center pt-8 pb-4">
            <View
              className="w-16 h-16 rounded-full items-center justify-center mb-4"
              style={{ backgroundColor: `${iconColor}20` }}
            >
              <Feather name={icon} size={32} color={iconColor} />
            </View>
            <Text className="text-xl font-bold text-gray-900 px-6 text-center">
              {title}
            </Text>
          </View>

          {/* Message */}
          <View className="px-6 pb-6">
            <Text className="text-center text-gray-600 leading-6">
              {message}
            </Text>
          </View>

          {/* Actions */}
          <View className="flex-row border-t border-gray-200">
            <TouchableOpacity
              onPress={onClose}
              disabled={isLoading}
              className="flex-1 py-4 items-center justify-center border-r border-gray-200"
              activeOpacity={0.7}
            >
              <Text className="font-semibold text-gray-700">{cancelText}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onConfirm}
              disabled={isLoading}
              className="flex-1 py-4 items-center justify-center"
              activeOpacity={0.7}
            >
              {isLoading ? (
                <ActivityIndicator color={iconColor} />
              ) : (
                <Text className="font-bold" style={{ color: iconColor }}>
                  {confirmText}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default DeliveryConfirmationModal;
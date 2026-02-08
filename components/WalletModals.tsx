import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, Text, TextInput, TouchableOpacity,View } from "react-native";



/* ---------------- WITHDRAWAL MODAL COMPONENT ---------------- */
export const WithdrawalModal = ({ 
  visible, 
  onClose, 
  availableBalance,
  onSubmit,
  isLoading,
}: {
  visible: boolean;
  onClose: () => void;
  availableBalance: number;
  onSubmit: (amount: number) => void;
  isLoading: boolean;
}) => {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  const handleAmountChange = (text: string) => {
    // Only allow numbers and decimal point
    const cleaned = text.replace(/[^0-9.]/g, '');
    // Prevent multiple decimal points
    const parts = cleaned.split('.');
    const formatted = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : cleaned;
    setAmount(formatted);
    setError('');
  };

  const handleSubmit = () => {
    const withdrawAmount = parseFloat(amount);
    
    if (!amount || isNaN(withdrawAmount)) {
      setError('Please enter a valid amount');
      return;
    }
    
    if (withdrawAmount <= 0) {
      setError('Amount must be greater than zero');
      return;
    }
    
    if (withdrawAmount > availableBalance) {
      setError(`Maximum withdrawal amount is ₹${availableBalance.toLocaleString('en-IN')}`);
      return;
    }

    onSubmit(withdrawAmount);
  };

  const handleClose = () => {
    setAmount('');
    setError('');
    onClose();
  };

  const setQuickAmount = (percentage: number) => {
    const quickAmount = (availableBalance * percentage / 100).toFixed(2);
    setAmount(quickAmount);
    setError('');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <Pressable
          className="flex-1 bg-black/50 justify-end"
          onPress={handleClose}
        >
          <Pressable 
            className="bg-white rounded-t-3xl"
            onPress={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <View className="flex-row items-center justify-between p-6 pb-4 border-b border-gray-100">
              <View>
                <Text className="text-2xl font-bold text-gray-900">Withdraw Funds</Text>
                <Text className="text-sm text-gray-500 mt-1">
                  Available: ₹{availableBalance.toLocaleString('en-IN')}
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleClose}
                className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center"
              >
                <Feather name="x" size={20} color="#374151" />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <View className="p-6">
              {/* Amount Input */}
              <View className="mb-4">
                <Text className="text-sm font-semibold text-gray-700 mb-2">
                  Enter Amount
                </Text>
                <View className="flex-row items-center bg-gray-50 rounded-xl px-4 py-3 border-2 border-gray-200">
                  <Text className="text-2xl font-bold text-gray-900 mr-2">₹</Text>
                  <TextInput
                    value={amount}
                    onChangeText={handleAmountChange}
                    placeholder="0.00"
                    placeholderTextColor="#9ca3af"
                    keyboardType="decimal-pad"
                    className="flex-1 text-2xl font-bold text-gray-900"
                    autoFocus
                  />
                </View>
                {error ? (
                  <View className="flex-row items-center mt-2">
                    <Feather name="alert-circle" size={14} color="#ef4444" />
                    <Text className="text-red-500 text-xs ml-1">{error}</Text>
                  </View>
                ) : null}
              </View>

              {/* Quick Amount Buttons */}
              <View className="mb-6">
                <Text className="text-sm font-semibold text-gray-700 mb-2">
                  Quick Select
                </Text>
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    onPress={() => setQuickAmount(25)}
                    className="flex-1 bg-indigo-50 py-3 rounded-lg border border-indigo-200"
                    activeOpacity={0.7}
                  >
                    <Text className="text-indigo-700 font-bold text-center">25%</Text>
                    <Text className="text-indigo-600 text-xs text-center mt-0.5">
                      ₹{(availableBalance * 0.25).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setQuickAmount(50)}
                    className="flex-1 bg-indigo-50 py-3 rounded-lg border border-indigo-200"
                    activeOpacity={0.7}
                  >
                    <Text className="text-indigo-700 font-bold text-center">50%</Text>
                    <Text className="text-indigo-600 text-xs text-center mt-0.5">
                      ₹{(availableBalance * 0.5).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setQuickAmount(100)}
                    className="flex-1 bg-indigo-50 py-3 rounded-lg border border-indigo-200"
                    activeOpacity={0.7}
                  >
                    <Text className="text-indigo-700 font-bold text-center">100%</Text>
                    <Text className="text-indigo-600 text-xs text-center mt-0.5">
                      ₹{availableBalance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Info Banner */}
              <View className="bg-blue-50 rounded-xl p-4 mb-6 flex-row">
                <Feather name="info" size={20} color="#3b82f6" />
                <View className="flex-1 ml-3">
                  <Text className="text-blue-900 font-semibold text-sm mb-1">
                    Processing Time
                  </Text>
                  <Text className="text-blue-700 text-xs leading-5">
                    Your withdrawal will be reviewed and processed within 24-48 hours. Funds will be transferred to your registered bank account.
                  </Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={handleClose}
                  className="flex-1 bg-gray-100 py-4 rounded-xl"
                  activeOpacity={0.7}
                  disabled={isLoading}
                >
                  <Text className="text-gray-700 font-bold text-center text-base">
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={isLoading || !amount}
                  className={`flex-1 py-4 rounded-xl flex-row items-center justify-center gap-2 ${
                    isLoading || !amount ? 'bg-gray-300' : 'bg-green-500'
                  }`}
                  activeOpacity={0.7}
                >
                  {isLoading ? (
                    <>
                      <ActivityIndicator color="white" size="small" />
                      <Text className="text-white font-bold text-base">Processing...</Text>
                    </>
                  ) : (
                    <>
                      <Feather name="arrow-down-circle" size={20} color="white" />
                      <Text className="text-white font-bold text-base">Withdraw</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
};

/* ---------------- CANCEL CASHOUT MODAL COMPONENT ---------------- */
export const CancelCashoutModal = ({
  visible,
  onClose,
  onConfirm,
  requestNumber,
  amount,
  isLoading,
}: {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  requestNumber: string;
  amount: string;
  isLoading: boolean;
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable 
        className="flex-1 bg-black/50 items-center justify-center px-6"
        onPress={onClose}
      >
        <Pressable 
          className="bg-white rounded-3xl p-6 w-full max-w-md"
          onPress={(e) => e.stopPropagation()}
        >
          {/* Icon */}
          <View className="w-16 h-16 bg-red-100 rounded-full items-center justify-center mx-auto mb-4">
            <Feather name="alert-triangle" size={32} color="#ef4444" />
          </View>

          {/* Title */}
          <Text className="text-xl font-bold text-gray-900 text-center mb-2">
            Cancel Withdrawal?
          </Text>

          {/* Description */}
          <Text className="text-gray-600 text-center mb-6">
            Are you sure you want to cancel withdrawal request{' '}
            <Text className="font-bold">#{requestNumber}</Text> for{' '}
            <Text className="font-bold">₹{parseFloat(amount).toLocaleString('en-IN')}</Text>?
            {'\n\n'}
            Funds will be returned to your available balance.
          </Text>

          {/* Buttons */}
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={onClose}
              disabled={isLoading}
              className="flex-1 bg-gray-100 py-4 rounded-xl"
              activeOpacity={0.7}
            >
              <Text className="text-gray-700 font-bold text-center">No, Keep It</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onConfirm}
              disabled={isLoading}
              className="flex-1 bg-red-500 py-4 rounded-xl flex-row items-center justify-center gap-2"
              activeOpacity={0.7}
            >
              {isLoading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <Feather name="x-circle" size={18} color="white" />
                  <Text className="text-white font-bold">Yes, Cancel</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

/* ---------------- SUCCESS MODAL COMPONENT ---------------- */
export const SuccessModal = ({
  visible,
  onClose,
  amount,
}: {
  visible: boolean;
  onClose: () => void;
  amount: number;
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable 
        className="flex-1 bg-black/50 items-center justify-center px-6"
        onPress={onClose}
      >
        <Pressable 
          className="bg-white rounded-3xl p-6 w-full max-w-md"
          onPress={(e) => e.stopPropagation()}
        >
          {/* Icon */}
          <View className="w-16 h-16 bg-green-100 rounded-full items-center justify-center mx-auto mb-4">
            <Feather name="check-circle" size={32} color="#22c55e" />
          </View>

          {/* Title */}
          <Text className="text-xl font-bold text-gray-900 text-center mb-2">
            Request Submitted!
          </Text>

          {/* Description */}
          <Text className="text-gray-600 text-center mb-6">
            Your withdrawal request for{' '}
            <Text className="font-bold">₹{amount.toLocaleString('en-IN')}</Text>{' '}
            has been submitted successfully.
            {'\n\n'}
            You'll be notified once it's approved and processed.
          </Text>

          {/* Button */}
          <TouchableOpacity
            onPress={onClose}
            className="bg-green-500 py-4 rounded-xl"
            activeOpacity={0.7}
          >
            <Text className="text-white font-bold text-center text-base">Great!</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};
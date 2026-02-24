import { blurhash } from "@/types/categories-products.types";
import { KycDocument, KycDocumentStatus } from "@/types/documents-kyc.types";
import { Feather, Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { memo, useState } from "react";
import { ActivityIndicator, Alert, Dimensions, Linking, Modal, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

// Document Viewer Modal Component
function DocumentViewerModal({
  visible,
  document,
  onClose
}: {
  visible: boolean;
  document: KycDocument | null;
  onClose: () => void;
}) {
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  if (!document) return null;

  function getStatusBadge(status: KycDocumentStatus) {
    switch (status) {
      case 'verified':
      case 'approved':
        return {
          bg: 'bg-emerald-100',
          text: 'text-emerald-700',
          label: 'Verified',
          icon: <Feather name='check-circle' size={16} color="#059669" />,
        };
      case 'pending':
        return {
          bg: 'bg-blue-100',
          text: 'text-blue-700',
          label: 'Pending Verification',
          icon: <Feather name='clock' size={16} color="#2563eb" />,
        };
      case 'rejected':
        return {
          bg: 'bg-red-100',
          text: 'text-red-700',
          label: 'Rejected',
          icon: <Feather name='alert-circle' size={16} color="#dc2626" />,
        };
      default:
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-700',
          label: 'Not Uploaded',
          icon: <Feather name='upload' size={16} color="#6b7280" />,
        };
    }
  }

  const statusInfo = getStatusBadge(document.status);

  const handleShare = async () => {
    if (document.document_url) {
      try {
        await Linking.openURL(document.document_url);
      } catch (error) {
        Toast.show({
          type: 'error',
          text1: 'Unable to open document URL',
          position: 'top',
        });
      }
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/95">
        {/* Header */}
        <SafeAreaView className="bg-black/50">
          <View className="px-4 py-4 flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-white font-bold text-lg">
                {document.document_name}
              </Text>
              <Text className="text-gray-300 text-xs mt-1">
                {document.document_description}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="bg-white/10 rounded-full p-2 ml-3"
            >
              <Feather name="x" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        {/* Document Image */}
        <View className="flex-1 items-center justify-center px-4">
          {document.document_url ? (
            <View className="w-full items-center">
              {imageError ? (
                <View className="bg-gray-800 rounded-2xl p-8 items-center">
                  <Ionicons name="image-outline" size={64} color="#9ca3af" />
                  <Text className="text-gray-400 text-center mt-4">
                    Unable to load image
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setImageError(false);
                      setImageLoading(true);
                    }}
                    className="bg-emerald-600 rounded-lg px-6 py-3 mt-4"
                  >
                    <Text className="text-white font-bold">Retry</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Image
                  source={document.document_url}
                  placeholder={{ blurhash: blurhash }}
                  contentFit="cover"
                  transition={1000}
                  style={{
                    width: SCREEN_WIDTH - 32,
                    height: SCREEN_HEIGHT * 0.6,
                  }}
                  onLoadStart={() => setImageLoading(true)}
                  onLoadEnd={() => setImageLoading(false)}
                  onError={() => {
                    setImageLoading(false);
                    setImageError(true);
                  }}
                />
              )}
            </View>
          ) : (
            <View className="bg-gray-800 rounded-2xl p-8 items-center">
              <Ionicons name="document-outline" size={64} color="#9ca3af" />
              <Text className="text-gray-400 text-center mt-4">
                No document available
              </Text>
            </View>
          )}
        </View>

        {/* Document Info Footer */}
        <View className="bg-gray-900 rounded-t-3xl px-4 pt-6 pb-8">
          {/* Status Badge */}
          <View className="flex-row items-center justify-between mb-4">
            <View className={`flex-row items-center gap-2 px-4 py-2 rounded-full ${statusInfo.bg}`}>
              {statusInfo.icon}
              <Text className={`font-bold text-sm ${statusInfo.text}`}>
                {statusInfo.label}
              </Text>
            </View>

            {document.document_url && (
              <TouchableOpacity
                onPress={handleShare}
                className="bg-emerald-600 rounded-full px-4 py-2 flex-row items-center gap-2"
              >
                <Feather name="external-link" size={16} color="white" />
                <Text className="text-white font-bold text-sm">Open</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Document Details */}
          <View className="space-y-3">
            {document.uploaded_date && (
              <View className="flex-row items-center gap-3">
                <View className="bg-gray-800 rounded-full p-2">
                  <Feather name="upload" size={16} color="#9ca3af" />
                </View>
                <View>
                  <Text className="text-gray-400 text-xs">Uploaded On</Text>
                  <Text className="text-white font-medium text-sm">
                    {new Date(document.uploaded_date).toLocaleDateString('en-US', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </Text>
                </View>
              </View>
            )}

            {document.verified_date && (
              <View className="flex-row items-center gap-3">
                <View className="bg-emerald-900 rounded-full p-2">
                  <Feather name="check-circle" size={16} color="#10b981" />
                </View>
                <View>
                  <Text className="text-gray-400 text-xs">Verified On</Text>
                  <Text className="text-white font-medium text-sm">
                    {new Date(document.verified_date).toLocaleDateString('en-US', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </Text>
                </View>
              </View>
            )}

            {document.status === 'rejected' && document.rejection_reason && (
              <View className="bg-red-900/20 border border-red-800 rounded-xl p-4 mt-2">
                <View className="flex-row items-start gap-3">
                  <Feather name="alert-circle" size={20} color="#dc2626" />
                  <View className="flex-1">
                    <Text className="text-red-400 font-bold text-sm mb-1">
                      Rejection Reason
                    </Text>
                    <Text className="text-red-300 text-xs leading-5">
                      {document.rejection_reason}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {document.status === 'pending' && (
              <View className="bg-blue-900/20 border border-blue-800 rounded-xl p-4 mt-2">
                <View className="flex-row items-start gap-3">
                  <Feather name="clock" size={20} color="#3b82f6" />
                  <View className="flex-1">
                    <Text className="text-blue-400 font-bold text-sm mb-1">
                      Under Review
                    </Text>
                    <Text className="text-blue-300 text-xs leading-5">
                      Your document is being verified. This usually takes up to 24 hours.
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default memo(DocumentViewerModal)
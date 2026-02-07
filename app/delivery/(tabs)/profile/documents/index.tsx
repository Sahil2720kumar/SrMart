import { Feather, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import {
  useDeliveryBoyKycDocuments,
  useDeliveryBoyKycSummary,
  useUploadDeliveryBoyKycDocument,
  useReplaceDeliveryBoyKycDocument,
  useDeleteDeliveryBoyKycDocument,
} from '@/hooks/queries/useDeliveryBoy';
import { useAuthStore } from '@/store/authStore';
import { FullPageError } from '@/components/ErrorComp';
import { KycDocument, KycDocumentStatus, KycDocumentType } from '@/types/documents-kyc.types';
import { BlurView } from 'expo-blur';
import DocumentViewerModal from '@/components/DocumentViewerModal';

const DOCUMENT_CONFIGS: Record<
  KycDocumentType,
  {
    label: string;
    description: string;
    isRequired: boolean;
    acceptedFormats: string;
  }
> = {
  aadhaar: {
    label: 'Aadhaar Card',
    description: 'Government issued identity proof',
    isRequired: true,
    acceptedFormats: 'JPG, PNG',
  },
  pan: {
    label: 'PAN Card',
    description: 'Permanent Account Number',
    isRequired: true,
    acceptedFormats: 'JPG, PNG',
  },
  driving_license: {
    label: 'Driving License',
    description: 'Valid driving license (Required for delivery)',
    isRequired: true,
    acceptedFormats: 'JPG, PNG',
  },
  bank_passbook: {
    label: 'Bank Passbook/Statement',
    description: 'Recent bank statement for payouts',
    isRequired: true,
    acceptedFormats: 'JPG, PNG',
  },
  profile_photo: {
    label: 'Profile Photo',
    description: 'Recent passport-size photograph',
    isRequired: true,
    acceptedFormats: 'JPG, PNG',
  },
};

function getStatusBadge(status: KycDocumentStatus) {
  switch (status) {
    case 'verified':
    case 'approved':
      return {
        bg: 'bg-emerald-100',
        text: 'text-emerald-700',
        label: 'Verified',
        icon: <Feather name="check-circle" size={16} color="#059669" />,
      };
    case 'pending':
      return {
        bg: 'bg-blue-100',
        text: 'text-blue-700',
        label: 'Pending Review',
        icon: <Feather name="clock" size={16} color="#2563eb" />,
      };
    case 'rejected':
      return {
        bg: 'bg-red-100',
        text: 'text-red-700',
        label: 'Rejected',
        icon: <Feather name="alert-circle" size={16} color="#dc2626" />,
      };
    default:
      return {
        bg: 'bg-gray-100',
        text: 'text-gray-700',
        label: 'Not Uploaded',
        icon: <Feather name="upload" size={16} color="#6b7280" />,
      };
  }
}

export default function DeliveryBoyDocumentsScreen() {
  const { session } = useAuthStore();

  // Fetch KYC documents
  const {
    data: documents,
    isLoading,
    isError,
    error,
    refetch,
  } = useDeliveryBoyKycDocuments(session?.user?.id || '');

  // Get KYC summary
  const summary = useDeliveryBoyKycSummary(session?.user?.id || '');

  // Mutations
  const uploadMutation = useUploadDeliveryBoyKycDocument();
  const replaceMutation = useReplaceDeliveryBoyKycDocument();
  const deleteMutation = useDeleteDeliveryBoyKycDocument();

  const [processingId, setProcessingId] = useState<string | null>(null);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<KycDocument | null>(null);
  const [uploadModal, setUploadModal] = useState(false);
  const [selectedDocumentType, setSelectedDocumentType] = useState<KycDocumentType | null>(null);

  // Helper to get document by type
  const getDocumentByType = (docType: KycDocumentType): KycDocument | undefined => {
    return documents?.find((doc) => doc.document_type === docType);
  };

  // Convert image URI to base64
  const convertImageToBase64 = async (uri: string): Promise<string> => {
    try {
      const localFile = new FileSystem.File(uri);
      const base64 = await localFile.base64();
      return base64;
    } catch (error) {
      console.error('Error converting image to base64:', error);
      throw new Error('Failed to process image');
    }
  };

  const handlePickImage = async (documentType: KycDocumentType) => {
    setSelectedDocumentType(documentType);
    setUploadModal(true);
  };

  const handleImagePicker = async (source: 'camera' | 'gallery') => {
    if (!selectedDocumentType) return;

    try {
      setProcessingId(selectedDocumentType);
      setUploadModal(false);

      let result;

      if (source === 'camera') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Permission Required', 'Camera permission is required to take photos');
          setProcessingId(null);
          return;
        }

        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });
      } else {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Permission Required', 'Gallery permission is required to select images');
          setProcessingId(null);
          return;
        }

        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets[0]) {
        await handleUpload(selectedDocumentType, result.assets[0].uri);
      } else {
        setProcessingId(null);
      }
    } catch (error: any) {
      console.error('Error picking image:', error);
      Alert.alert('Error', error.message || 'Failed to pick image. Please try again.');
      setProcessingId(null);
    } finally {
      setSelectedDocumentType(null);
    }
  };

  const handleUpload = async (documentType: KycDocumentType, imageUri: string) => {
    if (!session?.user?.id) {
      Alert.alert('Error', 'User not found');
      setProcessingId(null);
      return;
    }

    const userId = session?.user?.id;

    try {
      setProcessingId(documentType);

      const existingDoc = getDocumentByType(documentType);
      const config = DOCUMENT_CONFIGS[documentType];

      // Convert image to base64
      const base64 = await convertImageToBase64(imageUri);

      if (existingDoc) {
        // Replace existing document
        await replaceMutation.mutateAsync({
          documentId: existingDoc.id,
          userId: userId,
          oldDocumentUrl: existingDoc.document_url || undefined,
          newDocument: {
            user_id: userId,
            user_type: 'delivery_boy',
            document_type: documentType,
            document_name: config.label,
            document_description: config.description,
            is_required: config.isRequired,
            status: 'pending',
          },
          imageUri: imageUri,
          base64: base64,
        });

        Alert.alert(
          'Success',
          'Document replaced successfully! It will be verified within 24 hours.'
        );
      } else {
        // Upload new document
        await uploadMutation.mutateAsync({
          document: {
            user_id: userId,
            user_type: 'delivery_boy',
            document_type: documentType,
            document_name: config.label,
            document_description: config.description,
            is_required: config.isRequired,
            status: 'pending',
          },
          imageUri: imageUri,
          base64: base64,
        });

        Alert.alert(
          'Success',
          'Document uploaded successfully! It will be verified within 24 hours.'
        );
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      Alert.alert(
        'Upload Failed',
        error.message || 'Failed to upload document. Please check your connection and try again.'
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteDocument = (doc: KycDocument) => {
    Alert.alert('Delete Document', `Are you sure you want to delete ${doc.document_name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteMutation.mutateAsync({
              id: doc.id,
              userId: doc.user_id,
              documentUrl: doc.document_url || undefined,
            });
            Alert.alert('Success', 'Document deleted successfully');
          } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to delete document');
          }
        },
      },
    ]);
  };

  const handleViewDocument = (doc: KycDocument) => {
    if (!doc.document_url) {
      Alert.alert('No Document', 'No document file available');
      return;
    }

    setSelectedDocument(doc);
    setViewerVisible(true);
  };

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-[#4f46e5] items-center justify-center">
        <ActivityIndicator size="large" color="white" />
        <Text className="text-white mt-4">Loading documents...</Text>
      </SafeAreaView>
    );
  }

  // Error state
  if (isError) {
    return (
      <FullPageError
        code="500"
        message={error?.message || 'Failed to load documents'}
        onActionPress={refetch}
      />
    );
  }

  // Create list of all document types with their status
  const documentsList = (Object.keys(DOCUMENT_CONFIGS) as KycDocumentType[]).map((docType) => {
    const existingDoc = getDocumentByType(docType);
    const config = DOCUMENT_CONFIGS[docType];

    return {
      type: docType,
      config,
      document: existingDoc || null,
      status: (existingDoc?.status || 'not_uploaded') as KycDocumentStatus,
    };
  });

  const currentDocumentConfig = selectedDocumentType
    ? DOCUMENT_CONFIGS[selectedDocumentType]
    : null;

  return (
    <SafeAreaView className="flex-1 bg-[#4f46e5]">
      {/* Header */}
      <View className="bg-[#4f46e5] px-4 pt-4 pb-6">
        <View className="flex-row items-center gap-3 mb-4">
          <TouchableOpacity
            className="w-10 h-10 bg-white/20 rounded-full items-center justify-center"
            activeOpacity={0.8}
            onPress={() => router.back()}
          >
            <Feather name="arrow-left" size={24} color="#ffffff" />
          </TouchableOpacity>
          <View>
            <Text className="text-white text-2xl font-bold">Documents & Verification</Text>
            <Text className="text-white/80 text-sm mt-1">Upload your KYC documents</Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 bg-gray-50 rounded-t-3xl" showsVerticalScrollIndicator={false}>
        <View className="px-4 pt-6 pb-8">
          {/* Progress Summary */}
          <View
            className={`border rounded-2xl p-4 mb-6 ${
              summary.isComplete
                ? 'bg-emerald-50 border-emerald-200'
                : 'bg-blue-50 border-blue-200'
            }`}
          >
            <View className="flex-row items-center justify-between mb-3">
              <Text
                className={`font-bold text-base ${
                  summary.isComplete ? 'text-emerald-900' : 'text-blue-900'
                }`}
              >
                {summary.isComplete ? 'KYC Complete! 🎉' : 'Verification Progress'}
              </Text>
              {summary.isComplete && <Ionicons name="checkmark-circle" size={28} color="#059669" />}
            </View>

            <View className="flex-row items-center gap-3 mb-3">
              <View
                className={`flex-1 h-3 rounded-full overflow-hidden ${
                  summary.isComplete ? 'bg-emerald-200' : 'bg-blue-200'
                }`}
              >
                <View
                  className={`h-full ${summary.isComplete ? 'bg-emerald-600' : 'bg-blue-600'}`}
                  style={{ width: `${summary.progress}%` }}
                />
              </View>
              <Text
                className={`font-bold text-base ${
                  summary.isComplete ? 'text-emerald-700' : 'text-blue-700'
                }`}
              >
                {summary.progress}%
              </Text>
            </View>

            <Text
              className={`text-sm ${summary.isComplete ? 'text-emerald-700' : 'text-blue-700'}`}
            >
              {summary.requiredVerified} of {summary.required} required documents verified
            </Text>

            {summary.rejected > 0 && (
              <View className="flex-row items-center gap-2 mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
                <Ionicons name="alert-circle" size={18} color="#dc2626" />
                <Text className="text-red-700 text-sm font-semibold">
                  {summary.rejected} document{summary.rejected > 1 ? 's' : ''} need attention
                </Text>
              </View>
            )}
          </View>

          {/* Documents List */}
          <View className="gap-4">
            {documentsList.map((item) => {
              const statusInfo = getStatusBadge(item.status);
              const isProcessing =
                processingId === item.type ||
                uploadMutation.isPending ||
                replaceMutation.isPending ||
                deleteMutation.isPending;

              return (
                <View
                  key={item.type}
                  className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm"
                >
                  {/* Document Header */}
                  <View className="px-4 py-4 border-b border-gray-100">
                    <View className="flex-row items-start justify-between mb-2">
                      <View className="flex-1">
                        <View className="flex-row items-center gap-2 mb-1">
                          <Text className="text-gray-900 font-bold text-base">
                            {item.config.label}
                          </Text>
                          {item.config.isRequired && (
                            <View className="bg-amber-100 px-2 py-1 rounded-full">
                              <Text className="text-amber-700 text-xs font-bold">Required</Text>
                            </View>
                          )}
                        </View>
                        <Text className="text-gray-600 text-sm">{item.config.description}</Text>
                      </View>
                      <View
                        className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-full ${statusInfo.bg}`}
                      >
                        {statusInfo.icon}
                        <Text className={`text-xs font-semibold ${statusInfo.text}`}>
                          {statusInfo.label}
                        </Text>
                      </View>
                    </View>

                    {item.document?.uploaded_date && (
                      <Text className="text-gray-500 text-xs mt-1">
                        Uploaded: {new Date(item.document.uploaded_date).toLocaleDateString()}
                      </Text>
                    )}
                  </View>

                  {/* Rejection Reason */}
                  {item.status === 'rejected' && item.document?.rejection_reason && (
                    <View className="px-4 py-3 bg-red-50 border-b border-red-100 flex-row items-start gap-2">
                      <Feather
                        name="alert-circle"
                        size={16}
                        color="#dc2626"
                        style={{ marginTop: 2 }}
                      />
                      <View className="flex-1">
                        <Text className="text-red-900 font-semibold text-sm mb-1">
                          Rejection Reason
                        </Text>
                        <Text className="text-red-800 text-sm">{item.document.rejection_reason}</Text>
                      </View>
                    </View>
                  )}

                  {/* Action Buttons */}
                  <View className="px-4 py-3">
                    <View className="flex-row gap-2">
                      {/* Upload/Replace Button */}
                      <TouchableOpacity
                        onPress={() => handlePickImage(item.type)}
                        disabled={isProcessing}
                        className={`flex-1 bg-indigo-600 rounded-xl py-3 items-center justify-center active:opacity-70 ${
                          isProcessing ? 'opacity-50' : ''
                        }`}
                      >
                        {processingId === item.type ? (
                          <ActivityIndicator size="small" color="white" />
                        ) : (
                          <View className="flex-row items-center gap-2">
                            <Feather name="upload" size={16} color="white" />
                            <Text className="text-white font-bold text-sm">
                              {item.document ? 'Replace' : 'Upload'}
                            </Text>
                          </View>
                        )}
                      </TouchableOpacity>

                      {/* View & Delete Buttons */}
                      {item.document && (
                        <>
                          <TouchableOpacity
                            onPress={() => handleViewDocument(item.document!)}
                            disabled={isProcessing}
                            className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 items-center justify-center active:opacity-70"
                          >
                            <Feather name="eye" size={18} color="#3b82f6" />
                          </TouchableOpacity>

                          <TouchableOpacity
                            onPress={() => handleDeleteDocument(item.document!)}
                            disabled={isProcessing}
                            className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 items-center justify-center active:opacity-70"
                          >
                            <Feather name="trash-2" size={18} color="#dc2626" />
                          </TouchableOpacity>
                        </>
                      )}
                    </View>

                    <Text className="text-gray-500 text-xs mt-2 text-center">
                      Accepted: {item.config.acceptedFormats}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Info Banner */}
          <View className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mt-6">
            <View className="flex-row items-start gap-3">
              <Ionicons name="information-circle" size={22} color="#3b82f6" />
              <View className="flex-1">
                <Text className="text-blue-900 font-bold text-sm mb-2">Important Guidelines</Text>
                <Text className="text-blue-800 text-sm leading-6">
                  • Ensure all documents are clear and readable{'\n'}• Upload color images in JPG or
                  PNG format{'\n'}• All required documents must be verified to start deliveries
                  {'\n'}• Verification typically takes 24-48 hours
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Blur overlay when viewer is visible */}
      {viewerVisible && (
        <BlurView
          intensity={10}
          experimentalBlurMethod="dimezisBlurView"
          style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
        />
      )}

      {/* Document Viewer Modal */}
      <DocumentViewerModal
        visible={viewerVisible}
        document={selectedDocument}
        onClose={() => {
          setViewerVisible(false);
          setSelectedDocument(null);
        }}
      />

      {/* Upload Modal */}
      <Modal
        visible={uploadModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setUploadModal(false);
          setSelectedDocumentType(null);
        }}
      >
        <Pressable
          className="flex-1 bg-black/50 justify-end"
          onPress={() => {
            setUploadModal(false);
            setSelectedDocumentType(null);
          }}
        >
          <Pressable className="bg-white rounded-t-3xl p-6">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-1">
                <Text className="text-xl font-bold text-gray-900">
                  Upload {currentDocumentConfig?.label}
                </Text>
                <Text className="text-sm text-gray-600 mt-1">
                  {currentDocumentConfig?.description}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setUploadModal(false);
                  setSelectedDocumentType(null);
                }}
              >
                <Feather name="x" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <Text className="text-sm text-gray-600 mb-4">
              Choose how you'd like to upload. Accepted formats:{' '}
              {currentDocumentConfig?.acceptedFormats}
            </Text>

            <TouchableOpacity
              className="bg-[#4f46e5] py-4 rounded-xl flex-row items-center justify-center gap-3 mb-3"
              onPress={() => handleImagePicker('camera')}
            >
              <Feather name="camera" size={24} color="#ffffff" />
              <Text className="text-white font-semibold text-base">Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-indigo-100 py-4 rounded-xl flex-row items-center justify-center gap-3 mb-3"
              onPress={() => handleImagePicker('gallery')}
            >
              <Feather name="image" size={24} color="#4f46e5" />
              <Text className="text-[#4f46e5] font-semibold text-base">Choose from Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="py-4 rounded-xl flex-row items-center justify-center"
              onPress={() => {
                setUploadModal(false);
                setSelectedDocumentType(null);
              }}
            >
              <Text className="text-gray-600 font-medium">Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
import { Feather, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import Toast from 'react-native-toast-message';
import {
  useKycDocuments,
  useKycSummary,
  useUploadKycDocument,
  useReplaceKycDocument,
  useDeleteKycDocument,
} from '@/hooks/queries';
import { useVendorDetail } from '@/hooks/queries';
import { useAuthStore } from '@/store/authStore';
import { FullPageError } from '@/components/ErrorComp';
import { KycDocument, KycDocumentStatus, KycDocumentType } from '@/types/documents-kyc.types';
import { BlurView } from 'expo-blur';
import DocumentViewerModal from '@/components/DocumentViewerModal';

const DOCUMENT_CONFIGS: Record<KycDocumentType, {
  label: string;
  description: string;
  isRequired: boolean;
  acceptedFormats: string;
}> = {
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
    description: 'Valid driving license (Optional)',
    isRequired: false,
    acceptedFormats: 'JPG, PNG',
  },
  bank_passbook: {
    label: 'Bank Passbook/Statement',
    description: 'Recent bank statement or passbook',
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

export default function VendorDocumentsKYCScreen() {
  const { session } = useAuthStore();

  const {
    data: vendorData,
    isLoading: isLoadingVendor,
  } = useVendorDetail(session?.user?.id || '');

  const {
    data: documents,
    isLoading: isLoadingDocs,
    isError,
    error,
    refetch,
  } = useKycDocuments(session?.user?.id || '', 'vendor');

  const summary = useKycSummary(session?.user?.id || '', 'vendor');

  const uploadMutation = useUploadKycDocument();
  const replaceMutation = useReplaceKycDocument();
  const deleteMutation = useDeleteKycDocument();

  const [processingId, setProcessingId] = useState<string | null>(null);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<KycDocument | null>(null);

  // Upload source modal state
  const [uploadModal, setUploadModal] = useState(false);
  const [selectedDocumentType, setSelectedDocumentType] = useState<KycDocumentType | null>(null);

  // Delete confirmation modal state
  const [deleteModal, setDeleteModal] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<KycDocument | null>(null);

  const getDocumentByType = (docType: KycDocumentType): KycDocument | undefined => {
    return documents?.find(doc => doc.document_type === docType);
  };

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
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Toast.show({
        type: 'error',
        text1: 'Permission Required',
        text2: 'Media library permission is required to select images.',
        position: 'top',
      });
      return;
    }
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
        const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
        if (cameraPermission.status !== 'granted') {
          Toast.show({
            type: 'error',
            text1: 'Permission Required',
            text2: 'Camera permission is required to take photos.',
            position: 'top',
          });
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
    } catch (error) {
      console.error('Error picking image:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to pick image. Please try again.',
        position: 'top',
      });
      setProcessingId(null);
    } finally {
      setSelectedDocumentType(null);
    }
  };

  const handleUpload = async (documentType: KycDocumentType, imageUri: string) => {
    if (!session?.user?.id) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'User not found.',
        position: 'top',
      });
      setProcessingId(null);
      return;
    }

    const userId = session?.user?.id;

    try {
      setProcessingId(documentType);

      const existingDoc = getDocumentByType(documentType);
      const config = DOCUMENT_CONFIGS[documentType];

      const base64 = await convertImageToBase64(imageUri);

      if (existingDoc) {
        await replaceMutation.mutateAsync({
          documentId: existingDoc.id,
          userId: userId,
          userType: 'vendor',
          oldDocumentUrl: existingDoc.document_url || undefined,
          newDocument: {
            user_id: userId,
            user_type: 'vendor',
            document_type: documentType,
            document_name: config.label,
            document_description: config.description,
            is_required: config.isRequired,
            status: 'pending',
          },
          imageUri: imageUri,
          base64: base64,
        });

        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Document replaced successfully! It will be verified within 24 hours.',
          position: 'top',
        });
      } else {
        await uploadMutation.mutateAsync({
          document: {
            user_id: userId,
            user_type: 'vendor',
            document_type: documentType,
            document_name: config.label,
            document_description: config.description,
            is_required: config.isRequired,
            status: 'pending',
          },
          imageUri: imageUri,
          base64: base64,
        });

        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Document uploaded successfully! It will be verified within 24 hours.',
          position: 'top',
        });
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      Toast.show({
        type: 'error',
        text1: 'Upload Failed',
        text2: error.message || 'Failed to upload document. Please check your connection and try again.',
        position: 'top',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteDocument = (doc: KycDocument) => {
    setDocumentToDelete(doc);
    setDeleteModal(true);
  };

  const confirmDeleteDocument = async () => {
    if (!documentToDelete) return;

    try {
      await deleteMutation.mutateAsync({
        id: documentToDelete.id,
        userId: documentToDelete.user_id,
        userType: 'vendor',
        documentUrl: documentToDelete.document_url || undefined,
      });
      setDeleteModal(false);
      setDocumentToDelete(null);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Document deleted successfully.',
        position: 'top',
      });
    } catch (error: any) {
      setDeleteModal(false);
      setDocumentToDelete(null);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to delete document.',
        position: 'top',
      });
    }
  };

  const handleViewDocument = (doc: KycDocument) => {
    if (!doc.document_url) {
      Toast.show({
        type: 'info',
        text1: 'No Document',
        text2: 'No document file available.',
        position: 'top',
      });
      return;
    }
    setSelectedDocument(doc);
    setViewerVisible(true);
  };

  const handleGoBack = () => {
    router.back();
  };

  if (isLoadingVendor || isLoadingDocs) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#10b981" />
        <Text className="text-gray-600 mt-4">Loading documents...</Text>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <FullPageError
        code='500'
        message={error?.message || 'Failed to load documents'}
        onActionPress={refetch}
      />
    );
  }

  const documentsList = (Object.keys(DOCUMENT_CONFIGS) as KycDocumentType[]).map(docType => {
    const existingDoc = getDocumentByType(docType);
    const config = DOCUMENT_CONFIGS[docType];
    return {
      type: docType,
      config,
      document: existingDoc || null,
      status: (existingDoc?.status || 'not_uploaded') as KycDocumentStatus,
    };
  });

  const currentDocumentConfig = selectedDocumentType ? DOCUMENT_CONFIGS[selectedDocumentType] : null;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 pt-4 pb-4 border-b border-gray-100 flex-row items-center gap-3">
        <TouchableOpacity onPress={handleGoBack} className="p-2 -ml-2">
          <Feather name='chevron-left' size={24} color="#1f2937" />
        </TouchableOpacity>
        <View>
          <Text className="text-2xl font-bold text-gray-900">Documents & KYC</Text>
          <Text className="text-sm text-gray-600 mt-1">Verification documents</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        <View className="px-4 pt-6 pb-8">
          {/* Progress Summary */}
          <View className={`border rounded-xl p-4 mb-6 ${
            summary.isComplete ? 'bg-emerald-50 border-emerald-200' : 'bg-blue-50 border-blue-200'
          }`}>
            <View className="flex-row items-center justify-between mb-2">
              <Text className={`font-bold text-sm ${summary.isComplete ? 'text-emerald-900' : 'text-blue-900'}`}>
                {summary.isComplete ? 'KYC Complete!' : 'Verification Progress'}
              </Text>
              {summary.isComplete && <Ionicons name="checkmark-circle" size={24} color="#059669" />}
            </View>

            <View className="flex-row items-center gap-2 mt-2">
              <View className={`flex-1 h-2 rounded-full overflow-hidden ${
                summary.isComplete ? 'bg-emerald-200' : 'bg-blue-200'
              }`}>
                <View
                  className={`h-full ${summary.isComplete ? 'bg-emerald-600' : 'bg-blue-600'}`}
                  style={{ width: `${summary.progress}%` }}
                />
              </View>
              <Text className={`font-semibold text-sm ${summary.isComplete ? 'text-emerald-700' : 'text-blue-700'}`}>
                {summary.progress}%
              </Text>
            </View>

            <Text className={`text-xs mt-2 ${summary.isComplete ? 'text-emerald-700' : 'text-blue-700'}`}>
              {summary.requiredVerified} of{' '}
              {Object.values(DOCUMENT_CONFIGS).filter(doc => doc.isRequired).length} required documents verified
            </Text>

            {summary.rejected > 0 && (
              <View className="flex-row items-center gap-2 mt-2 bg-red-50 border border-red-200 rounded-lg p-2">
                <Ionicons name="alert-circle" size={16} color="#dc2626" />
                <Text className="text-red-700 text-xs font-medium">
                  {summary.rejected} document{summary.rejected > 1 ? 's' : ''} rejected
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
                <View key={item.type} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  {/* Document Header */}
                  <View className="px-4 py-4 border-b border-gray-100">
                    <View className="flex-row items-start justify-between mb-2">
                      <View className="flex-1">
                        <View className="flex-row items-center gap-2">
                          <Text className="text-gray-900 font-bold text-base">{item.config.label}</Text>
                          {item.config.isRequired && (
                            <View className="bg-amber-100 px-2 py-0.5 rounded-full">
                              <Text className="text-amber-700 text-xs font-bold">Required</Text>
                            </View>
                          )}
                        </View>
                        <Text className="text-gray-600 text-xs mt-1">{item.config.description}</Text>
                      </View>
                      <View className={`flex-row items-center gap-1.5 px-3 py-1 rounded-full ${statusInfo.bg}`}>
                        {statusInfo.icon}
                        <Text className={`text-xs font-semibold ${statusInfo.text}`}>{statusInfo.label}</Text>
                      </View>
                    </View>

                    {item.document?.uploaded_date && (
                      <Text className="text-gray-500 text-xs">
                        Uploaded: {new Date(item.document.uploaded_date).toLocaleDateString()}
                      </Text>
                    )}
                    {item.document?.verified_date && (
                      <Text className="text-gray-500 text-xs">
                        Verified: {new Date(item.document.verified_date).toLocaleDateString()}
                      </Text>
                    )}
                  </View>

                  {/* Rejection Reason */}
                  {item.status === 'rejected' && item.document?.rejection_reason && (
                    <View className="px-4 py-3 bg-red-50 border-b border-red-100 flex-row items-start gap-2">
                      <Feather name='alert-circle' size={16} color="#dc2626" style={{ marginTop: 2 }} />
                      <View className="flex-1">
                        <Text className="text-red-900 font-semibold text-sm mb-1">Rejection Reason</Text>
                        <Text className="text-red-800 text-xs">{item.document.rejection_reason}</Text>
                      </View>
                    </View>
                  )}

                  {/* Action Buttons */}
                  <View className="px-4 py-3">
                    <View className="flex-row gap-2">
                      <TouchableOpacity
                        onPress={() => handlePickImage(item.type)}
                        disabled={isProcessing}
                        className={`flex-1 bg-emerald-50 border border-emerald-200 rounded-lg py-3 items-center justify-center active:opacity-70 ${
                          isProcessing ? 'opacity-50' : ''
                        }`}
                      >
                        {processingId === item.type ? (
                          <ActivityIndicator size="small" color="#059669" />
                        ) : (
                          <View className="flex-row items-center gap-2">
                            <Feather name='upload' size={16} color="#059669" />
                            <Text className="text-emerald-700 font-bold text-sm">
                              {item.status === 'verified' || item.status === 'approved'
                                ? 'Replace'
                                : item.status === 'rejected'
                                ? 'Re-upload'
                                : 'Upload'}
                            </Text>
                          </View>
                        )}
                      </TouchableOpacity>

                      {item.document && (
                        <>
                          <TouchableOpacity
                            onPress={() => handleViewDocument(item.document!)}
                            disabled={isProcessing}
                            className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 items-center justify-center active:opacity-70"
                          >
                            <Feather name='eye' size={16} color="#3b82f6" />
                          </TouchableOpacity>

                          <TouchableOpacity
                            onPress={() => handleDeleteDocument(item.document!)}
                            disabled={isProcessing}
                            className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 items-center justify-center active:opacity-70"
                          >
                            <Feather name='trash-2' size={16} color="#dc2626" />
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
          <View className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-6">
            <View className="flex-row items-start gap-3">
              <Ionicons name="information-circle" size={20} color="#3b82f6" />
              <View className="flex-1">
                <Text className="text-blue-900 font-bold text-sm mb-1">Document Requirements</Text>
                <Text className="text-blue-800 text-xs leading-5">
                  • Ensure documents are clear and legible{'\n'}
                  • Upload color images (JPG or PNG) only{'\n'}
                  • All required documents must be verified for payouts{'\n'}
                  • Documents are reviewed within 24 hours
                </Text>
              </View>
            </View>
          </View>

          {/* Help Section */}
          <View className="bg-white rounded-2xl p-5 border border-gray-200 mt-6">
            <View className="flex-row items-center gap-3 mb-3">
              <Ionicons name="help-circle-outline" size={24} color="#059669" />
              <Text className="text-gray-900 font-bold text-base">Need Help?</Text>
            </View>
            <Text className="text-gray-600 text-sm mb-4">
              Having trouble uploading documents or facing verification issues? Contact our support team.
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/vendor/(tabs)/profile/support')}
              className="bg-emerald-50 border border-emerald-200 rounded-lg py-3 items-center"
            >
              <Text className="text-emerald-700 font-bold text-sm">Contact Support</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Blur overlay */}
      {(viewerVisible || uploadModal || deleteModal) && (
        <BlurView
          intensity={10}
          experimentalBlurMethod='dimezisBlurView'
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

      {/* Upload Source Modal */}
      <Modal
        visible={uploadModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setUploadModal(false);
          setSelectedDocumentType(null);
          setProcessingId(null);
        }}
      >
        <Pressable
          className="flex-1 bg-black/50 justify-end"
          onPress={() => {
            setUploadModal(false);
            setSelectedDocumentType(null);
            setProcessingId(null);
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
                  setProcessingId(null);
                }}
              >
                <Feather name="x" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <Text className="text-sm text-gray-600 mb-4">
              Accepted formats: {currentDocumentConfig?.acceptedFormats}
            </Text>

            <TouchableOpacity
              className="bg-emerald-600 py-4 rounded-xl flex-row items-center justify-center gap-3 mb-3"
              onPress={() => handleImagePicker('camera')}
            >
              <Feather name="camera" size={22} color="#ffffff" />
              <Text className="text-white font-semibold text-base">Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-emerald-50 border border-emerald-200 py-4 rounded-xl flex-row items-center justify-center gap-3 mb-3"
              onPress={() => handleImagePicker('gallery')}
            >
              <Feather name="image" size={22} color="#059669" />
              <Text className="text-emerald-700 font-semibold text-base">Choose from Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="py-4 rounded-xl flex-row items-center justify-center"
              onPress={() => {
                setUploadModal(false);
                setSelectedDocumentType(null);
                setProcessingId(null);
              }}
            >
              <Text className="text-gray-600 font-medium">Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={deleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setDeleteModal(false);
          setDocumentToDelete(null);
        }}
      >
        <Pressable
          className="flex-1 bg-black/50 justify-center items-center px-6"
          onPress={() => {
            setDeleteModal(false);
            setDocumentToDelete(null);
          }}
        >
          <Pressable className="bg-white rounded-3xl p-6 w-full">
            <View className="items-center mb-5">
              <View className="w-16 h-16 bg-red-100 rounded-full items-center justify-center mb-3">
                <Feather name="trash-2" size={30} color="#dc2626" />
              </View>
              <Text className="text-xl font-bold text-gray-900 mb-2">Delete Document?</Text>
              <Text className="text-sm text-gray-500 text-center leading-5">
                Are you sure you want to delete{' '}
                <Text className="font-semibold text-gray-700">{documentToDelete?.document_name}</Text>
                ? This action cannot be undone.
              </Text>
            </View>

            <TouchableOpacity
              className="bg-red-500 py-4 rounded-xl items-center justify-center mb-3"
              onPress={confirmDeleteDocument}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-base">Yes, Delete</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              className="border-2 border-gray-200 py-4 rounded-xl items-center justify-center"
              onPress={() => {
                setDeleteModal(false);
                setDocumentToDelete(null);
              }}
              disabled={deleteMutation.isPending}
            >
              <Text className="text-gray-700 font-semibold text-base">Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
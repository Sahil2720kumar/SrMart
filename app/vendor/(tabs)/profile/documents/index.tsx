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
  Platform,
  Modal,
  Image,
  Dimensions,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import {
  useKycDocuments,
  useKycSummary,
  useUploadKycDocument,
  useReplaceKycDocument,
  useDeleteKycDocument
} from '@/hooks/queries';
import { useVendorDetail } from '@/hooks/queries';
import { useProfileStore } from '@/store/profileStore';
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

  // Fetch vendor details
  const {
    data: vendorData,
    isLoading: isLoadingVendor
  } = useVendorDetail(session?.user?.id || '');

  // Fetch KYC documents
  const {
    data: documents,
    isLoading: isLoadingDocs,
    isError,
    error,
    refetch
  } = useKycDocuments(session?.user?.id || '', 'vendor');

  // Get KYC summary
  const summary = useKycSummary(session?.user?.id || '', 'vendor');

  // Mutations
  const uploadMutation = useUploadKycDocument();
  const replaceMutation = useReplaceKycDocument();
  const deleteMutation = useDeleteKycDocument();

  const [processingId, setProcessingId] = useState<string | null>(null);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<KycDocument | null>(null);

  // Helper to get document by type
  const getDocumentByType = (docType: KycDocumentType): KycDocument | undefined => {
    return documents?.find(doc => doc.document_type === docType);
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
    try {
      setProcessingId(documentType);

      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Media library permission is required to select images');
        setProcessingId(null);
        return;
      }

      // Show options: Camera or Gallery
      Alert.alert(
        'Choose Photo Source',
        'Select where to get the photo from',
        [
          {
            text: 'Camera',
            onPress: async () => {
              const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
              if (cameraPermission.status !== 'granted') {
                Alert.alert('Permission Required', 'Camera permission is required to take photos');
                setProcessingId(null);
                return;
              }

              const cameraResult = await ImagePicker.launchCameraAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
              });

              if (!cameraResult.canceled && cameraResult.assets[0]) {
                await handleUpload(documentType, cameraResult.assets[0].uri);
              } else {
                setProcessingId(null);
              }
            },
          },
          {
            text: 'Gallery',
            onPress: async () => {
              const galleryResult = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
              });

              if (!galleryResult.canceled && galleryResult.assets[0]) {
                await handleUpload(documentType, galleryResult.assets[0].uri);
              } else {
                setProcessingId(null);
              }
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => setProcessingId(null),
          },
        ]
      );
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
      setProcessingId(null);
    }
  };

  const handleUpload = async (documentType: KycDocumentType, imageUri: string) => {
    if (!session?.user?.id) {
      Alert.alert('Error', 'User not found');
      setProcessingId(null);
      return;
    }

    const userId = session?.user?.id

    try {
      setProcessingId(documentType);

      const existingDoc = getDocumentByType(documentType);
      const config = DOCUMENT_CONFIGS[documentType];

      // Convert image to base64
      console.log('Converting image to base64...');
      const base64 = await convertImageToBase64(imageUri);
      console.log('Base64 conversion successful, length:', base64.length);

      if (existingDoc) {
        // Replace existing document
        console.log('Replacing document:', documentType);
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

        Alert.alert(
          'Success',
          'Document replaced successfully! It will be verified within 24 hours.'
        );
      } else {
        // Upload new document
        console.log('Uploading new document:', documentType);
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
    Alert.alert(
      'Delete Document',
      `Are you sure you want to delete ${doc.document_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMutation.mutateAsync({
                id: doc.id,
                userId: doc.user_id,
                userType: 'vendor',
                documentUrl: doc.document_url || undefined,
              });
              Alert.alert('Success', 'Document deleted successfully');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete document');
            }
          },
        },
      ]
    );
  };

  const handleViewDocument = (doc: KycDocument) => {
    if (!doc.document_url) {
      Alert.alert('No Document', 'No document file available');
      return;
    }

    setSelectedDocument(doc);
    setViewerVisible(true);
  };

  const handleGoBack = () => {
    router.back();
  };

  // Loading state
  if (isLoadingVendor || isLoadingDocs) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#10b981" />
        <Text className="text-gray-600 mt-4">Loading documents...</Text>
      </SafeAreaView>
    );
  }

  // Error state
  if (isError) {
    return (
      <FullPageError
        code='500'
        message={error?.message || "Failed to load documents"}
        onActionPress={refetch}
      />
    );
  }

  // Create list of all document types with their status
  const documentsList = (Object.keys(DOCUMENT_CONFIGS) as KycDocumentType[]).map(docType => {
    const existingDoc = getDocumentByType(docType);
    const config = DOCUMENT_CONFIGS[docType];

    return {
      type: docType,
      config,
      document: existingDoc || null,
      status: existingDoc?.status || 'not_uploaded' as KycDocumentStatus,
    };
  });

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
          <View className={`border rounded-xl p-4 mb-6 ${summary.isComplete
              ? 'bg-emerald-50 border-emerald-200'
              : 'bg-blue-50 border-blue-200'
            }`}>
            <View className="flex-row items-center justify-between mb-2">
              <Text className={`font-bold text-sm ${summary.isComplete ? 'text-emerald-900' : 'text-blue-900'
                }`}>
                {summary.isComplete ? 'KYC Complete!' : 'Verification Progress'}
              </Text>
              {summary.isComplete && (
                <Ionicons name="checkmark-circle" size={24} color="#059669" />
              )}
            </View>

            <View className="flex-row items-center gap-2 mt-2">
              <View className={`flex-1 h-2 rounded-full overflow-hidden ${summary.isComplete ? 'bg-emerald-200' : 'bg-blue-200'
                }`}>
                <View
                  className={`h-full ${summary.isComplete ? 'bg-emerald-600' : 'bg-blue-600'
                    }`}
                  style={{ width: `${summary.progress}%` }}
                />
              </View>
              <Text className={`font-semibold text-sm ${summary.isComplete ? 'text-emerald-700' : 'text-blue-700'
                }`}>
                {summary.progress}%
              </Text>
            </View>

            <Text className={`text-xs mt-2 ${summary.isComplete ? 'text-emerald-700' : 'text-blue-700'
              }`}>
              {summary.requiredVerified} of {Object.values(DOCUMENT_CONFIGS).filter(
                (doc) => doc.isRequired
              ).length} required documents verified
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
              const isProcessing = processingId === item.type ||
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
                          <Text className="text-gray-900 font-bold text-base">
                            {item.config.label}
                          </Text>
                          {item.config.isRequired && (
                            <View className="bg-amber-100 px-2 py-0.5 rounded-full">
                              <Text className="text-amber-700 text-xs font-bold">Required</Text>
                            </View>
                          )}
                        </View>
                        <Text className="text-gray-600 text-xs mt-1">
                          {item.config.description}
                        </Text>
                      </View>
                      <View className={`flex-row items-center gap-1.5 px-3 py-1 rounded-full ${statusInfo.bg}`}>
                        {statusInfo.icon}
                        <Text className={`text-xs font-semibold ${statusInfo.text}`}>
                          {statusInfo.label}
                        </Text>
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
                        <Text className="text-red-900 font-semibold text-sm mb-1">
                          Rejection Reason
                        </Text>
                        <Text className="text-red-800 text-xs">
                          {item.document.rejection_reason}
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Action Buttons */}
                  <View className="px-4 py-3">
                    <View className="flex-row gap-2">
                      {/* Primary Action: Upload/Replace */}
                      <TouchableOpacity
                        onPress={() => handlePickImage(item.type)}
                        disabled={isProcessing}
                        className={`flex-1 bg-emerald-50 border border-emerald-200 rounded-lg py-3 items-center justify-center active:opacity-70 ${isProcessing ? 'opacity-50' : ''
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

                      {/* Secondary Actions */}
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

                    {/* Format info */}
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
                <Text className="text-blue-900 font-bold text-sm mb-1">
                  Document Requirements
                </Text>
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


      {viewerVisible && (
        <BlurView
          intensity={10}
          experimentalBlurMethod='dimezisBlurView'
          style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0 }}
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
    </SafeAreaView>
  );
}
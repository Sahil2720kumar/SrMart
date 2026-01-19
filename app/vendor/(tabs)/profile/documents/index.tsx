import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const mockDocuments = [
  {
    id: 'shop-license',
    name: 'Shop License',
    status: 'verified',
    uploadedDate: '10 Jan 2025',
  },
  {
    id: 'pan-card',
    name: 'PAN Card',
    status: 'verified',
    uploadedDate: '10 Jan 2025',
  },
  {
    id: 'gst-certificate',
    name: 'GST Certificate (Optional)',
    status: 'pending',
    uploadedDate: null,
  },
  {
    id: 'identity-proof',
    name: 'Identity Proof',
    status: 'rejected',
    rejectionReason: 'Document is blurry. Please upload a clear image.',
    uploadedDate: '08 Jan 2025',
  },
];

type DocumentStatus = 'verified' | 'pending' | 'rejected' | 'not-uploaded';

function getStatusBadge(status: DocumentStatus) {
  switch (status) {
    case 'verified':
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

export default function DocumentsKYCScreen() {
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleUploadDocument = async (docId: string, docName: string) => {
    setProcessingId(docId);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log('[v0] Opening document picker for:', docId);
      Alert.alert('Upload Document', `Opening file picker for ${docName}...`);
    } catch (error) {
      Alert.alert('Error', 'Failed to upload document');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReplaceDocument = async (docId: string, docName: string) => {
    setProcessingId(docId);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log('[v0] Replacing document:', docId);
      Alert.alert('Replace Document', `Opening file picker to replace ${docName}...`);
    } catch (error) {
      Alert.alert('Error', 'Failed to replace document');
    } finally {
      setProcessingId(null);
    }
  };

  const handleGoBack = () => {
    console.log('[v0] Going back to profile overview');
    router.back()
  };

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
          <View className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6">
            <Text className="text-emerald-900 font-bold text-sm mb-1">Verification Progress</Text>
            <View className="flex-row items-center gap-2 mt-2">
              <View className="flex-1 h-2 bg-emerald-200 rounded-full overflow-hidden">
                <View className="h-full w-1/2 bg-emerald-600" />
              </View>
              <Text className="text-emerald-700 font-semibold text-sm">50%</Text>
            </View>
            <Text className="text-emerald-700 text-xs mt-2">2 of 4 documents verified</Text>
          </View>

          {/* Documents List */}
          <View className="gap-4">
            {mockDocuments.map((doc) => {
              const statusInfo = getStatusBadge(doc.status as DocumentStatus);
              return (
                <View key={doc.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  {/* Document Header */}
                  <View className="px-4 py-4 border-b border-gray-100">
                    <View className="flex-row items-center justify-between mb-2">
                      <Text className="text-gray-900 font-bold text-base">{doc.name}</Text>
                      <View className={`flex-row items-center gap-1.5 px-3 py-1 rounded-full ${statusInfo.bg}`}>
                        {statusInfo.icon}
                        <Text className={`text-xs font-semibold ${statusInfo.text}`}>{statusInfo.label}</Text>
                      </View>
                    </View>
                    {doc.uploadedDate && (
                      <Text className="text-gray-500 text-xs">Uploaded: {doc.uploadedDate}</Text>
                    )}
                  </View>

                  {/* Rejection Reason (if applicable) */}
                  {doc.status === 'rejected' && doc.rejectionReason && (
                    <View className="px-4 py-3 bg-red-50 border-b border-red-100 flex-row items-start gap-2">
                      <Feather name='alert-circle' size={16} color="#dc2626" style={{ marginTop: 2 }} />
                      <View className="flex-1">
                        <Text className="text-red-900 font-semibold text-sm mb-1">Rejection Reason</Text>
                        <Text className="text-red-800 text-xs">{doc.rejectionReason}</Text>
                      </View>
                    </View>
                  )}

                  {/* Action Button */}
                  <View className="px-4 py-3">
                    <TouchableOpacity
                      onPress={() => {
                        if (doc.status === 'rejected') {
                          handleReplaceDocument(doc.id, doc.name);
                        } else if (doc.status === 'verified' || doc.status === 'pending') {
                          handleReplaceDocument(doc.id, doc.name);
                        } else {
                          handleUploadDocument(doc.id, doc.name);
                        }
                      }}
                      disabled={processingId === doc.id}
                      className={`bg-emerald-50 border border-emerald-200 rounded-lg py-3 items-center justify-center active:opacity-70 ${processingId === doc.id ? 'opacity-50' : ''}`}
                    >
                      {processingId === doc.id ? (
                        <ActivityIndicator size="small" color="#059669" />
                      ) : (
                        <View className="flex-row items-center gap-2">
                          <Feather name='upload' size={16} color="#059669" />
                          <Text className="text-emerald-700 font-bold text-sm">
                            {doc.status === 'verified' ? 'Replace' : doc.status === 'rejected' ? 'Re-upload' : 'Upload'} Document
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Info Banner */}
          <View className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-6">
            <Text className="text-blue-900 font-bold text-sm mb-1">Document Requirements</Text>
            <Text className="text-blue-800 text-xs leading-5">
              • Ensure documents are clear and legible{'\n'}
              • Upload color images only{'\n'}
              • All four documents must be verified to request payouts{'\n'}
              • GST certificate is optional
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

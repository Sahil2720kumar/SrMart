import React, { JSX, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';

import * as ImagePicker from 'expo-image-picker';
import { AntDesign, Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

type DocumentStatus = 'pending' | 'approved' | 'rejected' | 'not_uploaded';

interface Document {
  id: string;
  name: string;
  description: string;
  status: DocumentStatus;
  uploaded: boolean;
  rejectionReason?: string;
}

export default function DocumentsScreen() {
  const router = useRouter();
  const [uploadModal, setUploadModal] = useState<string | null>(null);
  const [expandedReason, setExpandedReason] = useState<string | null>(null);

  const [documents, setDocuments] = useState<Document[]>([
    {
      id: 'aadhaar',
      name: 'Aadhaar Card',
      description: 'Government ID proof',
      status: 'approved',
      uploaded: true,
    },
    {
      id: 'pan',
      name: 'PAN Card',
      description: 'Tax identification number',
      status: 'pending',
      uploaded: true,
    },
    {
      id: 'license',
      name: 'Driving License',
      description: 'Valid driving permit',
      status: 'rejected',
      uploaded: true,
      rejectionReason:
        'Image is blurry. Please upload a clear photo showing all details.',
    },
    {
      id: 'rc',
      name: 'Vehicle RC',
      description: 'Vehicle registration certificate',
      status: 'not_uploaded',
      uploaded: false,
    },
    {
      id: 'photo',
      name: 'Profile Photo',
      description: 'Recent passport size photo',
      status: 'not_uploaded',
      uploaded: false,
    },
  ]);

  // Calculate overall status
  const getOverallStatus = (): DocumentStatus => {
    const hasRejected = documents.some((d) => d.status === 'rejected');
    const allApproved = documents.every((d) => d.status === 'approved');
    if (hasRejected) return 'rejected';
    if (allApproved) return 'approved';
    return 'pending';
  };

  const overallStatus = getOverallStatus();

  const getStatusBadge = (status: DocumentStatus) => {
    const badges = {
      pending: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        label: 'Pending',
      },
      approved: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        label: 'Approved',
      },
      rejected: {
        bg: 'bg-red-100',
        text: 'text-red-800',
        label: 'Rejected',
      },
      not_uploaded: {
        bg: 'bg-gray-100',
        text: 'text-gray-800',
        label: 'Not Uploaded',
      },
    };
    return badges[status];
  };

  const getOverallStatusMessage = () => {
    const messages = {
      pending: 'Your documents are under admin review.',
      approved: 'All documents verified successfully.',
      rejected: 'Some documents need attention.',
      not_uploaded: 'Please upload all required documents.',
    };
    return messages[overallStatus];
  };

  const getProgress = () => {
    const approved = documents.filter((d) => d.status === 'approved').length;
    const total = documents.length;
    return { approved, total, percentage: (approved / total) * 100 };
  };

  const getDocumentIcon = (docId: string) => {
    const iconProps = { size: 24, color: '#4f46e5' };
    const icons: Record<string, JSX.Element> = {
      aadhaar: <Feather name="file-text" {...iconProps} />,
      pan: <Feather name='credit-card' {...iconProps} />,
      license: <AntDesign name="car"{...iconProps} />,
      rc: <Feather name='file-text' {...iconProps} />,
      photo: <Feather name='user' {...iconProps} />,
    };
    return icons[docId] || <Feather name='file-text' {...iconProps} />;
  };

  const handleImagePicker = async (docId: string, source: 'camera' | 'gallery') => {
    try {
      let result;

      if (source === 'camera') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Permission needed', 'Camera permission is required');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });
      } else {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Permission needed', 'Gallery permission is required');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });
      }

      if (!result.canceled) {
        // Simulate upload
        setDocuments((docs) =>
          docs.map((doc) =>
            doc.id === docId
              ? {
                  ...doc,
                  uploaded: true,
                  status: 'pending' as DocumentStatus,
                  rejectionReason: undefined,
                }
              : doc
          )
        );
        setUploadModal(null);
        Alert.alert('Success', 'Document uploaded successfully');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to upload document');
    }
  };

  const progress = getProgress();

  return (
    <SafeAreaView className="flex-1 bg-[#4f46e5]">
      {/* Header */}
      <View className="bg-[#4f46e5] px-4 pt-4 pb-6">
        <View className="flex-row items-center gap-3 mb-4">
          <TouchableOpacity className="w-10 h-10 bg-white/20 rounded-full items-center justify-center mr-3" activeOpacity={0.8} onPress={() => router.back()}>
            <Feather name='arrow-left' size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text className="text-white text-2xl font-bold">
            Documents & Verification
          </Text>
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView className="flex-1 bg-gray-50 rounded-t-3xl px-4 py-6">
        {/* Overall Status Banner */}
        <View className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <View className="flex-row items-start gap-3">
            <View
              className={`p-3 rounded-xl ${getStatusBadge(overallStatus).bg}`}
            >
              <Feather name='shield' size={24} color="#4f46e5" />
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-gray-900 text-base mb-1">
                Verification Status
              </Text>
              <Text className="text-sm text-gray-600 mb-2">
                {getOverallStatusMessage()}
              </Text>
              <View
                className={`self-start px-3 py-1 rounded-full ${
                  getStatusBadge(overallStatus).bg
                }`}
              >
                <Text
                  className={`text-xs font-medium ${
                    getStatusBadge(overallStatus).text
                  }`}
                >
                  {getStatusBadge(overallStatus).label}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Verification Progress */}
        <View className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="font-semibold text-gray-900">
              Verification Progress
            </Text>
            <Text className="text-sm text-gray-600">
              {progress.approved} of {progress.total}
            </Text>
          </View>
          <View className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <View
              className="h-full bg-[#4f46e5] rounded-full"
              style={{ width: `${progress.percentage}%` }}
            />
          </View>
          <View className="flex-row items-center justify-between mt-2">
            <Text className="text-xs text-gray-500">Uploaded</Text>
            <Text className="text-xs text-gray-500">Under Review</Text>
            <Text className="text-xs text-gray-500">Approved</Text>
          </View>
        </View>

        {/* Documents List */}
        <View className="mb-4">
          <Text className="font-bold text-gray-900 text-lg mb-3">
            Required Documents
          </Text>

          {documents.map((doc) => (
            <View key={doc.id} className="bg-white rounded-2xl p-4 shadow-sm mb-3">
              {/* Document Header */}
              <View className="flex-row items-start justify-between mb-3">
                <View className="flex-row items-start gap-3 flex-1">
                  <View className="p-2 bg-indigo-50 rounded-lg">
                    {getDocumentIcon(doc.id)}
                  </View>
                  <View className="flex-1">
                    <Text className="font-semibold text-gray-900 text-base">
                      {doc.name}
                    </Text>
                    <Text className="text-sm text-gray-600">
                      {doc.description}
                    </Text>
                  </View>
                </View>
                <View
                  className={`px-3 py-1 rounded-full ${
                    getStatusBadge(doc.status).bg
                  }`}
                >
                  <Text
                    className={`text-xs font-medium ${
                      getStatusBadge(doc.status).text
                    }`}
                  >
                    {getStatusBadge(doc.status).label}
                  </Text>
                </View>
              </View>

              {/* Rejection Reason (if rejected) */}
              {doc.status === 'rejected' && doc.rejectionReason && (
                <TouchableOpacity
                  className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3"
                  onPress={() =>
                    setExpandedReason(
                      expandedReason === doc.id ? null : doc.id
                    )
                  }
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2 flex-1">
                      <Feather name='alert-circle' size={16} color="#dc2626" />
                      <Text className="text-sm font-medium text-red-800 flex-1">
                        Rejection Reason
                      </Text>
                    </View>
                    {expandedReason === doc.id ? (
                      <Feather name='chevron-up' size={16} color="#dc2626" />
                    ) : (
                      <Feather name='chevron-down' size={16} color="#dc2626" />
                    )}
                  </View>
                  {expandedReason === doc.id && (
                    <Text className="text-sm text-red-700 mt-2">
                      {doc.rejectionReason}
                    </Text>
                  )}
                </TouchableOpacity>
              )}

              {/* Action Buttons */}
              {doc.status === 'approved' ? (
                <View className="flex-row items-center gap-2">
                  <Feather name='check-circle' size={20} color="#16a34a" />
                  <Text className="text-green-700 font-medium">Verified</Text>
                </View>
              ) : doc.status === 'pending' ? (
                <View className="bg-gray-100 py-3 rounded-lg flex-row items-center justify-center gap-2">
                  <Feather name='clock' size={18} color="#6b7280" />
                  <Text className="text-gray-600 font-medium">
                    Under Review
                  </Text>
                </View>
              ) : (
                <TouchableOpacity
                  className="bg-[#4f46e5] py-3 rounded-lg flex-row items-center justify-center gap-2"
                  onPress={() => setUploadModal(doc.id)}
                >
                  <Feather name='upload' size={18} color="#ffffff" />
                  <Text className="text-white font-semibold">
                    {doc.uploaded ? 'Re-upload Document' : 'Upload Document'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        {/* Info Banner */}
        <View className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6">
          <View className="flex-row gap-3">
            <Feather name='alert-circle' size={20} color="#3b82f6" />
            <View className="flex-1">
              <Text className="text-sm text-blue-900 font-medium mb-1">
                Verification Timeline
              </Text>
              <Text className="text-sm text-blue-800">
                Document verification usually takes 24–48 hours. You will be
                notified once review is completed.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Upload Modal */}
      <Modal
        visible={uploadModal !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setUploadModal(null)}
      >
        <Pressable
          className="flex-1 bg-black/50 justify-end"
          onPress={() => setUploadModal(null)}
        >
          <Pressable className="bg-white rounded-t-3xl p-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-gray-900">
                Upload Document
              </Text>
              <TouchableOpacity onPress={() => setUploadModal(null)}>
                <Feather name='x' size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <Text className="text-sm text-gray-600 mb-4">
              Choose how you'd like to upload your document. Max file size: 5MB
            </Text>

            <TouchableOpacity
              className="bg-[#4f46e5] py-4 rounded-xl flex-row items-center justify-center gap-3 mb-3"
              onPress={() =>
                uploadModal && handleImagePicker(uploadModal, 'camera')
              }
            >
              <Feather name='camera' size={24} color="#ffffff" />
              <Text className="text-white font-semibold text-base">
                Take Photo
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-indigo-100 py-4 rounded-xl flex-row items-center justify-center gap-3 mb-3"
              onPress={() =>
                uploadModal && handleImagePicker(uploadModal, 'gallery')
              }
            >
              <Feather name='image' size={24} color="#4f46e5" />
              <Text className="text-[#4f46e5] font-semibold text-base">
                Choose from Gallery
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="py-4 rounded-xl flex-row items-center justify-center"
              onPress={() => setUploadModal(null)}
            >
              <Text className="text-gray-600 font-medium">Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
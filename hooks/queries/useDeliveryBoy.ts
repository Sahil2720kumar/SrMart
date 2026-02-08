import { queryKeys } from '@/lib/queryKeys';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useProfileStore } from '@/store/profileStore';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { File } from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { randomUUID } from 'expo-crypto';
import {
  KycDocument,
  KycDocumentInsert,
  KycDocumentType,
  KycUserType,
} from '@/types/documents-kyc.types';
import { BankAccountType, DeliveryBoyBankDetails } from '@/types/payments-wallets.types';
import { useVendorBankDetails } from '.';

// ==========================================
// DELIVERY BOY PROFILE HOOKS
// ==========================================

export function useDeliveryBoyProfile(userId?: string) {
  const session = useAuthStore((state) => state.session);
  const id = userId || session?.user?.id;

  return useQuery({
    queryKey: queryKeys.deliveryBoys.byUser(id!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('delivery_boys')
        .select('*')
        .eq('user_id', id)
        .single();

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('phone, email')
        .eq('auth_id', id)
        .single();

      if (error || userError) throw error || userError;

      return {
        ...data,
        phone: userData?.phone,
        email: userData?.email,
      };
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 10,
  });
}

export function useUpdateDeliveryBoyProfile() {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);
  const { setDeliveryBoyProfile, setUser } = useProfileStore();

  return useMutation({
    mutationFn: async (updates: any) => {
      // Update delivery_boys table
      const { data: deliveryBoyData, error } = await supabase
        .from('delivery_boys')
        .update({
          first_name: updates.first_name,
          last_name: updates.last_name,
          profile_photo: updates.profile_photo,
          address_line1: updates.address_line1,
          address_line2: updates.address_line2,
          city: updates.city,
          state: updates.state,
          pincode: updates.pincode,
          emergency_contact_name: updates.emergency_contact_name,
          emergency_contact_phone: updates.emergency_contact_phone,
          vehicle_type: updates.vehicle_type ? updates.vehicle_type.toLowerCase() : null,
          vehicle_number: updates.vehicle_number,
          license_number: updates.license_number,
          is_available:updates.is_available,
          is_online:updates.is_online,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', session?.user?.id)
        .select('*')
        .single();

      setDeliveryBoyProfile(deliveryBoyData);

      // Get user data for phone and email (read-only fields)
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('phone, email')
        .eq('auth_id', session?.user?.id)
        .single();

      if (error) throw error;
      if (userError) throw userError;

      // Return same shape as useDeliveryBoyProfile
      return {
        ...deliveryBoyData,
        phone: userData?.phone,
        email: userData?.email,
      };
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.deliveryBoys.byUser(session?.user?.id!),
      });
    },
  });
}

// Upload profile photo for delivery boy
export function useUploadDeliveryBoyPhoto() {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);
  const updateProfile = useUpdateDeliveryBoyProfile();

  return useMutation({
    mutationFn: async (imageUri: string) => {
      if (!session?.user?.id) throw new Error('No user session');

      try {
        // Delete old profile photo if exists
        const { data: deliveryBoyData } = await supabase
          .from('delivery_boys')
          .select('profile_photo')
          .eq('user_id', session.user.id)
          .single();

        if (deliveryBoyData?.profile_photo) {
          const urlParts = deliveryBoyData.profile_photo.split('/delivery_boys/');
          if (urlParts.length > 1) {
            const oldPath = urlParts[1];
            await supabase.storage.from('delivery_boys').remove([oldPath]);
          }
        }

        // Use File API to read image as base64
        const localFile = new File(imageUri);
        const base64 = await localFile.base64();

        // Generate unique filename
        const fileExt = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${session.user.id}/${fileName}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('delivery_boys')
          .upload(filePath, decode(base64), {
            contentType: `image/${fileExt}`,
            upsert: false,
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw uploadError;
        }

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from('delivery_boys').getPublicUrl(filePath);

        return { publicUrl, filePath };
      } catch (error) {
        console.error('Upload error:', error);
        throw error;
      }
    },
    onSuccess: async ({ publicUrl }) => {
      await updateProfile.mutateAsync({
        profile_photo: publicUrl,
        updated_at: new Date().toISOString(),
      });

      queryClient.invalidateQueries({
        queryKey: queryKeys.deliveryBoys.byUser(session?.user?.id!),
      });
    },
  });
}

// Query Keys
export const deliveryBoyKycQueryKeys = {
  all: ['kyc-documents-delivery'] as const,
  byUser: (userId: string, userType: KycUserType) =>
    [...deliveryBoyKycQueryKeys.all, 'user', userId, userType] as const,
  byDocument: (userId: string, documentType: KycDocumentType) =>
    [...deliveryBoyKycQueryKeys.all, 'document', userId, documentType] as const,
  single: (id: string) => [...deliveryBoyKycQueryKeys.all, 'single', id] as const,
};

// ==================== FETCH QUERIES ====================

/**
 * Hook to fetch all KYC documents for a delivery boy
 */
export function useDeliveryBoyKycDocuments(userId: string) {
  return useQuery({
    queryKey: deliveryBoyKycQueryKeys.byUser(userId, 'delivery_boy'),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kyc_documents')
        .select('*')
        .eq('user_id', userId)
        .eq('user_type', 'delivery_boy')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as KycDocument[];
    },
    enabled: !!userId,
  });
}

/**
 * Hook to fetch a single KYC document by type
 */
export function useDeliveryBoyKycDocumentByType(userId: string, documentType: KycDocumentType) {
  return useQuery({
    queryKey: deliveryBoyKycQueryKeys.byDocument(userId, documentType),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kyc_documents')
        .select('*')
        .eq('user_id', userId)
        .eq('document_type', documentType)
        .maybeSingle();

      if (error) throw error;
      return data as KycDocument | null;
    },
    enabled: !!userId && !!documentType,
  });
}

/**
 * Hook to get KYC verification summary for delivery boy
 */
export function useDeliveryBoyKycSummary(userId: string) {
  const { data: documents } = useDeliveryBoyKycDocuments(userId);

  const summary = {
    total: documents?.length || 0,
    verified:
      documents?.filter((d) => d.status === 'verified' || d.status === 'approved').length || 0,
    pending: documents?.filter((d) => d.status === 'pending').length || 0,
    rejected: documents?.filter((d) => d.status === 'rejected').length || 0,
    notUploaded: documents?.filter((d) => d.status === 'not_uploaded').length || 0,
    required: documents?.filter((d) => d.is_required).length || 0,
    requiredVerified:
      documents?.filter(
        (d) => d.is_required && (d.status === 'verified' || d.status === 'approved')
      ).length || 0,
    progress: 0,
    isComplete: false,
  };

  if (summary.required > 0) {
    summary.progress = Math.round((summary.requiredVerified / summary.required) * 100);
    summary.isComplete = summary.requiredVerified === summary.required;
  }

  return summary;
}

// ==================== MUTATIONS ====================

/**
 * Hook to upload/add a new KYC document with base64 image for delivery boy
 */
export function useUploadDeliveryBoyKycDocument() {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);

  return useMutation({
    mutationFn: async (input: {
      document: KycDocumentInsert;
      imageUri: string;
      base64: string;
    }) => {
      try {
        let documentUrl = input.document.document_url;

        // Upload image to storage
        console.log('Starting upload process...');

        const fileExt = input.imageUri.split('.').pop() || 'jpg';
        const fileName = `${randomUUID()}.${fileExt}`;
        const filePath = `${session?.user.id}/kycDocuments/${fileName}`;

        console.log('Uploading to path:', filePath);

        // Upload to Supabase Storage - delivery_boys bucket
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('delivery_boys')
          .upload(filePath, decode(input.base64), {
            contentType: `image/${fileExt}`,
            upsert: false,
          });

        if (uploadError) {
          console.error('Storage upload error:', uploadError);
          throw new Error(`Upload failed: ${uploadError.message}`);
        }

        console.log('Upload successful:', uploadData);

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from('delivery_boys').getPublicUrl(filePath);

        documentUrl = publicUrl;
        console.log('Public URL:', publicUrl);

        // Check if document already exists
        const { data: existing } = await supabase
          .from('kyc_documents')
          .select('id')
          .eq('user_id', input.document.user_id)
          .eq('document_type', input.document.document_type)
          .maybeSingle();

        if (existing) {
          // Update existing document
          const { data, error } = await supabase
            .from('kyc_documents')
            .update({
              ...input.document,
              document_url: documentUrl,
              status: 'pending',
              uploaded_date: new Date().toISOString(),
              verified_date: null,
              verified_by: null,
              rejection_reason: null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id)
            .select()
            .single();

          if (error) throw error;
          return data as KycDocument;
        } else {
          // Insert new document
          const { data, error } = await supabase
            .from('kyc_documents')
            .insert({
              ...input.document,
              document_url: documentUrl,
              status: 'pending',
              uploaded_date: new Date().toISOString(),
            })
            .select()
            .single();

          if (error) throw error;
          return data as KycDocument;
        }
      } catch (error: any) {
        console.error('Upload mutation error:', error);
        throw new Error(error.message || 'Upload failed');
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: deliveryBoyKycQueryKeys.byUser(data.user_id, 'delivery_boy'),
      });
      queryClient.invalidateQueries({
        queryKey: deliveryBoyKycQueryKeys.byDocument(data.user_id, data.document_type),
      });
      queryClient.invalidateQueries({
        queryKey: deliveryBoyKycQueryKeys.all,
      });
    },
  });
}

/**
 * Hook to replace a KYC document for delivery boy
 */
export function useReplaceDeliveryBoyKycDocument() {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);

  return useMutation({
    mutationFn: async (input: {
      documentId: string;
      userId: string;
      oldDocumentUrl?: string;
      newDocument: KycDocumentInsert;
      imageUri: string;
      base64: string;
    }) => {
      try {
        // Delete old file from storage if exists
        if (input.oldDocumentUrl) {
          const urlParts = input.oldDocumentUrl.split('/delivery_boys/');
          if (urlParts.length > 1) {
            const filePath = urlParts[1];
            await supabase.storage.from('delivery_boys').remove([filePath]);
          }
        }

        const fileExt = input.imageUri.split('.').pop() || 'jpg';
        const fileName = `${randomUUID()}.${fileExt}`;
        const filePath = `${session?.user.id}/kycDocuments/${fileName}`;

        // console.log('Replacing document at path:', filePath);

        // Upload new file
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('delivery_boys')
          .upload(filePath, decode(input.base64), {
            contentType: `image/${fileExt}`,
            upsert: false,
          });

        if (uploadError) {
          console.error('Storage upload error:', uploadError);
          throw new Error(`Upload failed: ${uploadError.message}`);
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from('delivery_boys').getPublicUrl(filePath);

        // Update document record
        const { data, error } = await supabase
          .from('kyc_documents')
          .update({
            ...input.newDocument,
            document_url: publicUrl,
            status: 'pending',
            uploaded_date: new Date().toISOString(),
            verified_date: null,
            verified_by: null,
            rejection_reason: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', input.documentId)
          .select()
          .single();

        if (error) throw error;
        return data as KycDocument;
      } catch (error: any) {
        console.error('Replace document error:', error);
        throw new Error(`Replace failed: ${error.message || 'Unknown error'}`);
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: deliveryBoyKycQueryKeys.byUser(data.user_id, 'delivery_boy'),
      });
      queryClient.invalidateQueries({
        queryKey: deliveryBoyKycQueryKeys.single(data.id),
      });
      queryClient.invalidateQueries({
        queryKey: deliveryBoyKycQueryKeys.all,
      });
    },
  });
}

/**
 * Hook to delete a KYC document for delivery boy
 */
export function useDeleteDeliveryBoyKycDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { id: string; userId: string; documentUrl?: string }) => {
      // Delete file from storage if exists
      if (input.documentUrl) {
        const urlParts = input.documentUrl.split('/delivery_boys/');
        if (urlParts.length > 1) {
          const filePath = urlParts[1];

          const { error: storageError } = await supabase.storage
            .from('delivery_boys')
            .remove([filePath]);

          if (storageError) {
            console.warn('Failed to delete file from storage:', storageError);
          }
        }
      }

      // Delete from database
      const { error } = await supabase
        .from('kyc_documents')
        .delete()
        .eq('id', input.id)
        .eq('user_id', input.userId);

      if (error) throw error;
      return { success: true };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: deliveryBoyKycQueryKeys.byUser(variables.userId, 'delivery_boy'),
      });
      queryClient.invalidateQueries({
        queryKey: deliveryBoyKycQueryKeys.all,
      });
    },
  });
}

/**
 * Hook to fetch bank passbook image from KYC documents
 */
export function useKycBankPassbook(userId: string) {
  return useQuery({
    queryKey: bankDetailsQueryKeys.kycPassbook(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kyc_documents')
        .select('*')
        .eq('user_id', userId)
        .eq('document_type', 'bank_passbook')
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}

// ==================== DELIVERY BOY BANK DETAILS QUERIES ====================

export interface BankDetailsInput {
  account_holder_name: string;
  account_number: string;
  bank_name: string;
  ifsc_code: string;
  branch?: string;
  account_type?: BankAccountType;
  upi_id?: string;
  proof_image?: string;
}

export interface UploadBankProofInput {
  imageUri: string;
  base64: string;
  userId: string;
  userType: 'vendor' | 'delivery_boy';
}

export const bankDetailsQueryKeys = {
  all: ['bank-details'] as const,
  deliveryBoy: (deliveryBoyId: string) =>
    [...bankDetailsQueryKeys.all, 'delivery-boy', deliveryBoyId] as const,
  vendor: (vendorId: string) =>
    [...bankDetailsQueryKeys.all, 'vendor', vendorId] as const,
  kycPassbook: (userId: string) => [...bankDetailsQueryKeys.all, 'kyc-passbook', userId] as const,
};
/**
 * Hook to fetch delivery boy bank details
 */
export function useDeliveryBoyBankDetails(deliveryBoyId: string) {
  return useQuery({
    queryKey: bankDetailsQueryKeys.deliveryBoy(deliveryBoyId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('delivery_boy_bank_details')
        .select('*')
        .eq('delivery_boy_id', deliveryBoyId)
        .maybeSingle();

      if (error) throw error;
      return data as DeliveryBoyBankDetails | null;
    },
    enabled: !!deliveryBoyId,
  });
}

/**
 * Hook to add delivery boy bank details
 */
export function useAddDeliveryBoyBankDetails() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { delivery_boy_id: string; bankDetails: BankDetailsInput }) => {
      // Check if bank details already exist
      const { data: existing } = await supabase
        .from('delivery_boy_bank_details')
        .select('id')
        .eq('delivery_boy_id', input.delivery_boy_id)
        .maybeSingle();

      if (existing) {
        throw new Error('Bank details already exist. Please update instead.');
      }

      const { data, error } = await supabase
        .from('delivery_boy_bank_details')
        .insert({
          delivery_boy_id: input.delivery_boy_id,
          ...input.bankDetails,
          status: 'pending',
          is_verified: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data as DeliveryBoyBankDetails;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: bankDetailsQueryKeys.deliveryBoy(data.delivery_boy_id),
      });
      queryClient.invalidateQueries({
        queryKey: bankDetailsQueryKeys.all,
      });
    },
  });
}

/**
 * Hook to update delivery boy bank details
 */
export function useUpdateDeliveryBoyBankDetails() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      id: string;
      delivery_boy_id: string;
      bankDetails: Partial<BankDetailsInput>;
    }) => {
      const { data, error } = await supabase
        .from('delivery_boy_bank_details')
        .update({
          ...input.bankDetails,
          status: 'pending',
          is_verified: false,
          verified_at: null,
          verified_by: null,
          rejection_reason: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.id)
        .eq('delivery_boy_id', input.delivery_boy_id)
        .select()
        .single();

      if (error) throw error;
      return data as DeliveryBoyBankDetails;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: bankDetailsQueryKeys.deliveryBoy(data.delivery_boy_id),
      });
      queryClient.invalidateQueries({
        queryKey: bankDetailsQueryKeys.all,
      });
    },
  });
}

/**
 * Hook to delete delivery boy bank details
 */
export function useDeleteDeliveryBoyBankDetails() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { id: string; delivery_boy_id: string }) => {
      const { error } = await supabase
        .from('delivery_boy_bank_details')
        .delete()
        .eq('id', input.id)
        .eq('delivery_boy_id', input.delivery_boy_id);

      if (error) throw error;
      return { success: true };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: bankDetailsQueryKeys.deliveryBoy(variables.delivery_boy_id),
      });
      queryClient.invalidateQueries({
        queryKey: bankDetailsQueryKeys.all,
      });
    },
  });
}

// ==================== BANK PROOF UPLOAD MUTATION ====================

/**
 * Hook to upload bank proof image to storage and update KYC documents
 * Uses the existing KYC upload flow for consistency
 */
/**
 * Hook to upload bank proof image to storage and update KYC documents
 * Also updates the bank details table with the proof image URL
 */
export function useUploadBankProof() {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);

  return useMutation({
    mutationFn: async (input: UploadBankProofInput & { userType: 'vendor' | 'delivery_boy' }) => {
      try {
        // Check if bank_passbook document already exists
        const { data: existing } = await supabase
          .from('kyc_documents')
          .select('id, document_url, user_id')
          .eq('user_id', input.userId)
          .eq('document_type', 'bank_passbook')
          .maybeSingle();

        console.log('Existing bank passbook:', existing);

        // Determine storage bucket based on user type
        const storageBucket = input.userType === 'vendor' ? 'vendors' : 'delivery_boys';

        // Delete old file from storage if updating
        if (existing?.document_url) {
          const urlParts = existing.document_url.split(`/${storageBucket}/`);
          if (urlParts.length > 1) {
            const oldFilePath = urlParts[1];
            console.log('Deleting old file:', oldFilePath);

            const { error: deleteError } = await supabase.storage
              .from(storageBucket)
              .remove([oldFilePath]);

            // Don't throw on delete error, just log it
            if (deleteError) {
              console.warn('Failed to delete old file:', deleteError);
            }
          }
        }

        // Extract file extension from URI
        const fileExt = input.imageUri.split('.').pop() || 'jpg';
        const fileName = `bank_proof_${Date.now()}.${fileExt}`;
        const filePath = `${input.userId}/kycDocuments/${fileName}`;

        console.log('Uploading bank proof to:', filePath);

        // Upload to Supabase Storage using base64
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(storageBucket)
          .upload(filePath, decode(input.base64), {
            contentType: `image/${fileExt}`,
            upsert: false,
          });

        if (uploadError) {
          console.error('Storage upload error:', uploadError);
          throw new Error(`Upload failed: ${uploadError.message}`);
        }

        console.log('Upload successful:', uploadData);

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from(storageBucket).getPublicUrl(filePath);

        console.log('Public URL:', publicUrl);

        // Update or create KYC document
        let kycDocument;
        if (existing) {
          // Update existing KYC document
          const { data, error } = await supabase
            .from('kyc_documents')
            .update({
              document_url: publicUrl,
              status: 'pending',
              uploaded_date: new Date().toISOString(),
              verified_date: null,
              verified_by: null,
              rejection_reason: null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id)
            .select()
            .single();

          if (error) throw error;
          kycDocument = data;
        } else {
          // Insert new KYC document
          const { data, error } = await supabase
            .from('kyc_documents')
            .insert({
              user_id: input.userId,
              user_type: input.userType,
              document_type: 'bank_passbook',
              document_url: publicUrl,
              status: 'pending',
              uploaded_date: new Date().toISOString(),
              is_required: false,
            })
            .select()
            .single();

          if (error) throw error;
          kycDocument = data;
        }

        // Update bank details table with proof image URL
        if (input.userType === 'vendor') {
          // Update vendor bank details
          const { error: vendorBankError } = await supabase
            .from('vendor_bank_details')
            .update({
              proof_image: publicUrl,
              updated_at: new Date().toISOString(),
            })
            .eq('vendor_id', input.userId);

          // Don't throw if no bank details exist yet - they might add them later
          if (vendorBankError) {
            console.warn('Failed to update vendor bank details:', vendorBankError);
          }
        } else {
          // Update delivery boy bank details
          const { error: deliveryBoyBankError } = await supabase
            .from('delivery_boy_bank_details')
            .update({
              proof_image: publicUrl,
              updated_at: new Date().toISOString(),
            })
            .eq('delivery_boy_id', input.userId);

          // Don't throw if no bank details exist yet - they might add them later
          if (deliveryBoyBankError) {
            console.warn('Failed to update delivery boy bank details:', deliveryBoyBankError);
          }
        }

        return {
          documentUrl: publicUrl,
          kycDocument: kycDocument,
          isUpdate: !!existing,
        };
      } catch (error: any) {
        console.error('Upload bank proof error:', error);
        throw new Error(error.message || 'Upload failed');
      }
    },
    onSuccess: (data, variables) => {
      // Invalidate KYC passbook query
      queryClient.invalidateQueries({
        queryKey: bankDetailsQueryKeys.kycPassbook(variables.userId),
      });

      // Invalidate bank details queries based on user type
      if (variables.userType === 'vendor') {
        queryClient.invalidateQueries({
          queryKey: bankDetailsQueryKeys.vendor(variables.userId),
        });
      } else {
        queryClient.invalidateQueries({
          queryKey: bankDetailsQueryKeys.deliveryBoy(variables.userId),
        });
      }

      // Also invalidate the main KYC queries
      const kycQueryKeys = {
        all: ['kyc-documents'] as const,
        byUser: (userId: string, userType: 'vendor' | 'delivery_boy') =>
          ['kyc-documents', 'user', userId, userType] as const,
      };

      queryClient.invalidateQueries({
        queryKey: kycQueryKeys.byUser(variables.userId, variables.userType),
      });
      queryClient.invalidateQueries({
        queryKey: kycQueryKeys.all,
      });

      // Invalidate all bank details queries
      queryClient.invalidateQueries({
        queryKey: bankDetailsQueryKeys.all,
      });
    },
  });
}

// ==================== UTILITY HOOKS ====================

/**
 * Hook to get bank verification status
 */
export function useBankVerificationStatus(userId: string, userType: 'vendor' | 'delivery_boy') {
  const vendorQuery = useVendorBankDetails(userId);
  const deliveryBoyQuery = useDeliveryBoyBankDetails(userId);

  const bankDetails = userType === 'vendor' ? vendorQuery.data : deliveryBoyQuery.data;

  return {
    status: bankDetails?.status || 'not_added',
    isVerified: bankDetails?.is_verified || false,
    isPending: bankDetails?.status === 'pending',
    isRejected: bankDetails?.status === 'rejected',
    rejectionReason: bankDetails?.rejection_reason,
    bankDetails,
  };
}

/**
 * Hook to validate IFSC code format
 */
export function useValidateIFSC() {
  return (ifscCode: string): boolean => {
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    return ifscRegex.test(ifscCode);
  };
}

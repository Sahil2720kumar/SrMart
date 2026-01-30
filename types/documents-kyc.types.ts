export type KycUserType = 'vendor' | 'delivery_boy';

export type KycDocumentStatus =
  | 'not_uploaded'
  | 'pending'
  | 'verified'
  | 'approved'
  | 'rejected';

export type KycDocumentType =
  | 'aadhaar'
  | 'pan'
  | 'driving_license'
  | 'bank_passbook'
  | 'profile_photo';

export interface KycDocument {
  id: string; // uuid

  user_id: string; // uuid
  user_type: KycUserType;

  document_type: KycDocumentType;
  document_name: string;

  document_description?: string | null;
  document_url?: string | null;
  document_number?: string | null;

  status: KycDocumentStatus;

  uploaded_date?: string | null; // timestamptz
  verified_date?: string | null; // timestamptz
  verified_by?: string | null; // uuid
  rejection_reason?: string | null;
  is_required: boolean;
  created_at: string; // timestamptz
  updated_at: string; // timestamptz
}

export type KycDocumentInsert =
  Omit<KycDocument, 'id' | 'created_at' | 'updated_at'>;

export type KycDocumentUpdate =
  Partial<Omit<KycDocument, 'id' | 'user_id'>>;




export interface SecretaryDelegation {
  id: string;
  doctor_id: string;
  secretary_id: string;
  permissions: string[];
  created_at: string;
  updated_at: string;
}

export interface CreateDelegationRequest {
  secretary_id: string;
  permissions: string[];
}

export interface UpdateDelegationRequest {
  permissions: string[];
}

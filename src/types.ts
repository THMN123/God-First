export interface Member {
  phone: string;
  name: string;
  location_info?: string;
  savings_goal?: number;
  avatar_url?: string;
  savings: number;
  current_loan: number;
  loan_repayment: number;
  is_admin: number;
}

export interface Transaction {
  id: number;
  member_phone: string;
  member_name?: string;
  amount: number;
  type: 'saving' | 'loan';
  proof_ref: string;
  reason?: string;
  member_savings_at_time?: number;
  status: 'pending' | 'verified' | 'rejected';
  timestamp: string;
}

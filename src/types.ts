export interface Member {
  id: string;
  name: string;
  phone: string;
  savings: number;
  current_loan: number;
  joined_date: string;
  notes?: string;
}

export type TransactionType = 'SAVINGS_DEPOSIT' | 'LOAN_REPAYMENT' | 'LOAN_ISSUED' | 'SAVINGS_WITHDRAWAL';

export interface Transaction {
  id: string;
  member_id: string;
  member_name: string;
  type: TransactionType;
  amount: number;
  date: string;
  note?: string;
  savings_after: number;
  loan_after: number;
}

export interface WhatsAppStatus {
  status: 'DISCONNECTED' | 'PAIRING' | 'CONNECTED';
  phoneNumber?: string;
  qrCodeDataUrl?: string;
  pairingCode?: string;
  connectedAt?: string;
}

export interface StatementLog {
  memberId: string;
  memberName: string;
  phone: string;
  status: 'pending' | 'sent' | 'failed';
  messageText: string;
  sentAt?: string;
  error?: string;
}

export interface BatchSendResult {
  batchId: string;
  timestamp: string;
  totalMembers: number;
  sentCount: number;
  failedCount: number;
  logs: StatementLog[];
}

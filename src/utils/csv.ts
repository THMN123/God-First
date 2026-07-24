import { Member, Transaction } from '../types';

/**
 * Trigger file download in browser
 */
function downloadCSV(csvContent: string, fileName: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export member roster to CSV file
 */
export function exportMembersToCSV(members: Member[]) {
  const headers = ['Member ID', 'Full Name', 'Phone Number', 'Savings Balance (ZAR)', 'Current Loan (ZAR)', 'Joined Date', 'Notes'];
  const rows = members.map(m => [
    `"${m.id}"`,
    `"${m.name.replace(/"/g, '""')}"`,
    `"${m.phone.replace(/"/g, '""')}"`,
    m.savings,
    m.current_loan,
    `"${m.joined_date || ''}"`,
    `"${(m.notes || '').replace(/"/g, '""')}"`
  ]);

  const csvString = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const dateStr = new Date().toISOString().split('T')[0];
  downloadCSV(csvString, `god_first_members_${dateStr}.csv`);
}

/**
 * Export ledger transaction logs to CSV file
 */
export function exportTransactionsToCSV(transactions: Transaction[]) {
  const headers = ['Transaction ID', 'Date & Time', 'Member ID', 'Member Name', 'Transaction Type', 'Amount (ZAR)', 'Savings Balance After', 'Loan Balance After', 'Note'];
  const rows = transactions.map(t => [
    `"${t.id}"`,
    `"${t.date}"`,
    `"${t.member_id}"`,
    `"${t.member_name.replace(/"/g, '""')}"`,
    `"${t.type}"`,
    t.amount,
    t.savings_after !== undefined ? t.savings_after : '',
    t.loan_after !== undefined ? t.loan_after : '',
    `"${(t.note || '').replace(/"/g, '""')}"`
  ]);

  const csvString = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const dateStr = new Date().toISOString().split('T')[0];
  downloadCSV(csvString, `god_first_ledger_${dateStr}.csv`);
}

/**
 * Parse uploaded CSV file into Member records
 */
export function parseMembersCSV(csvText: string): Array<Omit<Member, 'id' | 'joined_date'>> {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length === 0) return [];

  // Detect header row or start directly
  const firstLine = lines[0].toLowerCase();
  const hasHeader = firstLine.includes('name') || firstLine.includes('phone') || firstLine.includes('member');
  const startIndex = hasHeader ? 1 : 0;

  const parsedMembers: Array<Omit<Member, 'id' | 'joined_date'>> = [];

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Simple robust CSV split handling quotes
    const regex = /(?:^|,)(?:"([^"]*)"|([^,]*))/g;
    const columns: string[] = [];
    let match;
    while ((match = regex.exec(line)) !== null) {
      // Avoid matching empty trailing string
      if (match.index === regex.lastIndex) {
        regex.lastIndex++;
      }
      columns.push((match[1] || match[2] || '').trim());
    }

    if (columns.length < 2) continue; // Must have at least name & phone

    // Extract fields (flexible column mapping)
    // Common columns: [ID, Name, Phone, Savings, Loan, Notes] or [Name, Phone, Savings, Loan, Notes]
    let name = '';
    let phone = '';
    let savings = 0;
    let loan = 0;
    let notes = '';

    if (columns[0].toLowerCase().startsWith('mem-') || columns[0].length < 10) {
      // First col might be ID or name
      if (columns.length >= 3 && (columns[2].includes('+') || columns[2].replace(/\D/g, '').length >= 8)) {
        name = columns[1];
        phone = columns[2];
        savings = parseFloat(columns[3]) || 0;
        loan = parseFloat(columns[4]) || 0;
        notes = columns[6] || columns[5] || '';
      } else {
        name = columns[0];
        phone = columns[1];
        savings = parseFloat(columns[2]) || 0;
        loan = parseFloat(columns[3]) || 0;
        notes = columns[4] || '';
      }
    } else {
      name = columns[0];
      phone = columns[1];
      savings = parseFloat(columns[2]) || 0;
      loan = parseFloat(columns[3]) || 0;
      notes = columns[4] || '';
    }

    // Format phone to standard +27 or +266 format if needed
    if (phone && !phone.startsWith('+')) {
      const digits = phone.replace(/\D/g, '');
      if (digits.startsWith('266')) {
        phone = `+${digits.slice(0, 3)} ${digits.slice(3)}`;
      } else if (digits.startsWith('27')) {
        phone = `+${digits.slice(0, 2)} ${digits.slice(2)}`;
      } else if (digits.startsWith('0')) {
        phone = `+27 ${digits.slice(1)}`;
      } else {
        phone = `+27 ${digits}`;
      }
    }

    if (name.trim() && phone.trim()) {
      parsedMembers.push({
        name: name.trim(),
        phone: phone.trim(),
        savings: isNaN(savings) ? 0 : savings,
        current_loan: isNaN(loan) ? 0 : loan,
        notes: notes.trim()
      });
    }
  }

  return parsedMembers;
}

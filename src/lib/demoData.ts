import type { Borrower, CollectionNote, Loan, Payment } from './types'

const now = new Date().toISOString()
const offsetDate = (days: number) => {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export const demoBorrowers: Borrower[] = [
  {
    id: 'b1',
    full_name: 'Kagiso Molefe',
    phone: '+267 71 100 101',
    national_id: 'OM1234567',
    address: 'Mogoditshane, Gaborone',
    risk_notes: 'Pays on time most months.',
    created_at: now,
  },
  {
    id: 'b2',
    full_name: 'Neo Dintle',
    phone: '+267 72 200 202',
    national_id: 'OM7654321',
    address: 'Tlokweng, Gaborone',
    risk_notes: 'Needs follow-up before due date.',
    created_at: now,
  },
  {
    id: 'b3',
    full_name: 'Thabo Ndlovu',
    phone: '+267 73 300 303',
    national_id: 'OM3334445',
    address: 'Block 8, Gaborone',
    risk_notes: 'Late on previous loan.',
    created_at: now,
  },
]

export const demoLoans: Loan[] = [
  {
    id: 'l1',
    borrower_id: 'b1',
    principal: 1200,
    interest_rate: 25,
    issue_date: offsetDate(-20),
    due_date: offsetDate(10),
    status: 'active',
    purpose: 'School fees',
    notes: 'Repeat customer',
    created_at: now,
  },
  {
    id: 'l2',
    borrower_id: 'b2',
    principal: 850,
    interest_rate: 20,
    issue_date: offsetDate(-40),
    due_date: offsetDate(-5),
    status: 'overdue',
    purpose: 'Business stock',
    notes: 'Needs active follow-up',
    created_at: now,
  },
  {
    id: 'l3',
    borrower_id: 'b3',
    principal: 3000,
    interest_rate: 30,
    issue_date: offsetDate(-75),
    due_date: offsetDate(-25),
    status: 'defaulted',
    purpose: 'Emergency cash',
    notes: 'High risk account',
    created_at: now,
  },
]

export const demoPayments: Payment[] = [
  {
    id: 'p1',
    loan_id: 'l1',
    amount: 400,
    payment_date: offsetDate(-5),
    method: 'Cash',
    reference: 'RCPT-101',
    notes: '',
    created_at: now,
  },
  {
    id: 'p2',
    loan_id: 'l2',
    amount: 300,
    payment_date: offsetDate(-10),
    method: 'Bank transfer',
    reference: 'TRF-202',
    notes: 'Part payment',
    created_at: now,
  },
]

export const demoCollectionNotes: CollectionNote[] = [
  {
    id: 'c1',
    loan_id: 'l2',
    note: 'Called borrower, promised to pay by Friday.',
    contact_date: offsetDate(-2),
    next_action_date: offsetDate(2),
    created_at: now,
  },
  {
    id: 'c2',
    loan_id: 'l3',
    note: 'No answer. Consider escalation or guarantor follow-up.',
    contact_date: offsetDate(-3),
    next_action_date: offsetDate(1),
    created_at: now,
  },
]

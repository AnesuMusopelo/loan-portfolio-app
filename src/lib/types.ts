export type LoanStatus = 'active' | 'paid' | 'overdue' | 'defaulted'

export interface Borrower {
  id: string
  full_name: string
  phone: string
  national_id: string
  address: string
  risk_notes: string
  created_at: string
}

export interface Loan {
  id: string
  borrower_id: string
  principal: number
  interest_rate: number
  issue_date: string
  due_date: string
  status: LoanStatus
  purpose: string
  notes: string
  created_at: string
}

export interface Payment {
  id: string
  loan_id: string
  amount: number
  payment_date: string
  method: string
  reference: string
  notes: string
  created_at: string
}

export interface CollectionNote {
  id: string
  loan_id: string
  note: string
  contact_date: string
  next_action_date: string | null
  created_at: string
}

export interface LoanWithBorrower extends Loan {
  borrower?: Borrower
  payments?: Payment[]
  collectionNotes?: CollectionNote[]
}

export interface PortfolioSummary {
  totalPrincipalIssued: number
  activeExposure: number
  totalCollected: number
  expectedInterest: number
  outstandingBalance: number
  overdueBalance: number
  loansDueThisWeek: number
  loansDueThisMonth: number
  overdueCount: number
  defaultCount: number
  collectionRate: number
}

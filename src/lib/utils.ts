import type { Borrower, CollectionNote, Loan, LoanWithBorrower, Payment, PortfolioSummary } from './types'

export const currency = (value: number) =>
  new Intl.NumberFormat('en-BW', {
    style: 'currency',
    currency: 'BWP',
    maximumFractionDigits: 2,
  }).format(value)

export const percent = (value: number) => `${value.toFixed(1)}%`

export const today = () => new Date().toISOString().slice(0, 10)

export const daysBetween = (from: string, to: string) => {
  const a = new Date(from)
  const b = new Date(to)
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24))
}

export const totalExpectedRepayment = (loan: Loan) => loan.principal * (1 + loan.interest_rate / 100)

export const totalPaidForLoan = (loanId: string, payments: Payment[]) =>
  payments.filter((payment) => payment.loan_id === loanId).reduce((sum, payment) => sum + payment.amount, 0)

export const outstandingForLoan = (loan: Loan, payments: Payment[]) =>
  Math.max(totalExpectedRepayment(loan) - totalPaidForLoan(loan.id, payments), 0)

export const isOverdue = (loan: Loan, payments: Payment[]) =>
  outstandingForLoan(loan, payments) > 0 && new Date(loan.due_date) < new Date(today())

export const buildLoanView = (
  loans: Loan[],
  borrowers: Borrower[],
  payments: Payment[],
  collectionNotes: CollectionNote[],
): LoanWithBorrower[] =>
  loans.map((loan) => ({
    ...loan,
    borrower: borrowers.find((borrower) => borrower.id === loan.borrower_id),
    payments: payments.filter((payment) => payment.loan_id === loan.id),
    collectionNotes: collectionNotes.filter((note) => note.loan_id === loan.id),
  }))

export const computePortfolioSummary = (loans: Loan[], payments: Payment[]): PortfolioSummary => {
  const totalPrincipalIssued = loans.reduce((sum, loan) => sum + loan.principal, 0)
  const activeLoans = loans.filter((loan) => loan.status === 'active' || loan.status === 'overdue')
  const activeExposure = activeLoans.reduce((sum, loan) => sum + outstandingForLoan(loan, payments), 0)
  const totalCollected = payments.reduce((sum, payment) => sum + payment.amount, 0)
  const expectedInterest = loans.reduce((sum, loan) => sum + loan.principal * (loan.interest_rate / 100), 0)
  const outstandingBalance = loans.reduce((sum, loan) => sum + outstandingForLoan(loan, payments), 0)
  const overdueLoans = loans.filter((loan) => isOverdue(loan, payments) || loan.status === 'overdue')
  const overdueBalance = overdueLoans.reduce((sum, loan) => sum + outstandingForLoan(loan, payments), 0)
  const now = new Date(today())
  const in7 = new Date(now)
  in7.setDate(now.getDate() + 7)
  const in30 = new Date(now)
  in30.setDate(now.getDate() + 30)
  const loansDueThisWeek = loans.filter((loan) => {
    const due = new Date(loan.due_date)
    return due >= now && due <= in7 && outstandingForLoan(loan, payments) > 0
  }).length
  const loansDueThisMonth = loans.filter((loan) => {
    const due = new Date(loan.due_date)
    return due >= now && due <= in30 && outstandingForLoan(loan, payments) > 0
  }).length
  const overdueCount = overdueLoans.length
  const defaultCount = loans.filter((loan) => loan.status === 'defaulted').length
  const expectedRepayment = loans.reduce((sum, loan) => sum + totalExpectedRepayment(loan), 0)
  const collectionRate = expectedRepayment === 0 ? 0 : (totalCollected / expectedRepayment) * 100

  return {
    totalPrincipalIssued,
    activeExposure,
    totalCollected,
    expectedInterest,
    outstandingBalance,
    overdueBalance,
    loansDueThisWeek,
    loansDueThisMonth,
    overdueCount,
    defaultCount,
    collectionRate,
  }
}

import type { ReactElement } from 'react'
import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  CircleDollarSign,
  Clock3,
  Coins,
  HandCoins,
  Landmark,
  NotebookPen,
  ShieldAlert,
  Users,
  Wallet,
} from 'lucide-react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Bar, BarChart } from 'recharts'
import { MetricCard } from './components/MetricCard'
import { SectionCard } from './components/SectionCard'
import {
  addBorrower,
  addCollectionNote,
  addLoan,
  addPayment,
  getBorrowers,
  getCollectionNotes,
  getLoans,
  getPayments,
} from './lib/dataService'
import { hasSupabaseEnv } from './lib/supabase'
import type { Borrower, CollectionNote, Loan, Payment } from './lib/types'
import {
  buildLoanView,
  computePortfolioSummary,
  currency,
  daysBetween,
  outstandingForLoan,
  percent,
  today,
  totalExpectedRepayment,
  totalPaidForLoan,
} from './lib/utils'
import './styles.css'

type ViewKey = 'dashboard' | 'borrowers' | 'loans' | 'payments' | 'collections' | 'reports'

const navItems: { key: ViewKey; label: string; icon: ReactElement }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: <BarChart3 size={18} /> },
  { key: 'borrowers', label: 'Borrowers', icon: <Users size={18} /> },
  { key: 'loans', label: 'Loans', icon: <HandCoins size={18} /> },
  { key: 'payments', label: 'Payments', icon: <Wallet size={18} /> },
  { key: 'collections', label: 'Collections', icon: <NotebookPen size={18} /> },
  { key: 'reports', label: 'Reports', icon: <BookOpen size={18} /> },
]

export default function App() {
  const [view, setView] = useState<ViewKey>('dashboard')
  const [borrowers, setBorrowers] = useState<Borrower[]>([])
  const [loans, setLoans] = useState<Loan[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [collectionNotes, setCollectionNotes] = useState<CollectionNote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [borrowerForm, setBorrowerForm] = useState({
    full_name: '',
    phone: '',
    national_id: '',
    address: '',
    risk_notes: '',
  })

  const [loanForm, setLoanForm] = useState({
    borrower_id: '',
    principal: '1000',
    interest_rate: '25',
    issue_date: today(),
    due_date: today(),
    status: 'active' as Loan['status'],
    purpose: '',
    notes: '',
  })

  const [paymentForm, setPaymentForm] = useState({
    loan_id: '',
    amount: '0',
    payment_date: today(),
    method: 'Cash',
    reference: '',
    notes: '',
  })

  const [collectionForm, setCollectionForm] = useState({
    loan_id: '',
    note: '',
    contact_date: today(),
    next_action_date: '',
  })

  const refreshData = async () => {
    try {
      setLoading(true)
      const [borrowerRows, loanRows, paymentRows, collectionRows] = await Promise.all([
        getBorrowers(),
        getLoans(),
        getPayments(),
        getCollectionNotes(),
      ])
      setBorrowers(borrowerRows)
      setLoans(loanRows)
      setPayments(paymentRows)
      setCollectionNotes(collectionRows)
      if (!loanForm.borrower_id && borrowerRows[0]) {
        setLoanForm((current) => ({ ...current, borrower_id: borrowerRows[0].id }))
      }
      if (!paymentForm.loan_id && loanRows[0]) {
        setPaymentForm((current) => ({ ...current, loan_id: loanRows[0].id }))
      }
      if (!collectionForm.loan_id && loanRows[0]) {
        setCollectionForm((current) => ({ ...current, loan_id: loanRows[0].id }))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refreshData()
  }, [])

  const loansWithBorrowers = useMemo(
    () => buildLoanView(loans, borrowers, payments, collectionNotes),
    [loans, borrowers, payments, collectionNotes],
  )

  const summary = useMemo(() => computePortfolioSummary(loans, payments), [loans, payments])

  const monthlyChart = useMemo(() => {
    const map = new Map<string, { month: string; lent: number; collected: number }>()

    loans.forEach((loan) => {
      const month = loan.issue_date.slice(0, 7)
      const row = map.get(month) ?? { month, lent: 0, collected: 0 }
      row.lent += loan.principal
      map.set(month, row)
    })

    payments.forEach((payment) => {
      const month = payment.payment_date.slice(0, 7)
      const row = map.get(month) ?? { month, lent: 0, collected: 0 }
      row.collected += payment.amount
      map.set(month, row)
    })

    return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month))
  }, [loans, payments])

  const agingData = useMemo(() => {
    const buckets = [
      { label: 'Current', min: -9999, max: 0 },
      { label: '1-7 days', min: 1, max: 7 },
      { label: '8-30 days', min: 8, max: 30 },
      { label: '31+ days', min: 31, max: 9999 },
    ]

    return buckets.map((bucket) => {
      const total = loans.reduce((sum, loan) => {
        const overdueDays = Math.max(daysBetween(loan.due_date, today()) * -1, 0)
        const daysLate = new Date(loan.due_date) < new Date(today()) ? Math.abs(daysBetween(today(), loan.due_date)) : 0
        const score = daysLate || overdueDays
        if (score >= bucket.min && score <= bucket.max) return sum + outstandingForLoan(loan, payments)
        return sum
      }, 0)

      return { bucket: bucket.label, amount: total }
    })
  }, [loans, payments])

  const submitBorrower = async (event: React.FormEvent) => {
    event.preventDefault()
    await addBorrower(borrowerForm)
    setBorrowerForm({ full_name: '', phone: '', national_id: '', address: '', risk_notes: '' })
    await refreshData()
  }

  const submitLoan = async (event: React.FormEvent) => {
    event.preventDefault()
    await addLoan({
      ...loanForm,
      principal: Number(loanForm.principal),
      interest_rate: Number(loanForm.interest_rate),
    })
    setLoanForm((current) => ({ ...current, principal: '1000', interest_rate: '25', purpose: '', notes: '' }))
    await refreshData()
  }

  const submitPayment = async (event: React.FormEvent) => {
    event.preventDefault()
    await addPayment({
      ...paymentForm,
      amount: Number(paymentForm.amount),
    })
    setPaymentForm((current) => ({ ...current, amount: '0', reference: '', notes: '' }))
    await refreshData()
  }

  const submitCollectionNote = async (event: React.FormEvent) => {
    event.preventDefault()
    await addCollectionNote({
      ...collectionForm,
      next_action_date: collectionForm.next_action_date || null,
    })
    setCollectionForm((current) => ({ ...current, note: '', next_action_date: '' }))
    await refreshData()
  }

  const riskyLoans = loansWithBorrowers
    .filter((loan) => loan.status === 'overdue' || loan.status === 'defaulted')
    .sort((a, b) => outstandingForLoan(b, payments) - outstandingForLoan(a, payments))
    .slice(0, 5)

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <div className="brand-badge">LoanBook</div>
          <h1>Portfolio command center</h1>
          <p>Track borrowers, repayments, risk, and cash exposure from one web app.</p>
        </div>

        <nav className="nav-list">
          {navItems.map((item) => (
            <button
              key={item.key}
              className={`nav-item ${view === item.key ? 'active' : ''}`}
              onClick={() => setView(item.key)}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="side-note">
          <strong>{hasSupabaseEnv ? 'Supabase live mode' : 'Demo mode active'}</strong>
          <span>
            {hasSupabaseEnv
              ? 'Your forms save to the connected Supabase project.'
              : 'No Supabase keys found yet, so the app uses local demo data and localStorage.'}
          </span>
        </div>
      </aside>

      <main className="main-content">
        <header className="page-header">
          <div>
            <div className="eyebrow">Small loan business overview</div>
            <h2>
              {view === 'dashboard' && 'Business dashboard'}
              {view === 'borrowers' && 'Borrower management'}
              {view === 'loans' && 'Loan book'}
              {view === 'payments' && 'Repayments'}
              {view === 'collections' && 'Collections and arrears'}
              {view === 'reports' && 'Portfolio reporting'}
            </h2>
          </div>
          <div className="status-pill">{loading ? 'Loading...' : `${loans.length} loans tracked`}</div>
        </header>

        {error ? <div className="error-banner">{error}</div> : null}

        {view === 'dashboard' && (
          <>
            <section className="metrics-grid">
              <MetricCard
                label="Total principal issued"
                value={currency(summary.totalPrincipalIssued)}
                hint="All loans ever created"
                icon={<Landmark size={22} />}
              />
              <MetricCard
                label="Active exposure"
                value={currency(summary.activeExposure)}
                hint="Capital still at risk"
                icon={<ShieldAlert size={22} />}
              />
              <MetricCard
                label="Total collected"
                value={currency(summary.totalCollected)}
                hint="Cash already returned"
                icon={<Coins size={22} />}
              />
              <MetricCard
                label="Expected interest"
                value={currency(summary.expectedInterest)}
                hint="If every loan is repaid"
                icon={<CircleDollarSign size={22} />}
              />
              <MetricCard
                label="Overdue balance"
                value={currency(summary.overdueBalance)}
                hint={`${summary.overdueCount} overdue account(s)`}
                icon={<AlertTriangle size={22} />}
              />
              <MetricCard
                label="Collection rate"
                value={percent(summary.collectionRate)}
                hint={`${summary.loansDueThisWeek} due in 7 days`}
                icon={<Clock3 size={22} />}
              />
            </section>

            <section className="two-col-grid">
              <SectionCard title="Cash flow trend" subtitle="How much you lent out versus how much came back">
                <div className="chart-box">
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={monthlyChart}>
                      <defs>
                        <linearGradient id="lendingFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="currentColor" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="currentColor" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => currency(Number(value ?? 0))} />
                      <Area type="monotone" dataKey="lent" fill="url(#lendingFill)" stroke="currentColor" />
                      <Area type="monotone" dataKey="collected" fillOpacity={0.15} strokeOpacity={0.7} stroke="currentColor" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </SectionCard>

              <SectionCard title="Most urgent accounts" subtitle="Largest overdue or defaulted balances first">
                <div className="stack-list">
                  {riskyLoans.length === 0 ? (
                    <p className="empty-text">No overdue or defaulted loans right now.</p>
                  ) : (
                    riskyLoans.map((loan) => (
                      <div key={loan.id} className="stack-row">
                        <div>
                          <strong>{loan.borrower?.full_name ?? 'Unknown borrower'}</strong>
                          <div className="muted-line">
                            {loan.status.toUpperCase()} · due {loan.due_date} · {loan.borrower?.phone}
                          </div>
                        </div>
                        <strong>{currency(outstandingForLoan(loan, payments))}</strong>
                      </div>
                    ))
                  )}
                </div>
              </SectionCard>
            </section>
          </>
        )}

        {view === 'borrowers' && (
          <section className="two-col-grid">
            <SectionCard title="Add borrower" subtitle="Capture identity and contact details for your records">
              <form className="form-grid" onSubmit={submitBorrower}>
                <label>
                  Full name
                  <input
                    value={borrowerForm.full_name}
                    onChange={(e) => setBorrowerForm({ ...borrowerForm, full_name: e.target.value })}
                    required
                  />
                </label>
                <label>
                  Phone
                  <input value={borrowerForm.phone} onChange={(e) => setBorrowerForm({ ...borrowerForm, phone: e.target.value })} required />
                </label>
                <label>
                  National ID
                  <input
                    value={borrowerForm.national_id}
                    onChange={(e) => setBorrowerForm({ ...borrowerForm, national_id: e.target.value })}
                    required
                  />
                </label>
                <label>
                  Address
                  <input value={borrowerForm.address} onChange={(e) => setBorrowerForm({ ...borrowerForm, address: e.target.value })} />
                </label>
                <label className="full-span">
                  Risk notes
                  <textarea
                    rows={4}
                    value={borrowerForm.risk_notes}
                    onChange={(e) => setBorrowerForm({ ...borrowerForm, risk_notes: e.target.value })}
                  />
                </label>
                <button className="primary-button" type="submit">
                  Save borrower
                </button>
              </form>
            </SectionCard>

            <SectionCard title="Borrower list" subtitle={`${borrowers.length} borrower(s) on file`}>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Phone</th>
                      <th>ID</th>
                      <th>Address</th>
                      <th>Risk notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {borrowers.map((borrower) => (
                      <tr key={borrower.id}>
                        <td>{borrower.full_name}</td>
                        <td>{borrower.phone}</td>
                        <td>{borrower.national_id}</td>
                        <td>{borrower.address}</td>
                        <td>{borrower.risk_notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          </section>
        )}

        {view === 'loans' && (
          <section className="two-col-grid">
            <SectionCard title="Create loan" subtitle="This drives your exposure, revenue, and due-date tracking">
              <form className="form-grid" onSubmit={submitLoan}>
                <label>
                  Borrower
                  <select value={loanForm.borrower_id} onChange={(e) => setLoanForm({ ...loanForm, borrower_id: e.target.value })} required>
                    {borrowers.map((borrower) => (
                      <option key={borrower.id} value={borrower.id}>
                        {borrower.full_name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Principal
                  <input value={loanForm.principal} onChange={(e) => setLoanForm({ ...loanForm, principal: e.target.value })} type="number" min="0" required />
                </label>
                <label>
                  Interest %
                  <input
                    value={loanForm.interest_rate}
                    onChange={(e) => setLoanForm({ ...loanForm, interest_rate: e.target.value })}
                    type="number"
                    min="0"
                    required
                  />
                </label>
                <label>
                  Issue date
                  <input value={loanForm.issue_date} onChange={(e) => setLoanForm({ ...loanForm, issue_date: e.target.value })} type="date" required />
                </label>
                <label>
                  Due date
                  <input value={loanForm.due_date} onChange={(e) => setLoanForm({ ...loanForm, due_date: e.target.value })} type="date" required />
                </label>
                <label>
                  Status
                  <select value={loanForm.status} onChange={(e) => setLoanForm({ ...loanForm, status: e.target.value as Loan['status'] })}>
                    <option value="active">Active</option>
                    <option value="paid">Paid</option>
                    <option value="overdue">Overdue</option>
                    <option value="defaulted">Defaulted</option>
                  </select>
                </label>
                <label>
                  Purpose
                  <input value={loanForm.purpose} onChange={(e) => setLoanForm({ ...loanForm, purpose: e.target.value })} />
                </label>
                <label className="full-span">
                  Notes
                  <textarea rows={4} value={loanForm.notes} onChange={(e) => setLoanForm({ ...loanForm, notes: e.target.value })} />
                </label>
                <button className="primary-button" type="submit">
                  Save loan
                </button>
              </form>
            </SectionCard>

            <SectionCard title="Loan book" subtitle={`${loans.length} loan(s) tracked`}>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Borrower</th>
                      <th>Principal</th>
                      <th>Total due</th>
                      <th>Paid</th>
                      <th>Outstanding</th>
                      <th>Status</th>
                      <th>Due</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loansWithBorrowers.map((loan) => (
                      <tr key={loan.id}>
                        <td>{loan.borrower?.full_name}</td>
                        <td>{currency(loan.principal)}</td>
                        <td>{currency(totalExpectedRepayment(loan))}</td>
                        <td>{currency(totalPaidForLoan(loan.id, payments))}</td>
                        <td>{currency(outstandingForLoan(loan, payments))}</td>
                        <td>
                          <span className={`status status-${loan.status}`}>{loan.status}</span>
                        </td>
                        <td>{loan.due_date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          </section>
        )}

        {view === 'payments' && (
          <section className="two-col-grid">
            <SectionCard title="Record repayment" subtitle="Every payment should be captured separately for proper history">
              <form className="form-grid" onSubmit={submitPayment}>
                <label>
                  Loan
                  <select value={paymentForm.loan_id} onChange={(e) => setPaymentForm({ ...paymentForm, loan_id: e.target.value })} required>
                    {loansWithBorrowers.map((loan) => (
                      <option key={loan.id} value={loan.id}>
                        {loan.borrower?.full_name} · due {currency(outstandingForLoan(loan, payments))}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Amount
                  <input value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} type="number" min="0" required />
                </label>
                <label>
                  Payment date
                  <input value={paymentForm.payment_date} onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })} type="date" required />
                </label>
                <label>
                  Method
                  <input value={paymentForm.method} onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })} required />
                </label>
                <label>
                  Reference
                  <input value={paymentForm.reference} onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })} />
                </label>
                <label className="full-span">
                  Notes
                  <textarea rows={4} value={paymentForm.notes} onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })} />
                </label>
                <button className="primary-button" type="submit">
                  Save payment
                </button>
              </form>
            </SectionCard>

            <SectionCard title="Payment history" subtitle={`${payments.length} payment(s) recorded`}>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Borrower</th>
                      <th>Amount</th>
                      <th>Method</th>
                      <th>Reference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => {
                      const loan = loansWithBorrowers.find((entry) => entry.id === payment.loan_id)
                      return (
                        <tr key={payment.id}>
                          <td>{payment.payment_date}</td>
                          <td>{loan?.borrower?.full_name ?? 'Unknown borrower'}</td>
                          <td>{currency(payment.amount)}</td>
                          <td>{payment.method}</td>
                          <td>{payment.reference}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          </section>
        )}

        {view === 'collections' && (
          <section className="two-col-grid">
            <SectionCard title="Add collection note" subtitle="Keep a follow-up trail for overdue accounts">
              <form className="form-grid" onSubmit={submitCollectionNote}>
                <label>
                  Loan
                  <select value={collectionForm.loan_id} onChange={(e) => setCollectionForm({ ...collectionForm, loan_id: e.target.value })} required>
                    {loansWithBorrowers.map((loan) => (
                      <option key={loan.id} value={loan.id}>
                        {loan.borrower?.full_name} · {loan.status}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Contact date
                  <input value={collectionForm.contact_date} onChange={(e) => setCollectionForm({ ...collectionForm, contact_date: e.target.value })} type="date" required />
                </label>
                <label>
                  Next action date
                  <input
                    value={collectionForm.next_action_date}
                    onChange={(e) => setCollectionForm({ ...collectionForm, next_action_date: e.target.value })}
                    type="date"
                  />
                </label>
                <label className="full-span">
                  Follow-up note
                  <textarea rows={5} value={collectionForm.note} onChange={(e) => setCollectionForm({ ...collectionForm, note: e.target.value })} required />
                </label>
                <button className="primary-button" type="submit">
                  Save follow-up
                </button>
              </form>
            </SectionCard>

            <SectionCard title="Collections board" subtitle="Focus on arrears, promises to pay, and next steps">
              <div className="stack-list">
                {loansWithBorrowers
                  .filter((loan) => loan.status === 'overdue' || loan.status === 'defaulted')
                  .map((loan) => (
                    <article key={loan.id} className="collection-card">
                      <div className="collection-topline">
                        <div>
                          <strong>{loan.borrower?.full_name}</strong>
                          <div className="muted-line">
                            Outstanding {currency(outstandingForLoan(loan, payments))} · {loan.borrower?.phone}
                          </div>
                        </div>
                        <span className={`status status-${loan.status}`}>{loan.status}</span>
                      </div>
                      <div className="note-list">
                        {loan.collectionNotes && loan.collectionNotes.length > 0 ? (
                          loan.collectionNotes.map((note) => (
                            <div key={note.id} className="note-item">
                              <strong>{note.contact_date}</strong>
                              <p>{note.note}</p>
                              {note.next_action_date ? <span>Next action: {note.next_action_date}</span> : null}
                            </div>
                          ))
                        ) : (
                          <p className="empty-text">No collection notes yet for this loan.</p>
                        )}
                      </div>
                    </article>
                  ))}
              </div>
            </SectionCard>
          </section>
        )}

        {view === 'reports' && (
          <section className="two-col-grid reports-grid">
            <SectionCard title="Portfolio aging" subtitle="Outstanding balance grouped by how late the account is">
              <div className="chart-box">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={agingData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="bucket" />
                    <YAxis />
                    <Tooltip formatter={(value) => currency(Number(value ?? 0))} />
                    <Bar dataKey="amount" fill="currentColor" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>

            <SectionCard title="Key operating questions" subtitle="The app is meant to answer these at a glance">
              <div className="insight-list">
                <div className="insight-item">
                  <strong>How much of my money is still out there?</strong>
                  <span>{currency(summary.outstandingBalance)}</span>
                </div>
                <div className="insight-item">
                  <strong>How much is already in trouble?</strong>
                  <span>{currency(summary.overdueBalance)}</span>
                </div>
                <div className="insight-item">
                  <strong>How many loans need attention this month?</strong>
                  <span>{summary.loansDueThisMonth}</span>
                </div>
                <div className="insight-item">
                  <strong>How much interest is on the table?</strong>
                  <span>{currency(summary.expectedInterest)}</span>
                </div>
              </div>
            </SectionCard>
          </section>
        )}
      </main>
    </div>
  )
}

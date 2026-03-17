import { demoBorrowers, demoCollectionNotes, demoLoans, demoPayments } from './demoData'
import { hasSupabaseEnv, supabase } from './supabase'
import type { Borrower, CollectionNote, Loan, Payment } from './types'

const DEMO_STORAGE_KEY = 'loan-portfolio-demo-db'

type DemoDb = {
  borrowers: Borrower[]
  loans: Loan[]
  payments: Payment[]
  collection_notes: CollectionNote[]
}

const makeId = (prefix: string) => `${prefix}_${crypto.randomUUID()}`

const defaultDb = (): DemoDb => ({
  borrowers: demoBorrowers,
  loans: demoLoans,
  payments: demoPayments,
  collection_notes: demoCollectionNotes,
})

const loadDemoDb = (): DemoDb => {
  const raw = localStorage.getItem(DEMO_STORAGE_KEY)
  if (!raw) {
    const seed = defaultDb()
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(seed))
    return seed
  }
  return JSON.parse(raw) as DemoDb
}

const saveDemoDb = (db: DemoDb) => {
  localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(db))
}

export async function getBorrowers() {
  if (!hasSupabaseEnv || !supabase) return loadDemoDb().borrowers
  const { data, error } = await supabase.from('borrowers').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data as Borrower[]
}

export async function addBorrower(payload: Omit<Borrower, 'id' | 'created_at'>) {
  if (!hasSupabaseEnv || !supabase) {
    const db = loadDemoDb()
    const borrower: Borrower = { id: makeId('borrower'), created_at: new Date().toISOString(), ...payload }
    db.borrowers = [borrower, ...db.borrowers]
    saveDemoDb(db)
    return borrower
  }
  const { data, error } = await supabase.from('borrowers').insert(payload).select().single()
  if (error) throw error
  return data as Borrower
}

export async function getLoans() {
  if (!hasSupabaseEnv || !supabase) return loadDemoDb().loans
  const { data, error } = await supabase.from('loans').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data as Loan[]
}

export async function addLoan(payload: Omit<Loan, 'id' | 'created_at'>) {
  if (!hasSupabaseEnv || !supabase) {
    const db = loadDemoDb()
    const loan: Loan = { id: makeId('loan'), created_at: new Date().toISOString(), ...payload }
    db.loans = [loan, ...db.loans]
    saveDemoDb(db)
    return loan
  }
  const { data, error } = await supabase.from('loans').insert(payload).select().single()
  if (error) throw error
  return data as Loan
}

export async function getPayments() {
  if (!hasSupabaseEnv || !supabase) return loadDemoDb().payments
  const { data, error } = await supabase.from('payments').select('*').order('payment_date', { ascending: false })
  if (error) throw error
  return data as Payment[]
}

export async function addPayment(payload: Omit<Payment, 'id' | 'created_at'>) {
  if (!hasSupabaseEnv || !supabase) {
    const db = loadDemoDb()
    const payment: Payment = { id: makeId('payment'), created_at: new Date().toISOString(), ...payload }
    db.payments = [payment, ...db.payments]
    saveDemoDb(db)
    return payment
  }
  const { data, error } = await supabase.from('payments').insert(payload).select().single()
  if (error) throw error
  return data as Payment
}

export async function getCollectionNotes() {
  if (!hasSupabaseEnv || !supabase) return loadDemoDb().collection_notes
  const { data, error } = await supabase
    .from('collection_notes')
    .select('*')
    .order('contact_date', { ascending: false })
  if (error) throw error
  return data as CollectionNote[]
}

export async function addCollectionNote(payload: Omit<CollectionNote, 'id' | 'created_at'>) {
  if (!hasSupabaseEnv || !supabase) {
    const db = loadDemoDb()
    const note: CollectionNote = { id: makeId('note'), created_at: new Date().toISOString(), ...payload }
    db.collection_notes = [note, ...db.collection_notes]
    saveDemoDb(db)
    return note
  }
  const { data, error } = await supabase.from('collection_notes').insert(payload).select().single()
  if (error) throw error
  return data as CollectionNote
}

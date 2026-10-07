import { useState } from 'react'
import {
  CalendarDays,
  Download,
  Edit3,
  MoreHorizontal,
  PackageOpen,
  Plus,
  Target,
  Trash2
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { AUTH_STORAGE_KEY, belongsToMonth, categoryIcons, compactMoney, donutGradient, expenseColors, formatDate, getExpenseBreakdown, getMonthlyTotals, goalIcons, money, percentageChange, todayInputDate, toInputDate } from '../app-data.js'
import { useAppData, useNotifications } from '../contexts.js'
import { AppLayout, DataModal, PublicHeader, SummaryCard } from '../components.jsx'
import { apiRequest, setApiToken } from '../api/client.js'

export function AuthPage({ mode }) {
  const navigate = useNavigate()
  const { setData, setSessionToken } = useAppData()
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agree: false,
  })

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    setError('')
    const email = form.email.trim().toLowerCase()
    if (isRegister && form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (isRegister && !form.agree) {
      setError('Please agree to the Terms & Conditions to continue.')
      return
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }

    setSubmitting(true)
    try {
      if (isRegister && !form.fullName.trim()) {
        setError('Enter your full name.')
        return
      }
      const result = await apiRequest(isRegister ? '/auth/register' : '/auth/login', {
        method: 'POST',
        authenticated: false,
        body: isRegister
          ? { fullName: form.fullName.trim(), email, password: form.password }
          : { email, password: form.password },
      })
      setApiToken(result.token)
      localStorage.setItem(AUTH_STORAGE_KEY, result.user.email)
      setSessionToken(result.token)
      setData((current) => ({ ...current, user: result.user }))
      navigate('/dashboard')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  const isRegister = mode === 'register'

  return (
    <div className="auth-shell">
      <PublicHeader minimal />

      <main className="auth-main">
        <div className="auth-illustration">
          <div className="safe-figure">
            <div className="safe-box">
              <div className="safe-top" />
              <div className="safe-door" />
              <div className="safe-ring" />
            </div>
            <div className="plant plant-left"> </div>
            <div className="plant plant-right"> </div>
            <div className="coin coin-one">$</div>
            <div className="coin coin-two">$</div>
            <div className="coin coin-three">$</div>
            <div className="figure">
              <div className="figure-head" />
              <div className="figure-body" />
            </div>
          </div>
        </div>

        <form className="auth-card" onSubmit={onSubmit}>
          <h1>{isRegister ? 'Create Account' : 'Welcome Back'}</h1>
          <p>{isRegister ? 'Register a new account' : 'Login to your account'}</p>

          {isRegister && (
            <label>
              <span>Full Name</span>
              <input name="fullName" placeholder="Your full name" value={form.fullName} onChange={handleChange} required />
            </label>
          )}

          <label>
            <span>Email</span>
            <input type="email" name="email" placeholder="Enter your email" value={form.email} onChange={handleChange} required />
          </label>

          <label>
            <span>Password</span>
            <input type="password" name="password" placeholder="Enter your password" value={form.password} onChange={handleChange} minLength={8} required />
          </label>

          {isRegister && (
            <label>
              <span>Confirm Password</span>
              <input type="password" name="confirmPassword" placeholder="Confirm your password" value={form.confirmPassword} onChange={handleChange} minLength={8} required />
            </label>
          )}

          {!isRegister && <a href="/login" className="muted-link">Forgot password?</a>}

          {isRegister && (
            <label className="checkbox-row">
              <input type="checkbox" name="agree" checked={form.agree} onChange={handleChange} />
              <span>I agree to the Terms &amp; Conditions</span>
            </label>
          )}

          {error && <p className="form-error" role="alert">{error}</p>}
          <button type="submit" className="primary-button large-button" disabled={submitting}>
            {submitting ? 'Please wait…' : isRegister ? 'Register' : 'Login'}
          </button>

          <div className="auth-switch">
            {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
            <Link to={isRegister ? '/login' : '/register'}>{isRegister ? 'Login' : 'Register'}</Link>
          </div>
        </form>
      </main>
    </div>
  )
}

export function DashboardPage() {
  const { data } = useAppData()

  const totalIncome = data.income.reduce((sum, item) => sum + item.amount, 0)
  const totalExpenses = data.expenses.reduce((sum, item) => sum + item.amount, 0)
  const totalBalance = totalIncome - totalExpenses
  const monthlySavings = data.savings.reduce((sum, goal) => sum + Number(goal.current), 0)
  const monthlyTotals = getMonthlyTotals(data.income, data.expenses)
  const latestMonth = monthlyTotals.at(-1)
  const previousMonth = monthlyTotals.at(-2)
  const expenseBreakdown = getExpenseBreakdown(data.expenses)
  const recentTransactions = [
    ...data.income.map((item) => ({ ...item, type: 'Income', description: item.source, category: 'Income', positive: true })),
    ...data.expenses.map((item) => ({ ...item, type: 'Expense', positive: false })),
  ].sort((left, right) => new Date(right.date) - new Date(left.date)).slice(0, 4)

  return (
    <AppLayout>
      <main className="dashboard-content">
        <section className="summary-grid">
          <SummaryCard title="Total Income" value={compactMoney(totalIncome)} helper="Compared to last month" trend={percentageChange(latestMonth.income, previousMonth.income)} positive />
          <SummaryCard title="Total Expenses" value={compactMoney(totalExpenses)} helper="This month" trend={percentageChange(latestMonth.expenses, previousMonth.expenses)} positive={latestMonth.expenses <= previousMonth.expenses} />
          <SummaryCard title="Total Balance" value={compactMoney(totalBalance)} helper="Available funds" trend={totalBalance >= 0 ? 'On track' : 'Over budget'} positive={totalBalance >= 0} />
          <SummaryCard title="Monthly Savings" value={compactMoney(monthlySavings)} helper="Saved toward your goals" trend={`${data.savings.length} goals`} positive />
        </section>

        <section className="dashboard-grid">
          <div className="panel large-panel">
            <div className="panel-header">
              <h3>Income vs Expenses</h3>
              <button type="button" className="outline-button">View Report</button>
            </div>
            <div className="chart-card">
              <div className="bars-chart">
                {monthlyTotals.map((month) => {
                  const ceiling = Math.max(...monthlyTotals.map((item) => Math.max(item.income, item.expenses)), 1)
                  return (
                  <div key={month.label + month.date.toISOString()} className="bar-column" title={`${month.label}: income ${money(month.income)}, expenses ${money(month.expenses)}`}>
                    <span className="bar blue" style={{ height: `${Math.max(3, month.income / ceiling * 100)}%` }} />
                    <span className="bar purple" style={{ height: `${Math.max(3, month.expenses / ceiling * 100)}%` }} />
                    <small className="bar-label">{month.label}</small>
                  </div>
                )})}
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <h3>Expenses by Category</h3>
              <button type="button" className="mini-button">See All</button>
            </div>
            <div className="donut-wrap">
              <div className="donut-chart" style={{ background: donutGradient(expenseBreakdown) }}>
                <div className="donut-center">
                  <strong>{Math.round(expenseBreakdown[0]?.percent ?? 0)}%</strong>
                </div>
              </div>
              <ul className="legend-list">
                {expenseBreakdown.slice(0, 4).map((item, index) => (
                  <li key={item.category}><span className="dot" style={{ background: expenseColors[index % expenseColors.length] }} /> {item.category}</li>
                ))}
                {expenseBreakdown.length === 0 && <li>No expense data yet</li>}
              </ul>
            </div>
          </div>
        </section>

        <section className="bottom-grid">
          <div className="panel">
            <div className="panel-header">
              <h3>Recent Transactions</h3>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((item) => (
                  <tr key={`${item.type}-${item.id}`}>
                    <td>{item.description}</td>
                    <td>{formatDate(item.date)}</td>
                    <td>{item.category}</td>
                    <td className={`amount ${item.positive ? 'positive' : 'negative'}`}>{item.positive ? '+' : '-'}{money(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="panel">
            <div className="panel-header">
              <h3>Budgets Overview</h3>
            </div>
            <div className="budget-stack">
              {data.budgets.map((budget) => {
                const spent = data.expenses.filter((item) => item.category === budget.category).reduce((sum, item) => sum + Number(item.amount), 0)
                const progress = budget.budget > 0 ? Math.min(100, (spent / budget.budget) * 100) : 0
                return (
                  <div key={budget.id} className="budget-row">
                    <div className="budget-meta">
                      <span>{budget.category}</span>
                      <strong>{money(spent)}</strong>
                    </div>
                    <div className="progress-bar"><span style={{ width: `${progress}%` }} /></div>
                    <div className="small-row">
                      <span>{Math.round(progress)}%</span>
                      <span>{money(budget.budget)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      </main>
    </AppLayout>
  )
}

export function IncomePage() {
  const { data, setData, setApiError } = useAppData()
  const { addNotification } = useNotifications()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ date: todayInputDate(), source: '', amount: '', note: '' })

  const total = data.income.reduce((sum, entry) => sum + entry.amount, 0)

  const openForm = (entry = null) => {
    setEditing(entry)
    setForm(entry ? { ...entry, date: toInputDate(entry.date) } : { date: todayInputDate(), source: '', amount: '', note: '' })
    setOpen(true)
  }

  const saveIncome = async (event) => {
    event.preventDefault()
    const record = { ...form, amount: Number(form.amount) }
    try {
      const { item } = await apiRequest(`/income${editing ? `/${encodeURIComponent(editing.id)}` : ''}`, {
        method: editing ? 'PATCH' : 'POST',
        body: editing ? { ...record, id: editing.id } : record,
      })
      setData((current) => ({
        ...current,
        income: editing
          ? current.income.map((entry) => entry.id === editing.id ? item : entry)
          : [item, ...current.income],
      }))
      setApiError('')
    } catch (requestError) {
      setApiError(requestError.message)
      return
    }
    addNotification('income', editing ? 'Income updated' : 'Income added', `${record.source} income of ${money(record.amount)} was ${editing ? 'updated' : 'added'}.`)
    setOpen(false)
    setEditing(null)
  }

  const removeIncome = async (id) => {
    try {
      await apiRequest(`/income/${encodeURIComponent(id)}`, { method: 'DELETE' })
    } catch (requestError) {
      setApiError(requestError.message)
      return
    }
    setData((current) => ({ ...current, income: current.income.filter((entry) => entry.id !== id) }))
    setApiError('')
    const entry = data.income.find((item) => item.id === id)
    if (entry) addNotification('income', 'Income removed', `${entry.source} income of ${money(entry.amount)} was removed.`)
  }

  return (
    <AppLayout>
      <main className="page-panel">
        <div className="page-header-row">
          <h2>Income</h2>
          <button type="button" className="primary-button" onClick={() => openForm()}>
            <Plus size={14} /> Add Income
          </button>
        </div>

        <div className="table-card">
          <table className="data-table wide-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Source</th>
                <th>Amount</th>
                <th>Note</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.income.map((entry) => (
                <tr key={entry.id}>
                  <td>{formatDate(entry.date)}</td>
                  <td>{entry.source}</td>
                  <td className="amount positive">{money(entry.amount)}</td>
                  <td>{entry.note}</td>
                  <td>
                    <div className="table-actions">
                      <button type="button" className="action-button" onClick={() => openForm(entry)} aria-label={`Edit ${entry.source}`}><Edit3 size={14} /></button>
                      <button type="button" className="action-button danger" onClick={() => removeIncome(entry.id)} aria-label="Delete income"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {data.income.length === 0 && <tr><td colSpan="5" className="empty-row">No income records yet. Add your first income to get started.</td></tr>}
            </tbody>
          </table>
        </div>

        <div className="page-footer">
          <span>Total Income</span>
          <strong className="amount positive">{money(total)}</strong>
        </div>
      </main>

      {open && <DataModal
        title={editing ? 'Edit Income' : 'Add Income'}
        form={form}
        setForm={setForm}
        fields={[
          { name: 'date', label: 'Date', type: 'date' },
          { name: 'source', label: 'Source' },
          { name: 'amount', label: 'Amount', type: 'number' },
          { name: 'note', label: 'Note', required: false },
        ]}
        onClose={() => setOpen(false)}
        onSave={saveIncome}
        submitLabel={editing ? 'Update Income' : 'Save Income'}
      />}
    </AppLayout>
  )
}

export function ExpensesPage() {
  const { data, setData, setApiError } = useAppData()
  const { addNotification } = useNotifications()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ date: todayInputDate(), description: '', category: data.categories[0]?.name ?? 'Others', amount: '' })

  const total = data.expenses.reduce((sum, item) => sum + item.amount, 0)

  const openForm = (item = null) => {
    setEditing(item)
    setForm(item ? { ...item, date: toInputDate(item.date) } : { date: todayInputDate(), description: '', category: data.categories[0]?.name ?? 'Others', amount: '' })
    setOpen(true)
  }

  const saveExpense = async (event) => {
    event.preventDefault()
    const record = { ...form, amount: Number(form.amount) }
    let saved
    try {
      const { item } = await apiRequest(`/expenses${editing ? `/${encodeURIComponent(editing.id)}` : ''}`, {
        method: editing ? 'PATCH' : 'POST',
        body: editing ? { ...record, id: editing.id } : record,
      })
      saved = item
      setApiError('')
    } catch (requestError) {
      setApiError(requestError.message)
      return
    }
    const updatedExpenses = editing
      ? data.expenses.map((item) => item.id === editing.id ? saved : item)
      : [saved, ...data.expenses]
    setData((current) => ({
      ...current,
      expenses: editing
        ? current.expenses.map((item) => item.id === editing.id ? saved : item)
        : [saved, ...current.expenses],
    }))
    addNotification('expense', editing ? 'Expense updated' : 'Expense added', `${record.description} expense of ${money(record.amount)} was ${editing ? 'updated' : 'added'}.`)
    data.budgets
      .filter((budget) => !budget.month || belongsToMonth(form.date, budget.month))
      .filter((budget) => budget.category === record.category)
      .forEach((budget) => {
        const spent = updatedExpenses
          .filter((item) => item.category === budget.category && (!budget.month || belongsToMonth(item.date, budget.month)))
          .reduce((sum, item) => sum + Number(item.amount), 0)
        const progress = budget.budget > 0 ? spent / budget.budget : 0
        if (progress >= 0.8) addNotification('budget', 'Budget limit is almost reached', `${budget.category} is ${Math.round(progress * 100)}% used.`)
      })
    setOpen(false)
    setEditing(null)
  }

  const removeExpense = async (id) => {
    try {
      await apiRequest(`/expenses/${encodeURIComponent(id)}`, { method: 'DELETE' })
    } catch (requestError) {
      setApiError(requestError.message)
      return
    }
    setData((current) => ({ ...current, expenses: current.expenses.filter((item) => item.id !== id) }))
    setApiError('')
    const item = data.expenses.find((expense) => expense.id === id)
    if (item) addNotification('expense', 'Expense removed', `${item.description} expense of ${money(item.amount)} was removed.`)
  }

  return (
    <AppLayout>
      <main className="page-panel">
        <div className="page-header-row">
          <h2>Expenses</h2>
          <button type="button" className="primary-button" onClick={() => openForm()}>
            <Plus size={14} /> Add Expense
          </button>
        </div>

        <div className="table-card">
          <table className="data-table wide-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.expenses.map((item) => (
                <tr key={item.id}>
                  <td>{formatDate(item.date)}</td>
                  <td>{item.description}</td>
                  <td>{item.category}</td>
                  <td className="amount negative">-{money(item.amount)}</td>
                  <td>
                    <div className="table-actions">
                      <button type="button" className="action-button" onClick={() => openForm(item)} aria-label={`Edit ${item.description}`}><Edit3 size={14} /></button>
                      <button type="button" className="action-button danger" onClick={() => removeExpense(item.id)} aria-label="Delete expense"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {data.expenses.length === 0 && <tr><td colSpan="5" className="empty-row">No expenses recorded yet. Add your first expense to get started.</td></tr>}
            </tbody>
          </table>
        </div>

        <div className="page-footer">
          <span>Total Expenses</span>
          <strong className="amount negative">-{money(total)}</strong>
        </div>
      </main>

      {open && <DataModal
        title={editing ? 'Edit Expense' : 'Add Expense'}
        form={form}
        setForm={setForm}
        fields={[
          { name: 'date', label: 'Date', type: 'date' },
          { name: 'description', label: 'Description' },
          { name: 'category', label: 'Category', type: 'select', options: data.categories.length ? data.categories.map((category) => category.name) : ['Others'] },
          { name: 'amount', label: 'Amount', type: 'number' },
        ]}
        onClose={() => setOpen(false)}
        onSave={saveExpense}
        submitLabel={editing ? 'Update Expense' : 'Save Expense'}
      />}
    </AppLayout>
  )
}

export function CategoriesPage() {
  const { data, setData, setApiError } = useAppData()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', icon: 'food' })

  const addCategory = async (event) => {
    event.preventDefault()
    const record = { name: form.name.trim(), icon: form.icon, count: editing?.count ?? 0 }
    let category
    try {
      const { item } = await apiRequest(`/categories${editing ? `/${encodeURIComponent(editing.id)}` : ''}`, {
        method: editing ? 'PATCH' : 'POST',
        body: editing ? { ...record, id: editing.id } : record,
      })
      category = item
      setApiError('')
    } catch (requestError) {
      setApiError(requestError.message)
      return
    }
    setData((current) => ({
      ...current,
      categories: editing
        ? current.categories.map((item) => item.id === editing.id ? category : item)
        : [...current.categories, category],
      expenses: editing
        ? current.expenses.map((expense) => expense.category === editing.name ? { ...expense, category: category.name } : expense)
        : current.expenses,
      budgets: editing
        ? current.budgets.map((budget) => budget.category === editing.name ? { ...budget, category: category.name } : budget)
        : current.budgets,
    }))
    setOpen(false)
    setEditing(null)
  }

  const openForm = (category = null) => {
    setEditing(category)
    setForm(category ? { name: category.name, icon: category.icon } : { name: '', icon: 'food' })
    setOpen(true)
  }

  const removeCategory = async (id) => {
    try {
      await apiRequest(`/categories/${encodeURIComponent(id)}`, { method: 'DELETE' })
    } catch (requestError) {
      setApiError(requestError.message)
      return
    }
    setData((current) => ({ ...current, categories: current.categories.filter((category) => category.id !== id) }))
    setApiError('')
  }

  return (
    <AppLayout>
      <main className="page-panel">
        <div className="page-header-row">
          <h2>Categories</h2>
          <button type="button" className="primary-button" onClick={() => openForm()}>
            <Plus size={14} /> Add Category
          </button>
        </div>

        <div className="category-grid">
          {data.categories.map((category) => (
            <div key={category.id} className="category-card">
              <div className="category-topline">
                <span className="category-icon">
                  {(() => {
                    const Icon = categoryIcons[category.icon] ?? PackageOpen
                    return <Icon size={19} />
                  })()}
                </span>
                <button type="button" className="action-dots" aria-label={`Edit or delete ${category.name}`} onClick={() => openForm(category)}><MoreHorizontal size={18} /></button>
              </div>
              <h4>{category.name}</h4>
              <div className="category-meta">{data.expenses.filter((item) => item.category === category.name).length} expenses</div>
              <div className="category-actions">
                <button type="button" className="action-button" onClick={() => openForm(category)} aria-label={`Edit ${category.name}`}><Edit3 size={14} /></button>
                <button type="button" className="action-button danger" onClick={() => removeCategory(category.id)} aria-label="Delete category"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {open && <DataModal
        title={editing ? 'Edit Category' : 'Add Category'}
        form={form}
        setForm={setForm}
        fields={[
          { name: 'name', label: 'Category name' },
          { name: 'icon', label: 'Category icon', type: 'icon', options: Object.keys(categoryIcons), iconMap: categoryIcons },
        ]}
        onClose={() => setOpen(false)}
        onSave={addCategory}
        submitLabel={editing ? 'Update Category' : 'Save Category'}
      />}
    </AppLayout>
  )
}

export function BudgetsPage() {
  const { data, setData, setApiError } = useAppData()
  const { addNotification } = useNotifications()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [month, setMonth] = useState('2024-05')
  const [form, setForm] = useState({ category: data.categories[0]?.name ?? 'Food', budget: '' })

  const addBudget = async (event) => {
    event.preventDefault()
    const record = { category: form.category, budget: Number(form.budget), month }
    let saved
    try {
      const { item } = await apiRequest(`/budgets${editing ? `/${encodeURIComponent(editing.id)}` : ''}`, {
        method: editing ? 'PATCH' : 'POST',
        body: editing ? { ...record, id: editing.id } : record,
      })
      saved = item
      setApiError('')
    } catch (requestError) {
      setApiError(requestError.message)
      return
    }
    setData((current) => ({
      ...current,
      budgets: editing
        ? current.budgets.map((item) => item.id === editing.id ? saved : item)
        : [...current.budgets, saved],
    }))
    const spent = data.expenses.filter((item) => item.category === form.category && (!month || belongsToMonth(item.date, month))).reduce((sum, item) => sum + Number(item.amount), 0)
    const progress = Number(form.budget) > 0 ? spent / Number(form.budget) : 0
    if (progress >= 0.8) addNotification('budget', 'Budget limit is almost reached', `${form.category} is already ${Math.round(progress * 100)}% used.`)
    addNotification('budget', editing ? 'Budget updated' : 'Budget added', `${form.category} budget of ${money(form.budget)} was ${editing ? 'updated' : 'added'}.`)
    setOpen(false)
    setEditing(null)
  }

  const openForm = (budget = null) => {
    setEditing(budget)
    setForm(budget ? { category: budget.category, budget: budget.budget } : { category: data.categories[0]?.name ?? 'Food', budget: '' })
    setOpen(true)
  }

  const removeBudget = async (id) => {
    try {
      await apiRequest(`/budgets/${encodeURIComponent(id)}`, { method: 'DELETE' })
    } catch (requestError) {
      setApiError(requestError.message)
      return
    }
    setData((current) => ({ ...current, budgets: current.budgets.filter((item) => item.id !== id) }))
    setApiError('')
    const budget = data.budgets.find((item) => item.id === id)
    if (budget) addNotification('budget', 'Budget removed', `${budget.category} budget of ${money(budget.budget)} was removed.`)
  }
  const visibleBudgets = data.budgets.filter((budget) => !budget.month || budget.month === month)

  return (
    <AppLayout>
      <main className="page-panel">
        <div className="page-header-row">
          <h2>Budgets</h2>
          <div className="page-actions compact">
            <label className="month-control"><CalendarDays size={14} /><input aria-label="Budget month" type="month" value={month} onChange={(event) => setMonth(event.target.value)} /></label>
            <button type="button" className="primary-button" onClick={() => openForm()}><Plus size={14} /> Add Budget</button>
          </div>
        </div>

        <div className="table-card">
          <table className="data-table wide-table budgets-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Budget</th>
                <th>Spent</th>
                <th>Left</th>
                <th>Progress</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleBudgets.map((budget) => {
                const spent = data.expenses
                  .filter((expense) => expense.category === budget.category && belongsToMonth(expense.date, budget.month ?? month))
                  .reduce((sum, expense) => sum + Number(expense.amount), 0)
                const left = Number(budget.budget) - spent
                const progress = budget.budget > 0 ? Math.min(100, (spent / budget.budget) * 100) : 0
                return (
                  <tr key={budget.id}>
                    <td>{budget.category}</td>
                    <td>{money(budget.budget)}</td>
                    <td>{money(spent)}</td>
                    <td className={left >= 0 ? 'amount positive' : 'amount negative'}>{money(left)}</td>
                    <td>
                      <div className="progress-column">
                        <div className={`progress-bar ${progress >= 90 ? 'at-limit' : ''}`}><span style={{ width: `${progress}%` }} /></div>
                        <small>{Math.round(progress)}%</small>
                      </div>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button type="button" className="action-button" onClick={() => openForm(budget)} aria-label={`Edit ${budget.category} budget`}><Edit3 size={14} /></button>
                        <button type="button" className="action-button danger" onClick={() => removeBudget(budget.id)} aria-label={`Delete ${budget.category} budget`}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {visibleBudgets.length === 0 && <tr><td colSpan="6" className="empty-row">No budgets for this month. Add a budget to get started.</td></tr>}
            </tbody>
          </table>
        </div>
      </main>

      {open && <DataModal
        title={editing ? 'Edit Budget' : 'Add Budget'}
        form={form}
        setForm={setForm}
        fields={[
          { name: 'category', label: 'Category', type: 'select', options: data.categories.length ? data.categories.map((category) => category.name) : ['Others'] },
          { name: 'budget', label: 'Budget amount', type: 'number' },
        ]}
        onClose={() => setOpen(false)}
        onSave={addBudget}
        submitLabel={editing ? 'Update Budget' : 'Save Budget'}
      />}
    </AppLayout>
  )
}

export function SavingsPage() {
  const { data, setData, setApiError } = useAppData()
  const { addNotification } = useNotifications()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', current: '0', target: '', date: todayInputDate(), icon: 'laptop' })

  const addGoal = async (event) => {
    event.preventDefault()
    const record = { ...form, current: Number(form.current), target: Number(form.target) }
    let saved
    try {
      const { item } = await apiRequest(`/savings${editing ? `/${encodeURIComponent(editing.id)}` : ''}`, {
        method: editing ? 'PATCH' : 'POST',
        body: editing ? { ...record, id: editing.id } : record,
      })
      saved = item
      setApiError('')
    } catch (requestError) {
      setApiError(requestError.message)
      return
    }
    setData((current) => ({
      ...current,
      savings: editing
        ? current.savings.map((goal) => goal.id === editing.id ? saved : goal)
        : [saved, ...current.savings],
    }))
    addNotification('savings', editing ? 'Savings goal updated' : 'Savings goal added', `Your ${record.name} savings goal was ${editing ? 'updated' : 'added'}.`)
    setOpen(false)
    setEditing(null)
  }

  const openForm = (goal = null) => {
    setEditing(goal)
    setForm(goal
      ? { ...goal, date: toInputDate(goal.date) }
      : { name: '', current: '0', target: '', date: todayInputDate(), icon: 'laptop' })
    setOpen(true)
  }

  const removeGoal = async (id) => {
    try {
      await apiRequest(`/savings/${encodeURIComponent(id)}`, { method: 'DELETE' })
    } catch (requestError) {
      setApiError(requestError.message)
      return
    }
    setData((current) => ({ ...current, savings: current.savings.filter((goal) => goal.id !== id) }))
    setApiError('')
    const goal = data.savings.find((item) => item.id === id)
    if (goal) addNotification('savings', 'Savings goal removed', `Your ${goal.name} savings goal was removed.`)
  }

  return (
    <AppLayout>
      <main className="page-panel">
        <div className="page-header-row">
          <h2>Savings Goals</h2>
          <button type="button" className="primary-button" onClick={() => openForm()}>
            <Plus size={14} /> Add Goal
          </button>
        </div>

        <div className="savings-grid">
          {data.savings.map((goal) => {
            const percentage = goal.target > 0 ? Math.min(100, (goal.current / goal.target) * 100) : 0
            const GoalIcon = goalIcons[goal.icon] ?? Target
            return (
              <div key={goal.id} className="savings-card">
                <div className="goal-topline">
                  <div className="goal-icon"><GoalIcon size={19} /></div>
                  <div className="goal-text">
                    <h4>{goal.name}</h4>
                    <span>Target: {formatDate(goal.date)}</span>
                  </div>
                  <button type="button" className="action-button" onClick={() => openForm(goal)} aria-label={`Edit ${goal.name}`}><Edit3 size={14} /></button>
                  <button type="button" className="action-button danger" onClick={() => removeGoal(goal.id)} aria-label="Delete goal">
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="money-row">
                  <span>{money(goal.current)}</span>
                  <span>{money(goal.target)}</span>
                </div>
                <div className="progress-bar"><span style={{ width: `${percentage}%` }} /></div>
                <div className="goal-summary">
                  <strong>{Math.round(percentage)}%</strong>
                  <small>{money(goal.target - goal.current)} left</small>
                </div>
              </div>
            )
          })}
        </div>
      </main>

      {open && <DataModal
        title={editing ? 'Edit Savings Goal' : 'Add Savings Goal'}
        form={form}
        setForm={setForm}
        fields={[
          { name: 'name', label: 'Goal name' },
          { name: 'current', label: 'Current savings', type: 'number' },
          { name: 'target', label: 'Target amount', type: 'number' },
          { name: 'date', label: 'Target date', type: 'date' },
          { name: 'icon', label: 'Goal icon', type: 'icon', options: Object.keys(goalIcons), iconMap: goalIcons },
        ]}
        onClose={() => setOpen(false)}
        onSave={addGoal}
        submitLabel={editing ? 'Update Goal' : 'Save Goal'}
      />}
    </AppLayout>
  )
}

export function ReportsPage() {
  const { data } = useAppData()
  const [period, setPeriod] = useState('Monthly')
  const [month, setMonth] = useState('2024-05')

  const inMonth = (date) => {
    const parsed = new Date(date)
    if (Number.isNaN(parsed.getTime())) return false
    if (period === 'Yearly') return String(parsed.getFullYear()) === month.slice(0, 4)
    return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}` === month
  }
  const incomes = data.income.filter((entry) => inMonth(entry.date))
  const expenses = data.expenses.filter((item) => inMonth(item.date))
  const totalIncome = incomes.reduce((sum, entry) => sum + Number(entry.amount), 0)
  const totalExpenses = expenses.reduce((sum, item) => sum + Number(item.amount), 0)
  const totalSavings = data.savings.reduce((sum, goal) => sum + goal.current, 0)
  const netBalance = totalIncome - totalExpenses
  const monthlyTotals = getMonthlyTotals(data.income, data.expenses)
  const expenseBreakdown = getExpenseBreakdown(expenses)
  const activeMonths = monthlyTotals.filter((item) => item.income || item.expenses)
  const averageIncome = activeMonths.length ? activeMonths.reduce((sum, item) => sum + item.income, 0) / activeMonths.length : 0
  const averageExpenses = activeMonths.length ? activeMonths.reduce((sum, item) => sum + item.expenses, 0) / activeMonths.length : 0
  const sortedExpenses = [...expenses].sort((left, right) => right.amount - left.amount)

  const exportReport = () => {
    const rows = [
      ['Type', 'Date', 'Description', 'Category', 'Amount'],
      ...incomes.map((item) => ['Income', item.date, item.source, '', item.amount]),
      ...expenses.map((item) => ['Expense', item.date, item.description, item.category, item.amount]),
    ]
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\r\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `budget-report-${month}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <AppLayout>
      <main className="page-panel">
        <div className="page-header-row">
          <h2>Reports</h2>
          <div className="page-actions compact">
            <select className="report-period" aria-label="Report period" value={period} onChange={(event) => setPeriod(event.target.value)}>
              <option>Monthly</option><option>Yearly</option>
            </select>
            <label className="month-control"><CalendarDays size={14} /><input aria-label="Report month" type="month" value={month} onChange={(event) => setMonth(event.target.value)} /></label>
            <button type="button" className="primary-button" onClick={exportReport}><Download size={14} /> Export</button>
          </div>
        </div>

        <section className="summary-grid compact-grid">
          <SummaryCard title="Total Income" value={money(totalIncome)} helper="Selected period" trend={`${incomes.length} records`} positive />
          <SummaryCard title="Total Expenses" value={money(totalExpenses)} helper="Selected period" trend={`${expenses.length} records`} positive={netBalance >= 0} />
          <SummaryCard title="Total Savings" value={money(totalSavings)} helper="Saved toward goals" trend={`${data.savings.length} goals`} positive />
          <SummaryCard title="Net Balance" value={money(netBalance)} helper="Income less expenses" trend={netBalance >= 0 ? 'Positive' : 'Negative'} positive={netBalance >= 0} />
        </section>

        <section className="dashboard-grid">
          <div className="panel large-panel">
            <div className="panel-header">
              <h3>Income vs Expenses</h3>
            </div>
            <div className="chart-card">
              <div className="bars-chart mini-bars">
                {monthlyTotals.map((entry) => {
                  const ceiling = Math.max(...monthlyTotals.map((item) => Math.max(item.income, item.expenses)), 1)
                  return (
                  <div key={entry.label + entry.date.toISOString()} className="bar-column">
                    <span className="bar blue" style={{ height: `${Math.max(3, entry.income / ceiling * 100)}%` }} />
                    <span className="bar purple" style={{ height: `${Math.max(3, entry.expenses / ceiling * 100)}%` }} />
                    <small className="bar-label">{entry.label}</small>
                  </div>
                  )
                })}
              </div>
              <div className="chart-legend"><span><i className="dot dot-blue" /> Income</span><span><i className="dot dot-purple" /> Expenses</span></div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <h3>Expenses by Category</h3>
            </div>
            <div className="donut-wrap">
              <div className="donut-chart small-donut" style={{ background: donutGradient(expenseBreakdown) }}>
                <div className="donut-center">
                  <strong>{Math.round(expenseBreakdown[0]?.percent ?? 0)}%</strong>
                </div>
              </div>
              <ul className="legend-list">
                {expenseBreakdown.slice(0, 4).map((item, index) => (
                  <li key={item.category}><span className="dot" style={{ background: expenseColors[index % expenseColors.length] }} /> {item.category}</li>
                ))}
                {expenseBreakdown.length === 0 && <li>No expense data yet</li>}
              </ul>
            </div>
          </div>
        </section>
        <section className="report-summary panel">
          <div className="panel-header"><h3>Summary</h3></div>
          <div className="report-metrics">
            <div><span>Average Monthly Income</span><strong>{money(averageIncome)}</strong></div>
            <div><span>Average Monthly Expenses</span><strong>{money(averageExpenses)}</strong></div>
            <div><span>Highest Expense</span><strong>{sortedExpenses.length ? money(sortedExpenses[0].amount) : money(0)}</strong><small>{sortedExpenses[0]?.description ?? 'No expenses'}</small></div>
            <div><span>Lowest Expense</span><strong>{sortedExpenses.length ? money(sortedExpenses.at(-1).amount) : money(0)}</strong><small>{sortedExpenses.at(-1)?.description ?? 'No expenses'}</small></div>
          </div>
        </section>
      </main>
    </AppLayout>
  )
}

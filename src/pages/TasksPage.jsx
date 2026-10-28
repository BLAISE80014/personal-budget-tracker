import { useEffect, useMemo, useState } from 'react'
import { Check, CheckCircle2, Circle, Clock3, Eye, ListTodo, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import { AppLayout } from '../components.jsx'
import { formatDate } from '../app-data.js'
import { apiRequest } from '../api/client.js'
import './TasksPage.css'

const emptyForm = {
  title: '',
  description: '',
  category: '',
  priority: 'Medium',
  status: 'Pending',
  startDate: '',
  dueDate: '',
  reminderAt: '',
}
const tabs = [
  { id: 'All', label: 'All Tasks' },
  { id: 'Pending', label: 'Pending' },
  { id: 'In Progress', label: 'In Progress' },
  { id: 'Completed', label: 'Completed' },
  { id: 'Overdue', label: 'Overdue' },
]
const priorities = { High: 3, Medium: 2, Low: 1 }
const today = () => {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
const prettyDate = (value) => value ? formatDate(value) : 'No date'
const isOverdue = (task, currentDate) => task.status !== 'Completed' && Boolean(task.dueDate) && task.dueDate < currentDate

function TaskDialog({ task, mode, onClose, onSave }) {
  const [form, setForm] = useState(task ? {
    title: task.title,
    description: task.description || '',
    category: task.category || '',
    priority: task.priority,
    status: task.status,
    startDate: task.startDate || '',
    dueDate: task.dueDate || '',
    reminderAt: task.reminderAt || '',
  } : emptyForm)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const readOnly = mode === 'view'

  const change = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setError('')
  }

  const submit = async (event) => {
    event.preventDefault()
    if (readOnly) return
    if (!form.title.trim()) {
      setError('Enter a task title.')
      return
    }
    if (form.startDate && form.dueDate && form.dueDate < form.startDate) {
      setError('Due date must be on or after the start date.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await onSave({
        ...form,
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category.trim(),
        startDate: form.startDate || null,
        dueDate: form.dueDate || null,
        reminderAt: form.reminderAt || null,
      })
    } catch (saveError) {
      setError(saveError.message)
      setSaving(false)
    }
  }

  return (
    <div className="task-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="task-modal" role="dialog" aria-modal="true" aria-labelledby="task-dialog-title">
        <div className="task-modal-heading">
          <div><span className="task-modal-icon"><ListTodo size={18} /></span><div><h2 id="task-dialog-title">{mode === 'view' ? 'Task details' : task ? 'Edit task' : 'Create task'}</h2><p>{mode === 'view' ? 'Review this task and its schedule.' : 'Add details to keep your plans on track.'}</p></div></div>
          <button type="button" className="task-icon-button" onClick={onClose} aria-label="Close dialog"><X size={18} /></button>
        </div>
        <form onSubmit={submit}>
          <div className="task-form-grid">
            <label className="task-form-wide"><span>Task title <b>*</b></span><input name="title" value={form.title} onChange={change} maxLength="160" required autoFocus={!readOnly} readOnly={readOnly} placeholder="e.g. Review monthly budget" /></label>
            <label className="task-form-wide"><span>Description</span><textarea name="description" rows="3" maxLength="2000" value={form.description} onChange={change} readOnly={readOnly} placeholder="Add helpful details..." /></label>
            <label><span>Category</span><input name="category" maxLength="80" value={form.category} onChange={change} readOnly={readOnly} placeholder="Personal, bills..." /></label>
            <label><span>Priority</span><select name="priority" value={form.priority} onChange={change} disabled={readOnly}><option>Low</option><option>Medium</option><option>High</option></select></label>
            <label><span>Status</span><select name="status" value={form.status} onChange={change} disabled={readOnly}><option>Pending</option><option>In Progress</option><option>Completed</option></select></label>
            <label><span>Start date</span><input type="date" name="startDate" value={form.startDate} onChange={change} readOnly={readOnly} /></label>
            <label><span>Due date</span><input type="date" name="dueDate" value={form.dueDate} onChange={change} readOnly={readOnly} /></label>
            <label><span>Reminder date</span><input type="date" name="reminderAt" value={form.reminderAt} onChange={change} readOnly={readOnly} /></label>
          </div>
          {error && <p className="task-form-error" role="alert">{error}</p>}
          {form.reminderAt && !readOnly && <p className="task-reminder-note">Reminder date is saved with the task. Automatic reminder delivery is not configured.</p>}
          <div className="task-modal-actions">
            <button type="button" className="task-secondary-button" onClick={onClose}>{readOnly ? 'Close' : 'Cancel'}</button>
            {!readOnly && <button type="submit" className="task-primary-button" disabled={saving}>{saving ? 'Saving…' : task ? 'Save changes' : 'Save task'}</button>}
          </div>
        </form>
      </section>
    </div>
  )
}

function SummaryCard({ label, count, icon: Icon, tone }) {
  return <article className="task-summary-card"><span className={`task-summary-icon ${tone}`}><Icon size={18} /></span><span className="task-summary-label">{label}</span><strong>{count}</strong></article>
}

export function TasksPage() {
  const [currentDate] = useState(today)
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [priorityFilter, setPriorityFilter] = useState('All')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [dueFilter, setDueFilter] = useState('All')
  const [sort, setSort] = useState('created-desc')
  const [dialog, setDialog] = useState(null)
  const nextWeekDate = useMemo(() => {
    const date = new Date(`${currentDate}T00:00:00`)
    date.setDate(date.getDate() + 7)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }, [currentDate])

  const loadTasks = async () => {
    setLoading(true)
    setError('')
    try {
      const result = await apiRequest('/tasks')
      setTasks(result.tasks)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    apiRequest('/tasks')
      .then((result) => { if (active) setTasks(result.tasks) })
      .catch((requestError) => { if (active) setError(requestError.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const counts = useMemo(() => ({
    total: tasks.length,
    pending: tasks.filter((task) => task.status === 'Pending').length,
    inProgress: tasks.filter((task) => task.status === 'In Progress').length,
    completed: tasks.filter((task) => task.status === 'Completed').length,
    overdue: tasks.filter((task) => isOverdue(task, currentDate)).length,
  }), [tasks, currentDate])
  const categories = useMemo(() => [...new Set(tasks.map((task) => task.category).filter(Boolean))].sort((a, b) => a.localeCompare(b)), [tasks])

  const visibleTasks = useMemo(() => {
    const query = search.trim().toLocaleLowerCase()
    return tasks.filter((task) => {
      const matchesTab = tab === 'All' || (tab === 'Overdue' ? isOverdue(task, currentDate) : task.status === tab)
      const matchesStatus = statusFilter === 'All' || task.status === statusFilter
      const matchesPriority = priorityFilter === 'All' || task.priority === priorityFilter
      const matchesCategory = categoryFilter === 'All' || task.category === categoryFilter
      const matchesDue = dueFilter === 'All'
        || (dueFilter === 'Overdue' && isOverdue(task, currentDate))
        || (dueFilter === 'No due date' && !task.dueDate)
        || (dueFilter === 'Next 7 days' && task.dueDate && task.dueDate >= currentDate && task.dueDate <= nextWeekDate)
      const matchesSearch = !query || `${task.title} ${task.description} ${task.category}`.toLocaleLowerCase().includes(query)
      return matchesTab && matchesStatus && matchesPriority && matchesCategory && matchesDue && matchesSearch
    }).sort((left, right) => {
      if (sort === 'created-asc') return new Date(left.createdAt) - new Date(right.createdAt)
      if (sort === 'due-asc') return (left.dueDate || '9999-12-31').localeCompare(right.dueDate || '9999-12-31')
      if (sort === 'due-desc') return (right.dueDate || '').localeCompare(left.dueDate || '')
      if (sort === 'priority') return priorities[right.priority] - priorities[left.priority] || new Date(right.createdAt) - new Date(left.createdAt)
      return new Date(right.createdAt) - new Date(left.createdAt)
    })
  }, [tasks, search, tab, statusFilter, priorityFilter, categoryFilter, dueFilter, sort, currentDate, nextWeekDate])

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('All')
    setPriorityFilter('All')
    setCategoryFilter('All')
    setDueFilter('All')
    setSort('created-desc')
    setTab('All')
  }

  const saveTask = async (fields) => {
    setBusy(true)
    try {
      const result = await apiRequest(dialog.task ? `/tasks/${encodeURIComponent(dialog.task.id)}` : '/tasks', {
        method: dialog.task ? 'PATCH' : 'POST',
        body: fields,
      })
      setTasks((current) => dialog.task
        ? current.map((task) => task.id === result.task.id ? result.task : task)
        : [result.task, ...current])
      setNotice(dialog.task ? 'Task updated successfully.' : 'Task created successfully.')
      setError('')
      setDialog(null)
    } finally {
      setBusy(false)
    }
  }

  const completeTask = async (task) => {
    if (task.status === 'Completed') return
    setBusy(true)
    setError('')
    try {
      const { task: updated } = await apiRequest(`/tasks/${encodeURIComponent(task.id)}`, { method: 'PATCH', body: { status: 'Completed' } })
      setTasks((current) => current.map((item) => item.id === updated.id ? updated : item))
      setNotice(`“${updated.title}” marked as completed.`)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  const deleteTask = async (task) => {
    if (!window.confirm(`Permanently delete “${task.title}”? This cannot be undone.`)) return
    setBusy(true)
    setError('')
    try {
      await apiRequest(`/tasks/${encodeURIComponent(task.id)}`, { method: 'DELETE' })
      setTasks((current) => current.filter((item) => item.id !== task.id))
      setNotice('Task deleted.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  const hasFilters = search || tab !== 'All' || statusFilter !== 'All' || priorityFilter !== 'All' || categoryFilter !== 'All' || dueFilter !== 'All'

  return (
    <AppLayout>
      <main className="page-panel tasks-page">
        <header className="tasks-page-heading">
          <div><span className="tasks-eyebrow">MY WORKSPACE</span><h1>Tasks</h1><p>Keep track of your financial plans and everyday to-dos.</p></div>
          <button type="button" className="primary-button" onClick={() => { setNotice(''); setDialog({ mode: 'create' }) }}><Plus size={16} /> Create Task</button>
        </header>

        {error && <div className="tasks-alert error" role="alert"><span>{error}</span><button type="button" onClick={loadTasks}>Retry</button></div>}
        {notice && <div className="tasks-alert success" role="status"><CheckCircle2 size={16} /><span>{notice}</span><button type="button" aria-label="Dismiss message" onClick={() => setNotice('')}>×</button></div>}

        <section className="tasks-summary-grid" aria-label="Task summary">
          <SummaryCard label="Total Tasks" count={counts.total} icon={ListTodo} tone="blue" />
          <SummaryCard label="Pending" count={counts.pending} icon={Circle} tone="gold" />
          <SummaryCard label="In Progress" count={counts.inProgress} icon={Clock3} tone="purple" />
          <SummaryCard label="Completed" count={counts.completed} icon={CheckCircle2} tone="green" />
          <SummaryCard label="Overdue" count={counts.overdue} icon={Clock3} tone="red" />
        </section>

        <section className="tasks-content-card">
          <div className="tasks-tabs" role="tablist" aria-label="Task status views">
            {tabs.map((item) => <button type="button" role="tab" aria-selected={tab === item.id} className={tab === item.id ? 'active' : ''} key={item.id} onClick={() => setTab(item.id)}>{item.label}{item.id === 'All' ? <span>{counts.total}</span> : item.id === 'Overdue' ? <span>{counts.overdue}</span> : <span>{tasks.filter((task) => task.status === item.id).length}</span>}</button>)}
          </div>

          <div className="tasks-toolbar">
            <label className="tasks-search"><Search size={16} /><input type="search" aria-label="Search tasks" placeholder="Search title or description..." value={search} onChange={(event) => setSearch(event.target.value)} /></label>
            <div className="tasks-filter-controls">
              <select aria-label="Filter by status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="All">All statuses</option><option>Pending</option><option>In Progress</option><option>Completed</option></select>
              <select aria-label="Filter by priority" value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}><option value="All">All priorities</option><option>High</option><option>Medium</option><option>Low</option></select>
              <select aria-label="Filter by category" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}><option value="All">All categories</option>{categories.map((category) => <option key={category}>{category}</option>)}</select>
              <select aria-label="Filter by due date" value={dueFilter} onChange={(event) => setDueFilter(event.target.value)}><option value="All">Any due date</option><option>Overdue</option><option>Next 7 days</option><option>No due date</option></select>
              <select aria-label="Sort tasks" value={sort} onChange={(event) => setSort(event.target.value)}><option value="created-desc">Newest first</option><option value="created-asc">Oldest first</option><option value="due-asc">Due date (soonest)</option><option value="due-desc">Due date (latest)</option><option value="priority">Priority (high first)</option></select>
              {hasFilters && <button type="button" className="tasks-clear-button" onClick={clearFilters}>Clear filters</button>}
            </div>
          </div>

          <div className="tasks-table-wrap">
            <table className="tasks-table">
              <thead><tr><th>Task</th><th>Category</th><th>Priority</th><th>Status</th><th>Due date</th><th>Created</th><th>Actions</th></tr></thead>
              <tbody>
                {loading && <tr><td colSpan="7"><div className="tasks-loading"><span /> Loading your tasks…</div></td></tr>}
                {!loading && visibleTasks.map((task) => (
                  <tr key={task.id} className={isOverdue(task) ? 'overdue-row' : ''}>
                    <td><div className="tasks-title-cell"><strong>{task.title}</strong>{task.description && <small>{task.description}</small>}{isOverdue(task, currentDate) && <em>Overdue</em>}</div></td>
                    <td>{task.category || <span className="tasks-muted">—</span>}</td>
                    <td><span className={`task-priority ${task.priority.toLowerCase()}`}><i />{task.priority}</span></td>
                    <td><span className={`task-status ${task.status.toLowerCase().replace(' ', '-')}`}>{task.status}</span></td>
                    <td className={isOverdue(task, currentDate) ? 'tasks-overdue-date' : ''}>{prettyDate(task.dueDate)}</td>
                    <td>{prettyDate(task.createdAt?.slice(0, 10))}</td>
                    <td><div className="tasks-row-actions">
                      <button type="button" aria-label={`View ${task.title}`} title="View task" onClick={() => setDialog({ mode: 'view', task })}><Eye size={15} /></button>
                      <button type="button" aria-label={`Edit ${task.title}`} title="Edit task" disabled={busy} onClick={() => { setNotice(''); setDialog({ mode: 'edit', task }) }}><Pencil size={15} /></button>
                      {task.status !== 'Completed' && <button type="button" aria-label={`Complete ${task.title}`} title="Mark completed" disabled={busy} onClick={() => completeTask(task)}><Check size={16} /></button>}
                      <button type="button" className="danger" aria-label={`Delete ${task.title}`} title="Delete task" disabled={busy} onClick={() => deleteTask(task)}><Trash2 size={15} /></button>
                    </div></td>
                  </tr>
                ))}
                {!loading && visibleTasks.length === 0 && <tr><td colSpan="7"><div className="tasks-empty"><span><ListTodo size={24} /></span><strong>{tasks.length ? 'No tasks match these filters' : 'No tasks yet'}</strong><p>{tasks.length ? 'Try adjusting your search or filters.' : 'Create your first task to organize your plans.'}</p>{tasks.length ? <button type="button" className="tasks-clear-button" onClick={clearFilters}>Clear filters</button> : <button type="button" className="primary-button" onClick={() => setDialog({ mode: 'create' })}><Plus size={15} /> Create Task</button>}</div></td></tr>}
              </tbody>
            </table>
          </div>
          <footer className="tasks-list-footer"><span>Showing {visibleTasks.length} of {tasks.length} tasks</span>{busy && <span>Saving changes…</span>}</footer>
        </section>
        <p className="tasks-scope-note">Tasks are private to your account. All task data is stored securely with your user account.</p>
        {dialog && <TaskDialog key={`${dialog.mode}-${dialog.task?.id || 'new'}`} task={dialog.task} mode={dialog.mode} onClose={() => setDialog(null)} onSave={saveTask} />}
      </main>
    </AppLayout>
  )
}

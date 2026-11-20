import { useEffect, useMemo, useState } from 'react'
import './App.css'

const STORAGE_KEY = 'todo-app-agentic:todos'

function loadTodos() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
    return Array.isArray(saved) ? saved : []
  } catch {
    return []
  }
}

function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function dueLabel(dueDate) {
  if (!dueDate) return null
  const today = todayISO()
  const d = new Date(`${dueDate}T00:00:00`)
  const label = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  if (dueDate === today) return { text: 'Due today', kind: 'today' }
  if (dueDate < today) return { text: `Overdue · ${label}`, kind: 'overdue' }
  return { text: label, kind: 'future' }
}

export default function App() {
  const [todos, setTodos] = useState(loadTodos)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [priority, setPriority] = useState('medium')
  const [dueDate, setDueDate] = useState('')
  const [showDetails, setShowDetails] = useState(false)
  const [titleError, setTitleError] = useState('')

  const [editingId, setEditingId] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [editPriority, setEditPriority] = useState('medium')
  const [editDueDate, setEditDueDate] = useState('')

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos))
  }, [todos])

  const activeCount = todos.filter((t) => !t.completed).length
  const completedCount = todos.length - activeCount

  const filtered = useMemo(() => {
    let list = todos
    if (filter === 'active') list = list.filter((t) => !t.completed)
    if (filter === 'done') list = list.filter((t) => t.completed)
    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (t) => t.title.toLowerCase().includes(q) || (t.notes || '').toLowerCase().includes(q),
      )
    }
    return list
  }, [todos, filter, search])

  function addTodo(e) {
    e.preventDefault()
    if (!title.trim()) {
      setTitleError('Write what needs doing first.')
      return
    }
    setTodos((prev) => [
      ...prev,
      {
        id: Date.now(),
        title: title.trim(),
        notes: notes.trim(),
        priority,
        dueDate: dueDate || null,
        completed: false,
        createdAt: new Date().toISOString(),
      },
    ])
    setTitle('')
    setNotes('')
    setPriority('medium')
    setDueDate('')
    setShowDetails(false)
    setTitleError('')
  }

  function toggleTodo(id) {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
    )
  }

  function deleteTodo(id) {
    setTodos((prev) => prev.filter((t) => t.id !== id))
  }

  function clearCompleted() {
    setTodos((prev) => prev.filter((t) => !t.completed))
  }

  function startEdit(todo) {
    setEditingId(todo.id)
    setEditTitle(todo.title)
    setEditNotes(todo.notes || '')
    setEditPriority(todo.priority)
    setEditDueDate(todo.dueDate || '')
  }

  function saveEdit(e) {
    e.preventDefault()
    if (!editTitle.trim()) return
    setTodos((prev) =>
      prev.map((t) =>
        t.id === editingId
          ? {
              ...t,
              title: editTitle.trim(),
              notes: editNotes.trim(),
              priority: editPriority,
              dueDate: editDueDate || null,
            }
          : t,
      ),
    )
    setEditingId(null)
  }

  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <main className="page">
      <header className="header">
        <p className="date">{todayLabel}</p>
        <h1>
          {todos.length === 0
            ? 'Your list'
            : activeCount === 0
              ? 'All done 🎉'
              : activeCount === 1
                ? '1 thing left'
                : `${activeCount} things left`}
        </h1>
        <p className="subtitle">
          {todos.length === 0
            ? 'Nothing here yet — add your first task below.'
            : `${todos.length} total · ${completedCount} completed`}
        </p>
        {completedCount > 0 && (
          <button type="button" className="clear-btn" onClick={clearCompleted}>
            Clear done
          </button>
        )}
      </header>

      <form className="capture" onSubmit={addTodo}>
        <div className="capture-row">
          <span aria-hidden="true">＋</span>
          <label htmlFor="new-title" className="sr-only">
            What needs doing?
          </label>
          <input
            id="new-title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
              if (titleError) setTitleError('')
            }}
            onFocus={() => setShowDetails(true)}
            placeholder="What needs doing?"
            autoComplete="off"
          />
          <button type="submit" className="add-btn">
            Add
          </button>
        </div>
        {titleError && (
          <p className="error" role="alert">
            {titleError}
          </p>
        )}
        {showDetails && (
          <div className="details">
            <label>
              Notes
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add a detail, link, or reminder…"
              />
            </label>
            <div className="details-grid">
              <label>
                Priority
                <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </label>
              <label>
                Due date
                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </label>
            </div>
            <button type="button" className="link-btn" onClick={() => setShowDetails(false)}>
              Hide details
            </button>
          </div>
        )}
      </form>

      {todos.length > 0 && (
        <div className="toolbar">
          <div className="filters" role="tablist" aria-label="Filter tasks">
            {[
              { v: 'all', label: `All · ${todos.length}` },
              { v: 'active', label: `Active · ${activeCount}` },
              { v: 'done', label: `Done · ${completedCount}` },
            ].map((f) => (
              <button
                key={f.v}
                type="button"
                role="tab"
                aria-selected={filter === f.v}
                className={filter === f.v ? 'filter active' : 'filter'}
                onClick={() => setFilter(f.v)}
              >
                {f.label}
              </button>
            ))}
          </div>
          <input
            className="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search…"
            aria-label="Search tasks"
          />
        </div>
      )}

      {todos.length === 0 ? (
        <div className="empty">
          <p className="empty-title">A clean page</p>
          <p>Type above, hit Add, and it&apos;ll show up here. Set a priority or due date if it matters.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty">
          <p className="empty-title">No tasks match</p>
          <p>Try a different filter or search.</p>
          <button
            type="button"
            className="add-btn"
            onClick={() => {
              setSearch('')
              setFilter('all')
            }}
          >
            Show all
          </button>
        </div>
      ) : (
        <ul className="list">
          {filtered.map((todo) => (
            <TodoRow
              key={todo.id}
              todo={todo}
              isEditing={editingId === todo.id}
              onToggle={() => toggleTodo(todo.id)}
              onDelete={() => deleteTodo(todo.id)}
              onEdit={() => startEdit(todo)}
              editTitle={editTitle}
              setEditTitle={setEditTitle}
              editNotes={editNotes}
              setEditNotes={setEditNotes}
              editPriority={editPriority}
              setEditPriority={setEditPriority}
              editDueDate={editDueDate}
              setEditDueDate={setEditDueDate}
              onSaveEdit={saveEdit}
              onCancelEdit={() => setEditingId(null)}
            />
          ))}
        </ul>
      )}

      {todos.length > 0 && <p className="hint">Tap the circle to complete a task · Tap ✎ to edit</p>}
    </main>
  )
}

function TodoRow({
  todo,
  isEditing,
  onToggle,
  onDelete,
  onEdit,
  editTitle,
  setEditTitle,
  editNotes,
  setEditNotes,
  editPriority,
  setEditPriority,
  editDueDate,
  setEditDueDate,
  onSaveEdit,
  onCancelEdit,
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const due = dueLabel(todo.dueDate)

  if (isEditing) {
    return (
      <li className="row editing">
        <form onSubmit={onSaveEdit} className="edit-form">
          <input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            aria-label="Edit task title"
            autoFocus
          />
          <input
            value={editNotes}
            onChange={(e) => setEditNotes(e.target.value)}
            placeholder="Notes…"
            aria-label="Edit notes"
          />
          <div className="details-grid">
            <select value={editPriority} onChange={(e) => setEditPriority(e.target.value)} aria-label="Edit priority">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <input
              type="date"
              value={editDueDate}
              onChange={(e) => setEditDueDate(e.target.value)}
              aria-label="Edit due date"
            />
          </div>
          <div className="edit-actions">
            <button type="submit" className="add-btn">
              Save
            </button>
            <button type="button" className="clear-btn" onClick={onCancelEdit}>
              Cancel
            </button>
          </div>
        </form>
      </li>
    )
  }

  return (
    <li className={`row ${todo.completed ? 'done' : ''}`}>
      <button
        type="button"
        className="toggle"
        onClick={onToggle}
        aria-label={todo.completed ? `Mark "${todo.title}" as not done` : `Mark "${todo.title}" as done`}
        aria-pressed={todo.completed}
      >
        ✓
      </button>
      <div className="row-body">
        <p className="row-title">{todo.title}</p>
        {todo.notes && <p className="row-notes">{todo.notes}</p>}
        <div className="tags">
          <span className={`tag priority-${todo.priority}`}>{todo.priority}</span>
          {due && <span className={`tag due-${due.kind}`}>{due.text}</span>}
        </div>
      </div>
      <div className="row-actions">
        {!confirmDelete ? (
          <>
            <button type="button" onClick={onEdit} aria-label={`Edit "${todo.title}"`}>
              ✎
            </button>
            <button type="button" onClick={() => setConfirmDelete(true)} aria-label={`Delete "${todo.title}"`}>
              ×
            </button>
          </>
        ) : (
          <>
            <button type="button" className="delete-confirm" onClick={onDelete}>
              Delete
            </button>
            <button type="button" onClick={() => setConfirmDelete(false)}>
              Keep
            </button>
          </>
        )}
      </div>
    </li>
  )
}

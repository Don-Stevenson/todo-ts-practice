import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Filter,
  CheckCircle,
  Circle,
  Star,
} from 'lucide-react'

// Types
interface User {
  id: number
  name: string
  email: string
  phone: string
  website: string
  company: {
    name: string
  }
}

interface Todo {
  id: number
  userId: number
  title: string
  completed: boolean
}

interface Post {
  id: number
  userId: number
  title: string
  body: string
}

interface NewTodo {
  title: string
  userId: number
}

type FilterType = 'all' | 'completed' | 'pending'

const PracticeApp: React.FC = () => {
  // State management
  const [users, setUsers] = useState<User[]>([])
  const [todos, setTodos] = useState<Todo[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [newTodo, setNewTodo] = useState<NewTodo>({ title: '', userId: 1 })
  const [editingTodo, setEditingTodo] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState('')

  // API calls
  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const [usersRes, todosRes, postsRes] = await Promise.all([
        fetch('https://jsonplaceholder.typicode.com/users'),
        fetch('https://jsonplaceholder.typicode.com/todos'),
        fetch('https://jsonplaceholder.typicode.com/posts'),
      ])

      if (!usersRes.ok || !todosRes.ok || !postsRes.ok) {
        throw new Error('Failed to fetch data')
      }

      const [usersData, todosData, postsData] = await Promise.all([
        usersRes.json(),
        todosRes.json(),
        postsRes.json(),
      ])

      setUsers(usersData)
      setTodos(todosData)
      setPosts(postsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Filtered and searched data
  const filteredTodos = useMemo(() => {
    return todos.filter(todo => {
      const matchesSearch = todo.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
      const matchesFilter =
        filterType === 'all' ||
        (filterType === 'completed' && todo.completed) ||
        (filterType === 'pending' && !todo.completed)
      const matchesUser =
        selectedUserId === null || todo.userId === selectedUserId

      return matchesSearch && matchesFilter && matchesUser
    })
  }, [todos, searchTerm, filterType, selectedUserId])

  // User statistics
  const userStats = useMemo(() => {
    return users.map(user => {
      const userTodos = todos.filter(todo => todo.userId === user.id)
      const userPosts = posts.filter(post => post.userId === user.id)
      const completedTodos = userTodos.filter(todo => todo.completed).length

      return {
        ...user,
        totalTodos: userTodos.length,
        completedTodos,
        totalPosts: userPosts.length,
        completionRate:
          userTodos.length > 0 ? (completedTodos / userTodos.length) * 100 : 0,
      }
    })
  }, [users, todos, posts])

  // CRUD operations
  const addTodo = async () => {
    if (!newTodo.title.trim()) return

    try {
      const response = await fetch(
        'https://jsonplaceholder.typicode.com/todos',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: newTodo.title,
            userId: newTodo.userId,
            completed: false,
          }),
        }
      )

      if (!response.ok) throw new Error('Failed to add todo')

      const newTodoItem = await response.json()
      setTodos(prev => [...prev, { ...newTodoItem, id: Date.now() }])
      setNewTodo({ title: '', userId: 1 })
    } catch (err) {
      console.error(err)
      setError('Failed to add todo')
    }
  }

  const toggleTodo = async (id: number) => {
    const todo = todos.find(t => t.id === id)
    if (!todo) return

    try {
      const response = await fetch(
        `https://jsonplaceholder.typicode.com/todos/${id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...todo,
            completed: !todo.completed,
          }),
        }
      )

      if (!response.ok) throw new Error('Failed to update todo')

      setTodos(prev =>
        prev.map(t => (t.id === id ? { ...t, completed: !t.completed } : t))
      )
    } catch (err) {
      console.error(err)
      setError('Failed to update todo')
    }
  }

  const deleteTodo = async (id: number) => {
    try {
      const response = await fetch(
        `https://jsonplaceholder.typicode.com/todos/${id}`,
        {
          method: 'DELETE',
        }
      )

      if (!response.ok) throw new Error('Failed to delete todo')

      setTodos(prev => prev.filter(t => t.id !== id))
    } catch (err) {
      console.error(err)
      setError('Failed to delete todo')
    }
  }

  const startEditing = (todo: Todo) => {
    setEditingTodo(todo.id)
    setEditTitle(todo.title)
  }

  const saveEdit = async (id: number) => {
    if (!editTitle.trim()) return

    try {
      const response = await fetch(
        `https://jsonplaceholder.typicode.com/todos/${id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...todos.find(t => t.id === id),
            title: editTitle,
          }),
        }
      )

      if (!response.ok) throw new Error('Failed to update todo')

      setTodos(prev =>
        prev.map(t => (t.id === id ? { ...t, title: editTitle } : t))
      )
      setEditingTodo(null)
      setEditTitle('')
    } catch (err) {
      console.error(err)
      setError('Failed to update todo')
    }
  }

  const cancelEdit = () => {
    setEditingTodo(null)
    setEditTitle('')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading practice data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-gray-50">
      <div className="max-w-7xl justify-center">
        {/* Header */}

        <div className="p-4 text-white" style={{ marginBottom: '2rem' }}>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            React TypeScript Practice App
          </h1>
          <p className="text-gray-600">
            Practice common patterns: API calls, state management, CRUD
            operations, filtering, and more
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* User Statistics */}
        <div className="mb-8" style={{ marginBottom: '2rem' }}>
          <h2 className="text-xl font-semibold mb-4">User Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userStats.map(user => (
              <div key={user.id} className="bg-white p-4 rounded-lg shadow">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">{user.name}</h3>
                  <Star className="w-4 h-4 text-yellow-500" />
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  {user.company.name}
                </p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Todos:</span>
                    <span>
                      {user.completedTodos}/{user.totalTodos}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Posts:</span>
                    <span>{user.totalPosts}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Completion:</span>
                    <span>{user.completionRate.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Todo Management */}
        <div
          className="flex flex-col bg-white rounded-lg shadow"
          style={{ marginBottom: '2rem' }}
        >
          <div
            className="flex flex-col p-6 justify-around gap-2"
            style={{ marginBottom: '2rem' }}
          >
            <h2 className="text-xl font-semibold mb-4">Todo Management</h2>

            {/* Add Todo Form */}
            <div className="flex gap-4 mb-4">
              <input
                id="input"
                type="text"
                value={newTodo.title}
                onChange={e =>
                  setNewTodo(prev => ({ ...prev, title: e.target.value }))
                }
                placeholder="Enter new todo..."
                className="flex-1 px-5 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={e => e.key === 'Enter' && addTodo()}
              />
              <select
                value={newTodo.userId}
                id="select"
                onChange={e =>
                  setNewTodo(prev => ({
                    ...prev,
                    userId: Number(e.target.value),
                  }))
                }
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
              <button
                onClick={addTodo}
                className="flex w-1/6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 justify-around items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Search todos..."
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={filterType}
                  onChange={e => setFilterType(e.target.value as FilterType)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Todos</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              <select
                value={selectedUserId || ''}
                onChange={e =>
                  setSelectedUserId(
                    e.target.value ? Number(e.target.value) : null
                  )
                }
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Users</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Todo List */}
          <div className="p-6">
            <p className="text-sm text-gray-600 mb-4">
              Showing {filteredTodos.length} of {todos.length} todos
            </p>

            <div className="space-y-2">
              {filteredTodos.map(todo => (
                <div
                  key={todo.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    todo.completed
                      ? 'bg-green-100 border-green-300'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <button
                    onClick={() => toggleTodo(todo.id)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {todo.completed ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>

                  <div className="flex-1">
                    {editingTodo === todo.id ? (
                      <input
                        type="text"
                        value={editTitle}
                        onChange={e => setEditTitle(e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onKeyDown={e => e.key === 'Enter' && saveEdit(todo.id)}
                        onBlur={() => saveEdit(todo.id)}
                        autoFocus
                      />
                    ) : (
                      <span
                        className={
                          todo.completed ? 'line-through text-gray-500' : ''
                        }
                      >
                        {todo.title}
                      </span>
                    )}
                  </div>

                  <span className="text-sm text-gray-500">
                    {users.find(u => u.id === todo.userId)?.name || 'Unknown'}
                  </span>

                  <div className="flex gap-2">
                    {editingTodo === todo.id ? (
                      <button
                        onClick={cancelEdit}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        Cancel
                      </button>
                    ) : (
                      <button
                        onClick={() => startEditing(todo)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={() => deleteTodo(todo.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PracticeApp

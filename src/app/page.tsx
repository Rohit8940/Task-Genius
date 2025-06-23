'use client'

import { useEffect, useState } from 'react'
import { useUser, SignOutButton } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Trash2, Loader2, Edit, Save, X, Filter } from 'lucide-react'
const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Task {
  id?: number
  title: string
  completed: boolean
  userId: number
  category?: string
}

export default function TaskPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [previewTasks, setPreviewTasks] = useState<{title: string, isSaving?: boolean}[]>([])
  const [error, setError] = useState<string | null>(null)
  const [topic, setTopic] = useState('')
  const [newTask, setNewTask] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null)
  const [editedTitle, setEditedTitle] = useState('')
  const [editedCategory, setEditedCategory] = useState('')
  const [showCategoryInput, setShowCategoryInput] = useState(false)
  const [customCategories, setCustomCategories] = useState<string[]>([])

  // Separate loading states
  const [isFetching, setIsFetching] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [isDeletingId, setIsDeletingId] = useState<number | null>(null)
  const [isEditingId, setIsEditingId] = useState<number | null>(null)

  const { user, isLoaded } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!isLoaded) return
    if (!user) {
      router.push(`/sign-in`)
      return
    }

    const fetchTasks = async () => {
      try {
        setIsFetching(true)
        const res = await fetch(`${baseUrl}/api/tasks?clerkUserId=${user.id}`)
        if (!res.ok) throw new Error('Failed to fetch tasks')
        const data = await res.json()
        setTasks(data)
        // Clear error if successful (even if empty)
        setError(null)
      } catch (err) {
        // Only show error if it's not the default empty state
        if (err instanceof Error && !err.message.includes('Failed to fetch')) {
          setError(err.message)
        }
      } finally {
        setIsFetching(false)
      }
    }

    fetchTasks()
  }, [isLoaded, user, router])

  const categories = Array.from(new Set([
    ...tasks.map(task => task.category).filter(Boolean) as string[],
    ...customCategories,
  ]))

  const handleGenerate = async () => {
    if (!topic.trim() || !user) return
    try {
      setIsGenerating(true)
      const response = await fetch(`${baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic }),
      })

      if (!response.ok) throw new Error('Failed to generate tasks')
      const { tasks: generatedTasks } = await response.json()
      if (!Array.isArray(generatedTasks)) throw new Error('Invalid response format')

      setPreviewTasks(generatedTasks.map(title => ({title})))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error generating tasks')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSaveTask = async (title: string, index: number) => {
    if (!user) return
    try {
      // Set loading state for this specific task
      setPreviewTasks(prev => prev.map((task, i) => 
        i === index ? {...task, isSaving: true} : task
      ))
      
      const response = await fetch(`${baseUrl}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          completed: false,
          clerkUserId: user.id,
          email: user.primaryEmailAddress?.emailAddress || '',
          category: topic.toLowerCase()
        }),
      })

      if (!response.ok) throw new Error('Failed to save task')
      const data = await response.json()
      setTasks(prev => [...prev, data])
      setPreviewTasks(prev => prev.filter((_, i) => i !== index))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving task')
      // Reset loading state on error
      setPreviewTasks(prev => prev.map((task, i) => 
        i === index ? {...task, isSaving: false} : task
      ))
    }
  }

  const handleAddTask = async () => {
    if (!newTask.trim() || !user) return
    try {
      setIsAdding(true)
      const response = await fetch(`${baseUrl}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTask,
          completed: false,
          clerkUserId: user.id,
          email: user.primaryEmailAddress?.emailAddress || '',
          category: newCategory || undefined
        }),
      })

      if (!response.ok) throw new Error('Failed to add task')
      const data = await response.json()
      setTasks(prev => [...prev, data])
      
      if (newCategory && !categories.includes(newCategory)) {
        setCustomCategories(prev => [...prev, newCategory])
      }
      
      setNewTask('')
      setNewCategory('')
      setShowCategoryInput(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error adding task')
    } finally {
      setIsAdding(false)
    }
  }

  const handleDelete = async (id?: number) => {
    if (!id) return
    try {
      setIsDeletingId(id)
      const res = await fetch(`${baseUrl}/api/tasks?id=${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete task')
      setTasks(prev => prev.filter(task => task.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting task')
    } finally {
      setIsDeletingId(null)
    }
  }

  const handleToggleComplete = async (id?: number) => {
    if (!id) return
    try {
      const taskToUpdate = tasks.find(task => task.id === id)
      if (!taskToUpdate) return

      const res = await fetch(`${baseUrl}/api/tasks?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !taskToUpdate.completed }),
      })

      if (!res.ok) throw new Error('Failed to update task')
      setTasks(prev =>
        prev.map(task =>
          task.id === id ? { ...task, completed: !task.completed } : task
        )
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating task')
    }
  }

  const handleEditTask = async (id?: number) => {
    if (!id) return
    try {
      setIsEditingId(id)
      const res = await fetch(`${baseUrl}/api/tasks?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: editedTitle,
          category: editedCategory || null
        }),
      })

      if (!res.ok) throw new Error('Failed to update task')
      setTasks(prev =>
        prev.map(task =>
          task.id === id ? { 
            ...task, 
            title: editedTitle,
            category: editedCategory || undefined
          } : task
        )
      )
      setEditingTaskId(null)
      setEditedTitle('')
      setEditedCategory('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating task')
    } finally {
      setIsEditingId(null)
    }
  }

  const startEditing = (task: Task) => {
    setEditingTaskId(task.id || null)
    setEditedTitle(task.title)
    setEditedCategory(task.category || '')
  }

  const cancelEditing = () => {
    setEditingTaskId(null)
    setEditedTitle('')
    setEditedCategory('')
  }

  const filteredTasks = tasks.filter(task => {
    const statusMatch = 
      filter === 'active' ? !task.completed :
      filter === 'completed' ? task.completed :
      true
    
    const categoryMatch = 
      categoryFilter === 'all' ? true :
      categoryFilter === 'uncategorized' ? !task.category :
      task.category === categoryFilter
    
    return statusMatch && categoryMatch
  })

  const progress = tasks.length > 0
    ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100)
    : 0

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-bold">Task Manager</CardTitle>
            <SignOutButton redirectUrl="https://golden-colt-97.accounts.dev/sign-in">
              <Button variant="destructive">Sign Out</Button>
            </SignOutButton>
          </div>
        </CardHeader>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Generate or Add Tasks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Enter topic (e.g. Learn Python)"
              disabled={isFetching || isGenerating}
            />
            <Button
              onClick={handleGenerate}
              disabled={!topic.trim() || isFetching || isGenerating}
              className="min-w-[200px]"
            >
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : '✨ Generate Tasks'}
            </Button>
          </div>
          <div className="flex gap-2">
            <Input
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="New task title"
              disabled={isAdding}
              onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
              className="min-w-[200px]"
            />
            <div className="flex gap-2 items-center">
              {showCategoryInput ? (
                <Input
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Enter category"
                  className="w-[180px]"
                  autoFocus
                />
              ) : (
                <Select
                  value={newCategory || "no-category"}
                  onValueChange={(value) => setNewCategory(value === "no-category" ? "" : value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue>
                      {newCategory ? newCategory : "Select category"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-category">No category</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  setShowCategoryInput(!showCategoryInput)
                  setNewCategory('')
                }}
                title={showCategoryInput ? "Use dropdown" : "Use custom input"}
                disabled={isAdding}
              >
                <Filter className="h-4 w-4" />
              </Button>
            </div>
            <Button
              onClick={handleAddTask}
              disabled={!newTask.trim() || isAdding}
              className="min-w-[200px]"
            >
              {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : '➕ Add Task'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {previewTasks.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Generated Tasks Preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {previewTasks.map((task, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <p className="text-sm">{task.title}</p>
                <Button 
                  size="sm" 
                  onClick={() => handleSaveTask(task.title, index)} 
                  disabled={task.isSaving}
                >
                  {task.isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Save'
                  )}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center flex-wrap gap-4">
            <CardTitle>Your Tasks</CardTitle>
            <div className="flex gap-2 flex-wrap">
              <div className="flex gap-2">
                <Button variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')} size="sm">
                  All
                </Button>
                <Button variant={filter === 'active' ? 'default' : 'outline'} onClick={() => setFilter('active')} size="sm">
                  Active
                </Button>
                <Button variant={filter === 'completed' ? 'default' : 'outline'} onClick={() => setFilter('completed')} size="sm">
                  Completed
                </Button>
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  <SelectItem value="uncategorized">Uncategorized</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {tasks.length > 0 && (
            <div className="mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-muted-foreground">Progress</span>
                <span className="text-sm font-medium">
                  {tasks.filter(t => t.completed).length} of {tasks.length} tasks
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
          {isFetching ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {filter === 'all' 
                ? categoryFilter === 'all' 
                  ? 'No tasks yet. Generate some or add your own!'
                  : `No tasks in ${categoryFilter === 'uncategorized' ? 'uncategorized' : `the ${categoryFilter} category`}`
                : filter === 'active'
                  ? categoryFilter === 'all'
                    ? 'No active tasks'
                    : `No active tasks in ${categoryFilter === 'uncategorized' ? 'uncategorized' : `the ${categoryFilter} category`}`
                  : categoryFilter === 'all'
                    ? 'No completed tasks'
                    : `No completed tasks in ${categoryFilter === 'uncategorized' ? 'uncategorized' : `the ${categoryFilter} category`}`}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                  {editingTaskId === task.id ? (
                    <div className="flex-1 space-y-2">
                      <Input
                        value={editedTitle}
                        onChange={(e) => setEditedTitle(e.target.value)}
                        className="mb-2"
                      />
                      <div className="flex gap-2">
                        <Select 
                          value={editedCategory || "no-category"}
                          onValueChange={(value) => setEditedCategory(value === 'no-category' ? '' : value)}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="No category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="no-category">No category</SelectItem>
                            {categories.map(category => (
                              <SelectItem key={category} value={category}>{category}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Button 
                          size="sm" 
                          onClick={() => handleEditTask(task.id)} 
                          disabled={isEditingId === task.id}
                        >
                          {isEditingId === task.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              Save
                            </>
                          )}
                        </Button>
                        <Button variant="outline" size="sm" onClick={cancelEditing}>
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center space-x-4 flex-1 min-w-0">
                        <Checkbox
                          checked={task.completed}
                          onCheckedChange={() => handleToggleComplete(task.id)}
                          disabled={isDeletingId === task.id || isEditingId === task.id}
                        />
                        <div className="min-w-0">
                          <p className={`text-sm truncate ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                            {task.title}
                          </p>
                          {task.category && (
                            <Badge variant="outline" className="mt-1">
                              {task.category}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => startEditing(task)}
                          className="text-primary hover:text-primary"
                          disabled={isDeletingId === task.id || isEditingId === task.id}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(task.id)}
                          className="text-destructive hover:text-destructive"
                          disabled={isDeletingId === task.id || isEditingId === task.id}
                        >
                          {isDeletingId === task.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-4">
          {error}
          <button className="float-right font-bold" onClick={() => setError(null)}>×</button>
        </div>
      )}
    </div>
  )
}
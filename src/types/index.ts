export interface User {
  _id: string
  name: string
  email: string
  role: 'admin' | 'member'
  avatar?: string
  createdAt: string
}

export interface ProjectMember {
  user: User
  role: 'admin' | 'member'
  joinedAt: string
}

export interface Project {
  _id: string
  name: string
  description?: string
  owner: User
  members: ProjectMember[]
  status: 'active' | 'completed' | 'on-hold' | 'archived'
  priority: 'low' | 'medium' | 'high' | 'critical'
  color: string
  dueDate?: string
  tags: string[]
  isArchived: boolean
  taskCounts?: { todo: number; 'in-progress': number; done: number }
  progress?: number
  taskCount?: number
  createdAt: string
  updatedAt: string
}

export interface Attachment {
  filename: string
  originalName: string
  mimetype: string
  size: number
  url: string
  uploadedBy: User
  uploadedAt: string
}

export interface Task {
  _id: string
  title: string
  description?: string
  project: Project | string
  assignedTo?: User
  createdBy: User
  status: 'todo' | 'in-progress' | 'done'
  priority: 'low' | 'medium' | 'high' | 'critical'
  dueDate?: string
  completedAt?: string
  tags: string[]
  attachments: Attachment[]
  aiGenerated: boolean
  createdAt: string
  updatedAt: string
}

export interface Comment {
  _id: string
  content: string
  task: string
  author: User
  isEdited: boolean
  createdAt: string
  updatedAt: string
}

export interface Activity {
  _id: string
  type: string
  user: User
  project?: Project
  task?: Task
  meta: Record<string, unknown>
  createdAt: string
}

export interface DashboardData {
  stats: {
    totalProjects: number
    activeProjects: number
    totalTasks: number
    completedTasks: number
    inProgressTasks: number
    pendingTasks: number
    overdueTasks: number
    myTasks: number
    myPendingTasks: number
    myOverdueTasks: number
  }
  activities: Activity[]
  upcomingTasks: Task[]
  projects: Project[]
  taskTrend: { date: string; completed: number; created: number }[]
}

export interface AIMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  parsed?: {
    action: string
    tasks?: Partial<Task>[]
    message?: string
  }
}

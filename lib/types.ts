export interface Child {
  id: string
  name: string
  grade: string
  color: string
}

// プリントの種類
export type PrintoutCategory = "todo" | "event" | "info"

export interface Printout {
  id: string
  childId: string
  title: string
  category: PrintoutCategory
  // 提出物（Todo）用
  submissionItem?: string
  deadline?: string
  // 行事（Event）用
  eventDate?: string
  eventTime?: string
  parentPreparation?: string // 親の持ち物・準備
  // お便り（Info）用
  summary?: string
  pinned?: boolean
  // 共通
  createdAt: string
  status: "pending" | "completed"
  notes?: string
}

export interface Notification {
  id: string
  printoutId: string
  message: string
  read: boolean
  createdAt: string
}

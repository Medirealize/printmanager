import type { PrintoutCategory } from "@/lib/types"

export interface AIProcessingResult {
  childId: string
  title: string
  category: PrintoutCategory
  submissionItem?: string
  deadline?: string
  eventDate?: string
  eventTime?: string
  parentPreparation?: string
  summary?: string
  notes?: string
  confidence: number
}

export interface ChildContext {
  id: string
  name: string
  grade: string
}

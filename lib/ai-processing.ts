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
  /** この写真で読み取りが難しい具体的な理由（AIが画像を見て判定） */
  qualityIssues?: string[]
  /** この写真を改善するための具体的なアドバイス */
  improvementTips?: string[]
}

export interface ChildContext {
  id: string
  name: string
  grade: string
}

import { Child, Printout, PrintoutCategory } from "@/lib/types"

// Mock data for children
export const mockChildren: Child[] = [
  { id: "1", name: "はるか", grade: "小学3年生", color: "bg-chart-1" },
  { id: "2", name: "そうた", grade: "小学5年生", color: "bg-chart-2" },
  { id: "3", name: "ゆい", grade: "小学1年生", color: "bg-chart-3" },
]

// Helper to get a date X days from now
const daysFromNow = (days: number): string => {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().split("T")[0]
}

// Mock printouts data with 3 categories
export const mockPrintouts: Printout[] = [
  // 提出物（Todo）
  {
    id: "1",
    childId: "1",
    title: "遠足参加同意書",
    category: "todo",
    submissionItem: "参加同意書 + 1,500円",
    deadline: daysFromNow(2),
    createdAt: daysFromNow(-5),
    status: "pending",
    notes: "おつりのないように準備",
  },
  {
    id: "2",
    childId: "2",
    title: "読書週間・本の注文",
    category: "todo",
    submissionItem: "本の注文書",
    deadline: daysFromNow(5),
    createdAt: daysFromNow(-3),
    status: "pending",
  },
  {
    id: "3",
    childId: "3",
    title: "写真パッケージ選択",
    category: "todo",
    submissionItem: "写真パッケージ選択用紙",
    deadline: daysFromNow(1),
    createdAt: daysFromNow(-7),
    status: "pending",
    notes: "A:2,000円 / B:3,500円 / C:5,000円",
  },
  {
    id: "4",
    childId: "1",
    title: "個人面談希望日",
    category: "todo",
    submissionItem: "希望日時選択用紙",
    deadline: daysFromNow(7),
    createdAt: daysFromNow(-2),
    status: "pending",
  },
  {
    id: "5",
    childId: "2",
    title: "学芸会参加申込",
    category: "todo",
    submissionItem: "参加申込書",
    deadline: daysFromNow(10),
    createdAt: daysFromNow(-1),
    status: "completed",
  },

  // 行事（Event）
  {
    id: "6",
    childId: "1",
    title: "授業参観",
    category: "event",
    eventDate: daysFromNow(5),
    eventTime: "10:00〜11:30",
    parentPreparation: "スリッパ、筆記用具",
    createdAt: daysFromNow(-4),
    status: "pending",
    notes: "3時間目・4時間目を公開\n駐車場はありません",
  },
  {
    id: "7",
    childId: "2",
    title: "運動会",
    category: "event",
    eventDate: daysFromNow(14),
    eventTime: "8:30〜14:00",
    parentPreparation: "お弁当、レジャーシート、日傘",
    createdAt: daysFromNow(-10),
    status: "pending",
    notes: "雨天時は翌日に延期\n場所取りは7:00から",
  },
  {
    id: "8",
    childId: "3",
    title: "入学式",
    category: "event",
    eventDate: daysFromNow(3),
    eventTime: "9:00〜10:30",
    parentPreparation: "スリッパ、カメラ",
    createdAt: daysFromNow(-14),
    status: "pending",
    notes: "保護者は体育館へ直接お越しください",
  },

  // お便り（Info）
  {
    id: "9",
    childId: "1",
    title: "学年だより 5月号",
    category: "info",
    summary: "今月の学習予定、行事予定、持ち物のお願いなど",
    createdAt: daysFromNow(-2),
    status: "pending",
    pinned: true,
  },
  {
    id: "10",
    childId: "2",
    title: "給食だより",
    category: "info",
    summary: "今月の献立表と食育コラム",
    createdAt: daysFromNow(-3),
    status: "pending",
    pinned: false,
  },
  {
    id: "11",
    childId: "3",
    title: "保健だより",
    category: "info",
    summary: "熱中症対策と健康診断の結果について",
    createdAt: daysFromNow(-1),
    status: "pending",
    pinned: false,
  },
  {
    id: "12",
    childId: "1",
    title: "PTA総会のお知らせ",
    category: "info",
    summary: "5月25日（土）14:00より体育館にて開催",
    createdAt: daysFromNow(-5),
    status: "pending",
    pinned: true,
  },
]

import type { AIProcessingResult } from "@/lib/ai-processing"
export type { AIProcessingResult }

// Simulate AI processing with realistic delay
export async function simulateAIProcessing(): Promise<AIProcessingResult> {
  // Simulate processing time (1.5-3 seconds)
  await new Promise((resolve) => setTimeout(resolve, 1500 + Math.random() * 1500))

  // Return mock AI inference result
  const mockResults: AIProcessingResult[] = [
    {
      childId: "1",
      title: "春の音楽会",
      category: "event",
      eventDate: daysFromNow(12),
      eventTime: "10:00〜12:00",
      parentPreparation: "スリッパ、カメラ",
      notes: "保護者席は各家庭2名まで",
      confidence: 0.92,
    },
    {
      childId: "2",
      title: "サッカークラブ入部届",
      category: "todo",
      submissionItem: "入部届 + 健康診断書",
      deadline: daysFromNow(6),
      notes: "月額500円（サッカーシューズ、すねあて必要）",
      confidence: 0.87,
    },
    {
      childId: "3",
      title: "学級だより 6月号",
      category: "info",
      summary: "今月の目標、学習予定、夏休みの準備について",
      confidence: 0.95,
    },
  ]

  return mockResults[Math.floor(Math.random() * mockResults.length)]
}

// Comment: Real LLM/Vision API integration point
// In production, this function would:
// 1. Upload the image to a cloud storage service
// 2. Call a Vision API (Google Cloud Vision, AWS Textract, or OpenAI Vision)
// 3. Extract text from the image
// 4. Send extracted text to an LLM (Gemini, Claude, GPT-4) with a prompt like:
//    "Extract the following from this school notice:
//     - Child's grade/class (to infer which child)
//     - Category: todo (submission required), event (attendance), or info (newsletter)
//     - For todo: submission item, deadline
//     - For event: date, time, parent preparations
//     - For info: brief summary
//     Return as JSON."
// 5. Parse and validate the LLM response
// 6. Return structured data with confidence scores

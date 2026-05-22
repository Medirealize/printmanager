"use client"

import { useState, useRef, useCallback } from "react"
import { Upload, Camera, Loader2, Check, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Child, PrintoutCategory } from "@/lib/types"
import type { AIProcessingResult } from "@/lib/ai-processing"
import { analyzePrintImage } from "@/lib/api-client"

interface ScanUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: Child[]
  onSave: (data: {
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
  }) => void | Promise<void>
}

type DialogStep = "upload" | "processing" | "review"

const categoryLabels: Record<PrintoutCategory, string> = {
  todo: "提出物",
  event: "行事",
  info: "お便り",
}

export function ScanUploadDialog({
  open,
  onOpenChange,
  children,
  onSave,
}: ScanUploadDialogProps) {
  const [step, setStep] = useState<DialogStep>("upload")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [aiResult, setAiResult] = useState<AIProcessingResult | null>(null)
  const [processError, setProcessError] = useState<string | null>(null)
  const [processWarning, setProcessWarning] = useState<string | null>(null)
  
  // Form state for review step
  const [formData, setFormData] = useState({
    childId: "",
    title: "",
    category: "todo" as PrintoutCategory,
    submissionItem: "",
    deadline: "",
    eventDate: "",
    eventTime: "",
    parentPreparation: "",
    summary: "",
    notes: "",
  })

  const fileInputRef = useRef<HTMLInputElement>(null)

  const resetDialog = useCallback(() => {
    setStep("upload")
    setSelectedFile(null)
    setPreviewUrl(null)
    setProcessingProgress(0)
    setAiResult(null)
    setProcessError(null)
    setProcessWarning(null)
    setFormData({
      childId: "",
      title: "",
      category: "todo",
      submissionItem: "",
      deadline: "",
      eventDate: "",
      eventTime: "",
      parentPreparation: "",
      summary: "",
      notes: "",
    })
  }, [])

  const handleClose = useCallback(() => {
    onOpenChange(false)
    // Reset after animation completes
    setTimeout(resetDialog, 200)
  }, [onOpenChange, resetDialog])

  const handleFileSelect = useCallback((file: File) => {
    const isImage =
      file.type.startsWith("image/") ||
      /\.(jpe?g|png|webp|heic|heif)$/i.test(file.name)
    if (!isImage) {
      alert("画像ファイルを選択してください")
      return
    }
    setSelectedFile(file)
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
  }, [])

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleFileSelect(file)
    },
    [handleFileSelect]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const file = e.dataTransfer.files?.[0]
      if (file) handleFileSelect(file)
    },
    [handleFileSelect]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const startProcessing = useCallback(async () => {
    if (!selectedFile) return
    setStep("processing")
    setProcessingProgress(0)
    setProcessError(null)
    setProcessWarning(null)

    const progressInterval = setInterval(() => {
      setProcessingProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + Math.random() * 15
      })
    }, 200)

    try {
      const childContext = children.map((c) => ({
        id: c.id,
        name: c.name,
        grade: c.grade,
      }))
      const { result, warning } = await analyzePrintImage(
        selectedFile,
        childContext
      )

      clearInterval(progressInterval)
      setProcessingProgress(100)
      setAiResult(result)
      setProcessWarning(warning ?? null)

      setFormData({
        childId: result.childId,
        title: result.title,
        category: result.category,
        submissionItem: result.submissionItem || "",
        deadline: result.deadline || "",
        eventDate: result.eventDate || "",
        eventTime: result.eventTime || "",
        parentPreparation: result.parentPreparation || "",
        summary: result.summary || "",
        notes: result.notes || "",
      })

      setTimeout(() => setStep("review"), 500)
    } catch (error) {
      clearInterval(progressInterval)
      setProcessError(
        error instanceof Error ? error.message : "AI解析に失敗しました"
      )
      setStep("upload")
    }
  }, [selectedFile, children])

  const handleSave = useCallback(async () => {
    if (!formData.childId || !formData.title) return
    if (
      formData.category === "todo" &&
      (!formData.submissionItem || !formData.deadline)
    )
      return
    if (formData.category === "event" && !formData.eventDate) return

    try {
      await onSave({
        childId: formData.childId,
        title: formData.title,
        category: formData.category,
        submissionItem:
          formData.category === "todo" ? formData.submissionItem : undefined,
        deadline: formData.category === "todo" ? formData.deadline : undefined,
        eventDate: formData.category === "event" ? formData.eventDate : undefined,
        eventTime: formData.category === "event" ? formData.eventTime : undefined,
        parentPreparation:
          formData.category === "event"
            ? formData.parentPreparation
            : undefined,
        summary: formData.category === "info" ? formData.summary : undefined,
        notes: formData.notes || undefined,
      })
      handleClose()
    } catch {
      setProcessError("保存に失敗しました。もう一度お試しください。")
      setStep("review")
    }
  }, [formData, onSave, handleClose])

  const isFormValid = () => {
    if (!formData.childId || !formData.title) return false
    if (formData.category === "todo" && (!formData.submissionItem || !formData.deadline)) return false
    if (formData.category === "event" && !formData.eventDate) return false
    return true
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        {step === "upload" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">プリントをスキャン</DialogTitle>
              <DialogDescription className="text-base">
                学校のプリントを撮影またはアップロードすると、AIが内容を読み取ります。
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {processError && (
                <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm text-destructive">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  {processError}
                </div>
              )}
              {/* Drop zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  selectedFile
                    ? "border-success bg-success/5"
                    : "border-muted-foreground/30 hover:border-primary hover:bg-primary/5"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileInputChange}
                  className="hidden"
                  aria-label="プリント画像をアップロード"
                />
                
                {previewUrl ? (
                  <div className="space-y-3">
                    <img
                      src={previewUrl}
                      alt="プリントのプレビュー"
                      className="max-h-48 mx-auto rounded-lg object-contain"
                    />
                    <p className="text-sm text-success font-medium flex items-center justify-center gap-2">
                      <Check className="h-4 w-4" />
                      {selectedFile?.name}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-center gap-4">
                      <Upload className="h-10 w-10 text-muted-foreground" />
                      <Camera className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-base font-medium">
                        タップして写真を撮るか選択
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        または画像をドラッグ&ドロップ
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={handleClose}
                className="text-base h-12"
              >
                キャンセル
              </Button>
              <Button
                onClick={startProcessing}
                disabled={!selectedFile}
                className="text-base h-12 px-6"
              >
                AIで読み取る
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "processing" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">読み取り中...</DialogTitle>
              <DialogDescription className="text-base">
                AIがプリントの内容を解析しています
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-8 space-y-6">
              <div className="flex justify-center">
                <div className="relative">
                  <Loader2 className="h-16 w-16 animate-spin text-primary" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Progress value={processingProgress} className="h-3" />
                <p className="text-sm text-center text-muted-foreground">
                  {processingProgress < 30 && "画像から文字を抽出中..."}
                  {processingProgress >= 30 && processingProgress < 60 && "プリントの種類を判定中..."}
                  {processingProgress >= 60 && processingProgress < 90 && "詳細を特定中..."}
                  {processingProgress >= 90 && "もうすぐ完了..."}
                </p>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                Gemini API がプリントの内容を解析しています
              </p>
            </div>
          </>
        )}

        {step === "review" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">内容を確認</DialogTitle>
              <DialogDescription className="text-base">
                読み取った内容を確認・修正してください
              </DialogDescription>
            </DialogHeader>

            {processWarning && (
              <div className="flex items-start gap-2 p-3 bg-warning/10 border border-warning/30 rounded-lg">
                <AlertCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                <p className="text-sm leading-snug">{processWarning}</p>
              </div>
            )}

            {aiResult && aiResult.confidence < 0.9 && !processWarning && (
              <div className="flex items-start gap-2 p-3 bg-warning/10 border border-warning/30 rounded-lg">
                <AlertCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                <p className="text-sm">
                  AIの読み取り精度が通常より低いです。内容をご確認ください。
                </p>
              </div>
            )}
            
            <div className="space-y-4 py-4">
              {/* 共通フィールド */}
              <div className="space-y-2">
                <Label htmlFor="child" className="text-base">
                  お子さん
                </Label>
                <Select
                  value={formData.childId}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, childId: value }))
                  }
                >
                  <SelectTrigger id="child" className="h-12 text-base">
                    <SelectValue placeholder="お子さんを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {children.map((child) => (
                      <SelectItem
                        key={child.id}
                        value={child.id}
                        className="text-base py-3"
                      >
                        <span className="flex items-center gap-2">
                          <span
                            className={`w-3 h-3 rounded-full ${child.color}`}
                          />
                          {child.name}（{child.grade}）
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="text-base">
                  プリントの種類
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(value: PrintoutCategory) =>
                    setFormData((prev) => ({ ...prev, category: value }))
                  }
                >
                  <SelectTrigger id="category" className="h-12 text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo" className="text-base py-3">
                      提出物（Todo）- 締め切りあり
                    </SelectItem>
                    <SelectItem value="event" className="text-base py-3">
                      行事（Event）- 日時あり
                    </SelectItem>
                    <SelectItem value="info" className="text-base py-3">
                      お便り（Info）- 読むだけ
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title" className="text-base">
                  タイトル
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="h-12 text-base"
                />
              </div>

              {/* 提出物（Todo）専用フィールド */}
              {formData.category === "todo" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="submissionItem" className="text-base">
                      提出するもの
                    </Label>
                    <Input
                      id="submissionItem"
                      value={formData.submissionItem}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          submissionItem: e.target.value,
                        }))
                      }
                      placeholder="例: 参加同意書 + 1,500円"
                      className="h-12 text-base"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deadline" className="text-base">
                      締め切り日
                    </Label>
                    <Input
                      id="deadline"
                      type="date"
                      value={formData.deadline}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, deadline: e.target.value }))
                      }
                      className="h-12 text-base"
                    />
                  </div>
                </>
              )}

              {/* 行事（Event）専用フィールド */}
              {formData.category === "event" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="eventDate" className="text-base">
                      開催日
                    </Label>
                    <Input
                      id="eventDate"
                      type="date"
                      value={formData.eventDate}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, eventDate: e.target.value }))
                      }
                      className="h-12 text-base"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="eventTime" className="text-base">
                      開催時間
                    </Label>
                    <Input
                      id="eventTime"
                      value={formData.eventTime}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, eventTime: e.target.value }))
                      }
                      placeholder="例: 10:00〜12:00"
                      className="h-12 text-base"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="parentPreparation" className="text-base">
                      親の持ち物・準備
                    </Label>
                    <Input
                      id="parentPreparation"
                      value={formData.parentPreparation}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, parentPreparation: e.target.value }))
                      }
                      placeholder="例: スリッパ、お弁当"
                      className="h-12 text-base"
                    />
                  </div>
                </>
              )}

              {/* お便り（Info）専用フィールド */}
              {formData.category === "info" && (
                <div className="space-y-2">
                  <Label htmlFor="summary" className="text-base">
                    概要
                  </Label>
                  <Textarea
                    id="summary"
                    value={formData.summary}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, summary: e.target.value }))
                    }
                    placeholder="例: 今月の学習予定、行事予定など"
                    className="min-h-[80px] text-base"
                  />
                </div>
              )}

              {/* メモ（全カテゴリ共通） */}
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-base">
                  メモ（任意）
                </Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  placeholder="追加のメモがあれば入力"
                  className="min-h-[80px] text-base"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                variant="outline"
                onClick={() => setStep("upload")}
                className="text-base h-12"
              >
                戻る
              </Button>
              <Button
                onClick={handleSave}
                disabled={!isFormValid()}
                className="text-base h-12 px-6"
              >
                <Check className="h-5 w-5 mr-2" />
                保存する
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

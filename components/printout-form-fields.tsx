"use client"

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
import type { Child, PrintoutCategory } from "@/lib/types"

export type PrintoutFormState = {
  childId: string
  title: string
  category: PrintoutCategory
  submissionItem: string
  deadline: string
  eventDate: string
  eventTime: string
  parentPreparation: string
  summary: string
  notes: string
}

export function printoutToFormState(printout: {
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
}): PrintoutFormState {
  return {
    childId: printout.childId,
    title: printout.title,
    category: printout.category,
    submissionItem: printout.submissionItem ?? "",
    deadline: printout.deadline ?? "",
    eventDate: printout.eventDate ?? "",
    eventTime: printout.eventTime ?? "",
    parentPreparation: printout.parentPreparation ?? "",
    summary: printout.summary ?? "",
    notes: printout.notes ?? "",
  }
}

export function isPrintoutFormValid(form: PrintoutFormState): boolean {
  if (!form.childId || !form.title.trim()) return false
  if (form.category === "todo" && (!form.submissionItem.trim() || !form.deadline))
    return false
  if (form.category === "event" && !form.eventDate) return false
  return true
}

export function formStateToPayload(form: PrintoutFormState) {
  return {
    childId: form.childId,
    title: form.title.trim(),
    category: form.category,
    submissionItem:
      form.category === "todo" ? form.submissionItem.trim() : undefined,
    deadline: form.category === "todo" ? form.deadline : undefined,
    eventDate: form.category === "event" ? form.eventDate : undefined,
    eventTime: form.category === "event" ? form.eventTime.trim() : undefined,
    parentPreparation:
      form.category === "event" ? form.parentPreparation.trim() : undefined,
    summary: form.category === "info" ? form.summary.trim() : undefined,
    notes: form.notes.trim() || undefined,
  }
}

interface PrintoutFormFieldsProps {
  idPrefix: string
  children: Child[]
  formData: PrintoutFormState
  setFormData: React.Dispatch<React.SetStateAction<PrintoutFormState>>
}

export function PrintoutFormFields({
  idPrefix,
  children,
  formData,
  setFormData,
}: PrintoutFormFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-child`} className="text-base">
          お子さん
        </Label>
        <Select
          value={formData.childId}
          onValueChange={(value) =>
            setFormData((prev) => ({ ...prev, childId: value }))
          }
        >
          <SelectTrigger id={`${idPrefix}-child`} className="h-12 text-base">
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
                  <span className={`w-3 h-3 rounded-full ${child.color}`} />
                  {child.name}（{child.grade}）
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-category`} className="text-base">
          プリントの種類
        </Label>
        <Select
          value={formData.category}
          onValueChange={(value: PrintoutCategory) =>
            setFormData((prev) => ({ ...prev, category: value }))
          }
        >
          <SelectTrigger id={`${idPrefix}-category`} className="h-12 text-base">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todo" className="text-base py-3">
              提出物（Todo）
            </SelectItem>
            <SelectItem value="event" className="text-base py-3">
              行事（Event）
            </SelectItem>
            <SelectItem value="info" className="text-base py-3">
              お便り（Info）
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-title`} className="text-base">
          タイトル
        </Label>
        <Input
          id={`${idPrefix}-title`}
          value={formData.title}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, title: e.target.value }))
          }
          className="h-12 text-base"
        />
      </div>

      {formData.category === "todo" && (
        <>
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-submission`} className="text-base">
              提出するもの
            </Label>
            <Input
              id={`${idPrefix}-submission`}
              value={formData.submissionItem}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  submissionItem: e.target.value,
                }))
              }
              className="h-12 text-base"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-deadline`} className="text-base">
              締め切り日
            </Label>
            <Input
              id={`${idPrefix}-deadline`}
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

      {formData.category === "event" && (
        <>
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-eventDate`} className="text-base">
              開催日
            </Label>
            <Input
              id={`${idPrefix}-eventDate`}
              type="date"
              value={formData.eventDate}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, eventDate: e.target.value }))
              }
              className="h-12 text-base"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-eventTime`} className="text-base">
              開催時間
            </Label>
            <Input
              id={`${idPrefix}-eventTime`}
              value={formData.eventTime}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, eventTime: e.target.value }))
              }
              placeholder="例: 10:00〜12:00"
              className="h-12 text-base"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-prep`} className="text-base">
              親の持ち物・準備
            </Label>
            <Input
              id={`${idPrefix}-prep`}
              value={formData.parentPreparation}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  parentPreparation: e.target.value,
                }))
              }
              className="h-12 text-base"
            />
          </div>
        </>
      )}

      {formData.category === "info" && (
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-summary`} className="text-base">
            概要
          </Label>
          <Textarea
            id={`${idPrefix}-summary`}
            value={formData.summary}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, summary: e.target.value }))
            }
            className="min-h-[80px] text-base"
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-notes`} className="text-base">
          メモ（任意）
        </Label>
        <Textarea
          id={`${idPrefix}-notes`}
          value={formData.notes}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, notes: e.target.value }))
          }
          className="min-h-[80px] text-base"
        />
      </div>
    </div>
  )
}

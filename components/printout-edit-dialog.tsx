"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  PrintoutFormFields,
  formStateToPayload,
  isPrintoutFormValid,
  printoutToFormState,
  type PrintoutFormState,
} from "@/components/printout-form-fields"
import type { Child, Printout } from "@/lib/types"

interface PrintoutEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  printout: Printout | null
  children: Child[]
  onSave: (id: string, data: ReturnType<typeof formStateToPayload>) => Promise<void>
}

export function PrintoutEditDialog({
  open,
  onOpenChange,
  printout,
  children,
  onSave,
}: PrintoutEditDialogProps) {
  const [formData, setFormData] = useState<PrintoutFormState | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (printout && open) {
      setFormData(printoutToFormState(printout))
      setError(null)
    }
  }, [printout, open])

  const handleSave = async () => {
    if (!printout || !formData || !isPrintoutFormValid(formData)) return
    setSaving(true)
    setError(null)
    try {
      await onSave(printout.id, formStateToPayload(formData))
      onOpenChange(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存に失敗しました")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">プリントを編集</DialogTitle>
          <DialogDescription className="text-base">
            内容を修正して保存してください
          </DialogDescription>
        </DialogHeader>

        {error && (
          <p className="text-sm text-destructive px-1">{error}</p>
        )}

        {formData && (
          <div className="py-2">
            <PrintoutFormFields
              idPrefix="edit"
              children={children}
              formData={formData}
              setFormData={(value) => {
                setFormData((prev) => {
                  if (!prev) return prev
                  return typeof value === "function" ? value(prev) : value
                })
              }}
            />
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-12 text-base"
          >
            キャンセル
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !formData || !isPrintoutFormValid(formData)}
            className="h-12 text-base px-6"
          >
            {saving ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                保存中...
              </>
            ) : (
              "保存する"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

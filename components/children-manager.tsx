"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, CheckCircle2, Loader2, Trash2, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  CHILD_COLOR_OPTIONS,
  GRADE_OPTIONS,
  GRADE_OTHER_LABEL,
  GRADE_OTHER_VALUE,
  isGradeSelectionValid,
  resolveGradeValue,
} from "@/lib/child-colors"
import {
  createChild,
  deleteChild,
  fetchChildren,
} from "@/lib/api-client"
import type { Child } from "@/lib/types"

function isSetupRequiredMessage(message: string): boolean {
  return message.includes("schema.sql") || message.includes("テーブルがありません")
}

function nextColor(current: string): string {
  const idx = CHILD_COLOR_OPTIONS.findIndex((c) => c.value === current)
  const next = CHILD_COLOR_OPTIONS[(idx + 1) % CHILD_COLOR_OPTIONS.length]
  return next.value
}

export default function ChildrenManager() {
  const router = useRouter()
  const [children, setChildren] = useState<Child[]>([])
  const [listLoading, setListLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [gradeSelect, setGradeSelect] = useState("")
  const [customGrade, setCustomGrade] = useState("")
  const [color, setColor] = useState<string>(CHILD_COLOR_OPTIONS[0].value)

  const nameInputRef = useRef<HTMLInputElement>(null)
  const loadGenerationRef = useRef(0)

  const gradeValid = isGradeSelectionValid(gradeSelect, customGrade)
  const resolvedGrade = resolveGradeValue(gradeSelect, customGrade)

  const resetForm = useCallback(
    (options?: { keepGrade?: boolean; rotateColor?: boolean }) => {
      setName("")
      if (!options?.keepGrade) {
        setGradeSelect("")
        setCustomGrade("")
      }
      if (options?.rotateColor) {
        setColor((c) => nextColor(c))
      }
    },
    []
  )

  const loadChildren = useCallback(async (silent = false) => {
    const generation = ++loadGenerationRef.current
    if (!silent) setListLoading(true)
    setError(null)
    try {
      const data = await fetchChildren()
      if (generation !== loadGenerationRef.current) return
      setChildren(data)
    } catch (e) {
      if (generation !== loadGenerationRef.current) return
      setError(
        e instanceof Error ? e.message : "お子さん一覧の読み込みに失敗しました"
      )
    } finally {
      if (generation === loadGenerationRef.current && !silent) {
        setListLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    loadChildren()
  }, [loadChildren])

  const focusNameInput = () => {
    requestAnimationFrame(() => nameInputRef.current?.focus())
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !gradeValid) return

    const registeredName = name.trim()
    setSaving(true)
    setError(null)
    setSuccessMessage(null)
    try {
      await createChild({
        name: registeredName,
        grade: resolvedGrade,
        color,
      })
      await loadChildren(true)
      resetForm({ keepGrade: true, rotateColor: true })
      setSuccessMessage(`${registeredName}さんを登録しました。続けて登録できます。`)
      router.refresh()
      focusNameInput()
    } catch (e) {
      setError(e instanceof Error ? e.message : "登録に失敗しました")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    setError(null)
    setSuccessMessage(null)
    try {
      await deleteChild(id)
      await loadChildren(true)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "削除に失敗しました")
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-10 w-10" asChild>
            <Link href="/" aria-label="ホームに戻る">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold">お子さんの登録</h1>
            <p className="text-sm text-muted-foreground">
              登録後もこの画面で続けて追加できます
            </p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 pb-12 max-w-lg">
        {error && (
          <div className="mb-4 space-y-3">
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
              {error}
              <Button
                variant="link"
                className="ml-2 h-auto p-0 text-destructive"
                onClick={() => loadChildren()}
              >
                再読み込み
              </Button>
            </div>
            {isSetupRequiredMessage(error) && (
              <Card className="p-4 bg-muted/50 border-primary/20">
                <p className="font-semibold text-base mb-2">Supabase の初期設定</p>
                <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                  <li>
                    <a
                      href="https://supabase.com/dashboard"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline"
                    >
                      Supabase ダッシュボード
                    </a>
                    を開く
                  </li>
                  <li>
                    左メニュー <strong>SQL Editor</strong> → New query
                  </li>
                  <li>
                    プロジェクトの{" "}
                    <code className="text-xs bg-muted px-1 rounded">
                      supabase/schema.sql
                    </code>{" "}
                    の内容をすべて貼り付けて <strong>Run</strong>
                  </li>
                  <li>完了後、このページで「再読み込み」</li>
                </ol>
              </Card>
            )}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 rounded-lg bg-success/10 border border-success/30 text-success text-sm flex items-start gap-2">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            新しく登録
          </h2>
          <Card className="p-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="child-name" className="text-base">
                  お名前
                </Label>
                <Input
                  ref={nameInputRef}
                  id="child-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="例: はるか"
                  className="h-12 text-base"
                  maxLength={20}
                  required
                  autoComplete="off"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="child-grade" className="text-base">
                  学年
                </Label>
                <Select
                  value={gradeSelect}
                  onValueChange={(value) => {
                    setGradeSelect(value)
                    if (value !== GRADE_OTHER_VALUE) setCustomGrade("")
                  }}
                >
                  <SelectTrigger id="child-grade" className="h-12 text-base">
                    <SelectValue placeholder="学年を選択" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {GRADE_OPTIONS.map((g) => (
                      <SelectItem key={g} value={g} className="text-base py-3">
                        {g}
                      </SelectItem>
                    ))}
                    <SelectItem
                      value={GRADE_OTHER_VALUE}
                      className="text-base py-3"
                    >
                      {GRADE_OTHER_LABEL}
                    </SelectItem>
                  </SelectContent>
                </Select>
                {gradeSelect === GRADE_OTHER_VALUE && (
                  <div className="space-y-2 pt-1">
                    <Label
                      htmlFor="child-grade-custom"
                      className="text-sm text-muted-foreground"
                    >
                      学年を入力
                    </Label>
                    <Input
                      id="child-grade-custom"
                      value={customGrade}
                      onChange={(e) => setCustomGrade(e.target.value)}
                      placeholder="例: 幼稚園年長、専門学校1年"
                      className="h-12 text-base"
                      maxLength={30}
                      required
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-base">タブの色</Label>
                <div className="flex flex-wrap gap-2">
                  {CHILD_COLOR_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setColor(opt.value)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-colors ${
                        color === opt.value
                          ? "border-primary bg-primary/5"
                          : "border-border"
                      }`}
                    >
                      <span
                        className={`w-4 h-4 rounded-full ${opt.value}`}
                        aria-hidden
                      />
                      <span className="text-sm">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base"
                disabled={saving || !name.trim() || !gradeValid}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    登録中...
                  </>
                ) : (
                  "登録する"
                )}
              </Button>
            </form>
          </Card>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">
            登録済み（{children.length}人）
          </h2>
          {listLoading && children.length === 0 ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : children.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              まだ登録がありません。上のフォームから追加してください。
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {children.map((child) => (
                <li key={child.id}>
                  <Card className="p-4 flex items-center gap-3">
                    <span
                      className={`w-4 h-4 rounded-full flex-shrink-0 ${child.color}`}
                      aria-hidden
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-lg">{child.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {child.grade}
                      </p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive"
                          aria-label={`${child.name}を削除`}
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            {child.name}さんを削除しますか？
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            このお子さんに紐づくプリントも削除されます。この操作は取り消せません。
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>キャンセル</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => handleDelete(child.id)}
                          >
                            削除する
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  )
}

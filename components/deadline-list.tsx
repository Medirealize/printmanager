"use client"

import { useState } from "react"
import { Child, Printout, PrintoutCategory } from "@/lib/types"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { 
  AlertTriangle, 
  Calendar, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  FileText, 
  ClipboardList,
  CalendarDays,
  Newspaper,
  Pin,
  PinOff,
  Clock,
  ShoppingBag
} from "lucide-react"
import { PrintoutCardActions } from "@/components/printout-card-actions"

interface PrintoutCardProps {
  printout: Printout
  child: Child
  onToggleComplete: (id: string) => void
  onTogglePin?: (id: string) => void
  onEdit?: (printout: Printout) => void
  onDelete?: (id: string) => void
}

function getDaysUntilDate(dateStr?: string): number {
  if (!dateStr) return 999
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const targetDate = new Date(dateStr)
  targetDate.setHours(0, 0, 0, 0)
  const diffTime = targetDate.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return ""
  const date = new Date(dateStr)
  return date.toLocaleDateString("ja-JP", {
    month: "long",
    day: "numeric",
    weekday: "short",
  })
}

// カテゴリごとのスタイル設定
const categoryConfig: Record<PrintoutCategory, {
  icon: React.ReactNode
  label: string
  borderColor: string
  bgColor: string
  badgeColor: string
}> = {
  todo: {
    icon: <ClipboardList className="h-4 w-4" />,
    label: "提出物",
    borderColor: "border-l-primary",
    bgColor: "bg-primary/5",
    badgeColor: "bg-primary/10 text-primary border-primary/30",
  },
  event: {
    icon: <CalendarDays className="h-4 w-4" />,
    label: "行事",
    borderColor: "border-l-chart-2",
    bgColor: "bg-chart-2/5",
    badgeColor: "bg-chart-2/10 text-chart-2 border-chart-2/30",
  },
  info: {
    icon: <Newspaper className="h-4 w-4" />,
    label: "お便り",
    borderColor: "border-l-chart-4",
    bgColor: "bg-chart-4/5",
    badgeColor: "bg-chart-4/10 text-chart-4 border-chart-4/30",
  },
}

function CardHeaderRow({
  printout,
  onEdit,
  onDelete,
}: {
  printout: Printout
  onEdit?: (printout: Printout) => void
  onDelete?: (id: string) => void
}) {
  if (!onEdit || !onDelete) return null
  return (
    <div className="flex justify-end -mt-1 -mr-1 mb-1">
      <PrintoutCardActions
        printout={printout}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </div>
  )
}

// 提出物（Todo）カード
function TodoCard({
  printout,
  child,
  onToggleComplete,
  onEdit,
  onDelete,
}: PrintoutCardProps) {
  const [showNotes, setShowNotes] = useState(false)
  const daysLeft = getDaysUntilDate(printout.deadline)
  const isUrgent = daysLeft <= 3 && printout.status !== "completed"
  const isOverdue = daysLeft < 0 && printout.status !== "completed"
  const isCompleted = printout.status === "completed"
  const config = categoryConfig.todo

  const getUrgencyStyles = () => {
    if (isCompleted) return "border-success/30 bg-success/5"
    if (isOverdue) return "border-destructive bg-destructive/5 animate-pulse-urgent"
    if (isUrgent) return "border-warning bg-warning/10"
    return `border-border ${config.bgColor}`
  }

  const getUrgencyBadge = () => {
    if (isCompleted) {
      return (
        <Badge variant="outline" className="bg-success/10 text-success border-success/30 text-sm px-3 py-1">
          <CheckCircle2 className="h-4 w-4 mr-1" />
          完了
        </Badge>
      )
    }
    if (isOverdue) {
      return (
        <Badge variant="destructive" className="text-sm px-3 py-1">
          <AlertTriangle className="h-4 w-4 mr-1" />
          期限切れ
        </Badge>
      )
    }
    if (daysLeft === 0) {
      return (
        <Badge variant="destructive" className="text-sm px-3 py-1">
          <AlertTriangle className="h-4 w-4 mr-1" />
          今日まで!
        </Badge>
      )
    }
    if (daysLeft === 1) {
      return (
        <Badge className="bg-warning text-warning-foreground text-sm px-3 py-1">
          明日まで
        </Badge>
      )
    }
    if (isUrgent) {
      return (
        <Badge className="bg-warning text-warning-foreground text-sm px-3 py-1">
          あと{daysLeft}日
        </Badge>
      )
    }
    return (
      <Badge variant="secondary" className="text-sm px-3 py-1">
        あと{daysLeft}日
      </Badge>
    )
  }

  const dateColorClass = isCompleted 
    ? "text-success" 
    : isOverdue 
    ? "text-destructive" 
    : daysLeft === 0 
    ? "text-destructive" 
    : daysLeft <= 3 
    ? "text-warning" 
    : "text-muted-foreground"

  return (
    <Card className={`p-4 transition-all duration-200 border-l-4 ${config.borderColor} ${getUrgencyStyles()} ${isCompleted ? "opacity-70" : ""}`}>
      <CardHeaderRow printout={printout} onEdit={onEdit} onDelete={onDelete} />
      <div className="flex items-start gap-4">
        <div className="pt-1">
          <Checkbox
            checked={isCompleted}
            onCheckedChange={() => onToggleComplete(printout.id)}
            className="h-6 w-6"
            aria-label={`${printout.title}を${isCompleted ? "未完了" : "完了"}にする`}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge variant="outline" className={`text-xs px-2 py-0.5 ${config.badgeColor}`}>
              {config.icon}
              <span className="ml-1">{config.label}</span>
            </Badge>
            <span className={`inline-block w-3 h-3 rounded-full ${child.color}`} aria-hidden="true" />
            <span className="text-sm font-medium text-muted-foreground">{child.name}</span>
            {getUrgencyBadge()}
          </div>
          <h3 className={`text-lg font-semibold mb-1 ${isCompleted ? "line-through text-muted-foreground" : ""}`}>
            {printout.title}
          </h3>
          <p className="text-base text-muted-foreground mb-2">
            提出物: <span className="font-medium text-foreground">{printout.submissionItem}</span>
          </p>
          <div className="flex items-center gap-2 text-sm">
            <Calendar className={`h-4 w-4 ${dateColorClass}`} />
            <span className={`font-medium ${dateColorClass}`}>
              {formatDate(printout.deadline)}
            </span>
          </div>
          
          {printout.notes && (
            <div className="mt-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNotes(!showNotes)}
                className="h-8 px-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <FileText className="h-4 w-4 mr-1" />
                メモ
                {showNotes ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
              </Button>
              {showNotes && (
                <div className="mt-2 p-3 bg-muted/50 rounded-lg text-sm whitespace-pre-wrap">
                  {printout.notes}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

// 行事（Event）カード
function EventCard({
  printout,
  child,
  onToggleComplete,
  onEdit,
  onDelete,
}: PrintoutCardProps) {
  const [showNotes, setShowNotes] = useState(false)
  const daysUntil = getDaysUntilDate(printout.eventDate)
  const isCompleted = printout.status === "completed"
  const config = categoryConfig.event

  const getDaysUntilBadge = () => {
    if (isCompleted) {
      return (
        <Badge variant="outline" className="bg-success/10 text-success border-success/30 text-sm px-3 py-1">
          <CheckCircle2 className="h-4 w-4 mr-1" />
          終了
        </Badge>
      )
    }
    if (daysUntil < 0) {
      return (
        <Badge variant="secondary" className="text-sm px-3 py-1">
          終了
        </Badge>
      )
    }
    if (daysUntil === 0) {
      return (
        <Badge className="bg-chart-2 text-white text-sm px-3 py-1">
          今日!
        </Badge>
      )
    }
    if (daysUntil === 1) {
      return (
        <Badge className="bg-chart-2/80 text-white text-sm px-3 py-1">
          明日
        </Badge>
      )
    }
    if (daysUntil <= 3) {
      return (
        <Badge className="bg-chart-2/60 text-white text-sm px-3 py-1">
          あと{daysUntil}日
        </Badge>
      )
    }
    return (
      <Badge variant="secondary" className="text-sm px-3 py-1">
        あと{daysUntil}日
      </Badge>
    )
  }

  return (
    <Card className={`p-4 transition-all duration-200 border-l-4 ${config.borderColor} ${config.bgColor} ${isCompleted ? "opacity-70" : ""}`}>
      <CardHeaderRow printout={printout} onEdit={onEdit} onDelete={onDelete} />
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge variant="outline" className={`text-xs px-2 py-0.5 ${config.badgeColor}`}>
              {config.icon}
              <span className="ml-1">{config.label}</span>
            </Badge>
            <span className={`inline-block w-3 h-3 rounded-full ${child.color}`} aria-hidden="true" />
            <span className="text-sm font-medium text-muted-foreground">{child.name}</span>
            {getDaysUntilBadge()}
          </div>
          <h3 className={`text-lg font-semibold mb-2 ${isCompleted ? "line-through text-muted-foreground" : ""}`}>
            {printout.title}
          </h3>

          {/* 開催日時 */}
          <div className="flex items-center gap-2 text-base mb-1">
            <CalendarDays className="h-4 w-4 text-chart-2" />
            <span className="font-medium">{formatDate(printout.eventDate)}</span>
          </div>
          {printout.eventTime && (
            <div className="flex items-center gap-2 text-base mb-2 ml-6">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{printout.eventTime}</span>
            </div>
          )}
          
          {/* 親の持ち物・準備 */}
          {printout.parentPreparation && (
            <div className="flex items-start gap-2 text-base mt-3 p-2 bg-chart-2/10 rounded-lg">
              <ShoppingBag className="h-4 w-4 text-chart-2 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-xs text-muted-foreground block">持ち物・準備</span>
                <span className="font-medium">{printout.parentPreparation}</span>
              </div>
            </div>
          )}
          
          {printout.notes && (
            <div className="mt-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNotes(!showNotes)}
                className="h-8 px-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <FileText className="h-4 w-4 mr-1" />
                詳細
                {showNotes ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
              </Button>
              {showNotes && (
                <div className="mt-2 p-3 bg-muted/50 rounded-lg text-sm whitespace-pre-wrap">
                  {printout.notes}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

// お便り（Info）カード
function InfoCard({
  printout,
  child,
  onTogglePin,
  onEdit,
  onDelete,
}: PrintoutCardProps) {
  const config = categoryConfig.info
  const isPinned = printout.pinned

  return (
    <Card className={`p-4 transition-all duration-200 border-l-4 ${config.borderColor} ${config.bgColor} ${isPinned ? "ring-1 ring-chart-4/30" : ""}`}>
      <CardHeaderRow printout={printout} onEdit={onEdit} onDelete={onDelete} />
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge variant="outline" className={`text-xs px-2 py-0.5 ${config.badgeColor}`}>
              {config.icon}
              <span className="ml-1">{config.label}</span>
            </Badge>
            <span className={`inline-block w-3 h-3 rounded-full ${child.color}`} aria-hidden="true" />
            <span className="text-sm font-medium text-muted-foreground">{child.name}</span>
            {isPinned && (
              <Badge variant="outline" className="text-xs px-2 py-0.5 bg-chart-4/10 text-chart-4 border-chart-4/30">
                <Pin className="h-3 w-3 mr-1" />
                ピン留め
              </Badge>
            )}
          </div>
          <h3 className="text-lg font-semibold mb-1">
            {printout.title}
          </h3>
          {printout.summary && (
            <p className="text-base text-muted-foreground">
              {printout.summary}
            </p>
          )}
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-muted-foreground">
              {formatDate(printout.createdAt)}
            </span>
            {onTogglePin && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onTogglePin(printout.id)}
                className="h-8 px-2 text-sm text-muted-foreground hover:text-foreground"
              >
                {isPinned ? (
                  <>
                    <PinOff className="h-4 w-4 mr-1" />
                    ピン解除
                  </>
                ) : (
                  <>
                    <Pin className="h-4 w-4 mr-1" />
                    ピン留め
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}

// メインのカードコンポーネント
export function PrintoutCard({
  printout,
  child,
  onToggleComplete,
  onTogglePin,
  onEdit,
  onDelete,
}: PrintoutCardProps) {
  switch (printout.category) {
    case "todo":
      return (
        <TodoCard
          printout={printout}
          child={child}
          onToggleComplete={onToggleComplete}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )
    case "event":
      return (
        <EventCard
          printout={printout}
          child={child}
          onToggleComplete={onToggleComplete}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )
    case "info":
      return (
        <InfoCard
          printout={printout}
          child={child}
          onToggleComplete={onToggleComplete}
          onTogglePin={onTogglePin}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )
    default:
      return (
        <TodoCard
          printout={printout}
          child={child}
          onToggleComplete={onToggleComplete}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )
  }
}

interface PrintoutListProps {
  printouts: Printout[]
  children: Child[]
  onToggleComplete: (id: string) => void
  onTogglePin?: (id: string) => void
  onEdit?: (printout: Printout) => void
  onDelete?: (id: string) => void
  filterChildId?: string | null
  filterCategory?: PrintoutCategory
  showCompleted?: boolean
}

export function PrintoutList({
  printouts,
  children,
  onToggleComplete,
  onTogglePin,
  onEdit,
  onDelete,
  filterChildId,
  filterCategory,
  showCompleted = true,
}: PrintoutListProps) {
  // Filter by child if specified
  let filteredPrintouts = filterChildId
    ? printouts.filter((p) => p.childId === filterChildId)
    : printouts

  // Filter by category if specified
  if (filterCategory) {
    filteredPrintouts = filteredPrintouts.filter((p) => p.category === filterCategory)
  }

  // Filter out completed if not showing
  if (!showCompleted) {
    filteredPrintouts = filteredPrintouts.filter((p) => p.status !== "completed")
  }

  // Sort: pinned info first, then by urgency/date
  const sortedPrintouts = [...filteredPrintouts].sort((a, b) => {
    // Pinned items go to top (info only)
    if (a.category === "info" && a.pinned && !(b.category === "info" && b.pinned)) return -1
    if (b.category === "info" && b.pinned && !(a.category === "info" && a.pinned)) return 1
    
    // Completed items go to bottom
    if (a.status === "completed" && b.status !== "completed") return 1
    if (a.status !== "completed" && b.status === "completed") return -1
    
    // Sort by deadline/eventDate
    const dateA = a.deadline || a.eventDate || a.createdAt
    const dateB = b.deadline || b.eventDate || b.createdAt
    return new Date(dateA).getTime() - new Date(dateB).getTime()
  })

  if (sortedPrintouts.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <p className="text-lg text-muted-foreground">
          {filterChildId
            ? "このお子さんのプリントはまだありません"
            : "プリントはまだありません"}
        </p>
        <p className="text-base text-muted-foreground mt-2">
          下のボタンから画像を追加しましょう!
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {sortedPrintouts.map((printout) => {
        const child = children.find((c) => c.id === printout.childId)
        if (!child) return null
        return (
          <PrintoutCard
            key={printout.id}
            printout={printout}
            child={child}
            onToggleComplete={onToggleComplete}
            onTogglePin={onTogglePin}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        )
      })}
    </div>
  )
}

// 後方互換性のためのエイリアス
export const DeadlineCard = PrintoutCard
export const DeadlineList = PrintoutList

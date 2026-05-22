"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { Camera, Plus, ClipboardList, CalendarDays, Newspaper, LayoutGrid, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { NotificationBell } from "@/components/notification-bell"
import { PrintoutList } from "@/components/deadline-list"
import { ScanUploadDialog } from "@/components/scan-upload-dialog"
import { Child, Printout, Notification, PrintoutCategory } from "@/lib/types"
import {
  createPrintout,
  fetchChildren,
  fetchPrintouts,
  patchPrintout,
} from "@/lib/api-client"

export default function Dashboard() {
  const [children, setChildren] = useState<Child[]>([])
  const [printouts, setPrintouts] = useState<Printout[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [activeTab, setActiveTab] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [scanDialogOpen, setScanDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [childrenData, printoutsData] = await Promise.all([
        fetchChildren(),
        fetchPrintouts(),
      ])
      setChildren(childrenData)
      setPrintouts(printoutsData)
    } catch (e) {
      setError(e instanceof Error ? e.message : "データの読み込みに失敗しました")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    const generateNotifications = () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const newNotifications: Notification[] = []

      printouts.forEach((printout) => {
        if (printout.status === "completed") return
        if (printout.category !== "todo" || !printout.deadline) return

        const deadline = new Date(printout.deadline)
        deadline.setHours(0, 0, 0, 0)
        const daysUntil = Math.ceil(
          (deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        )

        const child = children.find((c) => c.id === printout.childId)
        if (!child) return

        if (daysUntil <= 3 && daysUntil >= 0) {
          const dayText =
            daysUntil === 0
              ? "今日"
              : daysUntil === 1
                ? "明日"
                : `あと${daysUntil}日`

          newNotifications.push({
            id: `notif-${printout.id}`,
            printoutId: printout.id,
            message: `${child.name}: 「${printout.title}」は${dayText}まで。提出物: ${printout.submissionItem}`,
            read: false,
            createdAt: new Date().toISOString(),
          })
        }
      })

      printouts.forEach((printout) => {
        if (printout.status === "completed") return
        if (printout.category !== "event" || !printout.eventDate) return

        const eventDate = new Date(printout.eventDate)
        eventDate.setHours(0, 0, 0, 0)
        const daysUntil = Math.ceil(
          (eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        )

        const child = children.find((c) => c.id === printout.childId)
        if (!child) return

        if (daysUntil <= 3 && daysUntil >= 0) {
          const dayText =
            daysUntil === 0
              ? "今日"
              : daysUntil === 1
                ? "明日"
                : `あと${daysUntil}日`

          newNotifications.push({
            id: `notif-event-${printout.id}`,
            printoutId: printout.id,
            message: `${child.name}: 「${printout.title}」は${dayText}。${printout.parentPreparation ? `持ち物: ${printout.parentPreparation}` : ""}`,
            read: false,
            createdAt: new Date().toISOString(),
          })
        }
      })

      setNotifications(newNotifications)
    }

    if (children.length > 0) generateNotifications()
  }, [printouts, children])

  const handleToggleComplete = useCallback(async (printoutId: string) => {
    const current = printouts.find((p) => p.id === printoutId)
    if (!current) return
    const nextStatus = current.status === "completed" ? "pending" : "completed"
    try {
      const updated = await patchPrintout(printoutId, { status: nextStatus })
      setPrintouts((prev) =>
        prev.map((p) => (p.id === printoutId ? updated : p))
      )
    } catch {
      setError("ステータスの更新に失敗しました")
    }
  }, [printouts])

  const handleTogglePin = useCallback(async (printoutId: string) => {
    const current = printouts.find((p) => p.id === printoutId)
    if (!current) return
    try {
      const updated = await patchPrintout(printoutId, {
        pinned: !current.pinned,
      })
      setPrintouts((prev) =>
        prev.map((p) => (p.id === printoutId ? updated : p))
      )
    } catch {
      setError("ピン留めの更新に失敗しました")
    }
  }, [printouts])

  const handleMarkNotificationRead = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    )
  }, [])

  const handleClearAllNotifications = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [])

  const handleSavePrintout = useCallback(
    async (data: {
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
    }) => {
      try {
        const created = await createPrintout(data)
        setPrintouts((prev) => [created, ...prev])
      } catch {
        setError("プリントの保存に失敗しました")
        throw new Error("save failed")
      }
    },
    []
  )

  const pendingCounts = useMemo(() => {
    const counts: Record<string, number> = { all: 0 }
    children.forEach((child) => {
      counts[child.id] = printouts.filter(
        (p) =>
          p.childId === child.id &&
          p.status !== "completed" &&
          (p.category === "todo" || p.category === "event")
      ).length
    })
    counts.all = printouts.filter(
      (p) =>
        p.status !== "completed" &&
        (p.category === "todo" || p.category === "event")
    ).length
    return counts
  }, [printouts, children])

  const categoryCounts = useMemo(() => {
    const filterByChild = (p: Printout) =>
      activeTab === "all" || p.childId === activeTab
    return {
      all: printouts.filter(filterByChild).length,
      todo: printouts.filter(
        (p) => filterByChild(p) && p.category === "todo"
      ).length,
      event: printouts.filter(
        (p) => filterByChild(p) && p.category === "event"
      ).length,
      info: printouts.filter(
        (p) => filterByChild(p) && p.category === "info"
      ).length,
    }
  }, [printouts, activeTab])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">プリマネ</h1>
              <p className="text-sm text-muted-foreground">
                パシャッと仕分け、締切をまもる!
              </p>
            </div>
            <NotificationBell
              notifications={notifications}
              onMarkAsRead={handleMarkNotificationRead}
              onClearAll={handleClearAllNotifications}
            />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 pb-24">
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
            {error}
            <Button
              variant="link"
              className="ml-2 h-auto p-0 text-destructive"
              onClick={() => loadData()}
            >
              再読み込み
            </Button>
          </div>
        )}

        {printouts.some((p) => {
          if (p.status === "completed" || p.category !== "todo" || !p.deadline)
            return false
          const days = Math.ceil(
            (new Date(p.deadline).getTime() - Date.now()) /
              (1000 * 60 * 60 * 24)
          )
          return days <= 2
        }) && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-lg animate-pulse-urgent">
            <p className="text-base font-semibold text-destructive text-center">
              締め切りが近い提出物があります!
            </p>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full h-auto flex-wrap justify-start gap-1 bg-muted/50 p-1">
            <TabsTrigger
              value="all"
              className="flex-1 min-w-[80px] text-base py-3 data-[state=active]:bg-background"
            >
              全員
              {pendingCounts.all > 0 && (
                <span className="ml-2 inline-flex items-center justify-center min-w-[1.5rem] h-6 px-2 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  {pendingCounts.all}
                </span>
              )}
            </TabsTrigger>
            {children.map((child) => (
              <TabsTrigger
                key={child.id}
                value={child.id}
                className="flex-1 min-w-[80px] text-base py-3 data-[state=active]:bg-background"
              >
                <span
                  className={`w-2.5 h-2.5 rounded-full mr-2 ${child.color}`}
                  aria-hidden="true"
                />
                {child.name}
                {pendingCounts[child.id] > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center min-w-[1.5rem] h-6 px-2 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                    {pendingCounts[child.id]}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="flex flex-wrap gap-2 mt-4">
            <Button
              variant={categoryFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setCategoryFilter("all")}
              className="h-8 text-sm"
            >
              <LayoutGrid className="h-4 w-4 mr-1" />
              全て
              <span className="ml-1 text-xs opacity-70">
                ({categoryCounts.all})
              </span>
            </Button>
            <Button
              variant={categoryFilter === "todo" ? "default" : "outline"}
              size="sm"
              onClick={() => setCategoryFilter("todo")}
              className="h-8 text-sm"
            >
              <ClipboardList className="h-4 w-4 mr-1" />
              提出物
              <span className="ml-1 text-xs opacity-70">
                ({categoryCounts.todo})
              </span>
            </Button>
            <Button
              variant={categoryFilter === "event" ? "default" : "outline"}
              size="sm"
              onClick={() => setCategoryFilter("event")}
              className="h-8 text-sm"
            >
              <CalendarDays className="h-4 w-4 mr-1" />
              行事
              <span className="ml-1 text-xs opacity-70">
                ({categoryCounts.event})
              </span>
            </Button>
            <Button
              variant={categoryFilter === "info" ? "default" : "outline"}
              size="sm"
              onClick={() => setCategoryFilter("info")}
              className="h-8 text-sm"
            >
              <Newspaper className="h-4 w-4 mr-1" />
              お便り
              <span className="ml-1 text-xs opacity-70">
                ({categoryCounts.info})
              </span>
            </Button>
          </div>

          <div className="mt-6">
            <TabsContent value="all" className="mt-0">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-foreground">
                  プリント一覧
                </h2>
                <p className="text-sm text-muted-foreground">
                  提出物・行事・お便りを管理
                </p>
              </div>
              <PrintoutList
                printouts={printouts}
                children={children}
                onToggleComplete={handleToggleComplete}
                onTogglePin={handleTogglePin}
                filterCategory={
                  categoryFilter === "all"
                    ? undefined
                    : (categoryFilter as PrintoutCategory)
                }
              />
            </TabsContent>

            {children.map((child) => (
              <TabsContent key={child.id} value={child.id} className="mt-0">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-foreground">
                    {child.name}のプリント
                  </h2>
                  <p className="text-sm text-muted-foreground">{child.grade}</p>
                </div>
                <PrintoutList
                  printouts={printouts}
                  children={children}
                  onToggleComplete={handleToggleComplete}
                  onTogglePin={handleTogglePin}
                  filterChildId={child.id}
                  filterCategory={
                    categoryFilter === "all"
                      ? undefined
                      : (categoryFilter as PrintoutCategory)
                  }
                />
              </TabsContent>
            ))}
          </div>
        </Tabs>
      </main>

      <div className="fixed bottom-6 left-0 right-0 px-4 z-50">
        <Button
          onClick={() => setScanDialogOpen(true)}
          size="lg"
          className="w-full h-14 text-lg font-semibold shadow-lg hover:shadow-xl transition-shadow"
          disabled={children.length === 0}
        >
          <Camera className="h-6 w-6 mr-3" />
          プリントをスキャン
          <Plus className="h-5 w-5 ml-2" />
        </Button>
      </div>

      <ScanUploadDialog
        open={scanDialogOpen}
        onOpenChange={setScanDialogOpen}
        children={children}
        onSave={handleSavePrintout}
      />
    </div>
  )
}

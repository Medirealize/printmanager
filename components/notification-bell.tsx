"use client"

import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Notification } from "@/lib/types"

interface NotificationBellProps {
  notifications: Notification[]
  onMarkAsRead: (id: string) => void
  onClearAll: () => void
}

export function NotificationBell({
  notifications,
  onMarkAsRead,
  onClearAll,
}: NotificationBellProps) {
  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-12 w-12"
          aria-label={`通知${unreadCount > 0 ? `、未読${unreadCount}件` : ""}`}
        >
          <Bell className="h-6 w-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <span className="font-semibold text-base">リマインダー</span>
          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearAll}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              すべて既読
            </Button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="px-3 py-6 text-center text-muted-foreground">
              <p className="text-base">リマインダーはありません</p>
              <p className="text-sm mt-1">すべて完了しています!</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`px-3 py-3 cursor-pointer ${
                  !notification.read ? "bg-primary/5" : ""
                }`}
                onClick={() => onMarkAsRead(notification.id)}
              >
                <div className="flex flex-col gap-1 w-full">
                  <p
                    className={`text-sm leading-snug ${
                      !notification.read ? "font-medium" : ""
                    }`}
                  >
                    {notification.message}
                  </p>
                  {!notification.read && (
                    <span className="text-xs text-primary font-medium">
                      タップで既読にする
                    </span>
                  )}
                </div>
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

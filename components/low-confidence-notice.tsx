"use client"

import { AlertCircle } from "lucide-react"
import {
  LOW_CONFIDENCE_REASONS,
  LOW_CONFIDENCE_TIPS,
} from "@/lib/ai-confidence-help"

export function LowConfidenceNotice() {
  return (
    <div className="flex items-start gap-2 p-3 bg-warning/10 border border-warning/30 rounded-lg">
      <AlertCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
      <div className="text-sm space-y-2">
        <p className="font-medium">
          AIの読み取り精度が通常より低いです
        </p>
        <p className="text-muted-foreground leading-snug">
          次のような撮影条件だと、文字の認識が難しくなることがあります。
        </p>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
          {LOW_CONFIDENCE_REASONS.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
        <p className="font-medium pt-1">撮影のコツ</p>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
          {LOW_CONFIDENCE_TIPS.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}

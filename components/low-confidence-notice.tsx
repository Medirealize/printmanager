"use client"

import { AlertCircle } from "lucide-react"

interface LowConfidenceNoticeProps {
  qualityIssues?: string[]
  improvementTips?: string[]
}

export function LowConfidenceNotice({
  qualityIssues = [],
  improvementTips = [],
}: LowConfidenceNoticeProps) {
  const hasIssues = qualityIssues.length > 0
  const hasTips = improvementTips.length > 0

  return (
    <div className="flex items-start gap-2 p-3 bg-warning/10 border border-warning/30 rounded-lg">
      <AlertCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
      <div className="text-sm space-y-2">
        <p className="font-medium">AIの読み取り精度が通常より低いです</p>
        <p className="text-muted-foreground leading-snug">
          この写真について、読み取りが難しくなっている点は次のとおりです。
        </p>

        {hasIssues ? (
          <ul className="list-disc list-inside space-y-1.5 text-foreground">
            {qualityIssues.map((issue) => (
              <li key={issue} className="leading-snug">
                {issue}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground leading-snug">
            画像の状態により一部の文字を判別しづらい可能性があります。明るい場所で、プリント全体がはっきり写るよう再撮影してください。
          </p>
        )}

        {hasTips && (
          <>
            <p className="font-medium pt-1">この写真を改善するには</p>
            <ul className="list-disc list-inside space-y-1.5 text-foreground">
              {improvementTips.map((tip) => (
                <li key={tip} className="leading-snug">
                  {tip}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  )
}

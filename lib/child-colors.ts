export const CHILD_COLOR_OPTIONS = [
  { value: "bg-chart-1", label: "ブルー" },
  { value: "bg-chart-2", label: "グリーン" },
  { value: "bg-chart-3", label: "イエロー" },
  { value: "bg-chart-4", label: "オレンジ" },
  { value: "bg-chart-5", label: "パープル" },
] as const

/** プルダウン用の学年（高校3年まで + 大学生） */
export const GRADE_OPTIONS = [
  "小学1年生",
  "小学2年生",
  "小学3年生",
  "小学4年生",
  "小学5年生",
  "小学6年生",
  "中学1年生",
  "中学2年生",
  "中学3年生",
  "高校1年生",
  "高校2年生",
  "高校3年生",
  "大学生",
] as const

/** Select の「その他（自由記入）」用の内部値 */
export const GRADE_OTHER_VALUE = "__other__"
export const GRADE_OTHER_LABEL = "その他（自由記入）"

export function resolveGradeValue(
  selected: string,
  customGrade: string
): string {
  if (selected === GRADE_OTHER_VALUE) {
    return customGrade.trim()
  }
  return selected
}

export function isGradeSelectionValid(
  selected: string,
  customGrade: string
): boolean {
  if (!selected) return false
  if (selected === GRADE_OTHER_VALUE) {
    return customGrade.trim().length > 0
  }
  return true
}

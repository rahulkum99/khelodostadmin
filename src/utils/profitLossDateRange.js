/** Data source for GET /bets/admin/user-profit-loss (settlement window by settledAt). */
export const PROFIT_LOSS_LIVE = 'LIVE_DATA'
export const PROFIT_LOSS_OLD = 'OLD_DATA'
/** ~One month of history: 30 days ending yesterday (T−30 … T−1, excludes today). */
export const PROFIT_LOSS_OLD_MONTH = 'OLD_DATA_MONTH'

/**
 * LIVE: start of today → end of today (local calendar day, ISO 8601).
 * OLD: previous 7 calendar days excluding today (T−7 00:00 → T−1 23:59:59.999 local).
 * OLD_MONTH: 30 days excluding today (T−30 00:00 → T−1 23:59:59.999 local).
 */
export function getUserProfitLossDateRange(dataSource) {
  const now = new Date()
  if (dataSource === PROFIT_LOSS_OLD_MONTH) {
    const start = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 30,
      0,
      0,
      0,
      0,
    )
    const end = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 1,
      23,
      59,
      59,
      999,
    )
    return { from: start.toISOString(), to: end.toISOString() }
  }
  if (dataSource === PROFIT_LOSS_OLD) {
    const start = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 7,
      0,
      0,
      0,
      0,
    )
    const end = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 1,
      23,
      59,
      59,
      999,
    )
    return { from: start.toISOString(), to: end.toISOString() }
  }
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const end = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999,
  )
  return { from: start.toISOString(), to: end.toISOString() }
}

/** Local calendar YYYY-MM-DD from an ISO string (for date inputs). */
export function isoToDateInputValue(iso) {
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** ISO range for settlement filter: start of `fromYyyyMmDd` → end of `toYyyyMmDd` (local). */
export function dateInputRangeToIso(fromYyyyMmDd, toYyyyMmDd) {
  if (!fromYyyyMmDd || !toYyyyMmDd) {
    return { from: undefined, to: undefined }
  }
  let fromStr = fromYyyyMmDd
  let toStr = toYyyyMmDd
  if (fromStr > toStr) {
    const t = fromStr
    fromStr = toStr
    toStr = t
  }
  const [fy, fm, fd] = fromStr.split('-').map(Number)
  const [ty, tm, td] = toStr.split('-').map(Number)
  const start = new Date(fy, fm - 1, fd, 0, 0, 0, 0)
  const end = new Date(ty, tm - 1, td, 23, 59, 59, 999)
  return { from: start.toISOString(), to: end.toISOString() }
}

/** Preset Live/Old as date-input pair (matches {@link getUserProfitLossDateRange}). */
export function getPresetDateInputs(dataSource) {
  const { from, to } = getUserProfitLossDateRange(dataSource)
  return {
    fromDate: isoToDateInputValue(from),
    toDate: isoToDateInputValue(to),
  }
}

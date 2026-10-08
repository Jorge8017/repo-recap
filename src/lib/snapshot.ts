import { formatAccountAge, formatCount, formatHourLabel } from './stats'
import type { RecapStats } from '../types'

export interface SnapshotTile {
  label: string
  value: string
}

export function isDisplayableTileValue(value: string): boolean {
  const trimmed = value.trim()
  return trimmed.length > 0 && trimmed !== '—' && trimmed !== '-' && trimmed !== '0'
}

export function buildSnapshotTiles(stats: RecapStats): SnapshotTile[] {
  const tiles: SnapshotTile[] = [
    { label: 'Public for', value: formatAccountAge(stats.accountAgeYears) },
  ]

  if (stats.totalRepos > 0) {
    tiles.push({ label: 'Repos', value: formatCount(stats.totalRepos) })
  }
  if (stats.totalStars > 0) {
    tiles.push({ label: 'Stars', value: formatCount(stats.totalStars) })
  }
  if (stats.totalForks > 0) {
    tiles.push({ label: 'Forks', value: formatCount(stats.totalForks) })
  }

  const topLanguage = stats.topLanguages[0]?.name
  if (topLanguage) {
    tiles.push({ label: 'Top language', value: topLanguage })
  }

  if (stats.busiestDay) {
    tiles.push({ label: 'Peak day · 90d', value: stats.busiestDay })
  }
  if (stats.busiestHour !== null) {
    tiles.push({
      label: 'Peak hour · 90d',
      value: formatHourLabel(stats.busiestHour),
    })
  }
  if (stats.longestStreak > 0) {
    tiles.push({
      label: 'Streak · 90d',
      value: `${stats.longestStreak} ${stats.longestStreak === 1 ? 'day' : 'days'}`,
    })
  }
  if (stats.totalCommitsPushed > 0) {
    tiles.push({
      label: 'Commits · 90d',
      value: formatCount(stats.totalCommitsPushed),
    })
  }
  if (stats.mostStarredRepo && stats.mostStarredRepo.stars > 0) {
    tiles.push({ label: 'Most starred', value: stats.mostStarredRepo.name })
  }

  return tiles.filter((tile) => isDisplayableTileValue(tile.value))
}

export function shouldUseSingleStatSnapshot(tiles: SnapshotTile[]): boolean {
  return tiles.length < 2
}

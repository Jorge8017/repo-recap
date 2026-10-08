import { formatAccountAge } from '../../lib/stats'
import {
  buildSnapshotTiles,
  shouldUseSingleStatSnapshot,
} from '../../lib/snapshot'
import type { SlideProps } from '../../types'
import { Kicker, SlideShell } from './SlideShell'

export function SummarySlide({
  stats,
  personality,
  onReplay,
}: SlideProps & { onReplay: () => void }) {
  const tiles = buildSnapshotTiles(stats)
  const singleStat = shouldUseSingleStatSnapshot(tiles)
  const age = formatAccountAge(stats.accountAgeYears)

  return (
    <SlideShell
      announcement={`Summary for ${stats.displayName}: ${personality.title}. ${singleStat ? `Public for ${age}.` : tiles.map((tile) => `${tile.label} ${tile.value}`).join(', ')}`}
      gradient="bg-gradient-to-br from-[#0e1018] via-[#1a2238] to-[#2a3a5c]"
    >
      <Kicker>Snapshot</Kicker>
      <div className="rounded-3xl border border-white/15 bg-white/10 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.25)] backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <img
            src={stats.avatarUrl}
            alt=""
            className="h-12 w-12 rounded-2xl object-cover ring-2 ring-white/20"
          />
          <div>
            <p className="font-bold">{stats.displayName}</p>
            {!singleStat ? (
              <p className="text-sm text-white/70">
                {personality.emoji} {personality.title}
              </p>
            ) : (
              <p className="text-sm text-white/70">@{stats.username}</p>
            )}
          </div>
        </div>
        {singleStat ? (
          <div className="mt-6">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-white/55">
              Public for
            </p>
            <p className="mt-1 text-5xl leading-none font-bold tracking-tight">
              {age}
            </p>
            <p className="mt-4 text-lg font-semibold">
              {personality.emoji} {personality.title}
            </p>
            <p className="mt-1 text-white/70">{personality.description}</p>
          </div>
        ) : (
          <dl className="mt-5 grid grid-cols-2 gap-x-3 gap-y-4 text-sm">
            {tiles.map((tile) => (
              <div key={tile.label}>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55">
                  {tile.label}
                </dt>
                <dd className="mt-1 text-base font-semibold">{tile.value}</dd>
              </div>
            ))}
          </dl>
        )}
        <p className="mt-5 rounded-2xl bg-black/20 px-3 py-2 text-center text-xs tracking-wide text-white/65">
          Share & export lands on Night 2
        </p>
      </div>
      <button
        type="button"
        onClick={onReplay}
        className="mt-6 self-start rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
      >
        Replay recap
      </button>
    </SlideShell>
  )
}

import type { JSX } from 'react'
import { formatCount } from '../../lib/stats'
import {
  buildCompareScore,
  busiestContrastLine,
  compareMetric,
  formatHourLabel,
  sharedLanguage,
  type CompareSlideId,
} from '../../lib/compare'
import { LANGUAGE_BAR_COLORS } from '../../lib/slideMeta'
import type { RecapResult } from '../../types'
import { FittedText } from '../FittedText'
import { PersonalityIcon } from '../PersonalityIcon'
import { CompareHalf, CompareSplit } from './CompareHalf'

export interface CompareSlideProps {
  a: RecapResult
  b: RecapResult
  avatarA: string
  avatarB: string
  slideCount: number
  onReplay: () => void
  onSwap: () => void
  onDownload: () => void
  onCopyLink: () => void
  downloading?: boolean
  toast?: string | null
}

function displayContributions(result: RecapResult): string {
  if (result.stats.isEmptyProfile) return 'Private'
  return formatCount(result.stats.totalContributions)
}

function displayStreak(result: RecapResult): string {
  if (result.stats.isEmptyProfile) return 'Private'
  const n = result.stats.longestStreak
  return `${formatCount(n)} ${n === 1 ? 'day' : 'days'}`
}

function displayStars(result: RecapResult): string {
  if (result.stats.isEmptyProfile) return 'Private'
  return formatCount(result.stats.totalStars)
}

function AvatarRow({
  src,
  name,
  username,
}: {
  src: string
  name: string
  username: string
}) {
  return (
    <div className="flex items-center gap-3">
      <img
        src={src}
        alt=""
        width={56}
        height={56}
        className="h-14 w-14 rounded-[16px] object-cover bg-[#5B3A6E]"
      />
      <div className="min-w-0">
        <p className="truncate text-lg font-bold leading-tight">{name}</p>
        <p className="truncate text-sm text-[#CDB9DC]">@{username}</p>
      </div>
    </div>
  )
}

function LanguageBars({ result }: { result: RecapResult }) {
  const languages = result.stats.topLanguages.slice(0, 3)
  if (languages.length === 0) {
    return <p className="text-sm text-[#C9BFD6]">No languages detected</p>
  }
  const used = languages.reduce((sum, lang) => sum + lang.percentage, 0)
  const rest = Math.max(0, 100 - used)
  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-3 overflow-hidden rounded-full">
        {languages.map((lang, index) => (
          <div
            key={lang.name}
            style={{
              width: `${lang.percentage}%`,
              background: LANGUAGE_BAR_COLORS[index % LANGUAGE_BAR_COLORS.length],
            }}
          />
        ))}
        {rest > 0 ? (
          <div style={{ width: `${rest}%`, background: 'rgba(255,255,255,0.18)' }} />
        ) : null}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-[#D7C7E6]">
        {languages.map((lang) => (
          <span key={lang.name}>
            {lang.name} {lang.percentage}%
          </span>
        ))}
      </div>
    </div>
  )
}

export function CompareIntroSlide({
  a,
  b,
  avatarA,
  avatarB,
}: CompareSlideProps) {
  return (
    <section
      className="flex h-full min-h-0 flex-col justify-center gap-8 px-5 pb-6 pt-[var(--story-chrome,5.75rem)]"
      aria-label={`Compare @${a.stats.username} versus @${b.stats.username}`}
      data-testid="compare-intro"
    >
      <CompareSplit>
        <CompareHalf side="a">
          <AvatarRow
            src={avatarA}
            name={a.stats.displayName}
            username={a.stats.username}
          />
        </CompareHalf>
        <CompareHalf side="b">
          <AvatarRow
            src={avatarB}
            name={b.stats.displayName}
            username={b.stats.username}
          />
        </CompareHalf>
      </CompareSplit>
      <p
        data-testid="compare-hero"
        className="text-center font-mono text-sm tracking-[0.14em] text-[#F2C46D] uppercase"
      >
        @{a.stats.username} vs @{b.stats.username}
      </p>
    </section>
  )
}

function StatCompareSlide({
  a,
  b,
  label,
  aDisplay,
  bDisplay,
  aValue,
  bValue,
  testId,
}: {
  a: RecapResult
  b: RecapResult
  label: string
  aDisplay: string
  bDisplay: string
  aValue: number
  bValue: number
  testId: string
}) {
  const winner = compareMetric(aValue, bValue)
  return (
    <section
      className="flex h-full min-h-0 flex-col px-5 pb-6 pt-[var(--story-chrome,5.75rem)]"
      aria-label={`${label}: @${a.stats.username} versus @${b.stats.username}`}
      data-testid={testId}
    >
      <p className="mb-4 font-mono text-[11px] tracking-[0.16em] text-[#FFC9A8] uppercase">
        {label}
      </p>
      <CompareSplit>
        <CompareHalf side="a" winner={winner} showWinnerChip>
          <p className="text-sm text-[#CDB9DC]">@{a.stats.username}</p>
          <FittedText
            text={aDisplay}
            maxSize={56}
            minSize={28}
            testId={`${testId}-hero-a`}
            className="mt-2 font-bold tracking-[-0.03em]"
          />
        </CompareHalf>
        <CompareHalf side="b" winner={winner} showWinnerChip>
          <p className="text-sm text-[#CDB9DC]">@{b.stats.username}</p>
          <FittedText
            text={bDisplay}
            maxSize={56}
            minSize={28}
            testId={`${testId}-hero-b`}
            className="mt-2 font-bold tracking-[-0.03em]"
          />
        </CompareHalf>
      </CompareSplit>
    </section>
  )
}

export function CompareContributionsSlide(props: CompareSlideProps) {
  return (
    <StatCompareSlide
      a={props.a}
      b={props.b}
      label="Last 12 months"
      aDisplay={displayContributions(props.a)}
      bDisplay={displayContributions(props.b)}
      aValue={props.a.stats.totalContributions}
      bValue={props.b.stats.totalContributions}
      testId="compare-contributions"
    />
  )
}

export function CompareStreakSlide(props: CompareSlideProps) {
  return (
    <StatCompareSlide
      a={props.a}
      b={props.b}
      label="Longest streak"
      aDisplay={displayStreak(props.a)}
      bDisplay={displayStreak(props.b)}
      aValue={props.a.stats.longestStreak}
      bValue={props.b.stats.longestStreak}
      testId="compare-streak"
    />
  )
}

export function CompareStarsSlide(props: CompareSlideProps) {
  return (
    <StatCompareSlide
      a={props.a}
      b={props.b}
      label="Stars received"
      aDisplay={displayStars(props.a)}
      bDisplay={displayStars(props.b)}
      aValue={props.a.stats.totalStars}
      bValue={props.b.stats.totalStars}
      testId="compare-stars"
    />
  )
}

export function CompareLanguagesSlide({ a, b }: CompareSlideProps) {
  const shared = sharedLanguage(a.stats, b.stats)
  return (
    <section
      className="flex h-full min-h-0 flex-col px-5 pb-6 pt-[var(--story-chrome,5.75rem)]"
      data-testid="compare-languages"
      aria-label="Top languages comparison"
    >
      <p className="mb-4 font-mono text-[11px] tracking-[0.16em] text-[#FFC9A8] uppercase">
        Top languages
      </p>
      <CompareSplit>
        <CompareHalf side="a">
          <p className="mb-3 text-sm text-[#CDB9DC]">@{a.stats.username}</p>
          <LanguageBars result={a} />
        </CompareHalf>
        <CompareHalf side="b">
          <p className="mb-3 text-sm text-[#CDB9DC]">@{b.stats.username}</p>
          <LanguageBars result={b} />
        </CompareHalf>
      </CompareSplit>
      {shared ? (
        <p
          data-testid="compare-hero"
          className="mt-6 text-center text-base text-[#F2C46D]"
        >
          You both write {shared}
        </p>
      ) : (
        <p data-testid="compare-hero" className="mt-6 text-center text-base text-[#C9BFD6]">
          Different stacks
        </p>
      )}
    </section>
  )
}

export function CompareBusiestSlide({ a, b }: CompareSlideProps) {
  const line = busiestContrastLine(a.stats, b.stats)
  return (
    <section
      className="flex h-full min-h-0 flex-col px-5 pb-6 pt-[var(--story-chrome,5.75rem)]"
      data-testid="compare-busiest"
      aria-label="Peak time comparison"
    >
      <p className="mb-4 font-mono text-[11px] tracking-[0.16em] text-[#FFC9A8] uppercase">
        Peak time
      </p>
      <CompareSplit>
        <CompareHalf side="a">
          <p className="text-sm text-[#CDB9DC]">@{a.stats.username}</p>
          <FittedText
            text={a.stats.busiestDay ?? '—'}
            maxSize={48}
            minSize={24}
            testId="compare-busiest-hero-a"
            className="mt-2 font-bold"
          />
          <p className="mt-2 text-[#D7C7E6]">
            {formatHourLabel(a.stats.busiestHour)}
          </p>
        </CompareHalf>
        <CompareHalf side="b">
          <p className="text-sm text-[#CDB9DC]">@{b.stats.username}</p>
          <FittedText
            text={b.stats.busiestDay ?? '—'}
            maxSize={48}
            minSize={24}
            testId="compare-busiest-hero-b"
            className="mt-2 font-bold"
          />
          <p className="mt-2 text-[#D7C7E6]">
            {formatHourLabel(b.stats.busiestHour)}
          </p>
        </CompareHalf>
      </CompareSplit>
      <p data-testid="compare-hero" className="mt-6 text-center text-base text-[#F2C46D]">
        {line}
      </p>
    </section>
  )
}

export function ComparePersonalitiesSlide({ a, b }: CompareSlideProps) {
  return (
    <section
      className="flex h-full min-h-0 flex-col px-5 pb-6 pt-[var(--story-chrome,5.75rem)]"
      data-testid="compare-personalities"
      aria-label="Personalities side by side"
    >
      <CompareSplit>
        <CompareHalf side="a">
          <PersonalityIcon id={a.personality.id} size={56} />
          <FittedText
            text={a.personality.title}
            maxSize={44}
            minSize={22}
            testId="compare-personality-hero-a"
            className="mt-3 font-bold tracking-[-0.03em]"
          />
          <p className="mt-2 text-sm leading-snug text-[#D7C7E6]">
            {a.personality.description}
          </p>
        </CompareHalf>
        <CompareHalf side="b">
          <PersonalityIcon id={b.personality.id} size={56} />
          <FittedText
            text={b.personality.title}
            maxSize={44}
            minSize={22}
            testId="compare-personality-hero-b"
            className="mt-3 font-bold tracking-[-0.03em]"
          />
          <p className="mt-2 text-sm leading-snug text-[#D7C7E6]">
            {b.personality.description}
          </p>
        </CompareHalf>
      </CompareSplit>
      <p data-testid="compare-hero" className="sr-only">
        {a.personality.title} vs {b.personality.title}
      </p>
    </section>
  )
}

export function CompareScoreSlide({
  a,
  b,
  onReplay,
  onSwap,
  onDownload,
  onCopyLink,
  downloading,
  toast,
}: CompareSlideProps) {
  const score = buildCompareScore(a.stats, b.stats)
  return (
    <section
      className="relative flex h-full min-h-0 flex-col overflow-hidden px-5 pb-6 pt-[var(--story-chrome,5.75rem)]"
      data-testid="compare-score"
      aria-label={score.headline}
    >
      <FittedText
        text={score.headline}
        maxSize={42}
        minSize={22}
        testId="compare-hero"
        className="font-bold tracking-[-0.03em]"
      />
      <ul className="mt-6 space-y-2 text-sm text-[#D7C7E6]">
        {score.rounds.map((round) => (
          <li key={round.id} className="flex justify-between gap-3 border-b border-white/10 py-2">
            <span>{round.label}</span>
            <span className="text-[#F4EDE2]">
              {round.aDisplay} · {round.bDisplay}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-auto flex flex-col gap-2.5 pt-6">
        <button
          type="button"
          className="inline-flex h-12 items-center justify-center rounded-[14px] bg-[#F4EDE2] px-4 font-semibold text-[#1A0B22]"
          onClick={() => void onDownload()}
          disabled={downloading}
        >
          {downloading ? 'Preparing…' : 'Download comparison image'}
        </button>
        <button
          type="button"
          className="inline-flex h-12 items-center justify-center rounded-[14px] border border-white/20 bg-white/5 px-4 font-semibold"
          onClick={() => void onCopyLink()}
        >
          Copy link
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            className="inline-flex h-11 flex-1 items-center justify-center rounded-[14px] border border-white/15 px-3 text-sm"
            onClick={onSwap}
          >
            Swap sides
          </button>
          <button
            type="button"
            className="inline-flex h-11 flex-1 items-center justify-center rounded-[14px] border border-white/15 px-3 text-sm"
            onClick={onReplay}
          >
            Replay
          </button>
        </div>
        <a
          href="/"
          className="inline-flex h-11 items-center justify-center text-sm text-[#C9BFD6] underline-offset-2 hover:underline"
        >
          Try other names
        </a>
      </div>
      {toast ? (
        <p
          role="status"
          className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/55 px-4 py-2 text-sm text-white"
        >
          {toast}
        </p>
      ) : null}
    </section>
  )
}

export const COMPARE_SLIDE_COMPONENTS: Record<
  Exclude<CompareSlideId, 'compare-score'>,
  (props: CompareSlideProps) => JSX.Element
> = {
  'compare-intro': CompareIntroSlide,
  'compare-contributions': CompareContributionsSlide,
  'compare-streak': CompareStreakSlide,
  'compare-stars': CompareStarsSlide,
  'compare-languages': CompareLanguagesSlide,
  'compare-busiest': CompareBusiestSlide,
  'compare-personalities': ComparePersonalitiesSlide,
}

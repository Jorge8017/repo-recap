import type { JSX, ReactNode } from 'react'
import { formatCount } from '../../lib/stats'
import {
  buildCompareScore,
  busiestContrastLine,
  COMPARE_COLOR_A,
  COMPARE_COLOR_B,
  compareMetric,
  contributionsVerdict,
  formatHourLabel,
  hasPeakTimeData,
  isMetricPrivate,
  languagesVerdict,
  proportionShares,
  starsVerdict,
  streakVerdict,
  type CompareSlideId,
  type CompareSide,
  type VerdictPart,
} from '../../lib/compare'
import { languageBarColor } from '../../lib/slideMeta'
import type { RecapResult } from '../../types'
import { FittedText } from '../FittedText'
import { PersonalityIcon } from '../PersonalityIcon'
import {
  HandleWithChip,
  PlayerAvatar,
  ProportionBar,
  VerdictLine,
  VsBadge,
  VsDivider,
  playerColor,
  sideOpacity,
} from './CompareHalf'

export interface CompareSlideProps {
  a: RecapResult
  b: RecapResult
  avatarA: string
  avatarB: string
  slideCount: number
  qualifier?: string | null
  onReplay: () => void
  onSwap: () => void
  onDownload: () => void
  onCopyLink: () => void
  downloading?: boolean
  toast?: string | null
}

function displayContributions(result: RecapResult): string {
  if (isMetricPrivate(result.stats, 'contributions')) return 'Private'
  return formatCount(result.stats.totalContributions)
}

function displayStreak(result: RecapResult): string {
  if (isMetricPrivate(result.stats, 'streak')) return 'Private'
  const n = result.stats.longestStreak
  return `${formatCount(n)} ${n === 1 ? 'day' : 'days'}`
}

function displayStars(result: RecapResult): string {
  if (isMetricPrivate(result.stats, 'stars')) return 'Private'
  return formatCount(result.stats.totalStars)
}

function SlideShell({
  testId,
  label,
  qualifier,
  children,
}: {
  testId: string
  label: string
  qualifier?: string | null
  children: ReactNode
}) {
  return (
    <section
      className="flex h-full min-h-0 flex-col justify-center gap-5 overflow-hidden px-5 pb-5 pt-[var(--story-chrome,5.75rem)] lg:px-8"
      aria-label={label}
      data-testid={testId}
    >
      {qualifier ? (
        <p
          data-testid="compare-qualifier"
          className="shrink-0 text-center text-xs text-[#8F84A0] lg:hidden"
        >
          {qualifier}
        </p>
      ) : null}
      {children}
    </section>
  )
}

function LanguageBars({ result }: { result: RecapResult }) {
  const languages = result.stats.topLanguages.slice(0, 3)
  if (languages.length === 0) {
    return (
      <p className="text-[15px] text-[#8F84A0]">No public languages yet</p>
    )
  }
  const used = languages.reduce((sum, lang) => sum + lang.percentage, 0)
  const rest = Math.max(0, 100 - used)
  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex h-3.5 gap-[3px] overflow-hidden rounded-full">
        {languages.map((lang) => (
          <div
            key={lang.name}
            className="h-full rounded-full"
            style={{
              width: `${lang.percentage}%`,
              background: languageBarColor(lang.name),
            }}
          />
        ))}
        {rest > 0 ? (
          <div
            className="h-full rounded-full"
            style={{ width: `${rest}%`, background: 'rgba(255,255,255,0.18)' }}
          />
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
  qualifier,
}: CompareSlideProps) {
  return (
    <SlideShell
      testId="compare-intro"
      label={`Compare @${a.stats.username} versus @${b.stats.username}`}
      qualifier={qualifier}
    >
      <div className="flex w-full flex-col items-center gap-6 min-[600px]:grid min-[600px]:grid-cols-[1fr_72px_1fr] min-[600px]:items-center">
        <div className="flex flex-col items-center gap-3 min-[600px]:items-start">
          <PlayerAvatar src={avatarA} side="a" size={72} />
          <div className="min-w-0 text-center min-[600px]:text-left">
            <p className="truncate text-xl font-bold">{a.stats.displayName}</p>
            <p className="truncate text-sm" style={{ color: COMPARE_COLOR_A }}>
              @{a.stats.username}
            </p>
          </div>
        </div>
        <div className="hidden min-[600px]:flex min-[600px]:justify-center">
          <VsBadge />
        </div>
        <VsDivider />
        <div className="flex flex-col items-center gap-3 min-[600px]:items-end">
          <PlayerAvatar src={avatarB} side="b" size={72} />
          <div className="min-w-0 text-center min-[600px]:text-right">
            <p className="truncate text-xl font-bold">{b.stats.displayName}</p>
            <p className="truncate text-sm" style={{ color: COMPARE_COLOR_B }}>
              @{b.stats.username}
            </p>
          </div>
        </div>
      </div>
      <p data-testid="compare-hero" className="sr-only">
        @{a.stats.username} vs @{b.stats.username}
      </p>
    </SlideShell>
  )
}

function StatDuel({
  a,
  b,
  avatarA,
  avatarB,
  aDisplay,
  bDisplay,
  aValue,
  bValue,
  comparable,
  winner,
  verdict,
  testId,
}: {
  a: RecapResult
  b: RecapResult
  avatarA: string
  avatarB: string
  aDisplay: string
  bDisplay: string
  aValue: number
  bValue: number
  comparable: boolean
  winner: CompareSide
  verdict: VerdictPart[]
  testId: string
}) {
  const shares = comparable ? proportionShares(aValue, bValue) : null
  const aOpacity = sideOpacity('a', winner, comparable)
  const bOpacity = sideOpacity('b', winner, comparable)

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <div className="flex w-full flex-col gap-5 min-[600px]:grid min-[600px]:grid-cols-[1fr_72px_1fr] min-[600px]:items-center min-[600px]:gap-3">
        <div className="flex min-w-0 flex-col items-center gap-2 min-[600px]:items-start">
          <div className="flex items-center gap-2.5">
            <PlayerAvatar src={avatarA} side="a" />
            <HandleWithChip
              username={a.stats.username}
              side="a"
              winner={winner}
              comparable={comparable}
              align="start"
            />
          </div>
          <FittedText
            text={aDisplay}
            maxSize={96}
            minSize={48}
            testId={`${testId}-hero-a`}
            className="font-bold tracking-[-0.04em] min-[600px]:text-left"
            style={{ color: COMPARE_COLOR_A, opacity: aOpacity }}
          />
        </div>

        <div className="hidden min-[600px]:flex min-[600px]:justify-center">
          <VsBadge />
        </div>
        <VsDivider />

        <div className="flex min-w-0 flex-col items-center gap-2 min-[600px]:items-end">
          <div className="flex flex-row-reverse items-center gap-2.5 min-[600px]:flex-row">
            <HandleWithChip
              username={b.stats.username}
              side="b"
              winner={winner}
              comparable={comparable}
              align="end"
            />
            <PlayerAvatar src={avatarB} side="b" />
          </div>
          <FittedText
            text={bDisplay}
            maxSize={96}
            minSize={48}
            testId={`${testId}-hero-b`}
            className="font-bold tracking-[-0.04em] min-[600px]:text-right"
            style={{ color: COMPARE_COLOR_B, opacity: bOpacity }}
          />
        </div>
      </div>

      {shares ? (
        <ProportionBar aPercent={shares.aPercent} bPercent={shares.bPercent} />
      ) : null}

      <VerdictLine parts={verdict} />
    </div>
  )
}

function StatCompareSlide({
  a,
  b,
  avatarA,
  avatarB,
  aDisplay,
  bDisplay,
  aValue,
  bValue,
  roundId,
  verdict,
  testId,
  label,
  qualifier,
}: {
  a: RecapResult
  b: RecapResult
  avatarA: string
  avatarB: string
  aDisplay: string
  bDisplay: string
  aValue: number
  bValue: number
  roundId: 'contributions' | 'streak' | 'stars'
  verdict: VerdictPart[]
  testId: string
  label: string
  qualifier?: string | null
}) {
  const aPrivate = isMetricPrivate(a.stats, roundId)
  const bPrivate = isMetricPrivate(b.stats, roundId)
  const comparable = !aPrivate && !bPrivate
  const winner = comparable ? compareMetric(aValue, bValue) : 'tie'

  return (
    <SlideShell testId={testId} label={label} qualifier={qualifier}>
      <StatDuel
        a={a}
        b={b}
        avatarA={avatarA}
        avatarB={avatarB}
        aDisplay={aDisplay}
        bDisplay={bDisplay}
        aValue={aValue}
        bValue={bValue}
        comparable={comparable}
        winner={winner}
        verdict={verdict}
        testId={testId}
      />
    </SlideShell>
  )
}

export function CompareContributionsSlide(props: CompareSlideProps) {
  return (
    <StatCompareSlide
      a={props.a}
      b={props.b}
      avatarA={props.avatarA}
      avatarB={props.avatarB}
      aDisplay={displayContributions(props.a)}
      bDisplay={displayContributions(props.b)}
      aValue={props.a.stats.totalContributions}
      bValue={props.b.stats.totalContributions}
      roundId="contributions"
      verdict={contributionsVerdict(props.a.stats, props.b.stats)}
      testId="compare-contributions"
      label={`Contributions: @${props.a.stats.username} versus @${props.b.stats.username}`}
      qualifier={props.qualifier}
    />
  )
}

export function CompareStreakSlide(props: CompareSlideProps) {
  return (
    <StatCompareSlide
      a={props.a}
      b={props.b}
      avatarA={props.avatarA}
      avatarB={props.avatarB}
      aDisplay={displayStreak(props.a)}
      bDisplay={displayStreak(props.b)}
      aValue={props.a.stats.longestStreak}
      bValue={props.b.stats.longestStreak}
      roundId="streak"
      verdict={streakVerdict(props.a.stats, props.b.stats)}
      testId="compare-streak"
      label={`Streak: @${props.a.stats.username} versus @${props.b.stats.username}`}
      qualifier={props.qualifier}
    />
  )
}

export function CompareStarsSlide(props: CompareSlideProps) {
  return (
    <StatCompareSlide
      a={props.a}
      b={props.b}
      avatarA={props.avatarA}
      avatarB={props.avatarB}
      aDisplay={displayStars(props.a)}
      bDisplay={displayStars(props.b)}
      aValue={props.a.stats.totalStars}
      bValue={props.b.stats.totalStars}
      roundId="stars"
      verdict={starsVerdict(props.a.stats, props.b.stats)}
      testId="compare-stars"
      label={`Stars: @${props.a.stats.username} versus @${props.b.stats.username}`}
      qualifier={props.qualifier}
    />
  )
}

export function CompareLanguagesSlide({
  a,
  b,
  avatarA,
  avatarB,
  qualifier,
}: CompareSlideProps) {
  const verdict = languagesVerdict(a.stats, b.stats)
  return (
    <SlideShell
      testId="compare-languages"
      label="Top languages comparison"
      qualifier={qualifier}
    >
      <div className="flex w-full flex-col items-center gap-6">
        <div className="flex w-full flex-col gap-5 min-[600px]:grid min-[600px]:grid-cols-[1fr_72px_1fr] min-[600px]:items-center">
          <div className="flex min-w-0 flex-col items-center gap-3 min-[600px]:items-start">
            <div className="flex items-center gap-2.5">
              <PlayerAvatar src={avatarA} side="a" />
              <p className="text-sm" style={{ color: COMPARE_COLOR_A }}>
                @{a.stats.username}
              </p>
            </div>
            <LanguageBars result={a} />
          </div>
          <div className="hidden min-[600px]:flex min-[600px]:justify-center">
            <VsBadge />
          </div>
          <VsDivider />
          <div className="flex min-w-0 flex-col items-center gap-3 min-[600px]:items-end">
            <div className="flex flex-row-reverse items-center gap-2.5 min-[600px]:flex-row">
              <p className="text-sm" style={{ color: COMPARE_COLOR_B }}>
                @{b.stats.username}
              </p>
              <PlayerAvatar src={avatarB} side="b" />
            </div>
            <LanguageBars result={b} />
          </div>
        </div>
        <p data-testid="compare-hero" className="text-center text-[22px] text-[#F4EDE2]">
          {verdict}
        </p>
      </div>
    </SlideShell>
  )
}

function PeakSide({
  result,
  avatar,
  side,
}: {
  result: RecapResult
  avatar: string
  side: 'a' | 'b'
}) {
  const hasData = hasPeakTimeData(result.stats)
  const align =
    side === 'a'
      ? 'items-center min-[600px]:items-start'
      : 'items-center min-[600px]:items-end'
  const textAlign =
    side === 'a' ? 'text-center min-[600px]:text-left' : 'text-center min-[600px]:text-right'

  return (
    <div className={`flex min-w-0 flex-col gap-3 ${align}`}>
      <div
        className={`flex items-center gap-2.5 ${
          side === 'b' ? 'flex-row-reverse min-[600px]:flex-row' : ''
        }`}
      >
        {side === 'b' ? (
          <p className="text-sm" style={{ color: playerColor(side) }}>
            @{result.stats.username}
          </p>
        ) : null}
        <PlayerAvatar src={avatar} side={side} />
        {side === 'a' ? (
          <p className="text-sm" style={{ color: playerColor(side) }}>
            @{result.stats.username}
          </p>
        ) : null}
      </div>
      {hasData ? (
        <div className={textAlign}>
          <FittedText
            text={result.stats.busiestDay ?? formatHourLabel(result.stats.busiestHour)}
            maxSize={48}
            minSize={28}
            testId={`compare-busiest-hero-${side}`}
            className="font-bold"
            style={{ color: playerColor(side) }}
          />
          {result.stats.busiestDay && result.stats.busiestHour !== null ? (
            <p className="mt-2 text-[#D7C7E6]">
              {formatHourLabel(result.stats.busiestHour)}
            </p>
          ) : null}
        </div>
      ) : (
        <p
          data-testid={`compare-busiest-hero-${side}`}
          className={`text-[22px] text-[#8F84A0] ${textAlign}`}
        >
          Keeps their hours private
        </p>
      )}
    </div>
  )
}

export function CompareBusiestSlide({
  a,
  b,
  avatarA,
  avatarB,
  qualifier,
}: CompareSlideProps) {
  const line = busiestContrastLine(a.stats, b.stats)
  return (
    <SlideShell
      testId="compare-busiest"
      label="Peak time comparison"
      qualifier={qualifier}
    >
      <div className="flex w-full flex-col items-center gap-6">
        <div className="flex w-full flex-col gap-5 min-[600px]:grid min-[600px]:grid-cols-[1fr_72px_1fr] min-[600px]:items-center">
          <PeakSide result={a} avatar={avatarA} side="a" />
          <div className="hidden min-[600px]:flex min-[600px]:justify-center">
            <VsBadge />
          </div>
          <VsDivider />
          <PeakSide result={b} avatar={avatarB} side="b" />
        </div>
        <p data-testid="compare-hero" className="text-center text-[22px] text-[#F4EDE2]">
          {line}
        </p>
      </div>
    </SlideShell>
  )
}

export function ComparePersonalitiesSlide({
  a,
  b,
  qualifier,
}: CompareSlideProps) {
  return (
    <SlideShell
      testId="compare-personalities"
      label="Personalities side by side"
      qualifier={qualifier}
    >
      <div className="mx-auto flex w-full max-w-[640px] flex-col items-center gap-5">
        <div className="flex w-full flex-col items-center gap-3 text-center">
          <PersonalityIcon id={a.personality.id} size={48} color={COMPARE_COLOR_A} />
          <FittedText
            text={a.personality.title}
            maxSize={40}
            minSize={22}
            testId="compare-personality-hero-a"
            className="font-bold tracking-[-0.03em]"
            style={{ color: COMPARE_COLOR_A }}
          />
          <p className="max-w-[28rem] text-sm leading-snug text-[#D7C7E6]">
            {a.personality.description}
          </p>
        </div>
        <VsDivider />
        <div className="hidden w-full items-center justify-center min-[600px]:flex">
          <VsBadge size={56} />
        </div>
        <div className="flex w-full flex-col items-center gap-3 text-center">
          <PersonalityIcon id={b.personality.id} size={48} color={COMPARE_COLOR_B} />
          <FittedText
            text={b.personality.title}
            maxSize={40}
            minSize={22}
            testId="compare-personality-hero-b"
            className="font-bold tracking-[-0.03em]"
            style={{ color: COMPARE_COLOR_B }}
          />
          <p className="max-w-[28rem] text-sm leading-snug text-[#D7C7E6]">
            {b.personality.description}
          </p>
        </div>
      </div>
      <p data-testid="compare-hero" className="sr-only">
        {a.personality.title} vs {b.personality.title}
      </p>
    </SlideShell>
  )
}

export function CompareScoreSlide({
  a,
  b,
  avatarA,
  avatarB,
  onSwap,
  onDownload,
  onCopyLink,
  downloading,
  toast,
}: CompareSlideProps) {
  const score = buildCompareScore(a.stats, b.stats)
  const aDim = score.enoughData && score.winner === 'b'
  const bDim = score.enoughData && score.winner === 'a'

  return (
    <section
      className="relative flex h-full min-h-0 flex-col overflow-hidden px-5 pb-4 pt-[calc(var(--story-chrome,5.75rem)+16px)] lg:px-8"
      data-testid="compare-score"
      aria-label={score.headline}
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex shrink-0 items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <PlayerAvatar src={avatarA} side="a" size={56} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold lg:text-base">
                {a.stats.displayName}
              </p>
              <p className="truncate text-xs lg:text-sm" style={{ color: COMPARE_COLOR_A }}>
                @{a.stats.username}
              </p>
            </div>
          </div>

          {score.enoughData ? (
            <p
              data-testid="compare-score-digits"
              className="shrink-0 font-bold tracking-[-0.05em] text-[56px] leading-none lg:text-[72px]"
            >
              <span style={{ color: COMPARE_COLOR_A, opacity: aDim ? 0.72 : 1 }}>
                {score.aWins}
              </span>
              <span className="mx-1.5 text-[#8F84A0] lg:mx-2">–</span>
              <span style={{ color: COMPARE_COLOR_B, opacity: bDim ? 0.72 : 1 }}>
                {score.bWins}
              </span>
            </p>
          ) : (
            <span data-testid="compare-score-digits" className="w-8 shrink-0" />
          )}

          <div className="flex min-w-0 flex-1 flex-row-reverse items-center gap-2.5">
            <PlayerAvatar src={avatarB} side="b" size={56} />
            <div className="min-w-0 text-right">
              <p className="truncate text-sm font-semibold lg:text-base">
                {b.stats.displayName}
              </p>
              <p className="truncate text-xs lg:text-sm" style={{ color: COMPARE_COLOR_B }}>
                @{b.stats.username}
              </p>
            </div>
          </div>
        </div>

        <p
          data-testid="compare-hero"
          className="mt-3 shrink-0 text-center text-[18px] leading-snug text-[#F4EDE2] lg:text-[22px] [@media(max-height:740px)]:hidden [@container(max-height:520px)]:hidden"
        >
          {score.headline}
        </p>

        <ul className="mt-3 shrink-0">
          {score.rounds.map((round) => {
            const muted = !round.comparable
            const aWin = round.comparable && round.winner === 'a'
            const bWin = round.comparable && round.winner === 'b'
            return (
              <li
                key={round.id}
                className="grid h-11 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 border-b border-white/8 text-sm"
              >
                <span
                  className="min-w-0 truncate"
                  style={{
                    color: muted
                      ? '#8F84A0'
                      : aWin
                        ? COMPARE_COLOR_A
                        : round.winner === 'b'
                          ? 'rgba(242,196,109,0.72)'
                          : '#F4EDE2',
                    fontWeight: aWin ? 700 : 400,
                    opacity: muted || aWin || round.winner === 'tie' ? 1 : 0.72,
                  }}
                >
                  {round.aDisplay}
                </span>
                <span className="flex min-w-0 flex-col items-center px-1 text-center">
                  <span className="font-mono text-[11px] tracking-[0.12em] text-[#8F84A0] uppercase">
                    {round.label}
                  </span>
                  {muted ? (
                    <span className="font-mono text-[10px] tracking-[0.08em] text-[#8F84A0]">
                      · not comparable
                    </span>
                  ) : null}
                </span>
                <span
                  className="min-w-0 truncate text-right"
                  style={{
                    color: muted
                      ? '#8F84A0'
                      : bWin
                        ? COMPARE_COLOR_B
                        : round.winner === 'a'
                          ? 'rgba(111,211,184,0.72)'
                          : '#F4EDE2',
                    fontWeight: bWin ? 700 : 400,
                    opacity: muted || bWin || round.winner === 'tie' ? 1 : 0.72,
                  }}
                >
                  {round.bDisplay}
                </span>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="mt-3 flex shrink-0 flex-col gap-2">
        <button
          type="button"
          data-testid="compare-download"
          className="inline-flex h-11 items-center justify-center rounded-[14px] bg-[#F4EDE2] px-4 font-semibold text-[#1A0B22]"
          onClick={() => void onDownload()}
          disabled={downloading}
        >
          {downloading ? 'Preparing…' : 'Download image'}
        </button>
        <button
          type="button"
          data-testid="compare-copy-link"
          className="inline-flex h-11 items-center justify-center rounded-[14px] border border-white/20 bg-white/5 px-4 font-semibold"
          onClick={() => void onCopyLink()}
        >
          Copy link
        </button>
        <div className="flex items-center justify-center gap-5 pt-0.5 text-sm text-[#C9BFD6]">
          <button
            type="button"
            className="underline-offset-2 hover:text-[#F4EDE2] hover:underline"
            onClick={onSwap}
          >
            Swap
          </button>
          <a
            href="/"
            className="underline-offset-2 hover:text-[#F4EDE2] hover:underline"
          >
            New match
          </a>
        </div>
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

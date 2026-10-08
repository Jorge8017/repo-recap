import type { ComponentType } from 'react'
import type { SlideId, SlideProps } from '../../types'
import { AgeSlide } from './AgeSlide'
import { BusiestSlide } from './BusiestSlide'
import { IntroSlide } from './IntroSlide'
import { LanguagesSlide } from './LanguagesSlide'
import { PersonalitySlide } from './PersonalitySlide'
import { QuietSlide } from './QuietSlide'
import { StarredSlide } from './StarredSlide'
import { StreakSlide } from './StreakSlide'
import { TotalsSlide } from './TotalsSlide'

export const SLIDE_COMPONENTS: Record<
  Exclude<SlideId, 'summary'>,
  ComponentType<SlideProps>
> = {
  intro: IntroSlide,
  age: AgeSlide,
  quiet: QuietSlide,
  totals: TotalsSlide,
  languages: LanguagesSlide,
  busiest: BusiestSlide,
  streak: StreakSlide,
  starred: StarredSlide,
  personality: PersonalitySlide,
}

export { SummarySlide } from './SummarySlide'

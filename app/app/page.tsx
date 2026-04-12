import { LandingHero } from '@/components/landing/LandingHero'
import { LandingContent } from '@/components/landing/LandingContent'
import { PageFade } from '@/components/landing/PageFade'

export default function Home() {
  return (
    <PageFade>
      <LandingHero />
      <LandingContent />
    </PageFade>
  )
}

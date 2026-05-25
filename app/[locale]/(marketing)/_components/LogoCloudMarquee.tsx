import { useTranslations } from 'next-intl';

/**
 * Adult-industry brand wordmarks rendered as typography (no logo
 * images so we sidestep trademark / hotlink concerns and keep the
 * marquee snappy). Each entry mimics the brand's actual styling
 * within plain CSS — Pornhub's signature orange block, Brazzers' bold
 * tracking, CzechCasting's serif look, OnlyFans' two-tone wordmark.
 */
const logos = [
  {
    name: 'Pornhub',
    component: (
      <span className="inline-flex items-baseline gap-1 font-sans text-3xl font-black tracking-tight">
        <span>Porn</span>
        <span className="rounded-md bg-amber-500 px-2 py-0.5 leading-none text-black">
          hub
        </span>
      </span>
    ),
  },
  {
    name: 'Brazzers',
    component: (
      <span className="font-sans text-3xl font-black uppercase tracking-tight">
        BRAZZERS
      </span>
    ),
  },
  {
    name: 'CzechCasting',
    component: (
      <span className="font-serif text-2xl font-bold tracking-tight">
        Czech<span className="text-primary">Casting</span>
      </span>
    ),
  },
  {
    name: 'xHamster',
    component: (
      <span className="font-sans text-3xl font-black tracking-tighter">
        <span className="text-primary">x</span>Hamster
      </span>
    ),
  },
  {
    name: 'OnlyFans',
    component: (
      <span className="inline-flex items-baseline gap-0.5 font-sans text-3xl font-black tracking-tight">
        <span>Only</span>
        <span className="text-sky-400">Fans</span>
      </span>
    ),
  },
  {
    name: 'Stripchat',
    component: (
      <span className="font-sans text-3xl font-black uppercase tracking-tight">
        Strip<span className="text-primary">chat</span>
      </span>
    ),
  },
  {
    name: 'RealityKings',
    component: (
      <span className="font-serif text-2xl italic">Reality Kings</span>
    ),
  },
  {
    name: 'BangBros',
    component: (
      <span className="font-sans text-3xl font-black uppercase tracking-tight">
        BangBros
      </span>
    ),
  },
  {
    name: 'NaughtyAmerica',
    component: (
      <span className="font-serif text-2xl italic">Naughty America</span>
    ),
  },
];

export default function LogoCloudMarquee() {
  const t = useTranslations();
  return (
    <div className="logo-cloud-marquee bg-background">
      <div className="pt-8 text-center">
        <h3 className="logo-cloud-marquee__label text-sm font-medium tracking-widest uppercase">
          {t('logoCloud.inspiredBy')}
        </h3>
      </div>
      <div className="group relative w-full overflow-hidden py-8">
        <div className="absolute inset-0 z-10 before:absolute before:left-0 before:top-0 before:h-full before:w-1/4 before:bg-gradient-to-r before:from-background before:to-transparent before:content-[''] after:absolute after:right-0 after:top-0 after:h-full after:w-1/4 after:bg-gradient-to-l after:from-background after:to-transparent after:content-['']" />

        <div className="flex animate-marquee">
          <div className="flex min-w-full shrink-0 items-center justify-around gap-x-16">
            {logos.map((logo, i) => (
              <div key={i} className="mx-4 flex-shrink-0">
                {logo.component}
              </div>
            ))}
          </div>
          <div className="flex min-w-full shrink-0 items-center justify-around gap-x-16" aria-hidden="true">
            {logos.map((logo, i) => (
              <div key={`dup-${i}`} className="mx-4 flex-shrink-0">
                {logo.component}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

import { type ReactNode, createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useGetOverview, useGetTeacher, useListLanguages, useListPackages, useListPodcasts, useListTeachers } from '@workspace/api-client-react';
import type { Language, MinutePackage, Podcast, Teacher } from '@workspace/api-client-react';
import { ClerkProvider, Show, SignIn as ClerkSignIn, SignUp as ClerkSignUp, useClerk } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { ArrowLeft, ArrowRight, BookOpen, CalendarDays, Check, ChevronDown, CirclePlay, Clock3, Globe2, Headphones, Heart, Menu, Mic2, MoveUpRight, Search, Sparkles, Star, Users, X } from 'lucide-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Link, Redirect, Route, Switch, Router as WouterRouter, useLocation, useParams } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';

const queryClient = new QueryClient();
type Locale = 'en' | 'ar';
const LingoContext = createContext<{ locale: Locale; toggleLocale: () => void }>({ locale: 'en', toggleLocale: () => undefined });
const t = (locale: Locale, en: string, ar: string) => locale === 'ar' ? ar : en;
const mascot = '/assets/myna-bird.jpeg';
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
const clerkPubKey = publishableKeyFromHost(window.location.hostname, import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const stripBase = (path: string) => basePath && path.startsWith(basePath) ? path.slice(basePath.length) || '/' : path;
const clerkAppearance = {
  theme: shadcn,
  cssLayerName: 'clerk',
  options: {
    logoPlacement: 'inside' as const,
    logoLinkUrl: basePath || '/',
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: '#e8752d',
    colorForeground: '#2d2924',
    colorMutedForeground: '#70675c',
    colorDanger: '#b94b3b',
    colorBackground: '#fffaf0',
    colorInput: '#fffaf0',
    colorInputForeground: '#2d2924',
    colorNeutral: '#ded6c6',
    fontFamily: 'DM Sans, Noto Sans Arabic, sans-serif',
    borderRadius: '1rem',
  },
  elements: {
    rootBox: 'w-full flex justify-center',
    cardBox: 'bg-[#fffaf0] rounded-[28px] w-[440px] max-w-full overflow-hidden border border-[#ded6c6]',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none',
    footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: 'text-[#2d2924] font-bold',
    headerSubtitle: 'text-[#70675c]',
    socialButtonsBlockButtonText: 'text-[#2d2924] font-semibold',
    formFieldLabel: 'text-[#2d2924] font-semibold',
    footerActionLink: 'text-[#e8752d] font-bold',
    footerActionText: 'text-[#70675c]',
    dividerText: 'text-[#70675c]',
    formButtonPrimary: 'bg-[#2d2924] hover:bg-[#e8752d] text-[#fffaf0]',
    formFieldInput: 'bg-[#fffaf0] border-[#ded6c6] text-[#2d2924]',
    footerAction: 'bg-transparent',
    dividerLine: 'bg-[#ded6c6]',
    alert: 'bg-[#fff2e5] text-[#2d2924]',
    alertText: 'text-[#2d2924]',
    logoBox: 'h-12',
    logoImage: 'h-12',
    main: 'gap-5',
  },
};

function useLingo() { return useContext(LingoContext); }

function Brand({ compact = false }: { compact?: boolean }) {
  const { locale } = useLingo();
  return <Link href="/" data-testid="link-brand" className="flex items-center gap-2.5 shrink-0">
    <span className="relative grid size-10 place-items-center overflow-hidden rounded-[14px] bg-[#ffd64c] ring-1 ring-[#ef9c21]/30">
      <img src={mascot} alt="Myna Lingo bird" className="h-12 w-12 object-cover object-top mix-blend-multiply" />
    </span>
    {!compact && <span className="leading-none"><strong className="font-display text-[1.25rem] tracking-[-.04em]">myna</strong><span className="ml-1 text-xs font-bold uppercase tracking-[.18em] text-[#e8752d]">lingo</span><span className="mt-1 block text-[9px] font-semibold uppercase tracking-[.14em] text-muted-foreground">{t(locale, 'language club', 'نادي اللغات')}</span></span>}
  </Link>;
}

function LanguageSwitch() {
  const { locale, toggleLocale } = useLingo();
  return <button type="button" onClick={toggleLocale} data-testid="button-language-switcher" className="focus-ring inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-xs font-bold text-foreground transition hover:bg-secondary">
    <Globe2 size={15} className="text-primary" /><span>{locale === 'en' ? 'العربية' : 'English'}</span>
  </button>;
}

function SiteNav() {
  const { locale } = useLingo();
  const [open, setOpen] = useState(false);
  const links = [{ href: '/find-teacher', label: t(locale, 'Find a teacher', 'ابحث عن معلّم') }, { href: '/podcasts', label: t(locale, 'Podcasts', 'بودكاست') }, { href: '/packages', label: t(locale, 'Minute packages', 'باقات الدقائق') }];
  return <header className="sticky top-0 z-40 border-b border-border/70 bg-[#fffaf0]/90 backdrop-blur-md">
    <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 lg:px-8">
      <Brand />
      <nav className="hidden items-center gap-7 md:flex">{links.map(link => <Link key={link.href} href={link.href} data-testid={`link-nav-${link.href.slice(1)}`} className="text-sm font-semibold text-muted-foreground transition hover:text-foreground">{link.label}</Link>)}</nav>
      <div className="hidden items-center gap-2.5 md:flex"><LanguageSwitch /><Link href="/sign-in" data-testid="link-sign-in" className="rounded-full bg-foreground px-4 py-2.5 text-sm font-bold text-background transition hover:bg-primary">{t(locale, 'Sign in', 'تسجيل الدخول')}</Link></div>
      <button type="button" onClick={() => setOpen(!open)} data-testid="button-mobile-menu" className="focus-ring rounded-xl p-2 md:hidden">{open ? <X size={22} /> : <Menu size={22} />}</button>
    </div>
    {open && <div className="border-t border-border bg-background px-5 pb-5 pt-3 md:hidden">{links.map(link => <Link onClick={() => setOpen(false)} key={link.href} href={link.href} data-testid={`link-mobile-${link.href.slice(1)}`} className="block border-b border-border/60 py-3 text-sm font-bold">{link.label}</Link>)}<div className="flex items-center gap-2 pt-4"><LanguageSwitch /><Link href="/sign-in" data-testid="link-mobile-sign-in" className="rounded-full bg-foreground px-4 py-2.5 text-sm font-bold text-background">{t(locale, 'Sign in', 'تسجيل الدخول')}</Link></div></div>}
  </header>;
}

function Footer() {
  const { locale } = useLingo();
  return <footer className="border-t border-border bg-[#f8edcf]"><div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr] lg:px-8"><div><Brand /><p className="mt-4 max-w-xs text-sm leading-6 text-muted-foreground">{t(locale, 'A warm place to find your voice in another language.', 'مكان دافئ لتجد صوتك بلغة أخرى.')}</p></div><div><p className="mb-3 text-xs font-bold uppercase tracking-[.16em] text-primary">{t(locale, 'Learn', 'تعلّم')}</p><Link href="/find-teacher" data-testid="link-footer-teachers" className="block py-1.5 text-sm font-semibold">Find a teacher</Link><Link href="/podcasts" data-testid="link-footer-podcasts" className="block py-1.5 text-sm font-semibold">Podcasts</Link></div><div><p className="mb-3 text-xs font-bold uppercase tracking-[.16em] text-primary">{t(locale, 'For everyone', 'للجميع')}</p><Link href="/student" data-testid="link-footer-student" className="block py-1.5 text-sm font-semibold">Student space</Link><Link href="/teacher" data-testid="link-footer-teacher" className="block py-1.5 text-sm font-semibold">Teacher space</Link></div><div><p className="mb-3 text-xs font-bold uppercase tracking-[.16em] text-primary">{t(locale, 'Myna Lingo', 'مينا لينغو')}</p><p className="text-sm leading-6 text-muted-foreground">hello@mynalingo.com<br />Amman · London · Everywhere</p></div></div><div className="mx-auto max-w-7xl border-t border-border/70 px-5 py-5 text-xs text-muted-foreground lg:px-8">© 2024 Myna Lingo. {t(locale, 'Made for curious humans.', 'صُنع للفضوليين.')}</div></footer>;
}

function LoadingState({ label = 'Finding the good stuff…' }: { label?: string }) {
  return <div className="rounded-[28px] border border-border bg-card p-8 text-center" data-testid="status-loading"><div className="mx-auto mb-5 size-16 animate-pulse overflow-hidden rounded-2xl bg-secondary"><img src={mascot} alt="" className="h-full w-full object-cover mix-blend-multiply opacity-70" /></div><p className="text-sm font-semibold text-muted-foreground">{label}</p></div>;
}
function ErrorState({ retry, label = 'We hit a little language knot.' }: { retry?: () => void; label?: string }) {
  return <div className="rounded-[28px] border border-[#edc5a7] bg-[#fff2e5] p-8 text-center" data-testid="status-error"><div className="mx-auto mb-4 size-16 overflow-hidden rounded-2xl bg-[#ffd64c]"><img src={mascot} alt="Myna Lingo bird" className="h-full w-full object-cover mix-blend-multiply" /></div><p className="font-display text-xl">{label}</p><p className="mt-1 text-sm text-muted-foreground">Try again, or come back in a moment.</p>{retry && <button type="button" onClick={retry} data-testid="button-retry" className="mt-5 rounded-full bg-foreground px-4 py-2 text-sm font-bold text-background">Try again</button>}</div>;
}
function EmptyState({ title = 'Nothing here yet', detail = 'New discoveries are on their way.' }: { title?: string; detail?: string }) {
  return <div className="rounded-[28px] border border-dashed border-border bg-card p-10 text-center" data-testid="status-empty"><div className="mx-auto mb-4 size-14 overflow-hidden rounded-2xl bg-secondary"><img src={mascot} alt="" className="h-full w-full object-cover mix-blend-multiply opacity-70" /></div><p className="font-display text-xl">{title}</p><p className="mt-1 text-sm text-muted-foreground">{detail}</p></div>;
}

function Avatar({ teacher, size = 'md' }: { teacher: Pick<Teacher, 'id' | 'avatar' | 'name' | 'accent'>; size?: 'sm' | 'md' | 'lg' }) {
  const dimensions = size === 'lg' ? 'size-28' : size === 'sm' ? 'size-11' : 'size-16';
  const hasImage = teacher.avatar.startsWith('http') || teacher.avatar.startsWith('/');
  return hasImage ? <img src={teacher.avatar} alt={teacher.name} className={`${dimensions} rounded-[22px] object-cover`} data-testid={`img-avatar-${teacher.id}`} /> : <span data-testid={`avatar-fallback-${teacher.id}`} className={`${dimensions} grid place-items-center rounded-[22px] text-xl font-bold`} style={{ background: teacher.accent || '#ffd64c' }}>{teacher.name.split(' ').map(n => n[0]).slice(0, 2).join('')}</span>;
}

function TeacherCard({ teacher }: { teacher: Teacher }) {
  const { locale } = useLingo();
  const [favorite, setFavorite] = useState(false);
  return <article className="group rounded-[26px] border border-border bg-card p-4 shadow-[0_8px_30px_hsl(35_35%_35%_/_0.05)] transition hover:-translate-y-1 hover:shadow-[0_16px_35px_hsl(35_35%_35%_/_0.11)]" data-testid={`card-teacher-${teacher.id}`}>
    <div className="flex items-start justify-between"><div className="relative"><Avatar teacher={teacher} /><span className={`absolute -bottom-1 -right-1 size-4 rounded-full border-2 border-card ${teacher.online ? 'bg-[#54a66e]' : 'bg-[#c2b9a9]'}`} title={teacher.online ? 'Online now' : 'Offline'} /></div><button type="button" onClick={() => setFavorite(!favorite)} aria-label={favorite ? 'Remove favorite' : 'Add favorite'} data-testid={`button-favorite-teacher-${teacher.id}`} className={`focus-ring rounded-full border p-2 transition hover:border-accent hover:text-accent ${favorite ? 'border-accent bg-[#fff0d5] text-accent' : 'border-border text-muted-foreground'}`}><Heart size={16} className={favorite ? 'fill-current' : ''} /></button></div>
    <div className="mt-4"><div className="flex items-center gap-2"><h3 className="font-display text-[1.35rem]">{teacher.name}</h3>{teacher.online && <span className="rounded-full bg-[#e3f2e3] px-2 py-1 text-[10px] font-bold text-[#397747]">ONLINE</span>}</div><p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{teacher.headline}</p><div className="mt-3 flex flex-wrap gap-1.5">{teacher.languages.slice(0, 2).map(lang => <span key={lang} className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-bold">{lang}</span>)}</div></div>
    <div className="mt-5 flex items-center justify-between border-t border-border pt-4"><span className="flex items-center gap-1 text-sm font-bold"><Star size={15} className="fill-[#f0a52b] text-[#f0a52b]" />{teacher.rating.toFixed(1)} <span className="font-normal text-muted-foreground">({teacher.reviewCount})</span></span><span className="text-sm font-bold">{teacher.currency} {teacher.pricePerMinute}<span className="font-normal text-muted-foreground"> / min</span></span></div>
    <Link href={`/teachers/${teacher.id}`} data-testid={`link-teacher-${teacher.id}`} className="mt-4 flex items-center justify-center gap-2 rounded-full bg-[#f7e9bf] px-4 py-3 text-sm font-bold transition group-hover:bg-primary group-hover:text-primary-foreground">{t(locale, 'Meet ' + teacher.name.split(' ')[0], 'تعرّف على ' + teacher.name.split(' ')[0])}<MoveUpRight size={15} /></Link>
  </article>;
}

function Home() {
  const { locale } = useLingo();
  const overview = useGetOverview();
  const teachers = useListTeachers();
  const podcasts = useListPodcasts();
  const languages = useListLanguages();
  const [email, setEmail] = useState('');
  const featuredTeachers = (teachers.data || []).slice(0, 3);
  const featuredPodcasts = (podcasts.data || []).slice(0, 3);
  return <><SiteNav /><main>
    <section className="surface-grid relative overflow-hidden bg-[#f8e7b3]"><div className="mx-auto grid max-w-7xl items-center gap-10 px-5 pb-16 pt-14 lg:grid-cols-[1.05fr_.95fr] lg:px-8 lg:pb-24 lg:pt-20"><div className="relative z-10 myna-rise"><p className="mb-5 flex items-center gap-2 text-xs font-bold uppercase tracking-[.2em] text-[#b86525]"><Sparkles size={15} /> {t(locale, 'A language club for real life', 'نادي لغات للحياة اليومية')}</p><h1 className="max-w-xl font-display text-[clamp(3.3rem,7vw,6.6rem)] leading-[.9] tracking-[-.065em] text-balance">{t(locale, 'Find your voice. Then go use it.', 'اعثر على صوتك. ثم استخدمه.')}</h1><p className="mt-7 max-w-lg text-lg leading-8 text-[#554936]">{t(locale, 'Meet kind teachers, practice out loud, and make a little room in your day for another language.', 'قابل معلّمين لطفاء، تدرّب بصوت عالٍ، وافتح في يومك مساحة صغيرة للغة أخرى.')}</p><div className="mt-8 flex flex-wrap gap-3"><Link href="/find-teacher" data-testid="link-hero-find-teacher" className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3.5 text-sm font-bold text-background transition hover:bg-primary">{t(locale, 'Find my teacher', 'ابحث عن معلّمي')} <ArrowRight size={17} /></Link><Link href="/podcasts" data-testid="link-hero-podcasts" className="inline-flex items-center gap-2 rounded-full border border-foreground/20 bg-card/60 px-6 py-3.5 text-sm font-bold transition hover:bg-card"><CirclePlay size={17} />{t(locale, 'Listen first', 'استمع أولاً')}</Link></div><div className="mt-9 flex items-center gap-3 text-sm font-semibold text-[#665640]"><div className="flex -space-x-2"><span className="grid size-8 place-items-center rounded-full border-2 border-[#f8e7b3] bg-[#ef9c77] text-xs font-bold">SA</span><span className="grid size-8 place-items-center rounded-full border-2 border-[#f8e7b3] bg-[#a9c4a1] text-xs font-bold">MK</span><span className="grid size-8 place-items-center rounded-full border-2 border-[#f8e7b3] bg-[#c8a6cc] text-xs font-bold">RA</span></div>{t(locale, 'Loved by curious learners in 42 countries', 'محبوب لدى متعلّمين فضوليين في 42 دولة')}</div></div><div className="relative flex justify-center lg:justify-end myna-rise myna-rise-delay-1"><div className="absolute right-4 top-2 size-20 rounded-full border border-[#de9b2e]/40 lg:right-16" /><div className="absolute bottom-8 left-3 h-28 w-28 rounded-[38%_62%_60%_40%] bg-[#ef8d4b]/50 lg:left-14" /><div className="relative w-[min(100%,480px)] rotate-2 overflow-hidden rounded-[42%_58%_48%_52%/44%_43%_57%_56%] border-[12px] border-[#fff6dc] bg-[#ffd64c] shadow-[18px_22px_0_#e89b36] myna-float"><img src={mascot} alt="Myna Lingo bird mascot" className="aspect-[.84] w-full object-cover object-top mix-blend-multiply" /></div><div className="absolute -bottom-2 right-2 rounded-2xl bg-card p-4 shadow-lg lg:right-0"><p className="font-display text-2xl">مرحبا!</p><p className="text-xs font-semibold text-muted-foreground">Start with hello</p></div></div></div></section>
    <section className="mx-auto max-w-7xl px-5 py-9 lg:px-8"><div className="grid grid-cols-2 gap-3 rounded-[24px] border border-border bg-card p-5 sm:grid-cols-4 sm:p-7">{[['learners', overview.data?.learners, 'learners'], ['teachers', overview.data?.teachers, 'teachers'], ['lessons', overview.data?.lessons, 'lessons'], ['countries', overview.data?.countries, 'countries']].map(([key, value, label], i) => <div key={key as string} className={`${i > 1 ? 'border-t border-border pt-4 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0' : ''}`} data-testid={`stat-${key}`}><p className="font-display text-3xl">{overview.isLoading ? '—' : value?.toLocaleString() || '—'}</p><p className="mt-1 text-xs font-bold uppercase tracking-[.14em] text-muted-foreground">{t(locale, label as string, ['متعلمون', 'معلمون', 'درس', 'دول'][i])}</p></div>)}</div></section>
    <section className="mx-auto max-w-7xl px-5 py-14 lg:px-8"><div className="mb-7 flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-primary">{t(locale, 'Start here', 'ابدأ من هنا')}</p><h2 className="mt-2 font-display text-4xl tracking-[-.04em]">{t(locale, 'A little practice, often.', 'قليل من التدريب، باستمرار.')}</h2></div><Link href="/find-teacher" data-testid="link-section-teachers" className="hidden items-center gap-1 text-sm font-bold underline decoration-primary decoration-2 underline-offset-4 sm:flex">{t(locale, 'See all teachers', 'كل المعلّمين')} <ArrowRight size={15} /></Link></div>{teachers.isLoading ? <LoadingState label="Meeting the teachers…" /> : teachers.isError ? <ErrorState retry={() => teachers.refetch()} /> : (featuredTeachers || []).length ? <div className="grid gap-4 md:grid-cols-3">{(featuredTeachers || []).map(teacher => <TeacherCard teacher={teacher} key={teacher.id} />)}</div> : <EmptyState />}</section>
    <section className="bg-[#263c36] text-[#fff8e8]"><div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 lg:grid-cols-[.9fr_1.1fr] lg:px-8"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#ffd64c]">{t(locale, 'Listen & learn', 'استمع وتعلّم')}</p><h2 className="mt-3 max-w-md font-display text-5xl leading-[.95] tracking-[-.05em]">{t(locale, 'Your ears are language muscles.', 'أذناك عضلات لغوية.')}</h2><p className="mt-5 max-w-md leading-7 text-[#d9d7c8]">{t(locale, 'Short, human conversations for the walk to work, the school run, or the quiet bit after dinner.', 'محادثات قصيرة وإنسانية لرحلتك اليومية أو وقتك الهادئ بعد العشاء.')}</p><Link href="/podcasts" data-testid="link-listen-podcasts" className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#ffd64c] px-5 py-3 text-sm font-bold text-[#263c36]">{t(locale, 'Browse podcasts', 'تصفّح البودكاست')} <ArrowRight size={16} /></Link></div><div className="grid gap-3 sm:grid-cols-3">{podcasts.isLoading ? <div className="sm:col-span-3"><LoadingState label="Tuning in…" /></div> : podcasts.isError ? <div className="sm:col-span-3"><ErrorState retry={() => podcasts.refetch()} /></div> : featuredPodcasts.length ? featuredPodcasts.map((podcast, i) => <PodcastMini podcast={podcast} index={i} key={podcast.id} />) : <div className="sm:col-span-3"><EmptyState /></div>}</div></div></section>
    <section className="mx-auto grid max-w-7xl items-center gap-8 px-5 py-16 lg:grid-cols-[1fr_1.1fr] lg:px-8"><div className="rounded-[28px] bg-[#f4c9b1] p-7 sm:p-10"><div className="mb-7 flex items-center justify-between"><span className="rounded-full bg-card px-3 py-1.5 text-xs font-bold">myna note 01</span><Mic2 size={22} /></div><p className="font-display text-3xl leading-tight">“The goal isn’t perfect grammar. It’s a braver Tuesday.”</p><p className="mt-6 text-sm font-bold">— Noor, conversation partner</p></div><div><p className="text-xs font-bold uppercase tracking-[.18em] text-primary">{t(locale, 'A club, not a classroom', 'نادٍ، وليس صفاً دراسياً')}</p><h2 className="mt-3 max-w-lg font-display text-4xl leading-tight tracking-[-.04em]">{t(locale, 'Show up as you are. Leave with more to say.', 'تعال كما أنت. وغادر ولديك ما تقوله أكثر.')}</h2><p className="mt-5 max-w-lg leading-7 text-muted-foreground">{t(locale, 'Everyone starts somewhere. Myna Lingo makes that first hello feel less like a test and more like an invitation.', 'كل شخص يبدأ من مكان ما. مينا لينغو تجعل التحية الأولى دعوة، لا اختباراً.')}</p><div className="mt-7 flex flex-wrap gap-2">{(languages.data || []).slice(0, 4).map(lang => <span key={lang.id} className="rounded-full border border-border bg-card px-3 py-2 text-sm font-bold">{lang.nativeName} · {lang.name}</span>)}</div></div></section>
    <section className="bg-[#f8edcf]"><div className="mx-auto max-w-7xl px-5 py-14 lg:px-8"><div className="mx-auto max-w-xl text-center"><p className="text-xs font-bold uppercase tracking-[.18em] text-primary">{t(locale, 'Keep in touch', 'ابقَ على تواصل')}</p><h2 className="mt-3 font-display text-4xl tracking-[-.04em]">{t(locale, 'One thoughtful note a week.', 'رسالة واحدة لطيفة كل أسبوع.')}</h2><p className="mt-3 text-muted-foreground">{t(locale, 'New teachers, tiny wins, and a phrase worth carrying with you.', 'معلمون جدد، انتصارات صغيرة، وعبارة تستحق أن تحملها معك.')}</p><div className="mx-auto mt-6 flex max-w-md gap-2 rounded-full border border-border bg-card p-1.5"><input value={email} onChange={e => setEmail(e.target.value)} data-testid="input-newsletter-email" type="email" placeholder="your@email.com" className="min-w-0 flex-1 bg-transparent px-4 text-sm outline-none" /><button type="button" onClick={() => setEmail('')} data-testid="button-newsletter-submit" className="rounded-full bg-foreground px-4 py-2.5 text-xs font-bold text-background">{t(locale, 'Join us', 'انضم إلينا')}</button></div></div></div></section>
  </main><Footer /></>;
}

function PodcastMini({ podcast, index = 0 }: { podcast: Podcast; index?: number }) {
  return <article data-testid={`card-podcast-${podcast.id}`} className={`group rounded-[23px] p-4 ${index === 1 ? 'bg-[#ef8d4b]' : index === 2 ? 'bg-[#d5a9d3]' : 'bg-[#f4c9b1]'} text-[#263c36]`}><div className="flex items-center justify-between"><span className="grid size-10 place-items-center rounded-xl bg-[#fff8e8]/70"><Headphones size={18} /></span><button type="button" data-testid={`button-play-podcast-${podcast.id}`} className="grid size-9 place-items-center rounded-full bg-[#263c36] text-[#fff8e8] transition group-hover:scale-105"><CirclePlay size={16} /></button></div><p className="mt-7 text-[10px] font-bold uppercase tracking-[.12em] opacity-70">{podcast.language} · {podcast.level}</p><h3 className="mt-1 line-clamp-2 font-display text-xl leading-tight">{podcast.title}</h3><p className="mt-3 text-xs font-semibold opacity-70">{podcast.duration} · {podcast.xp} XP</p></article>;
}

function PageHeader({ eyebrow, title, detail }: { eyebrow: string; title: string; detail: string }) {
  return <section className="bg-[#f8e7b3]"><div className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-16"><p className="text-xs font-bold uppercase tracking-[.18em] text-[#b86525]">{eyebrow}</p><h1 className="mt-3 max-w-3xl font-display text-5xl leading-[.96] tracking-[-.055em] sm:text-6xl">{title}</h1><p className="mt-5 max-w-xl text-base leading-7 text-[#665640]">{detail}</p></div></section>;
}

function FindTeacher() {
  const { locale } = useLingo();
  const [search, setSearch] = useState('');
  const [language, setLanguage] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [onlineOnly, setOnlineOnly] = useState(false);
  const params = useMemo(() => ({ language: language || undefined, serviceType: (serviceType || undefined) as 'CONVERSATION_PARTNER' | 'PROFESSIONAL_TEACHER' | undefined, online: onlineOnly || undefined }), [language, onlineOnly, serviceType]);
  const teachers = useListTeachers(params);
  const languages = useListLanguages();
  const visible = (teachers.data || []).filter(teacher => `${teacher.name} ${teacher.headline} ${teacher.languages.join(' ')} ${teacher.specialties.join(' ')}`.toLowerCase().includes(search.toLowerCase()));
  return <><SiteNav /><main><PageHeader eyebrow={t(locale, 'Find your people', 'اعثر على رفاقك')} title={t(locale, 'The right teacher changes everything.', 'المعلّم المناسب يغيّر كل شيء.')} detail={t(locale, 'Search by language, energy, or simply the person whose story makes you want to say hello.', 'ابحث حسب اللغة أو الأسلوب، أو ببساطة عن الشخص الذي تجعلك قصته ترغب في إلقاء التحية.')} /><div className="mx-auto max-w-7xl px-5 py-10 lg:px-8"><div className="rounded-[26px] border border-border bg-card p-3 shadow-sm"><div className="flex flex-col gap-2 lg:flex-row"><label className="flex flex-1 items-center gap-3 rounded-2xl bg-secondary px-4 py-3"><Search size={19} className="text-muted-foreground" /><input value={search} onChange={e => setSearch(e.target.value)} data-testid="input-search-teachers" placeholder={t(locale, 'Search names, languages, or specialties', 'ابحث عن أسماء أو لغات أو تخصصات')} className="w-full bg-transparent text-sm outline-none" /></label><label className="flex items-center gap-2 rounded-2xl border border-border px-4 py-3 text-sm"><Globe2 size={16} className="text-primary" /><select value={language} onChange={e => setLanguage(e.target.value)} data-testid="select-teacher-language" className="bg-transparent font-semibold outline-none"><option value="">{t(locale, 'Any language', 'أي لغة')}</option>{(languages.data || []).map((item: Language) => <option key={item.id} value={item.name}>{item.name}</option>)}</select></label><label className="flex items-center gap-2 rounded-2xl border border-border px-4 py-3 text-sm"><select value={serviceType} onChange={e => setServiceType(e.target.value)} data-testid="select-teacher-type" className="bg-transparent font-semibold outline-none"><option value="">{t(locale, 'Any style', 'أي أسلوب')}</option><option value="CONVERSATION_PARTNER">{t(locale, 'Conversation partner', 'شريك محادثة')}</option><option value="PROFESSIONAL_TEACHER">{t(locale, 'Professional teacher', 'معلّم محترف')}</option></select></label><label className={`flex cursor-pointer items-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold ${onlineOnly ? 'bg-[#dff0df] text-[#397747]' : 'bg-secondary'}`}><input type="checkbox" checked={onlineOnly} onChange={e => setOnlineOnly(e.target.checked)} data-testid="checkbox-online-only" className="accent-[#397747]" />{t(locale, 'Online now', 'متاح الآن')}</label></div></div><div className="mb-5 mt-9 flex items-center justify-between"><p className="text-sm font-semibold text-muted-foreground" data-testid="text-teacher-count">{teachers.isLoading ? '...' : `${visible.length} ${t(locale, 'teachers to meet', 'معلمون للتعرّف')}`}</p><button type="button" onClick={() => { setSearch(''); setLanguage(''); setServiceType(''); setOnlineOnly(false); }} data-testid="button-clear-filters" className="text-xs font-bold underline underline-offset-4">Clear filters</button></div>{teachers.isLoading ? <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"><LoadingState /><LoadingState /><LoadingState /></div> : teachers.isError ? <ErrorState retry={() => teachers.refetch()} /> : visible.length ? <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{visible.map(teacher => <TeacherCard teacher={teacher} key={teacher.id} />)}</div> : <EmptyState title={t(locale, 'No teacher match yet', 'لم نجد معلّماً مناسباً بعد')} detail={t(locale, 'Try a wider search — your person may be one word away.', 'جرّب بحثاً أوسع، فقد يكون معلّمك على بُعد كلمة واحدة.')} />}</div></main><Footer /></>;
}

function TeacherProfile() {
  const { locale } = useLingo();
  const params = useParams<{ id: string }>();
  const teacher = useGetTeacher(params.id);
  const [booked, setBooked] = useState(false);
  if (teacher.isLoading) return <><SiteNav /><main className="mx-auto max-w-7xl px-5 py-12 lg:px-8"><LoadingState label="Opening their little corner…" /></main></>;
  if (teacher.isError || !teacher.data) return <><SiteNav /><main className="mx-auto max-w-7xl px-5 py-12 lg:px-8"><ErrorState retry={() => teacher.refetch()} label="That teacher profile is playing hide and seek." /></main></>;
  const person = teacher.data;
  return <><SiteNav /><main className="bg-[#f8e7b3]"><div className="mx-auto max-w-7xl px-5 py-10 lg:px-8 lg:py-16"><Link href="/find-teacher" data-testid="link-back-teachers" className="mb-8 inline-flex items-center gap-2 text-sm font-bold"><ArrowLeft size={16} />{t(locale, 'Back to teachers', 'العودة إلى المعلمين')}</Link><div className="grid gap-8 lg:grid-cols-[1fr_360px]"><section className="rounded-[32px] border border-border bg-card p-6 sm:p-9"><div className="flex flex-col gap-6 sm:flex-row sm:items-start"><Avatar teacher={person} size="lg" /><div className="flex-1"><div className="flex flex-wrap items-center gap-2"><h1 className="font-display text-4xl tracking-[-.05em]">{person.name}</h1>{person.online && <span className="rounded-full bg-[#e3f2e3] px-2.5 py-1 text-[10px] font-bold text-[#397747]">ONLINE NOW</span>}</div><p className="mt-2 text-lg text-muted-foreground">{person.headline}</p><div className="mt-4 flex flex-wrap gap-2">{person.languages.map(lang => <span key={lang} className="rounded-full bg-secondary px-3 py-1.5 text-xs font-bold">{lang}</span>)}</div></div></div><div className="mt-10 grid gap-5 border-y border-border py-6 sm:grid-cols-3"><div><p className="flex items-center gap-1 font-display text-2xl"><Star size={18} className="fill-[#f0a52b] text-[#f0a52b]" />{person.rating.toFixed(1)}</p><p className="mt-1 text-xs text-muted-foreground">{person.reviewCount} reviews</p></div><div><p className="font-display text-2xl">{person.students}</p><p className="mt-1 text-xs text-muted-foreground">learners helped</p></div><div><p className="font-display text-2xl">{person.experienceYears} yrs</p><p className="mt-1 text-xs text-muted-foreground">experience</p></div></div><h2 className="font-display text-2xl">{t(locale, 'A little about me', 'نبذة عني')}</h2><p className="mt-3 max-w-2xl leading-7 text-muted-foreground">{person.bio}</p><h2 className="mt-9 font-display text-2xl">{t(locale, 'What we can work on', 'ما يمكننا العمل عليه')}</h2><div className="mt-4 flex flex-wrap gap-2">{person.specialties.map(specialty => <span key={specialty} className="flex items-center gap-2 rounded-full border border-border px-3 py-2 text-sm font-semibold"><Check size={14} className="text-primary" />{specialty}</span>)}</div></section><aside className="h-fit rounded-[30px] bg-[#263c36] p-6 text-[#fff8e8] shadow-xl lg:sticky lg:top-24"><p className="text-xs font-bold uppercase tracking-[.16em] text-[#ffd64c]">{t(locale, 'Start with a hello', 'ابدأ بتحية')}</p><p className="mt-4 font-display text-3xl leading-tight">{t(locale, 'A first conversation is a small brave thing.', 'المحادثة الأولى شجاعة صغيرة.')}</p><div className="mt-8 rounded-2xl bg-[#fff8e8]/10 p-4"><div className="flex items-center justify-between"><span className="text-sm text-[#d9d7c8]">{person.serviceLabel}</span><span className="font-display text-2xl">{person.currency} {person.pricePerMinute}<small className="font-sans text-xs text-[#d9d7c8]"> / min</small></span></div><div className="mt-4 flex items-center gap-2 text-xs text-[#d9d7c8]"><CalendarDays size={15} /> Next opening: {person.nextAvailable}</div></div><button type="button" onClick={() => setBooked(!booked)} data-testid="button-book-lesson" className={`mt-4 w-full rounded-full px-5 py-3.5 text-sm font-bold ${booked ? 'bg-[#a9c4a1] text-[#263c36]' : 'bg-[#ffd64c] text-[#263c36]'}`}>{booked ? t(locale, 'Request sent', 'تم إرسال الطلب') : t(locale, 'Book a first lesson', 'احجز الدرس الأول')}</button><p className="mt-4 text-center text-xs text-[#b9c4bb]">{t(locale, 'No commitment. Just 25 minutes to see how it feels.', 'لا التزام. فقط 25 دقيقة لترى كيف تسير الأمور.')}</p></aside></div></div></main><Footer /></>;
}

function Podcasts() {
  const { locale } = useLingo();
  const podcasts = useListPodcasts();
  const [level, setLevel] = useState('All');
  const [playing, setPlaying] = useState<string | null>(null);
  const list = (podcasts.data || []).filter(item => level === 'All' || item.level.toLowerCase() === level.toLowerCase());
  const levels = Array.from(new Set((podcasts.data || []).map(item => item.level)));
  return <><SiteNav /><main><PageHeader eyebrow={t(locale, 'The listening room', 'غرفة الاستماع')} title={t(locale, 'Let a new language find your ears.', 'دع لغة جديدة تجد طريقها إلى أذنيك.')} detail={t(locale, 'Real voices, useful phrases, and stories you can finish before your coffee gets cold.', 'أصوات حقيقية، عبارات مفيدة، وقصص يمكنك إنهاؤها قبل أن تبرد قهوتك.')} /><div className="mx-auto max-w-7xl px-5 py-10 lg:px-8"><div className="mb-8 flex flex-wrap items-center gap-2"><span className="mr-2 text-xs font-bold uppercase tracking-[.15em] text-muted-foreground">{t(locale, 'Filter by level', 'تصفّح حسب المستوى')}</span><button type="button" onClick={() => setLevel('All')} data-testid="button-filter-podcast-all" className={`rounded-full px-4 py-2 text-xs font-bold ${level === 'All' ? 'bg-foreground text-background' : 'border border-border bg-card'}`}>All</button>{levels.map(item => <button type="button" key={item} onClick={() => setLevel(item)} data-testid={`button-filter-podcast-${item}`} className={`rounded-full px-4 py-2 text-xs font-bold ${level === item ? 'bg-foreground text-background' : 'border border-border bg-card'}`}>{item}</button>)}</div>{playing && <div className="mb-6 flex items-center justify-between rounded-2xl bg-[#e3f2e3] px-4 py-3 text-sm font-bold text-[#397747]" data-testid="status-podcast-playing"><span>Now playing: {podcasts.data?.find(item => item.id === playing)?.title}</span><button type="button" onClick={() => setPlaying(null)} data-testid="button-stop-podcast" className="rounded-full p-1 hover:bg-[#cce6cc]"><X size={16} /></button></div>}{podcasts.isLoading ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"><LoadingState /><LoadingState /><LoadingState /></div> : podcasts.isError ? <ErrorState retry={() => podcasts.refetch()} /> : list.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{list.map((podcast, index) => <article key={podcast.id} data-testid={`card-podcast-full-${podcast.id}`} className="group overflow-hidden rounded-[28px] border border-border bg-card transition hover:-translate-y-1 hover:shadow-xl"><div className="relative h-48 overflow-hidden p-5" style={{ background: podcast.accent || '#ef8d4b' }}><div className="absolute -right-10 -top-14 size-44 rounded-full border-[18px] border-card/20" /><div className="absolute bottom-4 left-5 grid size-14 place-items-center rounded-2xl bg-card/80"><Headphones size={25} /></div><span className="absolute right-5 top-5 rounded-full bg-card/80 px-3 py-1 text-[10px] font-bold uppercase">{podcast.language}</span></div><div className="p-5"><div className="flex items-center gap-2 text-xs font-bold text-muted-foreground"><span>{podcast.level}</span><span>·</span><span>{podcast.duration}</span><span>·</span><span>{podcast.xp} XP</span></div><h2 className="mt-3 font-display text-2xl leading-tight">{podcast.title}</h2><p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">{podcast.description}</p><button type="button" onClick={() => setPlaying(playing === podcast.id ? null : podcast.id)} data-testid={`button-play-podcast-full-${podcast.id}`} className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-secondary px-4 py-3 text-sm font-bold transition hover:bg-primary hover:text-primary-foreground"><CirclePlay size={17} />{playing === podcast.id ? t(locale, 'Pause episode', 'أوقف الحلقة') : t(locale, index === 0 ? 'Play episode' : 'Start listening', index === 0 ? 'شغّل الحلقة' : 'ابدأ الاستماع')}</button></div></article>)}</div> : <EmptyState title={t(locale, 'No episodes at this level', 'لا توجد حلقات بهذا المستوى')} />}</div></main><Footer /></>;
}

function Packages() {
  const { locale } = useLingo();
  const packages = useListPackages();
  return <><SiteNav /><main><PageHeader eyebrow={t(locale, 'Your pace, your practice', 'وتيرتك، تدريبك')} title={t(locale, 'Keep a few good minutes in your pocket.', 'احتفظ ببضع دقائق جيدة في جيبك.')} detail={t(locale, 'Choose a minute bundle, then spend it with the teacher who makes you want to keep talking.', 'اختر باقة دقائق، ثم أنفقها مع المعلّم الذي يجعلك ترغب في مواصلة الحديث.')} /><div className="mx-auto max-w-7xl px-5 py-12 lg:px-8">{packages.isLoading ? <div className="grid gap-5 md:grid-cols-3"><LoadingState /><LoadingState /><LoadingState /></div> : packages.isError ? <ErrorState retry={() => packages.refetch()} /> : packages.data?.length ? <div className="grid gap-5 md:grid-cols-3">{packages.data.map((item: MinutePackage, index) => <PackageCard item={item} featured={item.popular || index === 1} key={item.id} />)}</div> : <EmptyState title={t(locale, 'Packages are taking a breather', 'الباقات تستريح قليلاً')} />}</div><section className="mx-auto max-w-7xl px-5 pb-16 lg:px-8"><div className="flex flex-col items-start justify-between gap-6 rounded-[28px] bg-[#263c36] p-7 text-[#fff8e8] sm:flex-row sm:items-center sm:p-10"><div><p className="font-display text-3xl">{t(locale, 'Not sure where to begin?', 'لست متأكداً من أين تبدأ؟')}</p><p className="mt-2 text-sm text-[#d9d7c8]">{t(locale, 'Start small. A good conversation will tell you what comes next.', 'ابدأ بخطوة صغيرة. محادثة جيدة ستخبرك بالخطوة التالية.')}</p></div><Link href="/find-teacher" data-testid="link-packages-find-teacher" className="inline-flex items-center gap-2 rounded-full bg-[#ffd64c] px-5 py-3 text-sm font-bold text-[#263c36]">{t(locale, 'Meet teachers', 'تعرّف على المعلمين')} <ArrowRight size={16} /></Link></div></section></main><Footer /></>;
}
function PackageCard({ item, featured }: { item: MinutePackage; featured: boolean }) {
  const { locale } = useLingo();
  const [selected, setSelected] = useState(false);
  return <article className={`relative rounded-[28px] border p-6 ${featured ? 'border-[#e8752d] bg-[#fff0d5] shadow-[0_12px_0_#e8752d]' : 'border-border bg-card'}`} data-testid={`card-package-${item.id}`}>{featured && <span className="absolute -top-3 left-6 rounded-full bg-[#e8752d] px-3 py-1 text-[10px] font-bold uppercase tracking-[.14em] text-white">{t(locale, 'Most loved', 'الأكثر حباً')}</span>}<p className="text-xs font-bold uppercase tracking-[.15em] text-primary">{item.name}</p><div className="mt-4 flex items-end gap-2"><p className="font-display text-5xl tracking-[-.06em]">{item.minutes}</p><p className="pb-2 text-sm font-bold text-muted-foreground">minutes</p></div><p className="mt-3 min-h-12 text-sm leading-6 text-muted-foreground">{item.description}</p><div className="my-6 border-t border-border" /><p className="font-display text-3xl">{item.currency} {item.price}</p><p className="mt-1 text-xs text-muted-foreground">one-time purchase</p><button type="button" onClick={() => setSelected(!selected)} data-testid={`button-select-package-${item.id}`} className={`mt-6 w-full rounded-full px-4 py-3 text-sm font-bold ${selected ? 'bg-[#a9c4a1] text-[#263c36]' : featured ? 'bg-foreground text-background' : 'bg-secondary'}`}>{selected ? t(locale, 'Added to your plan', 'أضيفت إلى خطتك') : t(locale, 'Choose this bundle', 'اختر هذه الباقة')}</button></article>;
}

function AuthPage({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const { locale } = useLingo();
  const AuthComponent = mode === 'sign-in' ? ClerkSignIn : ClerkSignUp;
  return <div className="min-h-[100dvh] bg-[#f8e7b3]"><div className="mx-auto flex max-w-7xl justify-between px-5 py-5 lg:px-8"><Brand /><LanguageSwitch /></div><main className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-16 pt-8 lg:grid-cols-[1fr_440px] lg:px-8 lg:pt-14"><div className="hidden lg:block"><div className="relative mx-auto max-w-md"><div className="absolute -left-8 top-10 size-28 rounded-full border border-[#e49a35]" /><div className="relative overflow-hidden rounded-[38%_62%_55%_45%/47%_39%_61%_53%] border-[10px] border-[#fff8e8] bg-[#ffd64c] shadow-[15px_17px_0_#e8752d]"><img src={mascot} alt="Myna Lingo bird mascot" className="aspect-square w-full object-cover object-top mix-blend-multiply" /></div></div><p className="mx-auto mt-10 max-w-md font-display text-center text-4xl leading-tight">{t(locale, 'Come in, the conversation is already warm.', 'تفضل، فالمحادثة بدأت تصبح دافئة.')}</p></div><div className="flex justify-center"><AuthComponent routing="path" path={`${basePath}/${mode}`} signInUrl={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} /></div></main></div>;
}

function Dashboard({ role }: { role: 'student' | 'teacher' | 'parent' }) {
  const { locale } = useLingo();
  const [notice, setNotice] = useState('');
  const copy = { student: { eyebrow: 'Your learning desk', title: 'Keep your voice moving.', detail: 'A soft landing for your next lesson, your minutes, and the phrase you almost had yesterday.', cta: 'Find a teacher', href: '/find-teacher' }, teacher: { eyebrow: 'Your teaching desk', title: 'Good teaching starts with showing up.', detail: 'Your sessions, learners, and next thoughtful conversation — all in one place.', cta: 'View your schedule', href: '/teacher' }, parent: { eyebrow: 'Your family desk', title: 'Make language part of the week.', detail: 'A clear, calm view of practice, lessons, and the small progress worth celebrating.', cta: 'Explore teachers', href: '/find-teacher' } }[role]; 
  const cards = role === 'student' ? [{ icon: CalendarDays, label: 'Next lesson', value: 'Tomorrow · 18:30' }, { icon: Clock3, label: 'Minutes left', value: '86 minutes' }, { icon: Sparkles, label: 'Current streak', value: '6 days' }] : role === 'teacher' ? [{ icon: CalendarDays, label: 'Next session', value: 'Today · 16:00' }, { icon: Users, label: 'Active learners', value: '24 learners' }, { icon: Star, label: 'Your rating', value: '4.9 / 5' }] : [{ icon: CalendarDays, label: 'Next lesson', value: 'Thursday · 17:00' }, { icon: Clock3, label: 'Practice this week', value: '42 minutes' }, { icon: Sparkles, label: 'Words collected', value: '118 words' }];
  return <><SiteNav /><main className="min-h-[calc(100dvh-76px)] bg-[#f8edcf]"><div className="mx-auto max-w-7xl px-5 py-10 lg:px-8"><div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-primary">{t(locale, copy.eyebrow, role === 'student' ? 'مكتب تعلّمك' : role === 'teacher' ? 'مكتب تعليمك' : 'مكتب عائلتك')}</p><h1 className="mt-3 max-w-2xl font-display text-5xl leading-[.95] tracking-[-.055em]">{t(locale, copy.title, role === 'student' ? 'حافظ على تقدّم صوتك.' : role === 'teacher' ? 'التعليم الجيد يبدأ بالحضور.' : 'اجعل اللغة جزءاً من أسبوعكم.')}</h1><p className="mt-4 max-w-xl leading-7 text-muted-foreground">{copy.detail}</p></div><Link href={copy.href} data-testid={`link-dashboard-cta-${role}`} className="inline-flex w-fit items-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-bold text-background">{copy.cta}<ArrowRight size={16} /></Link></div><div className="mt-10 grid gap-4 md:grid-cols-3">{cards.map(({ icon: Icon, label, value }, index) => <div key={label} data-testid={`card-dashboard-${role}-${index}`} className={`rounded-[26px] border border-border p-5 ${index === 0 ? 'bg-[#ef8d4b]' : index === 1 ? 'bg-card' : 'bg-[#d5a9d3]'}`}><Icon size={21} /><p className="mt-8 text-xs font-bold uppercase tracking-[.12em] opacity-70">{label}</p><p className="mt-2 font-display text-3xl">{value}</p></div>)}</div>{notice && <div className="mt-6 rounded-2xl bg-[#e3f2e3] px-4 py-3 text-sm font-bold text-[#397747]" data-testid={`status-dashboard-${role}`}>{notice}</div>}<div className="mt-6 grid gap-6 lg:grid-cols-[1.25fr_.75fr]"><section className="rounded-[28px] border border-border bg-card p-6"><div className="flex items-center justify-between"><h2 className="font-display text-2xl">Your week</h2><button type="button" onClick={() => setNotice('Calendar view is ready for your next planning session.')} data-testid={`button-dashboard-calendar-${role}`} className="rounded-full border border-border p-2"><CalendarDays size={17} /></button></div><div className="mt-6 space-y-3">{['Mon  ·  Listening room', 'Wed  ·  Teacher conversation', 'Sat  ·  Five new phrases'].map((item, index) => <div key={item} className="flex items-center gap-4 rounded-2xl bg-secondary p-4"><span className="grid size-9 place-items-center rounded-xl bg-card text-sm font-bold">{index + 1}</span><span className="text-sm font-semibold">{item}</span><Check size={17} className="ml-auto text-[#397747]" /></div>)}</div></section><section className="relative overflow-hidden rounded-[28px] bg-[#263c36] p-6 text-[#fff8e8]"><div className="absolute -bottom-10 -right-7 size-36 rounded-full bg-[#ef8d4b]/40" /><p className="relative text-xs font-bold uppercase tracking-[.16em] text-[#ffd64c]">myna thought</p><p className="relative mt-5 font-display text-3xl leading-tight">“Small, repeated courage sounds like fluency.”</p><button type="button" onClick={() => setNotice('Practice room opened — take one brave minute.')} data-testid={`button-dashboard-practice-${role}`} className="relative mt-8 inline-flex items-center gap-2 rounded-full bg-[#ffd64c] px-4 py-2.5 text-sm font-bold text-[#263c36]">Practice now <ArrowRight size={15} /></button></section></div></div></main></>;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}
function HomeRoute() {
  return <><Show when="signed-in"><Redirect to="/student" /></Show><Show when="signed-out"><Home /></Show></>;
}

function ProtectedDashboard({ role }: { role: 'student' | 'teacher' | 'parent' }) {
  return <><Show when="signed-in"><Dashboard role={role} /></Show><Show when="signed-out"><Redirect to="/" /></Show></>;
}

function Router() {
  return <RoutedErrorBoundary><Switch><Route path="/" component={HomeRoute} /><Route path="/find-teacher" component={FindTeacher} /><Route path="/teachers/:id" component={TeacherProfile} /><Route path="/podcasts" component={Podcasts} /><Route path="/packages" component={Packages} /><Route path="/sign-in/*?" component={() => <AuthPage mode="sign-in" />} /><Route path="/sign-up/*?" component={() => <AuthPage mode="sign-up" />} /><Route path="/student" component={() => <ProtectedDashboard role="student" />} /><Route path="/teacher" component={() => <ProtectedDashboard role="teacher" />} /><Route path="/parent" component={() => <ProtectedDashboard role="parent" />} /><Route component={NotFound} /></Switch></RoutedErrorBoundary>;
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const client = useQueryClient();
  const previousUserId = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (previousUserId.current !== undefined && previousUserId.current !== userId) client.clear();
      previousUserId.current = userId;
    });
    return unsubscribe;
  }, [addListener, client]);
  return null;
}

function ClerkApp({ context }: { context: { locale: Locale; toggleLocale: () => void } }) {
  const [, setLocation] = useLocation();
  if (!clerkPubKey) throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in environment');
  return <ClerkProvider publishableKey={clerkPubKey} proxyUrl={clerkProxyUrl} appearance={clerkAppearance} signInUrl={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} routerPush={to => setLocation(stripBase(to))} routerReplace={to => setLocation(stripBase(to), { replace: true })} localization={{ signIn: { start: { title: 'Welcome back', subtitle: 'Sign in to keep your learning moving' } }, signUp: { start: { title: 'Start your language journey', subtitle: 'A little practice goes a long way' } } }}><QueryClientProvider client={queryClient}><ClerkQueryClientCacheInvalidator /><TooltipProvider><LingoContext.Provider value={context}><div dir={context.locale === 'ar' ? 'rtl' : 'ltr'} lang={context.locale} className={context.locale === 'ar' ? 'font-arabic' : ''}><Router /></div></LingoContext.Provider></TooltipProvider><Toaster /></QueryClientProvider></ClerkProvider>;
}

function App() {
  const [locale, setLocale] = useState<Locale>('en');
  const context = useMemo(() => ({ locale, toggleLocale: () => setLocale(value => value === 'en' ? 'ar' : 'en') }), [locale]);
  return <WouterRouter base={basePath}><ClerkApp context={context} /></WouterRouter>;
}
export default App;
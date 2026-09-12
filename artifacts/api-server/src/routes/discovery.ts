import { and, eq } from "drizzle-orm";
import { Router, type IRouter } from "express";
import { db, languagesTable, minutePackagesTable, podcastsTable, siteStatsTable, teachersTable, testimonialsTable } from "@workspace/db";
import {
  GetOverviewResponse,
  GetTeacherParams,
  GetTeacherResponse,
  ListLanguagesResponse,
  ListPackagesResponse,
  ListPodcastsResponse,
  ListTeachersQueryParams,
  ListTeachersResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();
let seedPromise: Promise<void> | undefined;

const seedDiscoveryData = async (): Promise<void> => {
  const [language] = await db.select({ id: languagesTable.id }).from(languagesTable).limit(1);
  if (language) return;

  await db.insert(languagesTable).values([
    { id: "english", name: "English", nativeName: "English", code: "EN", learners: 12400, accent: "sun" },
    { id: "french", name: "French", nativeName: "Français", code: "FR", learners: 9800, accent: "coral" },
    { id: "spanish", name: "Spanish", nativeName: "Español", code: "ES", learners: 7600, accent: "mint" },
    { id: "german", name: "German", nativeName: "Deutsch", code: "DE", learners: 4300, accent: "lavender" },
    { id: "italian", name: "Italian", nativeName: "Italiano", code: "IT", learners: 3200, accent: "peach" },
    { id: "arabic", name: "Arabic", nativeName: "العربية", code: "AR", learners: 5100, accent: "sky" },
  ]);

  await db.insert(teachersTable).values([
    {
      id: "nora-benali",
      name: "Nora Benali",
      avatar: "NB",
      headline: "Speak with confidence, one conversation at a time.",
      bio: "I help learners find their voice through practical conversations, gentle corrections, and topics that feel relevant to everyday life.",
      languages: ["English", "Arabic", "French"],
      serviceType: "CONVERSATION_PARTNER",
      serviceLabel: "Conversation partner",
      rating: "9.8",
      reviewCount: 86,
      students: 142,
      online: true,
      pricePerMinute: 100,
      currency: "DA",
      experienceYears: 5,
      specialties: ["Daily conversation", "Pronunciation", "Travel English"],
      nextAvailable: "Available now",
      accent: "sun",
    },
    {
      id: "yasmine-mansouri",
      name: "Yasmine Mansouri",
      avatar: "YM",
      headline: "Clear lessons for real-world French.",
      bio: "Together we make French feel less intimidating and more useful, from your first sentence to your next big conversation.",
      languages: ["French", "Arabic", "English"],
      serviceType: "PROFESSIONAL_TEACHER",
      serviceLabel: "Professional teacher",
      rating: "9.7",
      reviewCount: 64,
      students: 98,
      online: true,
      pricePerMinute: 150,
      currency: "DA",
      experienceYears: 8,
      specialties: ["Grammar", "DELF preparation", "Conversation"],
      nextAvailable: "Available now",
      accent: "coral",
    },
    {
      id: "adam-klein",
      name: "Adam Klein",
      avatar: "AK",
      headline: "Build your English with structure and momentum.",
      bio: "My lessons are focused, encouraging, and built around the moments you actually need English for.",
      languages: ["English", "German"],
      serviceType: "PROFESSIONAL_TEACHER",
      serviceLabel: "Professional teacher",
      rating: "9.6",
      reviewCount: 51,
      students: 76,
      online: false,
      pricePerMinute: 150,
      currency: "DA",
      experienceYears: 11,
      specialties: ["Business English", "Writing", "Interview prep"],
      nextAvailable: "Today, 18:30",
      accent: "mint",
    },
    {
      id: "lucia-rossi",
      name: "Lucia Rossi",
      avatar: "LR",
      headline: "Learn Italian through stories, food, and culture.",
      bio: "Language is a doorway into culture. We will use stories and everyday topics to make Italian stick.",
      languages: ["Italian", "English", "French"],
      serviceType: "CONVERSATION_PARTNER",
      serviceLabel: "Conversation partner",
      rating: "9.5",
      reviewCount: 39,
      students: 61,
      online: true,
      pricePerMinute: 100,
      currency: "DA",
      experienceYears: 4,
      specialties: ["Travel Italian", "Culture", "Fluency"],
      nextAvailable: "Available now",
      accent: "peach",
    },
    {
      id: "sarah-martin",
      name: "Sarah Martin",
      avatar: "SM",
      headline: "Make English feel natural and enjoyable.",
      bio: "I work with teens and adults who want a relaxed, supportive space to improve their speaking and listening.",
      languages: ["English", "French"],
      serviceType: "CONVERSATION_PARTNER",
      serviceLabel: "Conversation partner",
      rating: "9.4",
      reviewCount: 28,
      students: 44,
      online: false,
      pricePerMinute: 100,
      currency: "DA",
      experienceYears: 3,
      specialties: ["Teen learners", "Listening", "Everyday English"],
      nextAvailable: "Tomorrow, 10:00",
      accent: "lavender",
    },
    {
      id: "karim-haddad",
      name: "Karim Haddad",
      avatar: "KH",
      headline: "Arabic for curious minds and confident speakers.",
      bio: "I make Arabic approachable with clear explanations, useful phrases, and a lot of practice.",
      languages: ["Arabic", "English", "French"],
      serviceType: "PROFESSIONAL_TEACHER",
      serviceLabel: "Professional teacher",
      rating: "9.8",
      reviewCount: 72,
      students: 119,
      online: true,
      pricePerMinute: 150,
      currency: "DA",
      experienceYears: 9,
      specialties: ["Modern Standard Arabic", "Dialects", "Reading"],
      nextAvailable: "Available now",
      accent: "sky",
    },
  ]);

  await db.insert(minutePackagesTable).values([
    { id: "starter", name: "Starter", minutes: 56, price: 100, currency: "DA", popular: false, description: "Try a first conversation and see how it feels." },
    { id: "momentum", name: "Momentum", minutes: 300, price: 500, currency: "DA", popular: true, description: "A steady rhythm for meaningful weekly practice." },
    { id: "deep-dive", name: "Deep dive", minutes: 700, price: 1000, currency: "DA", popular: false, description: "For learners ready to make speaking a habit." },
  ]);

  await db.insert(podcastsTable).values([
    { id: "small-talk", title: "The art of small talk", description: "Useful phrases for starting conversations without overthinking them.", language: "English", level: "Beginner", duration: "12 min", xp: 40, cover: "ST", accent: "sun" },
    { id: "paris-in-a-day", title: "Paris in a day", description: "Follow a relaxed day in Paris and learn the language of getting around.", language: "French", level: "Intermediate", duration: "18 min", xp: 60, cover: "PA", accent: "coral" },
    { id: "coffee-italiano", title: "Un caffè, per favore", description: "Order coffee, ask questions, and sound more natural in an Italian café.", language: "Italian", level: "Beginner", duration: "9 min", xp: 30, cover: "CF", accent: "peach" },
    { id: "arabic-at-home", title: "Arabic at home", description: "Everyday Arabic expressions for the moments you share with family.", language: "Arabic", level: "Beginner", duration: "15 min", xp: 50, cover: "AH", accent: "sky" },
  ]);

  await db.insert(testimonialsTable).values([
    { id: "testimonial-1", quote: "I stopped translating every sentence in my head. That changed everything.", name: "Meriem", role: "English learner", avatar: "M", rating: 5 },
    { id: "testimonial-2", quote: "The teachers feel like real people who want you to succeed, not just profiles on a screen.", name: "Omar", role: "French learner", avatar: "O", rating: 5 },
    { id: "testimonial-3", quote: "My daughter looks forward to her lessons now. She is speaking more every week.", name: "Nadia", role: "Parent", avatar: "N", rating: 5 },
  ]);

  await db.insert(siteStatsTable).values({
    id: "main",
    learners: 18000,
    teachers: 240,
    lessons: 97000,
    countries: 42,
    rating: "9.7",
  });
};

const ensureSeeded = async (): Promise<void> => {
  seedPromise ??= seedDiscoveryData().catch((error: unknown) => {
    seedPromise = undefined;
    throw error;
  });
  await seedPromise;
};

const mapTeacher = (teacher: typeof teachersTable.$inferSelect) => ({
  ...teacher,
  rating: Number(teacher.rating),
});

router.get("/languages", async (_req, res): Promise<void> => {
  await ensureSeeded();
  const rows = await db.select().from(languagesTable).where(eq(languagesTable.isActive, true));
  res.json(ListLanguagesResponse.parse(rows));
});

router.get("/teachers", async (req, res): Promise<void> => {
  await ensureSeeded();
  const parsed = ListTeachersQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const onlineFilter =
    typeof req.query.online === "string"
      ? req.query.online === "true"
      : parsed.data.online;
  const filters = [eq(teachersTable.isApproved, true)];
  if (parsed.data.serviceType) {
    filters.push(eq(teachersTable.serviceType, parsed.data.serviceType));
  }
  if (onlineFilter !== undefined) {
    filters.push(eq(teachersTable.online, onlineFilter));
  }

  const rows = await db.select().from(teachersTable).where(and(...filters));
  const result = rows
    .filter((teacher) => !parsed.data.language || teacher.languages.includes(parsed.data.language))
    .map(mapTeacher);
  res.json(ListTeachersResponse.parse(result));
});

router.get("/teachers/:teacherId", async (req, res): Promise<void> => {
  await ensureSeeded();
  const parsed = GetTeacherParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [teacher] = await db
    .select()
    .from(teachersTable)
    .where(and(eq(teachersTable.id, parsed.data.teacherId), eq(teachersTable.isApproved, true)));
  if (!teacher) {
    res.status(404).json({ error: "Teacher not found" });
    return;
  }

  res.json(GetTeacherResponse.parse(mapTeacher(teacher)));
});

router.get("/packages", async (_req, res): Promise<void> => {
  await ensureSeeded();
  const rows = await db.select().from(minutePackagesTable).where(eq(minutePackagesTable.isActive, true));
  res.json(ListPackagesResponse.parse(rows));
});

router.get("/podcasts", async (_req, res): Promise<void> => {
  await ensureSeeded();
  const rows = await db.select().from(podcastsTable).where(eq(podcastsTable.isActive, true));
  res.json(ListPodcastsResponse.parse(rows));
});

router.get("/overview", async (_req, res): Promise<void> => {
  await ensureSeeded();
  const [stats] = await db.select().from(siteStatsTable).where(eq(siteStatsTable.id, "main"));
  const testimonials = await db.select().from(testimonialsTable).where(eq(testimonialsTable.isActive, true));
  res.json(
    GetOverviewResponse.parse({
      ...stats,
      rating: Number(stats?.rating ?? 0),
      testimonials,
    }),
  );
});

export default router;
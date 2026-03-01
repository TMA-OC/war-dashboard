/**
 * Seed script — populates the sources registry.
 * Run: npx tsx backend/db/seed.ts
 */
import { db } from './index';
import { sources } from './schema';

const seedSources = [
  // ── Global wire services (highest trust) ──────────────────────────────
  {
    name: 'Reuters',
    url: 'https://feeds.reuters.com/reuters/worldNews',
    homepage: 'https://www.reuters.com',
    iconUrl: 'https://www.reuters.com/favicon.ico',
    trustRank: 95,
  },
  {
    name: 'Associated Press (AP)',
    url: 'https://rsshub.app/apnews/topics/world-news',
    homepage: 'https://apnews.com',
    iconUrl: 'https://apnews.com/favicon.ico',
    trustRank: 95,
  },
  {
    name: 'AFP (Agence France-Presse)',
    url: 'https://www.afp.com/en/rss',
    homepage: 'https://www.afp.com',
    iconUrl: 'https://www.afp.com/favicon.ico',
    trustRank: 92,
  },

  // ── Major international broadcasters ─────────────────────────────────
  {
    name: 'BBC News — Middle East',
    url: 'https://feeds.bbci.co.uk/news/world/middle_east/rss.xml',
    homepage: 'https://www.bbc.com/news/world/middle_east',
    iconUrl: 'https://www.bbc.co.uk/favicon.ico',
    trustRank: 88,
  },
  {
    name: 'CNN World',
    url: 'http://rss.cnn.com/rss/edition_world.rss',
    homepage: 'https://edition.cnn.com/world',
    iconUrl: 'https://edition.cnn.com/favicon.ico',
    trustRank: 80,
  },
  {
    name: 'Al Jazeera English',
    url: 'https://www.aljazeera.com/xml/rss/all.xml',
    homepage: 'https://www.aljazeera.com',
    iconUrl: 'https://www.aljazeera.com/favicon.ico',
    trustRank: 78,
  },

  // ── Israeli media ─────────────────────────────────────────────────────
  {
    name: 'Haaretz',
    url: 'https://www.haaretz.com/srv/haaretz-latest-articles.rss',
    homepage: 'https://www.haaretz.com',
    iconUrl: 'https://www.haaretz.com/favicon.ico',
    trustRank: 82,
  },
  {
    name: 'Times of Israel',
    url: 'https://www.timesofisrael.com/feed/',
    homepage: 'https://www.timesofisrael.com',
    iconUrl: 'https://www.timesofisrael.com/favicon.ico',
    trustRank: 78,
  },
  {
    name: 'Ynet News',
    url: 'https://www.ynetnews.com/RSS/RSSWorldNews.xml',
    homepage: 'https://www.ynetnews.com',
    iconUrl: 'https://www.ynetnews.com/favicon.ico',
    trustRank: 75,
  },
  {
    name: 'Jerusalem Post',
    url: 'https://www.jpost.com/rss/rssfeedsfrontpage.aspx',
    homepage: 'https://www.jpost.com',
    iconUrl: 'https://www.jpost.com/favicon.ico',
    trustRank: 74,
  },
  {
    name: 'i24 News',
    url: 'https://www.i24news.tv/en/rss',
    homepage: 'https://www.i24news.tv',
    iconUrl: 'https://www.i24news.tv/favicon.ico',
    trustRank: 72,
  },

  // ── Pro-resistance / regional perspective ────────────────────────────
  {
    name: 'Al Mayadeen',
    url: 'https://english.almayadeen.net/rss.xml',
    homepage: 'https://english.almayadeen.net',
    iconUrl: 'https://english.almayadeen.net/favicon.ico',
    trustRank: 50,
  },
  {
    name: 'Press TV',
    url: 'https://www.presstv.ir/rss',
    homepage: 'https://www.presstv.ir',
    iconUrl: 'https://www.presstv.ir/favicon.ico',
    trustRank: 35,
  },
  {
    name: 'Iran International',
    url: 'https://www.iranintl.com/en/rss',
    homepage: 'https://www.iranintl.com',
    iconUrl: 'https://www.iranintl.com/favicon.ico',
    trustRank: 68,
  },
  {
    name: 'Middle East Eye',
    url: 'https://www.middleeasteye.net/rss',
    homepage: 'https://www.middleeasteye.net',
    iconUrl: 'https://www.middleeasteye.net/favicon.ico',
    trustRank: 65,
  },

  // ── Lebanon ───────────────────────────────────────────────────────────
  {
    name: 'NNA — National News Agency (Lebanon)',
    url: 'https://www.nna-leb.gov.lb/en/rss',
    homepage: 'https://www.nna-leb.gov.lb',
    iconUrl: 'https://www.nna-leb.gov.lb/favicon.ico',
    trustRank: 70,
  },
  {
    name: 'Naharnet',
    url: 'https://www.naharnet.com/stories/en/rss',
    homepage: 'https://www.naharnet.com',
    iconUrl: 'https://www.naharnet.com/favicon.ico',
    trustRank: 68,
  },
  {
    name: 'Al Jadeed TV',
    url: 'https://www.aljadeed.tv/rss',
    homepage: 'https://www.aljadeed.tv',
    iconUrl: 'https://www.aljadeed.tv/favicon.ico',
    trustRank: 60,
  },

  // ── Iraq / Kurdistan ─────────────────────────────────────────────────
  {
    name: 'Rudaw',
    url: 'https://www.rudaw.net/rss/english',
    homepage: 'https://www.rudaw.net/english',
    iconUrl: 'https://www.rudaw.net/favicon.ico',
    trustRank: 70,
  },
  {
    name: 'Kurdistan 24',
    url: 'https://www.kurdistan24.net/en/rss',
    homepage: 'https://www.kurdistan24.net',
    iconUrl: 'https://www.kurdistan24.net/favicon.ico',
    trustRank: 68,
  },

  // ── Yemen ─────────────────────────────────────────────────────────────
  {
    name: 'Yemen Monitor',
    url: 'https://www.yemenmonitor.com/feed/',
    homepage: 'https://www.yemenmonitor.com',
    iconUrl: 'https://www.yemenmonitor.com/favicon.ico',
    trustRank: 60,
  },

  // ── Gulf ──────────────────────────────────────────────────────────────
  {
    name: 'Arab News',
    url: 'https://www.arabnews.com/rss',
    homepage: 'https://www.arabnews.com',
    iconUrl: 'https://www.arabnews.com/favicon.ico',
    trustRank: 72,
  },
  {
    name: 'Al Arabiya English',
    url: 'https://english.alarabiya.net/rss.xml',
    homepage: 'https://english.alarabiya.net',
    iconUrl: 'https://english.alarabiya.net/favicon.ico',
    trustRank: 70,
  },
];

async function seed() {
  console.log(`Seeding ${seedSources.length} sources…`);

  for (const source of seedSources) {
    await db
      .insert(sources)
      .values({ ...source, active: true })
      .onConflictDoUpdate({
        target: sources.url,
        set: {
          name: source.name,
          homepage: source.homepage,
          iconUrl: source.iconUrl,
          trustRank: source.trustRank,
          active: true,
        },
      });
  }

  console.log('✅ Sources seeded.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});

// Scraper & Bot Protection Utility

const KNOWN_SCRAPER_USER_AGENTS = [
  'curl',
  'python-requests',
  'python-urllib',
  'httpx',
  'scrapy',
  'phantomjs',
  'selenium',
  'puppeteer',
  'playwright',
  'go-http-client',
  'node-fetch',
  'axios',
  'libwww-perl',
  'bytespider',
  'mj12bot',
  'ahrefsbot',
  'semrushbot',
  'dotbot',
  'rogue-scraper'
];

const LEGITIMATE_SEO_BOTS = [
  'googlebot',
  'bingbot',
  'twitterbot',
  'facebookexternalhit',
  'linkedinbot',
  'slackbot-linkexpanding',
  'whatsapp',
  'telegrambot',
  'gptbot',
  'chatgpt-user',
  'oai-searchbot',
  'perplexitybot',
  'claudebot',
  'anthropic-ai',
  'applebot',
  'duckduckbot',
  'yandexbot',
  'baiduspider',
  'ia_archiver'
];

export interface BotCheckResult {
  isBot: boolean;
  isLegitimateSeoBot: boolean;
  reason?: string;
}

export function detectBotOrScraper(userAgent: string | null): BotCheckResult {
  if (!userAgent || userAgent.trim() === '') {
    return { isBot: true, isLegitimateSeoBot: false, reason: 'Missing User-Agent Header' };
  }

  const uaLower = userAgent.toLowerCase();

  // Check if it's a legitimate SEO crawler
  const isSeo = LEGITIMATE_SEO_BOTS.some(seoBot => uaLower.includes(seoBot));
  if (isSeo) {
    return { isBot: true, isLegitimateSeoBot: true };
  }

  // Check against known scraping user-agents
  const isMaliciousBot = KNOWN_SCRAPER_USER_AGENTS.some(bot => uaLower.includes(bot));
  if (isMaliciousBot) {
    return { isBot: true, isLegitimateSeoBot: false, reason: `Blocked Scraper Signature (${userAgent})` };
  }

  // Check for Headless Chrome / Selenium automation flags
  if (uaLower.includes('headlesschrome') || uaLower.includes('webdriver')) {
    return { isBot: true, isLegitimateSeoBot: false, reason: 'Automated Headless Browser Detected' };
  }

  return { isBot: false, isLegitimateSeoBot: false };
}

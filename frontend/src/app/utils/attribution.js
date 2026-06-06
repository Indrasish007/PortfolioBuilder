// frontend/src/app/utils/attribution.js

export function detectTrafficSource() {
  const urlParams = new URLSearchParams(window.location.search);
  const utmSource = urlParams.get('utm_source');
  const utmMedium = urlParams.get('utm_medium') || '';
  const utmCampaign = urlParams.get('utm_campaign') || '';
  const utmContent = urlParams.get('utm_content') || '';
  const utmTerm = urlParams.get('utm_term') || '';

  // Retrieve stored first-touch
  let firstSource = sessionStorage.getItem('first_touch_source');
  let firstMedium = sessionStorage.getItem('first_touch_medium');
  let firstCampaign = sessionStorage.getItem('first_touch_campaign');

  // Parse active touchpoint source
  let activeSource = '';
  let activeMedium = '';
  let activeCampaign = '';

  if (utmSource) {
    // Priority 1: UTM source from URL query parameter
    activeSource = utmSource;
    activeMedium = utmMedium;
    activeCampaign = utmCampaign;
  } else {
    // Priority 3: document.referrer domain analysis
    const referrer = document.referrer || '';
    if (referrer) {
      const parsed = parseReferrerDomain(referrer);
      activeSource = parsed || 'Referral';
      activeMedium = 'referral';
    } else {
      // Priority 3.5: Mobile UA app signature detection (if referrer is unavailable)
      const appSource = detectMobileAppUA();
      if (appSource) {
        activeSource = appSource;
        activeMedium = 'social_app';
      } else {
        // Priority 4: Direct / Unknown
        // No UTM, no referrer. Could be true direct (bookmark, address bar) or
        // mobile app traffic (LinkedIn app, Instagram app, WhatsApp) where the
        // OS strips the HTTP Referer header. Labelled "Direct / Unknown" so the
        // dashboard can surface an accurate explanation to the portfolio owner.
        activeSource = 'Direct / Unknown';
        activeMedium = 'direct';
      }
    }
  }

  // Normalize source names
  const normalized = normalizeSource(activeSource);
  if (normalized) {
    activeSource = normalized;
  } else {
    // Custom campaign formatting: e.g. partner_newsletter -> Partner Newsletter
    activeSource = formatCustomSource(activeSource);
  }

  // Priority 2: Storing / Retrieving first-touch
  if (!firstSource) {
    firstSource = activeSource;
    firstMedium = activeMedium;
    firstCampaign = activeCampaign;
    sessionStorage.setItem('first_touch_source', firstSource);
    sessionStorage.setItem('first_touch_medium', firstMedium);
    sessionStorage.setItem('first_touch_campaign', firstCampaign);
  }

  // Store last-touch (updated on every landing parameter load)
  sessionStorage.setItem('last_touch_source', activeSource);
  sessionStorage.setItem('last_touch_medium', activeMedium);
  sessionStorage.setItem('last_touch_campaign', activeCampaign);

  return {
    source: activeSource,
    medium: activeMedium,
    campaign: activeCampaign,
    referrer: document.referrer || '',
    utm_source: utmSource || '',
    utm_medium: utmMedium || '',
    utm_campaign: utmCampaign || '',
    first_touch_source: firstSource,
    first_touch_medium: firstMedium,
    first_touch_campaign: firstCampaign,
    last_touch_source: activeSource,
    last_touch_medium: activeMedium,
    last_touch_campaign: activeCampaign
  };
}

function detectMobileAppUA() {
  if (typeof navigator === 'undefined') return null;
  const ua = navigator.userAgent || '';
  if (/instagram/i.test(ua)) return 'Instagram';
  if (/fbav|fban/i.test(ua)) return 'Facebook';
  if (/linkedinapp/i.test(ua)) return 'LinkedIn';
  if (/musical_ly|tiktok/i.test(ua)) return 'TikTok';
  if (/threads/i.test(ua)) return 'Threads';
  return null;
}

function formatCustomSource(str) {
  if (!str) return '';
  return str
    .split(/[_-]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function normalizeSource(sourceStr) {
  if (!sourceStr) return null;
  const s = sourceStr.toLowerCase().trim();
  if (s.includes('linkedin')) return 'LinkedIn';
  if (s.includes('github')) return 'GitHub';
  if (s.includes('google')) return 'Google';
  if (s.includes('bing')) return 'Bing';
  if (s.includes('duckduckgo')) return 'DuckDuckGo';
  if (s.includes('yahoo')) return 'Yahoo';
  if (s.includes('yandex')) return 'Yandex';
  if (s.includes('baidu')) return 'Baidu';
  if (s.includes('ecosia')) return 'Ecosia';
  if (s.includes('brave')) return 'Brave Search';
  if (s.includes('tiktok')) return 'TikTok';
  if (s.includes('threads')) return 'Threads';
  if (s.includes('snapchat')) return 'Snapchat';
  if (s.includes('facebook') || s === 'fb') return 'Facebook';
  if (s.includes('instagram') || s === 'ig') return 'Instagram';
  if (s === 'twitter' || s === 'x' || s === 'x.com' || s === 't.co') return 'X';
  if (s.includes('reddit')) return 'Reddit';
  if (s.includes('youtube') || s === 'youtu.be') return 'YouTube';
  if (s.includes('whatsapp')) return 'WhatsApp';
  if (s.includes('telegram') || s === 't.me') return 'Telegram';
  if (s.includes('discord')) return 'Discord';
  if (s.includes('medium')) return 'Medium';
  if (s.includes('quora')) return 'Quora';
  if (s.includes('hackernews') || s === 'hacker-news' || s === 'hn') return 'HackerNews';
  return null;
}

function parseReferrerDomain(referrer) {
  try {
    const url = new URL(referrer);
    const host = url.hostname.toLowerCase();

    if (host.includes('linkedin.com') || host.includes('lnkd.in')) return 'LinkedIn';
    if (host.includes('github.com')) return 'GitHub';
    if (/^www\.google\.[a-z.]+$/.test(host) || host === 'google.com' || host.includes('.google.')) return 'Google';
    if (host.includes('bing.com')) return 'Bing';
    if (host.includes('duckduckgo.com')) return 'DuckDuckGo';
    if (host.includes('yahoo.com')) return 'Yahoo';
    if (host.includes('yandex.ru') || host.includes('yandex.com')) return 'Yandex';
    if (host.includes('baidu.com')) return 'Baidu';
    if (host.includes('ecosia.org')) return 'Ecosia';
    if (host.includes('brave.com') || host.includes('search.brave.com')) return 'Brave Search';
    if (host.includes('tiktok.com')) return 'TikTok';
    if (host.includes('threads.net')) return 'Threads';
    if (host.includes('snapchat.com')) return 'Snapchat';
    if (host.includes('facebook.com') || host === 'm.facebook.com') return 'Facebook';
    if (host.includes('instagram.com')) return 'Instagram';
    if (host === 't.co' || host.includes('twitter.com') || host.includes('x.com')) return 'X';
    if (host.includes('reddit.com')) return 'Reddit';
    if (host.includes('youtube.com') || host === 'youtu.be') return 'YouTube';
    if (host.includes('whatsapp.com') || host.includes('wa.me')) return 'WhatsApp';
    if (host.includes('telegram.org') || host.includes('t.me')) return 'Telegram';
    if (host.includes('discord.com') || host.includes('discord.gg')) return 'Discord';
    if (host.includes('medium.com')) return 'Medium';
    if (host.includes('quora.com')) return 'Quora';
    if (host.includes('news.ycombinator.com')) return 'HackerNews';
    return null;
  } catch (e) {
    return null;
  }
}

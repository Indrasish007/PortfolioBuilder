/**
 * Generates a source-aware portfolio URL containing the appropriate utm_source query parameter.
 *
 * @param {string} baseUrl - The base live URL of the portfolio
 * @param {string} platformKey - The platform identifier (e.g. 'linkedin', 'github', 'whatsapp')
 * @returns {string} The decorated portfolio URL
 */
export function generateSourceUrl(baseUrl, platformKey) {
  const cleanBase = baseUrl.trim();
  const separator = cleanBase.includes("?") ? "&" : "?";
  return `${cleanBase}${separator}utm_source=${platformKey.toLowerCase()}`;
}

/**
 * Platform Capabilities Configuration
 */
export const PLATFORMS = {
  // Professional Networks
  linkedin: {
    name: "LinkedIn",
    group: "professional",
    type: "feed_message",
    color: "#0077b5",
    hoverBg: "hover:bg-[#0077b5]/10 hover:text-[#0077b5]",
    openUrl: "https://linkedin.com/",
    getFeedUrl: (url, text) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    getMessageUrl: () => `https://www.linkedin.com/messaging/`
  },
  github: {
    name: "GitHub",
    group: "professional",
    type: "copy_open",
    color: "#4f46e5",
    hoverBg: "hover:bg-[#4f46e5]/10 hover:text-[#4f46e5]",
    openUrl: "https://github.com/"
  },
  medium: {
    name: "Medium",
    group: "professional",
    type: "copy_open",
    color: "#00ab6c",
    hoverBg: "hover:bg-[#00ab6c]/10 hover:text-[#00ab6c]",
    openUrl: "https://medium.com/"
  },
  stackoverflow: {
    name: "Stack Overflow",
    group: "professional",
    type: "copy_open",
    color: "#f48024",
    hoverBg: "hover:bg-[#f48024]/10 hover:text-[#f48024]",
    openUrl: "https://stackoverflow.com/"
  },
  hackernews: {
    name: "Hacker News",
    group: "professional",
    type: "copy_open",
    color: "#ff6600",
    hoverBg: "hover:bg-[#ff6600]/10 hover:text-[#ff6600]",
    openUrl: "https://news.ycombinator.com/"
  },

  // Messaging Platforms
  whatsapp: {
    name: "WhatsApp",
    group: "messaging",
    type: "message_only",
    color: "#22c55e",
    hoverBg: "hover:bg-[#22c55e]/10 hover:text-[#22c55e]",
    getMessageUrl: (url, text) => `https://api.whatsapp.com/send?text=${encodeURIComponent(text + " " + url)}`
  },
  telegram: {
    name: "Telegram",
    group: "messaging",
    type: "message_only",
    color: "#0088cc",
    hoverBg: "hover:bg-[#0088cc]/10 hover:text-[#0088cc]",
    getMessageUrl: (url, text) => `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`
  },
  discord: {
    name: "Discord",
    group: "messaging",
    type: "message_only",
    color: "#5865f2",
    hoverBg: "hover:bg-[#5865f2]/10 hover:text-[#5865f2]",
    getMessageUrl: () => `https://discord.com/channels/@me`
  },
  email: {
    name: "Email",
    group: "messaging",
    type: "message_only",
    color: "#f472b6",
    hoverBg: "hover:bg-[#f472b6]/10 hover:text-[#f472b6]",
    getMessageUrl: (url, text) => `mailto:?subject=${encodeURIComponent("Professional Portfolio")}&body=${encodeURIComponent(text + "\n\n" + url)}`
  },

  // Social Platforms
  twitter: {
    name: "X/Twitter",
    group: "social",
    type: "feed_message",
    color: "#38bdf8",
    hoverBg: "hover:bg-[#38bdf8]/10 hover:text-[#38bdf8]",
    openUrl: "https://twitter.com/",
    getFeedUrl: (url, text) => `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
    getMessageUrl: (url, text) => `https://twitter.com/messages/compose?text=${encodeURIComponent(text + " " + url)}`
  },
  facebook: {
    name: "Facebook",
    group: "social",
    type: "feed_message",
    color: "#1877f2",
    hoverBg: "hover:bg-[#1877f2]/10 hover:text-[#1877f2]",
    openUrl: "https://facebook.com/",
    getFeedUrl: (url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    getMessageUrl: () => `https://www.facebook.com/messages/`
  },
  instagram: {
    name: "Instagram",
    group: "social",
    type: "copy_open",
    color: "#ec4899",
    hoverBg: "hover:bg-[#ec4899]/10 hover:text-[#ec4899]",
    openUrl: "https://instagram.com/"
  },
  reddit: {
    name: "Reddit",
    group: "social",
    type: "feed_message",
    color: "#ff4500",
    hoverBg: "hover:bg-[#ff4500]/10 hover:text-[#ff4500]",
    openUrl: "https://reddit.com/",
    getFeedUrl: (url, text) => `https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(text)}`,
    getMessageUrl: (url, text) => `https://www.reddit.com/message/compose/?subject=${encodeURIComponent("My Portfolio")}&message=${encodeURIComponent(text + " " + url)}`
  },
  youtube: {
    name: "YouTube",
    group: "social",
    type: "copy_open",
    color: "#ff0000",
    hoverBg: "hover:bg-[#ff0000]/10 hover:text-[#ff0000]",
    openUrl: "https://youtube.com/"
  }
};

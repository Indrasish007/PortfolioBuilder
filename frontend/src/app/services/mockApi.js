export async function mockLogin(email, password) {
  await new Promise((r) => setTimeout(r, 600));
  if (!email || !password) throw new Error("Email and password required");
  return { token: "mock-jwt", user: { email, name: email.split("@")[0] } };
}
export async function mockSignup(email, name) {
  await new Promise((r) => setTimeout(r, 600));
  return { token: "mock-jwt", user: { email, name } };
}
export async function mockAIAssistant(prompt) {
  await new Promise((r) => setTimeout(r, 900));
  return { reply: `Here's an idea for "${prompt}": Lead with a punchy 7-word hero line, then 3 outcome-focused project cards.` };
}
export const mockAnalytics = {
  views: Array.from({ length: 14 }, (_, i) => ({ day: `D${i + 1}`, views: 200 + Math.round(Math.sin(i / 2) * 120 + Math.random() * 180) })),
  visitors: Array.from({ length: 14 }, (_, i) => ({ day: `D${i + 1}`, visitors: 80 + Math.round(Math.cos(i / 3) * 60 + Math.random() * 90) })),
  devices: [
    { name: "Desktop", value: 62 }, { name: "Mobile", value: 31 }, { name: "Tablet", value: 7 },
  ],
  countries: [
    { country: "United States", visits: 5421 }, { country: "Germany", visits: 1820 },
    { country: "India", visits: 1612 }, { country: "Brazil", visits: 980 }, { country: "Japan", visits: 712 },
  ],
  downloads: 482,
  suggestions: [
    "Your hero CTA gets 28% fewer clicks on mobile — try a sticky bottom CTA.",
    "Visitors from Germany convert 2.3× higher — consider a localized homepage.",
    "Add a testimonial near your pricing — projects with one convert 18% better.",
  ],
};

import { create } from "zustand";
import { defaultPortfolio } from "../services/mockPortfolio.js";
import api from "../services/api";

// Default theme for each template — applied automatically when a template
// is selected so the live preview immediately reflects the right colours.
const TEMPLATE_DEFAULT_THEME = {
  // Minimal family
  minimal:       "minimal",
  scandinavian:  "minimal",
  paper:         "sand",
  typewriter:    "sand",

  // Sidebar / Developer family
  developer:     "midnight",
  obsidian:      "noir",
  architect:     "slate",
  terminal:      "forest",

  // Bold family
  bold:          "twilight",
  cyberpunk:     "neon",
  space:         "twilight",
  retro:         "twilight",
  neon:          "neon",
  quantum:       "midnight",

  // Glass family
  gradient:      "gradientblue",
  aurora:        "forest",
  glassmorphism: "glass",
  holographic:   "glass",

  // Split family
  creative:      "midnight",
  dusk:          "sand",
  coral:         "sand",
  sakura:        "minimal",

  // Biz family
  classic:       "minimal",
  startup:       "gradientblue",
  forest:        "forest",
  oceanic:       "neon",

  // Brutalist family
  brutalist:     "noir",
  monochrome:    "minimal",
};

export const usePortfolioStore = create((set, get) => ({
  portfolio: defaultPortfolio,
  template: "developer",
  themeName: "midnight",
  history: [],
  future: [],
  isLoading: false,
  resetPortfolio: () => set({ portfolio: defaultPortfolio, template: "developer", themeName: "midnight", history: [], future: [] }),
  fetchPortfolio: async (id) => {
    set({ isLoading: true });
    try {
      const url = id ? `/portfolios/${id}/` : '/portfolios/';
      const response = await api.get(url);
      let data = response.data;
      if (Array.isArray(data)) {
        if (data.length > 0) data = data[0];
        else { set({ isLoading: false }); return; }
      }

      // Transform skills from [{id, name}] to ["name"]
      if (data.skills) {
        data.skills = data.skills.map(s => typeof s === 'object' ? s.name : s);
      }

      // Deep merge user to avoid losing nested structures
      const mergedUser = { ...defaultPortfolio.user, ...(data.user || {}) };

      // Unflatten social fields
      if (data.user) {
        mergedUser.social = {
          github: data.user.github || "",
          twitter: data.user.twitter || "",
          linkedin: data.user.linkedin || "",
          facebook: data.user.facebook || "",
          instagram: data.user.instagram || "",
          website: data.user.website || "",
        };
      }

      set({
        portfolio: { ...defaultPortfolio, ...data, user: mergedUser },
        template: data.template || "developer",
        themeName: data.theme || "midnight",
      });
    } catch (error) {
      console.error("Failed to fetch portfolio", error);
    } finally {
      set({ isLoading: false });
    }
  },
  savePortfolio: async (overrideName = null) => {
    set({ isLoading: true });
    try {
      const state = get();
      const payload = { ...state.portfolio, template: state.template, theme: state.themeName };
      
      // Apply name override from save modal if provided
      if (overrideName) payload.name = overrideName;

      // Transform skills from ["name"] to [{name: "name"}] for API
      if (payload.skills) {
        payload.skills = payload.skills.map(s => typeof s === 'string' ? { name: s } : s);
      }

      // Flatten user.social for API
      if (payload.user && payload.user.social) {
        payload.user = { ...payload.user, ...payload.user.social };
        delete payload.user.social;
      }

      const restoreData = (data) => {
        if (data.skills) {
          data.skills = data.skills.map(s => typeof s === 'object' ? s.name : s);
        }
        const mergedUser = { ...state.portfolio.user, ...(data.user || {}) };
        if (data.user) {
          mergedUser.social = {
            github: data.user.github || state.portfolio.user?.social?.github || "",
            twitter: data.user.twitter || state.portfolio.user?.social?.twitter || "",
            linkedin: data.user.linkedin || state.portfolio.user?.social?.linkedin || "",
            facebook: data.user.facebook || state.portfolio.user?.social?.facebook || "",
            instagram: data.user.instagram || state.portfolio.user?.social?.instagram || "",
            website: data.user.website || state.portfolio.user?.social?.website || "",
          };
        }
        // Safety net: always keep the email that was in the store (entered in the form or
        // parsed from CV) — never let the API response overwrite it with the auth email.
        const preSaveEmail = state.portfolio.user?.email;
        if (preSaveEmail !== undefined) {
          mergedUser.email = preSaveEmail;
        }
        set({ portfolio: { ...state.portfolio, ...data, user: mergedUser, contact: state.portfolio.contact } });
      };

      if (state.portfolio.id) {
        const response = await api.put(`/portfolios/${state.portfolio.id}/`, payload);
        restoreData(response.data);
        return response.data.id;
      } else {
        const response = await api.post('/portfolios/', payload);
        restoreData(response.data);
        return response.data.id;
      }
    } catch (error) {
      console.error("Failed to save portfolio", error);
      set({ isLoading: false });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  setTemplate: (template) => {
    const prev = { portfolio: get().portfolio, template: get().template, themeName: get().themeName };
    // Switch to this template's default theme so the preview instantly reflects
    // the right colour scheme. Falls back to the current theme if not mapped.
    const newTheme = TEMPLATE_DEFAULT_THEME[template] || get().themeName;
    set({ history: [...get().history, prev], future: [], template, themeName: newTheme });
  },
  setThemeName: (themeName) => {
    const prev = { portfolio: get().portfolio, template: get().template, themeName: get().themeName };
    set({ history: [...get().history, prev], future: [], themeName });
  },
  updateField: (path, value) => {
    const prev = { portfolio: get().portfolio, template: get().template, themeName: get().themeName };
    const next = structuredClone(get().portfolio);
    const keys = path.split(".");
    let cur = next;
    for (let i = 0; i < keys.length - 1; i++) {
      if (cur[keys[i]] === undefined || cur[keys[i]] === null) cur[keys[i]] = {};
      cur = cur[keys[i]];
    }
    cur[keys[keys.length - 1]] = value;
    set({ history: [...get().history, prev], future: [], portfolio: next });
  },
  undo: () => {
    const h = get().history;
    if (!h.length) return;
    const last = h[h.length - 1];
    const cur = { portfolio: get().portfolio, template: get().template, themeName: get().themeName };
    set({ ...last, history: h.slice(0, -1), future: [...get().future, cur] });
  },
  redo: () => {
    const f = get().future;
    if (!f.length) return;
    const next = f[f.length - 1];
    const cur = { portfolio: get().portfolio, template: get().template, themeName: get().themeName };
    set({ ...next, future: f.slice(0, -1), history: [...get().history, cur] });
  },
}));

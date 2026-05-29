import { create } from "zustand";
import { persist } from "zustand/middleware";
import { defaultPortfolio } from "../services/mockPortfolio.js";
import api from "../services/api";

// Maps template → its default theme
const TEMPLATE_DEFAULT_THEME = {
  minimal: "minimal", scandinavian: "minimal", paper: "sand", typewriter: "sand",
  developer: "midnight", obsidian: "noir", architect: "slate", terminal: "forest",
  bold: "twilight", cyberpunk: "neon", space: "twilight", retro: "twilight",
  neon: "neon", quantum: "midnight",
  gradient: "gradientblue", aurora: "forest", glassmorphism: "glass", holographic: "glass",
  creative: "midnight", dusk: "sand", coral: "sand", sakura: "minimal",
  classic: "minimal", startup: "gradientblue", forest: "forest", oceanic: "neon",
  brutalist: "noir", monochrome: "minimal",
};

export const usePortfolioStore = create(
  persist(
    (set, get) => ({
      portfolio: defaultPortfolio,
      template: "developer",
      themeName: "midnight",
      history: [],
      future: [],
      isLoading: false,

      resetPortfolio: () =>
        set({
          portfolio: defaultPortfolio,
          template: "developer",
          themeName: "midnight",
          history: [],
          future: [],
        }),

      // Load a draft directly into the store without touching the API.
      // Used to restore an unsaved new portfolio from localStorage.
      loadDraftData: (draftData, draftTemplate, draftThemeName) =>
        set({
          portfolio: { ...defaultPortfolio, ...draftData },
          template:  draftTemplate  || "developer",
          themeName: draftThemeName || "midnight",
          history: [],
          future: [],
        }),

      fetchPortfolio: async (id) => {
        set({ isLoading: true });
        try {
          const url = id ? `/portfolios/${id}/` : "/portfolios/";
          const response = await api.get(url);
          let data = response.data;

          if (Array.isArray(data)) {
            if (data.length > 0) data = data[0];
            else { set({ isLoading: false }); return null; }
          }

          // Normalise skills to plain strings
          if (data.skills) {
            data.skills = data.skills.map((s) => (typeof s === "object" ? s.name : s));
          }

          // Merge user + social links
          const mergedUser = { ...defaultPortfolio.user, ...(data.user || {}) };
          if (data.user) {
            mergedUser.social = {
              github:    data.user.github    || "",
              twitter:   data.user.twitter   || "",
              linkedin:  data.user.linkedin  || "",
              facebook:  data.user.facebook  || "",
              instagram: data.user.instagram || "",
              website:   data.user.website   || "",
            };
          }

          const loaded = { ...defaultPortfolio, ...data, user: mergedUser };
          set({
            portfolio: loaded,
            template:  data.template || "developer",
            themeName: data.theme    || "midnight",
          });

          return loaded;
        } catch (error) {
          console.error("Failed to fetch portfolio", error);
          return null;
        } finally {
          set({ isLoading: false });
        }
      },

      savePortfolio: async (overrideName = null) => {
        set({ isLoading: true });
        try {
          const state = get();
          const payload = { ...state.portfolio, template: state.template, theme: state.themeName };

          if (overrideName) payload.name = overrideName;

          // Skills: backend expects array of objects
          if (payload.skills) {
            payload.skills = payload.skills.map((s) => (typeof s === "string" ? { name: s } : s));
          }

          // Flatten social links into user object for backend
          if (payload.user?.social) {
            payload.user = { ...payload.user, ...payload.user.social };
            delete payload.user.social;
          }

          const normaliseResponse = (data) => {
            if (data.skills) {
              data.skills = data.skills.map((s) => (typeof s === "object" ? s.name : s));
            }
            const mergedUser = { ...state.portfolio.user, ...(data.user || {}) };
            if (data.user) {
              mergedUser.social = {
                github:    data.user.github    || state.portfolio.user?.social?.github    || "",
                twitter:   data.user.twitter   || state.portfolio.user?.social?.twitter   || "",
                linkedin:  data.user.linkedin  || state.portfolio.user?.social?.linkedin  || "",
                facebook:  data.user.facebook  || state.portfolio.user?.social?.facebook  || "",
                instagram: data.user.instagram || state.portfolio.user?.social?.instagram || "",
                website:   data.user.website   || state.portfolio.user?.social?.website   || "",
              };
            }
            // Preserve pre-save email and contact
            if (state.portfolio.user?.email !== undefined) mergedUser.email = state.portfolio.user.email;
            return { ...state.portfolio, ...data, user: mergedUser, contact: state.portfolio.contact };
          };

          let savedId;
          if (state.portfolio.id) {
            const res = await api.put(`/portfolios/${state.portfolio.id}/`, payload);
            set({ portfolio: normaliseResponse(res.data) });
            savedId = res.data.id;
          } else {
            const res = await api.post("/portfolios/", payload);
            set({ portfolio: normaliseResponse(res.data) });
            savedId = res.data.id;
          }

          return savedId;
        } catch (error) {
          console.error("Failed to save portfolio", error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      setTemplate: (template) => {
        const prev = { portfolio: get().portfolio, template: get().template, themeName: get().themeName };
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
    }),
    {
      name: "pb-editor-draft",
      // Only persist the core editor content — not loading state or history
      partialize: (state) => ({
        portfolio: state.portfolio,
        template:  state.template,
        themeName: state.themeName,
      }),
    }
  )
);

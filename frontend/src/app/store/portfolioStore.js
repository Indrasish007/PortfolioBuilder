import { create } from "zustand";
import { defaultPortfolio } from "../services/mockPortfolio.js";
import api from "../services/api";

export const usePortfolioStore = create((set, get) => ({
  portfolio: defaultPortfolio,
  template: "developer",
  themeName: "midnight",
  history: [],
  future: [],
  isLoading: false,
  fetchPortfolio: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get('/portfolios/');
      if (response.data && response.data.length > 0) {
        const data = response.data[0];
        
        // Transform skills from [{id, name}] to ["name"]
        if (data.skills) {
          data.skills = data.skills.map(s => typeof s === 'object' ? s.name : s);
        }

        set({
          portfolio: data,
          template: data.template || "developer",
          themeName: data.theme || "midnight",
        });
      }
    } catch (error) {
      console.error("Failed to fetch portfolio", error);
    } finally {
      set({ isLoading: false });
    }
  },
  savePortfolio: async () => {
    set({ isLoading: true });
    try {
      const state = get();
      const payload = { ...state.portfolio, template: state.template, theme: state.themeName };
      
      // Transform skills from ["name"] to [{name: "name"}] for API
      if (payload.skills) {
        payload.skills = payload.skills.map(s => typeof s === 'string' ? { name: s } : s);
      }

      if (state.portfolio.id) {
        await api.put(`/portfolios/${state.portfolio.id}/`, payload);
      } else {
        const response = await api.post('/portfolios/', payload);
        set({ portfolio: response.data });
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
    set({ history: [...get().history, prev], future: [], template });
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

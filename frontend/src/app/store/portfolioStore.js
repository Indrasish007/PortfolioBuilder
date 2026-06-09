import { create } from "zustand";
import { defaultPortfolio } from "../services/mockPortfolio.js";
import api from "../services/api";

// Maps template → its default theme
const TEMPLATE_DEFAULT_THEME = {
  minimal: "minimal",
  scandinavian: "minimal",
  paper: "sand",
  typewriter: "sand",
  developer: "midnight",
  obsidian: "noir",
  architect: "slate",
  terminal: "forest",
  bold: "twilight",
  cyberpunk: "neon",
  space: "twilight",
  retro: "twilight",
  neon: "neon",
  quantum: "midnight",
  gradient: "gradientblue",
  aurora: "forest",
  glassmorphism: "glass",
  holographic: "glass",
  creative: "midnight",
  dusk: "sand",
  coral: "sand",
  sakura: "minimal",
  classic: "minimal",
  startup: "gradientblue",
  forest: "forest",
  oceanic: "neon",
  brutalist: "noir",
  monochrome: "minimal",
};

export const usePortfolioStore = create((set, get) => ({
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

  fetchPortfolio: async (id) => {
    if (!id || id === "null" || id === "undefined") {
      return null;
    }
    set({ isLoading: true });
    try {
      const response = await api.get(`/portfolios/${id}/`);
      let data = response.data;

      if (Array.isArray(data)) {
        if (data.length > 0) data = data[0];
        else {
          set({ isLoading: false });
          return null;
        }
      }

      // Normalise skills to plain strings
      if (data.skills) {
        data.skills = data.skills.map((s) => (typeof s === "object" ? s.name : s));
      }

      // Merge user + social links
      const mergedUser = { ...defaultPortfolio.user, ...(data.user || {}) };
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

      const loaded = { ...defaultPortfolio, ...data, user: mergedUser };
      set({
        portfolio: loaded,
        template: data.template || "developer",
        themeName: data.theme || "midnight",
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

      // Deep clone to safely modify nested objects without mutating state directly
      const payload = structuredClone({
        ...state.portfolio,
        template: state.template,
        theme: state.themeName,
      });

      if (overrideName) payload.name = overrideName;

      // Helper to convert dataURL to File for backend upload
      const dataURLtoFile = (dataurl, filename) => {
        try {
          const arr = dataurl.split(",");
          const mime = arr[0].match(/:(.*?);/)[1];
          const bstr = atob(arr[1]);
          let n = bstr.length;
          const u8arr = new Uint8Array(n);
          while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
          }
          return new File([u8arr], filename, { type: mime });
        } catch (e) {
          console.error("Failed to parse data URL", e);
          return null;
        }
      };

      // Helper to upload a base64 string if found
      const uploadIfBase64 = async (value, defaultFilename) => {
        if (typeof value === "string" && value.startsWith("data:")) {
          const file = dataURLtoFile(value, defaultFilename);
          if (file) {
            const formData = new FormData();
            formData.append("file", file);
            const res = await api.post("/portfolios/upload-image/", formData, {
              headers: { "Content-Type": "multipart/form-data" },
            });
            return res.data.url;
          }
        }
        return value;
      };

      // 1. Process portfolio avatar
      if (payload.avatar) {
        payload.avatar = await uploadIfBase64(payload.avatar, "avatar.png");
      }
      if (payload.user?.avatar) {
        payload.user.avatar = await uploadIfBase64(payload.user.avatar, "avatar.png");
      }

      // 2. Process portfolio resume
      if (payload.profile_resume_link) {
        payload.profile_resume_link = await uploadIfBase64(
          payload.profile_resume_link,
          "resume.pdf",
        );
      }
      if (payload.user?.resume_link) {
        payload.user.resume_link = await uploadIfBase64(payload.user.resume_link, "resume.pdf");
      }

      // 3. Process project images
      if (payload.projects) {
        payload.projects = await Promise.all(
          payload.projects.map(async (proj) => {
            if (proj.image) {
              proj.image = await uploadIfBase64(proj.image, "project.png");
            }
            return proj;
          }),
        );
      }

      // 4. Process gallery images
      if (payload.gallery) {
        payload.gallery = await Promise.all(
          payload.gallery.map(async (img, idx) => {
            return await uploadIfBase64(img, `gallery_${idx}.png`);
          }),
        );
      }

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
            github: data.user.github || state.portfolio.user?.social?.github || "",
            twitter: data.user.twitter || state.portfolio.user?.social?.twitter || "",
            linkedin: data.user.linkedin || state.portfolio.user?.social?.linkedin || "",
            facebook: data.user.facebook || state.portfolio.user?.social?.facebook || "",
            instagram: data.user.instagram || state.portfolio.user?.social?.instagram || "",
            website: data.user.website || state.portfolio.user?.social?.website || "",
          };
        }
        // Preserve pre-save email and contact
        if (state.portfolio.user?.email !== undefined)
          mergedUser.email = state.portfolio.user.email;
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
    const prev = {
      portfolio: get().portfolio,
      template: get().template,
      themeName: get().themeName,
    };
    const newTheme = TEMPLATE_DEFAULT_THEME[template] || get().themeName;
    set({ history: [...get().history, prev], future: [], template, themeName: newTheme });
  },

  setThemeName: (themeName) => {
    const prev = {
      portfolio: get().portfolio,
      template: get().template,
      themeName: get().themeName,
    };
    set({ history: [...get().history, prev], future: [], themeName });
  },

  updateField: (path, value) => {
    const prev = {
      portfolio: get().portfolio,
      template: get().template,
      themeName: get().themeName,
    };
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
    const cur = {
      portfolio: get().portfolio,
      template: get().template,
      themeName: get().themeName,
    };
    set({ ...last, history: h.slice(0, -1), future: [...get().future, cur] });
  },

  redo: () => {
    const f = get().future;
    if (!f.length) return;
    const next = f[f.length - 1];
    const cur = {
      portfolio: get().portfolio,
      template: get().template,
      themeName: get().themeName,
    };
    set({ ...next, future: f.slice(0, -1), history: [...get().history, cur] });
  },
}));

/**
 * useAutoSave — reliable auto-save hook for the portfolio editor.
 *
 * LocalStorage draft writing (for ALL portfolios, including new unsaved):
 *  - Debounced 2 s after every portfolio/template/theme change
 *  - Every 10 s as a safety-net interval
 *  - On tab hidden (visibilitychange)
 *  - On page close (beforeunload)
 *  - On unmount
 *
 * DB save (only for portfolios that already have an id):
 *  - Every 30 s (if changed)
 *  - On active section change
 *  - On tab hidden
 *  - On unmount
 *
 * Draft shape written to localStorage key 'editorDraft':
 *   { portfolioId, isNewUnsaved, data, template, themeName, savedAt }
 *
 * @returns {{ saveStatus, triggerSave }}
 *   saveStatus: 'idle' | 'saving' | 'saved' | 'failed'
 *   triggerSave: () => Promise<void>  — saves to DB immediately
 */

import { useState, useEffect, useRef, useCallback } from 'react';

export default function useAutoSave(portfolio, template, themeName, saveFn, sectionKey) {
  const [saveStatus, setSaveStatus] = useState('idle');

  // Refs — always fresh, no stale closures
  const portfolioRef  = useRef(portfolio);
  const templateRef   = useRef(template);
  const themeNameRef  = useRef(themeName);
  const saveFnRef     = useRef(saveFn);
  const lastSavedRef  = useRef(null);   // JSON signature of last DB-saved state
  const savingRef     = useRef(false);  // prevent concurrent DB saves
  const clearTimerRef = useRef(null);
  const debounceRef   = useRef(null);   // debounce timer for localStorage writes

  portfolioRef.current = portfolio;
  templateRef.current  = template;
  themeNameRef.current = themeName;
  saveFnRef.current    = saveFn;

  // ── Helper: write localStorage draft for ANY portfolio ───────────────────
  // This runs for both saved (has id) and new unsaved portfolios.
  const writeLocalDraft = useCallback(() => {
    const p = portfolioRef.current;
    try {
      localStorage.setItem('editorDraft', JSON.stringify({
        portfolioId:  p?.id   || null,
        isNewUnsaved: !p?.id,
        data:         p,
        template:     templateRef.current,
        themeName:    themeNameRef.current,
        savedAt:      new Date().toISOString(),
      }));
    } catch { /* ignore quota errors */ }
  }, []);

  // ── Core DB save function (only when portfolio has an id) ────────────────
  const triggerSave = useCallback(async () => {
    const p = portfolioRef.current;

    if (!p?.id)           return; // can't DB-save a new unsaved portfolio
    if (savingRef.current) return; // already saving

    const sig = JSON.stringify({
      ...p,
      user:  { ...p.user, avatar: p.user?.avatar ? '__has_avatar__' : '' },
      _tpl:  templateRef.current,
      _thm:  themeNameRef.current,
    });

    if (sig === lastSavedRef.current) return; // nothing changed

    savingRef.current = true;
    setSaveStatus('saving');
    clearTimeout(clearTimerRef.current);

    try {
      await saveFnRef.current();
      lastSavedRef.current = sig;
      setSaveStatus('saved');
      clearTimerRef.current = setTimeout(() => setSaveStatus('idle'), 3000);

      // After a successful DB save, also refresh the localStorage draft
      // so it reflects the saved state (isNewUnsaved becomes false)
      writeLocalDraft();

    } catch (err) {
      console.error('[AutoSave] DB save failed:', err);
      setSaveStatus('failed');
    } finally {
      savingRef.current = false;
    }
  }, [writeLocalDraft]);

  // ── Initialise lastSavedRef when a saved portfolio first loads ───────────
  const portfolioId = portfolio?.id;
  useEffect(() => {
    if (!portfolioId) return;
    const sig = JSON.stringify({
      ...portfolioRef.current,
      user: { ...portfolioRef.current?.user, avatar: portfolioRef.current?.user?.avatar ? '__has_avatar__' : '' },
      _tpl: templateRef.current,
      _thm: themeNameRef.current,
    });
    lastSavedRef.current = sig;
  }, [portfolioId]);

  // ── Debounced localStorage write on EVERY portfolio/template/theme change ─
  // 2-second debounce so we don't hammer storage on every keystroke.
  // Runs for ALL portfolios — saved AND new unsaved.
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      writeLocalDraft();
    }, 2000);
    return () => clearTimeout(debounceRef.current);
  }, [portfolio, template, themeName, writeLocalDraft]);

  // ── localStorage backup every 10 s ──────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => writeLocalDraft(), 10_000);
    return () => clearInterval(interval);
  }, [writeLocalDraft]);

  // ── DB auto-save timer: every 30 s (saved portfolios only) ──────────────
  useEffect(() => {
    if (!portfolioId) return;
    const interval = setInterval(() => triggerSave(), 30_000);
    return () => clearInterval(interval);
  }, [portfolioId, triggerSave]);

  // ── DB auto-save on section change ───────────────────────────────────────
  const prevSectionRef = useRef(sectionKey);
  useEffect(() => {
    if (prevSectionRef.current !== sectionKey && prevSectionRef.current !== null) {
      triggerSave();
    }
    prevSectionRef.current = sectionKey;
  }, [sectionKey, triggerSave]);

  // ── Save on tab hidden ────────────────────────────────────────────────────
  useEffect(() => {
    const handler = () => {
      if (document.hidden) {
        writeLocalDraft(); // always write local backup
        triggerSave();     // attempt DB save if applicable
      }
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [triggerSave, writeLocalDraft]);

  // ── Save on page close (beforeunload) ─────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      writeLocalDraft(); // always write local backup (works for new portfolios too)
      const p = portfolioRef.current;
      if (!p?.id) return; // nothing to block for unsaved-new portfolio
      const sig = JSON.stringify({ ...p, user: { ...p.user, avatar: p.user?.avatar ? '__has_avatar__' : '' } });
      if (sig === lastSavedRef.current) return; // DB is already up to date
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [writeLocalDraft]);

  // ── DB save on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      writeLocalDraft();
      triggerSave();
    };
  }, [triggerSave, writeLocalDraft]);

  return { saveStatus, triggerSave };
}

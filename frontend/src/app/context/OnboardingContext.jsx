import { createContext, useContext, useState, useCallback } from "react";

/**
 * OnboardingContext — global state that persists extracted + reviewed resume
 * data across the entire onboarding flow (Upload → Review → Templates → Editor).
 *
 * Nothing here touches the backend or portfolioStore directly.
 * The TemplateMarketplace reads reviewedData and pushes it into portfolioStore
 * only when the user selects a template during onboarding.
 */

const OnboardingContext = createContext(null);

const DEFAULT_REVIEWED_DATA = {
  full_name: "",
  headline: "",
  bio: "",
  email: "",
  phone: "",
  location: "",
  skills: [],
  experience: [],
  projects: [],
  social_links: [],
};

export function OnboardingProvider({ children }) {
  const [parsedData, setParsedData] = useState(null);   // raw AI response
  const [reviewedData, setReviewedData] = useState(null); // user-edited copy
  const [isFromResume, setIsFromResume] = useState(false);

  const initFromParsed = useCallback((data) => {
    // Deep clone so edits don't mutate the original parsed data
    const copy = JSON.parse(JSON.stringify({ ...DEFAULT_REVIEWED_DATA, ...data }));
    setParsedData(data);
    setReviewedData(copy);
    setIsFromResume(true);
  }, []);

  const resetOnboarding = useCallback(() => {
    setParsedData(null);
    setReviewedData(null);
    setIsFromResume(false);
  }, []);

  return (
    <OnboardingContext.Provider
      value={{
        parsedData,
        reviewedData,
        isFromResume,
        setParsedData,
        setReviewedData,
        initFromParsed,
        resetOnboarding,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error("useOnboarding must be used inside <OnboardingProvider>");
  return ctx;
}

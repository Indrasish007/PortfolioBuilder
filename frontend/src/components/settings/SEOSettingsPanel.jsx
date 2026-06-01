import { useState, useEffect } from "react";
import api from "../../app/services/api.js";
import { useToast } from "../../app/context/ToasterContext.jsx";
import GlassCard from "../../app/components/GlassCard.jsx";
import Button from "../../app/components/Button.jsx";
import { Save, Loader2, Globe, Sparkles } from "lucide-react";

export default function SEOSettingsPanel({ portfolio, onRefresh }) {
  const { toast } = useToast();
  
  // Custom states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ogImage, setOgImage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Sync with current portfolio data on load or external changes
  useEffect(() => {
    if (portfolio) {
      setTitle(portfolio.custom_seo_title || "");
      setDescription(portfolio.custom_seo_description || "");
      setOgImage(portfolio.custom_og_image || "");
    }
  }, [portfolio]);

  const handleSave = async () => {
    if (!portfolio?.id) return;
    setIsSaving(true);
    try {
      const payload = {
        custom_seo_title: title.trim() || null,
        custom_seo_description: description.trim() || null,
        custom_og_image: ogImage.trim() || null,
      };

      await api.patch(`/portfolios/${portfolio.id}/`, payload);
      
      toast({
        title: "SEO settings saved!",
        description: "Your custom SEO metadata has been successfully updated.",
        type: "success",
      });

      // Refresh the editor's store portfolio to update the score widget and parent state
      if (onRefresh) {
        await onRefresh();
      }
    } catch (err) {
      console.error("Failed to save SEO settings:", err);
      toast({
        title: "Save failed",
        description: "Something went wrong. Please check your inputs and try again.",
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Live Snippet Previews
  const previewTitle = title.trim() || portfolio?.seo?.title || "Professional Portfolio";
  const previewDescription = description.trim() || portfolio?.seo?.description || "Explore this professional portfolio — projects, skills, and experience.";
  const previewOgImage = ogImage.trim() || portfolio?.seo?.open_graph?.["og:image"] || "/og-default.png";
  const portfolioUrl = `${window.location.origin}/p/${portfolio?.slug || portfolio?.id || "username"}`;

  return (
    <GlassCard className="p-5 space-y-5">
      <div className="flex items-center gap-2 border-b border-border/40 pb-3">
        <Globe className="w-4 h-4 text-brand" />
        <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Custom SEO Settings</h3>
      </div>

      <div className="space-y-4">
        {/* Custom SEO Title */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-xs font-semibold text-muted-foreground" htmlFor="custom-seo-title">Custom Page Title</label>
            <span className={`text-[10px] font-mono ${title.length > 70 ? "text-red-400 font-bold" : "text-muted-foreground/60"}`}>
              {title.length}/70
            </span>
          </div>
          <input
            id="custom-seo-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
            className={`w-full h-9 px-3 rounded-lg bg-input/40 border text-sm focus:outline-none focus:ring-2 transition ${
              title.length > 70 ? "border-red-500/50 focus:ring-red-500/30" : "border-border focus:ring-brand"
            }`}
            placeholder={portfolio?.seo?.title || "e.g. Mohit Halder | Data Analyst"}
          />
          <p className="text-[10px] text-muted-foreground/50 mt-1">
            Override the default &quot;Name | Headline&quot; format. Optimal length is under 60-70 characters.
          </p>
        </div>

        {/* Custom Meta Description */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-xs font-semibold text-muted-foreground" htmlFor="custom-seo-desc">Meta Description Override</label>
            <span className={`text-[10px] font-mono ${description.length > 160 ? "text-red-400 font-bold" : "text-muted-foreground/60"}`}>
              {description.length}/160
            </span>
          </div>
          <textarea
            id="custom-seo-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={300}
            rows={3}
            className={`w-full p-2.5 rounded-lg bg-input/40 border text-sm focus:outline-none focus:ring-2 resize-none transition ${
              description.length > 160 ? "border-red-500/50 focus:ring-red-500/30" : "border-border focus:ring-brand"
            }`}
            placeholder={portfolio?.seo?.description || "Provide a summary of your portfolio..."}
          />
          <p className="text-[10px] text-muted-foreground/50 mt-1">
            Summarize your expertise for search indexers. Optimal length is between 120 and 160 characters.
          </p>
        </div>

        {/* Custom OG Image URL */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-xs font-semibold text-muted-foreground" htmlFor="custom-og-img">Social Image Override (URL)</label>
          </div>
          <input
            id="custom-og-img"
            value={ogImage}
            onChange={(e) => setOgImage(e.target.value)}
            className="w-full h-9 px-3 rounded-lg bg-input/40 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            placeholder="https://example.com/social-preview.png"
          />
          <p className="text-[10px] text-muted-foreground/50 mt-1">
            Specify a custom absolute image URL (1200x630 px) for social media link previews (LinkedIn, X, etc.).
          </p>

          {/* Optional Image URL Preview */}
          {ogImage.trim() && ogImage.startsWith("http") && (
            <div className="mt-3 rounded-lg overflow-hidden border border-border/40 aspect-[1.91/1] bg-muted/20 relative group">
              <img
                src={ogImage}
                alt="OG Preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Real-time Google Search Snippet Preview */}
      <div className="p-4 rounded-xl border border-border bg-black/30 space-y-1.5">
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest mb-1">
          <Sparkles className="w-3 h-3 text-brand" /> Search Result Snippet Preview
        </div>
        
        {/* Title */}
        <div className="text-[#1a0dab] dark:text-[#8ab4f8] hover:underline text-[18px] font-medium leading-tight line-clamp-1 cursor-pointer max-w-[600px] break-words">
          {previewTitle}
        </div>

        {/* URL */}
        <div className="text-[#202124] dark:text-[#dadce0] text-[13px] leading-tight truncate font-mono">
          {portfolioUrl}
        </div>

        {/* Description */}
        <div className="text-[#4d5156] dark:text-[#bdc1c6] text-xs leading-normal line-clamp-2 break-words">
          {previewDescription}
        </div>
      </div>

      {/* Save Button */}
      <Button
        onClick={handleSave}
        disabled={isSaving || title.length > 70 || description.length > 160}
        className="w-full flex items-center justify-center gap-1.5 font-bold"
      >
        {isSaving ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Saving SEO Settings...
          </>
        ) : (
          <>
            <Save className="w-4 h-4" /> Save SEO Settings
          </>
        )}
      </Button>
    </GlassCard>
  );
}

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Check, QrCode, Share2, Mail, Globe, ArrowLeft, Download, ExternalLink } from "lucide-react";
import { useToast } from "../context/ToasterContext.jsx";
import { generateSourceUrl, PLATFORMS } from "../utils/share.js";
import { useTheme } from "../context/ThemeContext.jsx";
import { QRCodeCanvas } from "qrcode.react";

// Inline brand SVGs for premium consistency
const BRAND_ICONS = {
  linkedin: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
    </svg>
  ),
  github: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
    </svg>
  ),
  medium: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M13.54 12a6.8 6.8 0 01-6.77 6.82A6.8 6.8 0 010 12a6.8 6.8 0 016.77-6.82A6.8 6.8 0 0113.54 12zm7.42 0c0 3.54-1.51 6.42-3.38 6.42s-3.38-2.88-3.38-6.42 1.51-6.42 3.38-6.42 3.38 2.88 3.38 6.42zm3.04 0c0 3.06-.35 5.54-.78 5.54s-.78-2.48-.78-5.54.35-5.54.78-5.54.78 2.48.78 5.54z" />
    </svg>
  ),
  stackoverflow: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M18.986 21.865v-6.435h2.24v8.62H1.022v-8.62h2.229v6.435h15.735zm-3.26-9.52l.965 2.019-7.39 3.535-.965-2.019 7.39-3.535zm1.536-3.829l1.417 1.737-6.368 5.187-1.418-1.737 6.369-5.187zm2.086-3.418l1.79 1.344-5.077 6.46-1.79-1.344 5.077-6.46zm2.42-2.736l2.079.824-3.535 7.39-2.079-.824 3.535-7.39zm-13.626 15.68h8.562v-2.229H8.142v2.229z" />
    </svg>
  ),
  hackernews: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M0 0h24v24H0V0zm12.9 13.55l4.305-8.15h-2.115l-3.24 6.645-3.285-6.645H6.555l4.305 8.1v4.8h2.04v-4.8z" />
    </svg>
  ),
  whatsapp: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.727-1.458L0 24zm6.59-4.846c1.6.95 3.16 1.455 4.88 1.456 5.483 0 9.942-4.437 9.945-9.899.001-2.646-1.026-5.133-2.893-7.001C16.656 1.843 14.171.815 11.53.815 6.046.815 1.588 5.253 1.585 10.716c-.001 1.777.464 3.506 1.348 5.04L1.928 21.23l5.63-1.477z" />
    </svg>
  ),
  telegram: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M22.05 1.577c-.396 0-.785.1-1.117.288L1.472 11.83c-.885.426-1.442 1.285-1.47 2.24-.027.953.473 1.846 1.32 2.308l5.222 2.855 1.867 5.696c.27 1.01.884 1.2 1.83 1.023l2.85-2.617 5.617 4.144c.732.54 1.62.628 2.4.246.776-.38 1.258-1.157 1.284-2.01l3.057-20.088c.08-.528-.063-1.066-.396-1.477-.33-.41-.83-.65-1.374-.65zm-11.75 14.28L18.8 7.424M10.3 15.857v4.618l1.837-3.928" />
    </svg>
  ),
  discord: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.094 13.094 0 01-1.873-.894.077.077 0 01-.008-.128c.126-.093.252-.19.372-.287a.075.075 0 01.077-.011c3.92 1.793 8.18 1.793 12.061 0a.073.073 0 01.078.009c.12.099.246.195.373.289a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.894.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.156 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.156 2.418z" />
    </svg>
  ),
  twitter: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  facebook: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z" />
    </svg>
  ),
  instagram: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051C.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  ),
  reddit: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M24 11.5c0-1.65-1.35-3-3-3-.96 0-1.86.48-2.42 1.24-1.64-1-3.85-1.64-6.23-1.72l1.37-4.34 3.74.83c.04.97.85 1.75 1.84 1.75 1.02 0 1.85-.83 1.85-1.85S19.52 2.5 18.5 2.5c-.83 0-1.54.55-1.77 1.3l-4.13-.91c-.24-.05-.47.09-.53.33l-1.61 5.12C8.07 8.43 5.83 9.07 4.17 10.07A3 3 0 002 9.5c-1.65 0-3 1.35-3 3 0 1.23.75 2.27 1.8 2.73-.07.41-.1.83-.1 1.25 0 3.86 4.49 7 10 7s10-3.14 10-7c0-.42-.03-.84-.1-1.25 1.05-.46 1.8-1.5 1.8-2.73zM7 13.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5c0 .83-.67 1.5-1.5 1.5S7 14.33 7 13.5zm11.5 3c-1.2 1.2-3.48 1.3-3.5 1.3-.06 0-.13-.03-.18-.08-.05-.05-.08-.12-.08-.19a15.65 15.65 0 013.5-1.3c.07 0 .14.03.18.08.05.05.08.12.08.19zm-.65-1.5c-.83 0-1.5-.67-1.5-1.5 0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5c0 .83-.67 1.5-1.5 1.5z" />
    </svg>
  ),
  youtube: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M23.498 6.163a3.003 3.003 0 00-2.11-2.11C19.517 3.545 12 3.545 12 3.545s-7.517 0-9.388.508a3.003 3.003 0 00-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 002.11 2.11c1.871.508 9.388.508 9.388.508s7.517 0 9.388-.508a3.003 3.003 0 002.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  )
};

const PLATFORM_DESCRIPTIONS = {
  linkedin: "Share to your professional network timeline or send private messages to recruiters.",
  github: "Link from your GitHub profile readme, repositories, or description.",
  medium: "Reference or embed in your blog posts and developer publications.",
  stackoverflow: "Add to your developer profile page or resume/CV links.",
  hackernews: "Submit your work and discuss with the Hacker News community.",
  whatsapp: "Send directly to your chat contacts, groups, or professional contacts.",
  telegram: "Send to friends or broadcast to your channels/groups.",
  discord: "Post in developer communities or share in direct messages.",
  email: "Send a formal email invitation with your custom portfolio link.",
  twitter: "Share an update on your timeline feed or send a direct message.",
  facebook: "Post to your personal timeline, page, or messenger groups.",
  instagram: "Add to your bio description or share in direct messages.",
  reddit: "Share your projects on show-and-tell developer subreddits.",
  youtube: "Feature in your channel about tab or video descriptions."
};

export default function ShareModal({ isOpen, onClose, portfolioUrl, portfolioName }) {
  const { toast } = useToast();
  const { theme } = useTheme();
  const [view, setView] = useState("platforms"); // "platforms" | "qrcode"
  const modalRef = useRef(null);

  // Close modal on escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
      // Auto focus modal wrapper for keyboard trap
      if (modalRef.current) modalRef.current.focus();
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  const baseOrigin = window.location.origin;
  // Ensure we use the correct absolute URL, replacing relative routes if necessary
  const urlSafe = portfolioUrl || "";
  const absoluteBaseUrl = urlSafe.startsWith("http") 
    ? urlSafe 
    : `${baseOrigin}${urlSafe.startsWith("/") ? "" : "/"}${urlSafe}`;

  console.log("[ShareModal] render - portfolioUrl:", portfolioUrl, "absoluteBaseUrl:", absoluteBaseUrl);

  // Synchronous, foolproof clipboard writing helper
  const copyTextToClipboard = (text) => {
    let success = false;
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.width = "2em";
    textArea.style.height = "2em";
    textArea.style.padding = "0";
    textArea.style.border = "none";
    textArea.style.outline = "none";
    textArea.style.boxShadow = "none";
    textArea.style.background = "transparent";
    textArea.style.opacity = "0.01";

    try {
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      success = document.execCommand("copy");
      console.log("[ShareModal] execCommand copy result:", success);
    } catch (err) {
      console.warn("[ShareModal] execCommand copy failed, using fallback:", err);
    } finally {
      if (textArea && textArea.parentNode) {
        textArea.parentNode.removeChild(textArea);
      }
    }

    // 2. Fallback to async writeText if synchronous fails
    if (!success && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => console.log("[ShareModal] Async copy text success"))
        .catch((err) => {
          console.error("[ShareModal] Async clipboard write text failed", err);
        });
      success = true;
    }
    
    return success;
  };

  // Quick Action Handlers
  const handleCopyDirect = () => {
    console.log("[ShareModal] handleCopyDirect clicked");
    const success = copyTextToClipboard(absoluteBaseUrl);
    if (success) {
      toast({
        title: "✓ Direct link copied",
        description: "The untracked clean link has been copied to your clipboard.",
        type: "success"
      });
    } else {
      toast({
        title: "Copy failed",
        description: "Please select and copy the URL manually.",
        type: "error"
      });
    }
  };

  const handleCopyTracked = () => {
    console.log("[ShareModal] handleCopyTracked clicked");
    const trackedUrl = generateSourceUrl(absoluteBaseUrl, "share");
    const success = copyTextToClipboard(trackedUrl);
    if (success) {
      toast({
        title: "✓ Tracked link copied",
        description: "Clipboard has been updated with: ?utm_source=share",
        type: "success"
      });
    } else {
      toast({
        title: "Copy failed",
        description: "Please select and copy the URL manually.",
        type: "error"
      });
    }
  };

  const handleNativeShare = async () => {
    console.log("[ShareModal] handleNativeShare clicked");
    const trackedUrl = generateSourceUrl(absoluteBaseUrl, "native_share");
    if (navigator.share) {
      try {
        await navigator.share({
          title: portfolioName || "Personal Portfolio",
          text: `Check out ${portfolioName || "my"} professional portfolio!`,
          url: trackedUrl
        });
        toast({ title: "✓ Shared successfully!", type: "success" });
      } catch (err) {
        if (err.name !== "AbortError") {
          toast({ title: "Sharing failed", description: err.message, type: "error" });
        }
      }
    } else {
      toast({
        title: "Native share unavailable",
        description: "Your browser does not support native sharing. Try direct channels.",
        type: "info"
      });
    }
  };

  // Platform Execution Action Handler
  const handlePlatformShare = (platformKey, platform, actionType) => {
    const trackedUrl = generateSourceUrl(absoluteBaseUrl, platformKey);
    const text = `Check out my professional portfolio!`;

    // 1. Build intent URL first
    let intentUrl = trackedUrl;
    if (actionType === "feed" && platform.getFeedUrl) {
      intentUrl = platform.getFeedUrl(trackedUrl, text);
    } else if (actionType === "message" && platform.getMessageUrl) {
      intentUrl = platform.getMessageUrl(trackedUrl, text);
    } else if (platform.openUrl) {
      intentUrl = platform.openUrl;
    }

    // 2. Copy FIRST (sync execCommand stays within the gesture tick,
    //    so window.open below is still allowed by the browser).
    const syncSuccess = copyTextToClipboard(trackedUrl);
    if (syncSuccess) {
      toast({
        title: `✓ ${platform.name} link copied`,
        description: "Tracked URL copied — opening platform now.",
        type: "success"
      });
    } else if (navigator.clipboard && navigator.clipboard.writeText) {
      // Async fallback (HTTPS / production) — fires after window.open
      navigator.clipboard.writeText(trackedUrl)
        .then(() => {
          toast({
            title: `✓ ${platform.name} link copied`,
            description: "Tracked URL copied to clipboard.",
            type: "success"
          });
        })
        .catch(() => {
          toast({
            title: `${platform.name} opened`,
            description: "Clipboard blocked — copy the link from the bar below.",
            type: "info"
          });
        });
    } else {
      toast({
        title: `${platform.name} opened`,
        description: "Copy the link from the URL bar below.",
        type: "info"
      });
    }

    // 3. Open the platform AFTER copying
    window.open(intentUrl, "_blank", "noopener,noreferrer");
  };

  // QR Code Actions
  const handleDownloadQR = () => {
    const canvas = document.getElementById("share-qr-canvas");
    if (!canvas) return;
    try {
      const url = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = url;
      link.download = `${portfolioName ? portfolioName.replace(/\s+/g, "_") : "portfolio"}_qr_code.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: "✓ QR Code downloaded!", type: "success" });
    } catch (err) {
      toast({ title: "Download failed", description: "Could not download QR canvas.", type: "error" });
    }
  };

  const handleCopyQR = () => {
    const canvas = document.getElementById("share-qr-canvas");
    if (!canvas) return;
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob })
        ]);
        toast({
          title: "✓ QR Code copied!",
          description: "QR Code image has been copied to your clipboard.",
          type: "success"
        });
      } catch (err) {
        toast({
          title: "Copy failed",
          description: "Browser limits direct canvas copies. Use download button instead.",
          type: "error"
        });
      }
    }, "image/png");
  };

  // Group platforms into matching objects
  const groupedPlatforms = {
    professional: [],
    messaging: [],
    social: []
  };

  Object.entries(PLATFORMS).forEach(([key, platform]) => {
    if (groupedPlatforms[platform.group]) {
      groupedPlatforms[platform.group].push({ key, ...platform });
    }
  });

  const renderPlatformGrid = (title, items) => {
    if (items.length === 0) return null;
    return (
      <div className="space-y-4">
        <h4 className="text-[11px] font-black uppercase tracking-wider text-muted-foreground/80 pl-1">
          {title}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((plat) => (
            <div
              key={plat.key}
              className="flex flex-col p-4 rounded-2xl border border-zinc-200/80 dark:border-white/[0.08] bg-white dark:bg-zinc-900/40 hover:border-zinc-300 dark:hover:border-white/[0.15] transition-all duration-300 shadow-sm hover:shadow-md animate-in fade-in zoom-in-95 duration-200"
            >
              <div className="flex items-start gap-3.5 mb-3">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm"
                  style={{ backgroundColor: plat.color }}
                >
                  {BRAND_ICONS[plat.key] || <Globe className="w-5 h-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="font-bold text-sm text-foreground block">{plat.name}</span>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {PLATFORM_DESCRIPTIONS[plat.key] || "Share your professional portfolio link."}
                  </p>
                </div>
              </div>

              <div className="mt-auto pt-2">
                {/* Feed + Message style */}
                {plat.type === "feed_message" && (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handlePlatformShare(plat.key, plat, "feed")}
                      className="text-xs py-2 px-3 font-bold rounded-xl bg-indigo-50/60 dark:bg-white/[0.04] hover:bg-indigo-100/80 dark:hover:bg-white/[0.1] text-indigo-600 dark:text-indigo-300 hover:text-indigo-700 dark:hover:text-indigo-200 transition cursor-pointer text-center focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      Share to Feed
                    </button>
                    <button
                      onClick={() => handlePlatformShare(plat.key, plat, "message")}
                      className="text-xs py-2 px-3 font-bold rounded-xl bg-emerald-50/60 dark:bg-white/[0.04] hover:bg-emerald-100/80 dark:hover:bg-white/[0.1] text-emerald-600 dark:text-emerald-300 hover:text-emerald-700 dark:hover:text-emerald-200 transition cursor-pointer text-center focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      Share via Msg
                    </button>
                  </div>
                )}

                {/* Message Only style */}
                {plat.type === "message_only" && (
                  <button
                    onClick={() => handlePlatformShare(plat.key, plat, "message")}
                    className="w-full text-xs py-2 px-3 font-bold rounded-xl bg-emerald-50/60 dark:bg-white/[0.04] hover:bg-emerald-100/80 dark:hover:bg-white/[0.1] text-emerald-600 dark:text-emerald-300 hover:text-emerald-700 dark:hover:text-emerald-200 text-center transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    Send Message
                  </button>
                )}

                {/* Copy & Open style */}
                {plat.type === "copy_open" && (
                  <button
                    onClick={() => handlePlatformShare(plat.key, plat, "share")}
                    className="w-full text-xs py-2 px-3 font-bold rounded-xl bg-indigo-50/60 dark:bg-white/[0.04] hover:bg-indigo-100/80 dark:hover:bg-white/[0.1] text-indigo-600 dark:text-indigo-300 hover:text-indigo-700 dark:hover:text-indigo-200 text-center transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    Copy & Open Platform
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const qrBg = theme === "dark" ? "#09090b" : "#ffffff";
  const qrFg = theme === "dark" ? "#6366f1" : "#4f46e5";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed top-[var(--header-height)] bottom-0 left-0 right-0 z-[800] flex items-start justify-center p-4 md:p-8 overflow-y-auto bg-black/75 backdrop-blur-md">
          {/* Click outside to close wrapper */}
          <div className="absolute inset-0" onClick={onClose} />

          <motion.div
            ref={modalRef}
            tabIndex={-1}
            initial={{ scale: 0.95, y: -20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: -20, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="relative z-[900] w-full max-w-3xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/90 dark:border-white/[0.08] shadow-2xl rounded-3xl overflow-hidden flex flex-col my-auto md:my-10 max-h-[calc(100vh-var(--header-height)-4rem)] focus:outline-none"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 pr-16 border-b border-zinc-200/80 dark:border-white/[0.04] bg-white dark:bg-zinc-900/10 relative">
              {view === "qrcode" ? (
                <button 
                  onClick={() => setView("platforms")}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition font-bold cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Channels
                </button>
              ) : (
                <div>
                  <h3 className="font-black text-base text-foreground uppercase tracking-wider">Share Your Portfolio</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 font-medium">Generate tracked links, QR codes, and social shares.</p>
                </div>
              )}
              {/* Sticky close button with minimum 40x40 touch area */}
              <button 
                onClick={onClose}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-zinc-200/60 dark:hover:bg-white/[0.06] transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Actions Header Bar */}
            {view === "platforms" && (
              <div className="p-4 bg-white dark:bg-zinc-900/10 border-b border-zinc-200/80 dark:border-white/[0.04] grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                <button
                  onClick={handleCopyDirect}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-zinc-200/80 dark:border-white/[0.04] bg-white dark:bg-zinc-900/20 hover:bg-zinc-100 dark:hover:bg-white/[0.06] text-foreground transition font-bold shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <Copy className="w-4 h-4 text-indigo-500 dark:text-indigo-400" /> Direct Link
                </button>
                <button
                  onClick={handleCopyTracked}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-zinc-200/80 dark:border-white/[0.04] bg-white dark:bg-zinc-900/20 hover:bg-zinc-100 dark:hover:bg-white/[0.06] text-foreground transition font-bold shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <Share2 className="w-4 h-4 text-indigo-500 dark:text-indigo-400" /> Tracked Link
                </button>
                <button
                  onClick={() => setView("qrcode")}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-zinc-200/80 dark:border-white/[0.04] bg-white dark:bg-zinc-900/20 hover:bg-zinc-100 dark:hover:bg-white/[0.06] text-foreground transition font-bold shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <QrCode className="w-4 h-4 text-indigo-500 dark:text-indigo-400" /> QR Code
                </button>
                <button
                  onClick={handleNativeShare}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-zinc-200/80 dark:border-white/[0.04] bg-white dark:bg-zinc-900/20 hover:bg-zinc-100 dark:hover:bg-white/[0.06] text-foreground transition font-bold shadow-sm cursor-pointer col-span-1 focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <ExternalLink className="w-4 h-4 text-indigo-500 dark:text-indigo-400" /> Native Share
                </button>
              </div>
            )}

            {/* Body Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-zinc-50 dark:bg-zinc-950">
              {view === "platforms" ? (
                <>
                  {renderPlatformGrid("Professional Networks", groupedPlatforms.professional)}
                  {renderPlatformGrid("Messaging Platforms", groupedPlatforms.messaging)}
                  {renderPlatformGrid("Social Platforms", groupedPlatforms.social)}

                  {/* Bottom URL Display bar */}
                  <div className="pt-6 border-t border-zinc-200/80 dark:border-white/[0.04]">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2.5 pl-1">
                      Default Copy Link Preview
                    </div>
                    <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white dark:bg-black/30 border border-zinc-200/80 dark:border-white/[0.04] min-w-0 shadow-inner">
                      <span className="font-mono text-xs text-muted-foreground truncate flex-1 pl-1 select-all select-none select-text">
                        {generateSourceUrl(absoluteBaseUrl, "share")}
                      </span>
                      <button
                        onClick={handleCopyTracked}
                        className="p-2.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 shrink-0 transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring"
                        title="Copy tracked URL"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                /* QR Code view */
                <div className="flex flex-col items-center justify-center py-6 text-center space-y-6">
                  <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] shadow-md shrink-0 relative">
                    <QRCodeCanvas
                      id="share-qr-canvas"
                      value={generateSourceUrl(absoluteBaseUrl, "qrcode")}
                      size={220}
                      bgColor={qrBg}
                      fgColor={qrFg}
                      level={"H"}
                      includeMargin={true}
                    />
                    {/* Fine micro-glow under canvas */}
                    <div className="absolute inset-0 bg-indigo-500/5 rounded-2xl blur-lg pointer-events-none -z-10" />
                  </div>

                  <div className="space-y-1.5 max-w-sm">
                    <h4 className="font-black text-base text-foreground">Your QR Code is Ready!</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Scanning this code dynamically attributes hits to the <span className="text-indigo-600 dark:text-indigo-400 font-bold">QR Code</span> source in your analytics portal.
                    </p>
                  </div>

                  <div className="flex gap-3 w-full max-w-xs">
                    <button
                      onClick={handleCopyQR}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] hover:bg-zinc-100 dark:hover:bg-white/[0.08] text-foreground text-xs font-bold transition shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <Copy className="w-4 h-4" /> Copy Image
                    </button>
                    <button
                      onClick={handleDownloadQR}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-brand hover:brightness-105 active:scale-[0.98] text-white text-xs font-bold transition shadow-glow cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <Download className="w-4 h-4" /> Download
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

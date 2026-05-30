import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, ChevronDown, ChevronUp, Send, Mail,
  Inbox, HelpCircle, CheckCircle, XCircle, Clock,
  Loader2, ChevronRight, Trash2
} from "lucide-react";
import GlassCard from "../components/GlassCard.jsx";
import Button from "../components/Button.jsx";
import Badge from "../components/Badge.jsx";
import { useAuthStore } from "../store/authStore.js";
import api from "../services/api.js";
import BackButton from "../components/BackButton.jsx";
import { useToast } from "../context/ToasterContext.jsx";


// ─── FAQ Data ────────────────────────────────────────────────────────────────
const FAQ_DATA = [
  {
    category: "🗂️ Getting Started",
    questions: [
      { q: "How do I create my first portfolio?", a: "Go to the Dashboard and click the '+ New portfolio' button in the top bar. You'll be taken to the editor where you can choose a template and start filling in your details." },
      { q: "How do I publish my portfolio?", a: "In the editor, click the 'Publish' button in the top-right corner. Your portfolio will be live instantly at a unique link." },
      { q: "How do I share my portfolio link?", a: "After publishing, go to Dashboard → your portfolio card → click 'Share'. You can copy the link or share directly. Your link is in the format: /p/your-slug." },
      { q: "Can I create multiple portfolios?", a: "Yes! Click '+ New portfolio' from the dashboard header anytime. Each portfolio is independent with its own template and content." },
      { q: "How do I switch between portfolios?", a: "Go to the Dashboard page to see all your portfolios as cards. Click any card to open it in the editor." },
    ],
  },
  {
    category: "🎨 Editor & Design",
    questions: [
      { q: "How do I change my portfolio template?", a: "In the editor, click the palette icon in the top bar or go to Templates. Pick a new template — your content is preserved." },
      { q: "How do I change my portfolio theme?", a: "Open the editor and click the theme/color icon. Select from light, dark, or custom accent color options." },
      { q: "How do I upload a profile picture?", a: "Go to Settings → Profile. Upload your photo there. It will appear on all your portfolios automatically." },
      { q: "Why is my theme not changing?", a: "Try a hard refresh (Ctrl+Shift+R). If the issue persists, try clearing your browser cache and reloading." },
      { q: "How do I add projects to my portfolio?", a: "In the editor, scroll to the Projects section and click '+ Add Project'. Fill in the title, description, tech stack, and optional links." },
      { q: "How do I add my skills?", a: "In the editor, find the Skills section. Type a skill name and press Enter or the '+' button to add it." },
      { q: "Does my portfolio auto-save?", a: "Yes! Changes are auto-saved every few seconds while you type. You'll see a 'Saved' indicator in the editor toolbar." },
      { q: "How do I restore unsaved changes?", a: "If you accidentally navigate away, the editor checks for a local draft and shows a 'Restore draft' banner at the top. Click it to restore." },
    ],
  },
  {
    category: "📊 Analytics",
    questions: [
      { q: "How does visit tracking work?", a: "When someone opens your public portfolio link, a visit is recorded with their approximate country (via IP) and device type." },
      { q: "Why is my visit count showing wrong?", a: "Your own visits may be counted. Also, some ad-blockers prevent the tracking beacon. The count reflects real external views." },
      { q: "How is the country of a visitor detected?", a: "We use the visitor's IP address to infer their country. This is approximate and may not be 100% accurate for VPN users." },
      { q: "What is the portfolio score?", a: "The portfolio score (0–100) rates how complete and polished your portfolio is, based on sections filled, content quality, and profile completeness." },
      { q: "How do I get a perfect portfolio score?", a: "Fill in all sections: bio, profile picture, at least 2 projects with descriptions, 5+ skills, education, and at least one social link." },
      { q: "How does view time tracking work?", a: "We track how long a visitor stays on your portfolio using page visibility events. The session time is sent when they leave." },
      { q: "Why is my view time showing 0 on the live site?", a: "This can happen if the tracking beacon is blocked by ad-blockers or browser privacy extensions. Local development visits may also show 0." },
    ],
  },
  {
    category: "🔔 Project Insights",
    questions: [
      { q: "How are top projects ranked in the bell notification?", a: "Projects are ranked by total click count — how many times visitors clicked on each project card on your live portfolio." },
      { q: "How is project click count tracked?", a: "Clicks on project cards on your live public portfolio are counted. Each unique click event is recorded in real time." },
      { q: "Why are my project clicks not updating?", a: "Clicks are tracked on the live public portfolio only (not in the editor preview). Make sure your portfolio is published and try opening it in an incognito window." },
    ],
  },
  {
    category: "⚙️ Settings & Account",
    questions: [
      { q: "How do I change my username?", a: "Go to Settings → Account. Update your display name and click Save." },
      { q: "How do I change my email?", a: "Email changes are not yet supported via the UI for security reasons. Contact support to request an email change." },
      { q: "How do I change my password?", a: "Go to Settings → Security and use the Change Password form." },
      { q: "How do I delete my account?", a: "Go to Settings → Account → scroll to the bottom and click 'Delete Account'. This is permanent and cannot be undone." },
      { q: "What happens to my portfolios if I delete my account?", a: "All your portfolios, analytics data, and support tickets are permanently deleted along with your account." },
      { q: "How do I sign out?", a: "Click your profile picture in the top-right of the dashboard, then click 'Sign out'." },
    ],
  },
  {
    category: "🤖 AI Features",
    questions: [
      { q: "How does the AI rewrite feature work?", a: "In the editor, click the '✨ Rewrite with AI' button next to your bio or project description. The AI analyzes your text and produces a polished, professional version." },
      { q: "Which AI model is used for rewriting?", a: "We use Google Gemini (gemini-2.0-flash) for all AI rewrites and CV parsing." },
      { q: "Can I undo an AI rewrite?", a: "Yes! After an AI rewrite, an 'Undo' button appears briefly. You can also just retype or paste your original text back." },
      { q: "Why is the AI rewrite button not working?", a: "Ensure you have some text in the field before clicking rewrite. If it still fails, the AI service may be temporarily unavailable — try again in a minute." },
    ],
  },
  {
    category: "🛠️ Troubleshooting",
    questions: [
      { q: "Why is my portfolio not loading?", a: "Check if it's published (green 'Live' badge on Dashboard). If published, try clearing cache or opening in incognito mode." },
      { q: "Why is my analytics showing 0?", a: "Analytics only count visits from the live public URL, not the editor preview. Share your public link and wait for real visitors." },
      { q: "Why is my country not showing in analytics?", a: "Some visitors use VPNs or privacy tools that mask their IP. The country may show as 'Unknown' in those cases." },
      { q: "Why does the editor keep opening a blank page?", a: "This happens when no previous portfolio draft or last-edited portfolio is found. Click '+ New portfolio' to start fresh." },
      { q: "Why is my profile picture changing for all portfolios?", a: "Profile pictures are linked to your account, not individual portfolios. Changing it in Settings updates it globally." },
      { q: "My changes are not saving — what do I do?", a: "Check your internet connection. The editor auto-saves but requires a connection. If offline, changes are kept in a local draft until you reconnect." },
      { q: "The site works on localhost but not on Vercel — why?", a: "Usually a missing environment variable or CORS issue. Ensure VITE_API_URL points to your production backend URL on Render, and check CORS_ALLOWED_ORIGINS in your backend settings." },
    ],
  },
];

// ─── Category Badge Colors ────────────────────────────────────────────────────
const CATEGORY_COLORS = {
  general: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  bug: "bg-red-500/20 text-red-400 border-red-500/30",
  feature: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  account: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  analytics: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  editor: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  other: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

const STATUS_CONFIG = {
  pending: { label: "Pending", icon: Clock, color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  answered: { label: "Answered", icon: CheckCircle, color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  closed: { label: "Closed", icon: XCircle, color: "bg-gray-500/20 text-gray-400 border-gray-500/30" },
};

// ─── FAQ Tab ─────────────────────────────────────────────────────────────────
function FAQTab() {
  const [search, setSearch] = useState("");
  const [openCategory, setOpenCategory] = useState(null);
  const [openQuestion, setOpenQuestion] = useState(null);

  const searchLower = search.toLowerCase();
  const filtered = search.trim()
    ? FAQ_DATA.map((cat) => ({
        ...cat,
        questions: cat.questions.filter(
          (item) =>
            item.q.toLowerCase().includes(searchLower) ||
            item.a.toLowerCase().includes(searchLower)
        ),
      })).filter((cat) => cat.questions.length > 0)
    : FAQ_DATA;

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search FAQs — How can we help you?"
          className="w-full h-14 pl-12 pr-4 rounded-2xl border border-border bg-background/50 text-base focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <XCircle className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* No results */}
      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <HelpCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No results found. Try a different search or contact support below.</p>
        </div>
      )}

      {/* FAQ Categories */}
      <div className="space-y-3">
        {filtered.map((cat) => {
          const isCatOpen = search.trim() ? true : openCategory === cat.category;
          return (
            <GlassCard key={cat.category} className="rounded-2xl overflow-hidden">
              <button
                onClick={() => setOpenCategory(isCatOpen && !search ? null : cat.category)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-accent/20 transition"
              >
                <span className="font-semibold text-sm">{cat.category}</span>
                <span className="text-muted-foreground text-xs flex items-center gap-2">
                  <span>{cat.questions.length} questions</span>
                  {isCatOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </span>
              </button>
              <AnimatePresence>
                {isCatOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-border/40 divide-y divide-border/30">
                      {cat.questions.map((item) => {
                        const key = `${cat.category}::${item.q}`;
                        const isOpen = openQuestion === key;
                        return (
                          <div key={item.q}>
                            <button
                              onClick={() => setOpenQuestion(isOpen ? null : key)}
                              className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-accent/10 transition text-sm"
                            >
                              <span className={isOpen ? "text-foreground font-medium" : "text-muted-foreground"}>
                                {item.q}
                              </span>
                              <ChevronRight className={`w-4 h-4 flex-shrink-0 ml-2 transition-transform text-muted-foreground ${isOpen ? "rotate-90" : ""}`} />
                            </button>
                            <AnimatePresence>
                              {isOpen && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden"
                                >
                                  <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed border-l-2 border-brand/40 ml-5">
                                    {item.a}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}

// ─── Contact Support Tab ──────────────────────────────────────────────────────
function ContactTab() {
  const user = useAuthStore((s) => s.user) || {};
  const [formData, setFormData] = useState({
    user_name: user.name || "",
    user_email: user.email || "",
    category: "general",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const validate = () => {
    const e = {};
    if (!formData.user_name.trim()) e.user_name = "Name is required.";
    if (!formData.user_email.trim()) e.user_email = "Email is required.";
    if (!formData.subject.trim()) e.subject = "Subject is required.";
    if (formData.message.trim().length < 20) e.message = "Message must be at least 20 characters.";
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setIsSubmitting(true);
    setSubmitError("");
    try {
      await api.post("/support/tickets/", formData);
      setSubmitted(true);
      setFormData({ user_name: user.name || "", user_email: user.email || "", category: "general", subject: "", message: "" });
    } catch (err) {
      console.error("[ContactTab] Submit error:", err);
      const isTimeout = err.code === "ECONNABORTED" || err.message?.includes("timeout");
      if (isTimeout) {
        setSubmitError("❌ Request timed out. The server took too long to respond — please try again.");
      } else {
        const serverMsg = err.response?.data?.error || err.response?.data?.detail || "";
        setSubmitError(serverMsg
          ? `❌ ${serverMsg}`
          : "❌ Failed to send message. Please check your connection and try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };


  if (submitted) {
    return (
      <div className="py-16 text-center flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-emerald-400" />
        </div>
        <h3 className="text-xl font-bold">Message Sent!</h3>
        <p className="text-muted-foreground text-sm max-w-sm">
          ✅ Your message has been sent! We'll get back to you within 24 hours.
        </p>
        <Button variant="ghost" size="sm" onClick={() => setSubmitted(false)}>Send another message</Button>
      </div>
    );
  }

  const inputClass = "w-full h-11 px-4 rounded-xl border border-border bg-background/50 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition";
  const errorClass = "text-xs text-red-400 mt-1";
  const labelClass = "block text-sm font-medium text-muted-foreground mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className={labelClass}>Full Name</label>
          <input name="user_name" value={formData.user_name} onChange={handleChange} placeholder="Your name" className={inputClass} />
          {errors.user_name && <p className={errorClass}>{errors.user_name}</p>}
        </div>
        <div>
          <label className={labelClass}>Email Address</label>
          <input name="user_email" type="email" value={formData.user_email} onChange={handleChange} placeholder="you@example.com" className={inputClass} />
          {errors.user_email && <p className={errorClass}>{errors.user_email}</p>}
        </div>
      </div>

      <div>
        <label className={labelClass}>Category</label>
        <select name="category" value={formData.category} onChange={handleChange} className={`${inputClass} cursor-pointer`}>
          <option value="general">General</option>
          <option value="bug">Bug Report</option>
          <option value="feature">Feature Request</option>
          <option value="account">Account Issue</option>
          <option value="analytics">Analytics Issue</option>
          <option value="editor">Editor Issue</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <label className={labelClass}>Subject</label>
        <input name="subject" value={formData.subject} onChange={handleChange} placeholder="Brief summary of your issue" className={inputClass} />
        {errors.subject && <p className={errorClass}>{errors.subject}</p>}
      </div>

      <div>
        <label className={labelClass}>Message</label>
        <textarea
          name="message"
          value={formData.message}
          onChange={handleChange}
          rows={6}
          placeholder="Describe your issue in detail (minimum 20 characters)…"
          className="w-full p-4 rounded-xl border border-border bg-background/50 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition resize-none"
        />
        {errors.message && <p className={errorClass}>{errors.message}</p>}
        <p className="text-xs text-muted-foreground mt-1">{formData.message.length} / 20+ chars</p>
      </div>

      {submitError && <p className="text-sm text-red-400">{submitError}</p>}

      <Button type="submit" disabled={isSubmitting} className="flex items-center gap-2">
        {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</> : <><Send className="w-4 h-4" /> Send Message</>}
      </Button>
    </form>
  );
}

// ─── Inbox Tab ────────────────────────────────────────────────────────────────
function InboxTab() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const res = await api.get("/support/tickets/");
        setTickets(res.data);
      } catch {
        setTickets([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, []);

  const deleteTicket = async (e, ticketId) => {
    e.stopPropagation(); // Avoid selecting/opening the ticket details
    const confirmed = window.confirm(
      'Are you sure you want to delete this support ticket? This action cannot be undone.'
    );
    
    if (!confirmed) return;
    
    try {
      setDeletingId(ticketId);
      await api.delete(`/support/tickets/${ticketId}/`);
      
      // Remove deleted ticket from UI immediately
      setTickets(prev => prev.filter(ticket => ticket.id !== ticketId));
      toast({
        title: "Ticket deleted successfully",
        description: "The support ticket has been permanently removed.",
        type: "success"
      });
      
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Failed to delete ticket",
        description: "An error occurred while trying to delete this ticket. Please try again.",
        type: "error"
      });
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="text-center py-16">
        <Inbox className="w-14 h-14 mx-auto mb-4 text-muted-foreground opacity-30" />
        <h3 className="font-semibold mb-1">No support tickets yet</h3>
        <p className="text-sm text-muted-foreground">
          If you need help, use the <strong>Contact Support</strong> tab!
        </p>
      </div>
    );
  }

  if (selected) {
    const st = STATUS_CONFIG[selected.status] || STATUS_CONFIG.pending;
    const catColor = CATEGORY_COLORS[selected.category] || CATEGORY_COLORS.other;
    return (
      <div className="space-y-4">
        <button
          onClick={() => setSelected(null)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition"
        >
          <ChevronDown className="w-4 h-4 rotate-90" /> Back to inbox
        </button>
        <GlassCard className="rounded-2xl p-6 space-y-4">
          <div className="flex flex-wrap items-start gap-2 justify-between">
            <div>
              <h3 className="font-bold text-lg">{selected.subject}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Submitted {new Date(selected.created_at).toLocaleString()}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${catColor}`}>
                {selected.category}
              </span>
              <span className={`text-xs px-2.5 py-1 rounded-full border font-medium flex items-center gap-1 ${st.color}`}>
                <st.icon className="w-3 h-3" /> {st.label}
              </span>
            </div>
          </div>

          <div className="rounded-xl bg-accent/20 p-4">
            <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wider">Your Message</p>
            <p className="text-sm leading-relaxed">{selected.message}</p>
          </div>

          {selected.admin_reply && (
            <div className="rounded-xl border border-brand/20 bg-brand/5 p-4">
              <p className="text-xs text-brand mb-1 font-medium uppercase tracking-wider">Reply from Support</p>
              <p className="text-sm leading-relaxed">{selected.admin_reply}</p>
              {selected.replied_at && (
                <p className="text-xs text-muted-foreground mt-2">
                  Replied {new Date(selected.replied_at).toLocaleString()}
                </p>
              )}
            </div>
          )}

          {!selected.admin_reply && (
            <div className="text-sm text-muted-foreground text-center py-3 glass rounded-xl">
              ⏳ No reply yet. We'll respond within 24 hours.
            </div>
          )}
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tickets.map((ticket) => {
        const st = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.pending;
        const catColor = CATEGORY_COLORS[ticket.category] || CATEGORY_COLORS.other;
        return (
          <motion.div
            key={ticket.id}
            whileHover={{ scale: 1.005 }}
            onClick={() => setSelected(ticket)}
            className="cursor-pointer"
          >
            <GlassCard className="rounded-2xl p-4 hover:shadow-glow transition relative group">
              <div className="flex items-start gap-3 justify-between flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${catColor}`}>
                      {ticket.category}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium flex items-center gap-1 ${st.color}`}>
                      <st.icon className="w-3 h-3" /> {st.label}
                    </span>
                  </div>
                  <p className="font-semibold text-sm truncate">{ticket.subject}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                    {ticket.message.slice(0, 100)}{ticket.message.length > 100 ? "…" : ""}
                  </p>
                </div>
                <div className="text-right flex-shrink-0 flex flex-col items-end justify-between h-full min-h-[50px]">
                  <p className="text-xs text-muted-foreground">
                    {new Date(ticket.created_at).toLocaleDateString()}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    {ticket.status !== 'closed' && (
                      <button
                        onClick={(e) => deleteTicket(e, ticket.id)}
                        disabled={deletingId !== null}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition"
                        title="Delete ticket"
                      >
                        {deletingId === ticket.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Main HelpCenter Page ─────────────────────────────────────────────────────
const TABS = [
  { id: "faq", label: "FAQ & Search", icon: Search },
  { id: "contact", label: "Contact Support", icon: Mail },
  { id: "inbox", label: "My Inbox", icon: Inbox },
];

export default function HelpCenter() {
  const [activeTab, setActiveTab] = useState("faq");

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <BackButton />
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <HelpCircle className="w-5 h-5 text-brand" />
          <h1 className="text-2xl font-bold">Help Center</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Find answers or reach our support team.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 glass rounded-2xl overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition whitespace-nowrap flex-1 justify-center ${
              activeTab === tab.id
                ? "bg-background shadow-card text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/30"
            }`}
          >
            <tab.icon className="w-4 h-4 flex-shrink-0" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "faq" && <FAQTab />}

          {activeTab === "contact" && (
            <GlassCard className="rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-9 h-9 rounded-xl glass border border-brand/20 flex items-center justify-center">
                  <Mail className="w-4 h-4 text-brand" />
                </div>
                <div>
                  <h3 className="font-semibold">Contact Support</h3>
                  <p className="text-xs text-muted-foreground">We typically reply within 24 hours</p>
                </div>
              </div>
              <ContactTab />
            </GlassCard>
          )}
          {activeTab === "inbox" && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Inbox className="w-5 h-5 text-brand" />
                <h3 className="font-semibold">My Support Tickets</h3>
              </div>
              <InboxTab />
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

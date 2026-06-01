import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Send, X } from "lucide-react";
import api from "../services/api.js";

export default function AIWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "ai", text: "Hi Alex 👋 I'm your AI co-pilot. Ask me to rewrite your hero, suggest projects to feature, or improve your bio." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!input.trim()) return;
    const q = input;
    setMessages((m) => [...m, { role: "user", text: q }]);
    setInput("");
    setLoading(true);
    try {
      const res = await api.post('/ai/assistant/', { prompt: q });
      setMessages((m) => [...m, { role: "ai", text: res.data.reply }]);
    } catch (e) {
      setMessages((m) => [...m, { role: "ai", text: "Sorry, I'm having trouble connecting right now." }]);
    }
    setLoading(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 px-4 h-12 rounded-full gradient-bg text-white shadow-glow animate-glow-pulse"
      >
        <Sparkles className="w-4 h-4" /> AI assistant
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            className="fixed bottom-5 right-5 z-50 w-[min(92vw,380px)] h-[520px] glass rounded-2xl shadow-card flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 pr-14 border-b border-border/50 relative">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg gradient-bg flex items-center justify-center"><Sparkles className="w-3.5 h-3.5 text-white" /></span>
                <div>
                  <div className="text-sm font-semibold">AI co-pilot</div>
                  <div className="text-[10px] text-muted-foreground">Online · GPT-4 class</div>
                </div>
              </div>
              <button 
                onClick={() => setOpen(false)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-zinc-200/60 dark:hover:bg-white/[0.06] transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
                aria-label="Close AI assistant"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm ${m.role === "user" ? "gradient-bg text-white" : "glass"}`}>{m.text}</div>
                </div>
              ))}
              {loading && <div className="text-xs text-muted-foreground animate-pulse">Thinking…</div>}
            </div>
            <div className="p-3 border-t border-border/50 flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Ask anything…"
                className="flex-1 h-10 px-3 rounded-lg bg-input/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button onClick={send} className="h-10 w-10 rounded-lg gradient-bg text-white flex items-center justify-center"><Send className="w-4 h-4" /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

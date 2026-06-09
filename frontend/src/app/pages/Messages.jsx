import { useState, useEffect, useRef } from "react";
import { useToast } from "../context/ToasterContext.jsx";
import api from "../services/api.js";
import { 
  Search, Mail, MailOpen, Trash2, Copy, Check, Filter, 
  ChevronDown, RefreshCw, MessageSquare, AlertCircle, Calendar, 
  Inbox, Info
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Button from "../components/Button.jsx";

export default function Messages() {
  const { toast } = useToast();
  const [messages, setMessages] = useState([]);
  const [stats, setStats] = useState({ total: 0, unread: 0, this_month: 0, portfolios_receiving: 0 });
  const [portfolios, setPortfolios] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedPortfolio, setSelectedPortfolio] = useState("all");
  const [filterType, setFilterType] = useState("all"); // 'all', 'unread', 'read'
  const [sortBy, setSortBy] = useState("newest"); // 'newest', 'oldest'
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const [selectedIds, setSelectedIds] = useState([]);
  const [copied, setCopied] = useState(false);

  // Debounce search input (400ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch portfolios lists on mount
  useEffect(() => {
    const fetchPortfolios = async () => {
      try {
        const res = await api.get('/portfolios/');
        setPortfolios(res.data || []);
      } catch (err) {
        console.error("Failed to fetch portfolios list", err);
      }
    };
    fetchPortfolios();
  }, []);

  // Fetch stats & messages when filters or debounced search changes
  useEffect(() => {
    fetchStats();
    fetchMessages(true);
  }, [debouncedSearch, selectedPortfolio, filterType, sortBy]);

  // Listen for real-time WebSocket incoming messages dispatched from DashboardLayout
  useEffect(() => {
    const handleNewWebSocketMessage = (e) => {
      const newMsg = e.detail;
      if (!newMsg) return;

      fetchStats();

      const matchesPortfolio = selectedPortfolio === "all" || String(newMsg.portfolio) === String(selectedPortfolio);
      const matchesRead = filterType === "all" || filterType === "unread";

      if (matchesPortfolio && matchesRead) {
        setMessages(prev => {
          if (prev.some(m => m.id === newMsg.id)) return prev;
          return [newMsg, ...prev];
        });
      }
    };

    window.addEventListener('newMessageReceived', handleNewWebSocketMessage);
    return () => {
      window.removeEventListener('newMessageReceived', handleNewWebSocketMessage);
    };
  }, [selectedPortfolio, filterType]);

  const notifyDashboardBadgeUpdate = (count) => {
    window.dispatchEvent(new CustomEvent('updateUnreadCount', { detail: count }));
  };

  const fetchStats = async () => {
    try {
      const res = await api.get('/portfolios/messages/stats/');
      setStats(res.data);
      notifyDashboardBadgeUpdate(res.data.unread);
    } catch (err) {
      console.error("Failed to fetch messages stats", err);
    }
  };

  const fetchMessages = async (reset = false) => {
    if (reset) {
      setLoading(true);
      setPage(1);
    } else {
      setLoadingMore(true);
    }
    setError(null);

    try {
      const currentPage = reset ? 1 : page;
      const params = {
        page: currentPage,
        sort: sortBy,
        search: debouncedSearch
      };

      if (selectedPortfolio !== "all") {
        params.portfolio_id = selectedPortfolio;
      }

      if (filterType === "unread") {
        params.is_read = "false";
      } else if (filterType === "read") {
        params.is_read = "true";
      }

      const res = await api.get('/portfolios/messages/', { params });
      const newMessages = res.data.results || [];
      setHasMore(!!res.data.next);

      if (reset) {
        setMessages(newMessages);
        setSelectedIds([]);
        if (newMessages.length > 0) {
          // Keep current selected if it is in newMessages, otherwise select first new message
          const found = newMessages.find(m => m.id === selectedMessage?.id);
          if (found) {
            setSelectedMessage(found);
          } else {
            setSelectedMessage(newMessages[0]);
          }
        } else {
          setSelectedMessage(null);
        }
      } else {
        setMessages(prev => {
          const combined = [...prev];
          newMessages.forEach(msg => {
            if (!combined.some(m => m.id === msg.id)) {
              combined.push(msg);
            }
          });
          return combined;
        });
      }
    } catch (err) {
      console.error("Failed to fetch messages list", err);
      setError("Failed to load messages. Please click retry.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreMessages = () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    setPage(prev => {
      const nextPage = prev + 1;
      api.get('/portfolios/messages/', {
        params: {
          page: nextPage,
          sort: sortBy,
          search: debouncedSearch,
          portfolio_id: selectedPortfolio !== "all" ? selectedPortfolio : undefined,
          is_read: filterType === "unread" ? "false" : filterType === "read" ? "true" : undefined
        }
      }).then(res => {
        setMessages(prevMsgs => {
          const combined = [...prevMsgs];
          (res.data.results || []).forEach(msg => {
            if (!combined.some(m => m.id === msg.id)) {
              combined.push(msg);
            }
          });
          return combined;
        });
        setHasMore(!!res.data.next);
        setLoadingMore(false);
      }).catch(err => {
        console.error("Failed to load more", err);
        toast({ title: "Load More Failed", description: "Could not load next page.", type: "error" });
        setLoadingMore(false);
      });
      return nextPage;
    });
  };

  const handleListScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 50) {
      loadMoreMessages();
    }
  };

  // Optimistic UI updates helper
  const handleSingleMessageUpdate = async (msgId, updates, apiCall) => {
    const originalMessages = [...messages];
    const originalSelected = selectedMessage ? { ...selectedMessage } : null;

    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, ...updates } : m));
    if (selectedMessage && selectedMessage.id === msgId) {
      setSelectedMessage(prev => ({ ...prev, ...updates }));
    }

    try {
      await apiCall();
      fetchStats();
    } catch (err) {
      console.error("API update failed", err);
      setMessages(originalMessages);
      setSelectedMessage(originalSelected);
      toast({ title: "Operation Failed", description: "Connection error. Reverting change.", type: "error" });
    }
  };

  const toggleReadStatus = (msg) => {
    const newReadStatus = !msg.is_read;
    handleSingleMessageUpdate(
      msg.id,
      { is_read: newReadStatus },
      () => api.patch(`/portfolios/messages/${msg.id}/`, { is_read: newReadStatus })
    );
  };

  const handleDeleteMessage = (msg) => {
    if (!confirm("Are you sure you want to delete this message permanently?")) return;
    
    handleSingleMessageUpdate(
      msg.id,
      null,
      async () => {
        await api.delete(`/portfolios/messages/${msg.id}/`);
        setMessages(prev => prev.filter(m => m.id !== msg.id));
        setSelectedMessage(prev => {
          const index = messages.findIndex(m => m.id === msg.id);
          const remaining = messages.filter(m => m.id !== msg.id);
          if (remaining.length === 0) return null;
          return remaining[Math.min(index, remaining.length - 1)];
        });
        toast({ title: "Message Deleted", description: "Message deleted permanently.", type: "success" });
      }
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === messages.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(messages.map(m => m.id));
    }
  };

  const handleBulkAction = async (actionType) => {
    if (selectedIds.length === 0) return;

    const originalMessages = [...messages];
    const originalSelected = selectedMessage ? { ...selectedMessage } : null;

    if (actionType === 'read') {
      setMessages(prev => prev.map(m => selectedIds.includes(m.id) ? { ...m, is_read: true } : m));
      if (selectedMessage && selectedIds.includes(selectedMessage.id)) {
        setSelectedMessage(prev => ({ ...prev, is_read: true }));
      }
    } else if (actionType === 'unread') {
      setMessages(prev => prev.map(m => selectedIds.includes(m.id) ? { ...m, is_read: false } : m));
      if (selectedMessage && selectedIds.includes(selectedMessage.id)) {
        setSelectedMessage(prev => ({ ...prev, is_read: false }));
      }
    } else if (actionType === 'delete') {
      setMessages(prev => prev.filter(m => !selectedIds.includes(m.id)));
      if (selectedMessage && selectedIds.includes(selectedMessage.id)) {
        setSelectedMessage(null);
      }
    }

    try {
      await api.post('/portfolios/messages/bulk-actions/', {
        ids: selectedIds,
        action: actionType
      });
      setSelectedIds([]);
      fetchStats();
      toast({
        title: "Bulk Action Completed",
        description: `Successfully applied action '${actionType}' to ${selectedIds.length} messages.`,
        type: "success"
      });
      if (actionType === 'delete') {
        fetchMessages(true);
      }
    } catch (err) {
      console.error(err);
      setMessages(originalMessages);
      setSelectedMessage(originalSelected);
      toast({ title: "Bulk Action Failed", description: "Failed to update bulk messages.", type: "error" });
    }
  };

  const handleCopyEmail = (email) => {
    navigator.clipboard.writeText(email);
    setCopied(true);
    toast({ title: "Email Copied", description: `${email} copied to clipboard.`, type: "success" });
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const diffMs = now - d;
      const diffMin = Math.floor(diffMs / 60000);
      const diffHr = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHr / 24);

      if (diffMin < 1) return "Just now";
      if (diffMin < 60) return `${diffMin}m ago`;
      if (diffHr < 24) return `${diffHr}h ago`;
      if (diffDay < 7) return `${diffDay}d ago`;

      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch (e) {
      return "";
    }
  };

  const formatFullDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      return d.toLocaleString("en-US", { 
        day: "numeric", month: "short", year: "numeric", 
        hour: "numeric", minute: "2-digit", hour12: true 
      });
    } catch (e) {
      return "";
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Message Center</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage inquiries sent by visitors through your portfolio contact forms.
          </p>
        </div>
        <Button size="sm" variant="outline" className="self-start md:self-auto flex items-center gap-2" onClick={() => { fetchStats(); fetchMessages(true); }}>
          <RefreshCw className="w-3.5 h-3.5" /> Reload Inbox
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Messages", value: stats.total, color: "var(--brand)" },
          { label: "Unread Messages", value: stats.unread, color: "#f59e0b", badge: stats.unread > 0 },
          { label: "Received This Month", value: stats.this_month, color: "#10b981" },
          { label: "Receiving Portfolios", value: stats.portfolios_receiving, color: "#8b5cf6" },
        ].map((s, idx) => (
          <div key={idx} className="glass rounded-2xl p-5 border border-border/30 relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:border-border/60 hover:shadow-glow">
            <div className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">{s.label}</div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</span>
              {s.badge && <span className="animate-pulse flex h-2 w-2 rounded-full bg-amber-500" />}
            </div>
          </div>
        ))}
      </div>

      {/* Main Inbox Window */}
      <div className="glass rounded-3xl border border-border/30 overflow-hidden flex flex-col min-h-[600px] shadow-2xl">
        <div className="p-4 border-b border-border/30 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-card/10">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search sender, email, content..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-border/30 bg-background/50 text-sm focus:outline-none focus:ring-2 focus:ring-brand/45 focus:border-brand transition"
              />
            </div>
            
            <div className="relative">
              <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <select
                value={selectedPortfolio}
                onChange={e => setSelectedPortfolio(e.target.value)}
                className="pl-9 pr-8 py-2 rounded-xl border border-border/30 bg-background/50 text-sm focus:outline-none focus:ring-2 focus:ring-brand/45 cursor-pointer appearance-none min-w-[150px]"
              >
                <option value="all">All Portfolios</option>
                {portfolios.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          <div className="flex items-center gap-3 justify-between">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="px-3 py-2 rounded-xl border border-border/30 bg-background/50 text-sm focus:outline-none focus:ring-2 focus:ring-brand/45 cursor-pointer min-w-[130px]"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>

            <div className="flex bg-background/50 p-1 rounded-xl border border-border/30">
              {[
                { id: "all", label: "All" },
                { id: "unread", label: "Unread" },
                { id: "read", label: "Read" }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setFilterType(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    filterType === tab.id ? "bg-brand text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bulk Actions floating header */}
        <AnimatePresence>
          {selectedIds.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-4 py-3 bg-brand/10 border-b border-border/30 flex items-center justify-between gap-4 overflow-hidden"
            >
              <div className="text-xs font-bold text-brand flex items-center gap-2">
                <Check className="w-4 h-4" /> Selected {selectedIds.length} message(s)
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleBulkAction('read')} className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-background border border-border/30 hover:border-border/60 transition flex items-center gap-1.5"><MailOpen className="w-3.5 h-3.5" /> Read</button>
                <button onClick={() => handleBulkAction('unread')} className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-background border border-border/30 hover:border-border/60 transition flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Unread</button>
                <button onClick={() => handleBulkAction('delete')} className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-500 transition flex items-center gap-1.5"><Trash2 className="w-3.5 h-3.5" /> Delete</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Split pane list and detail panels */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0">
          <div className="w-full md:w-[360px] border-r border-border/30 flex flex-col min-h-0 bg-background/25">
            <div 
              onScroll={handleListScroll}
              className="flex-1 overflow-y-auto p-2 space-y-2 min-h-0 max-h-[500px] md:max-h-none"
            >
              {loading && messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center h-48 md:h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand mb-3" />
                  <span className="text-sm text-muted-foreground">Loading messages...</span>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center p-8 text-center h-48 md:h-full">
                  <AlertCircle className="w-8 h-8 text-destructive mb-3" />
                  <span className="text-sm font-semibold">{error}</span>
                  <button onClick={() => fetchMessages(true)} className="mt-3 text-xs text-brand font-bold underline">Retry</button>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center h-48 md:h-full">
                  <Inbox className="w-10 h-10 text-muted-foreground/40 mb-3" />
                  <span className="text-sm font-semibold text-muted-foreground">Inbox is empty</span>
                </div>
              ) : (
                <>
                  <div className="px-2 py-1.5 flex items-center justify-between border-b border-border/10">
                    <button onClick={handleToggleSelectAll} className="text-xs text-muted-foreground font-semibold hover:text-foreground transition flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === messages.length && messages.length > 0}
                        onChange={handleToggleSelectAll}
                        className="rounded border-border/30 accent-brand w-3.5 h-3.5 cursor-pointer"
                      />
                      Select All
                    </button>
                    <span className="text-[10px] text-muted-foreground font-mono">{messages.length} loaded</span>
                  </div>

                  <AnimatePresence initial={false}>
                    {messages.map((msg) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => setSelectedMessage(msg)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer relative group flex gap-3 ${
                          selectedMessage?.id === msg.id ? "bg-brand/10 border-brand/50 shadow-sm" : "bg-card/5 hover:bg-card/25 border-border/20"
                        } ${!msg.is_read ? "font-semibold text-foreground" : "text-muted-foreground"}`}
                      >
                        <div className="flex items-start pt-0.5" onClick={e => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(msg.id)}
                            onChange={() => {
                              setSelectedIds(prev => prev.includes(msg.id) ? prev.filter(id => id !== msg.id) : [...prev, msg.id]);
                            }}
                            className="rounded border-border/30 accent-brand w-3.5 h-3.5 cursor-pointer"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-bold text-foreground truncate">{msg.sender_name}</span>
                            <span className="text-[10px] text-muted-foreground/80 flex-shrink-0">{formatTimeAgo(msg.created_at)}</span>
                          </div>
                          <div className="text-[11px] text-brand/80 font-medium truncate mt-0.5">
                            Portfolio: {msg.portfolio_name}
                          </div>
                          <p className="text-xs text-muted-foreground truncate mt-1">
                            {msg.message}
                          </p>
                        </div>

                        {!msg.is_read && (
                          <div className="absolute top-4 right-3 w-1.5 h-1.5 rounded-full bg-brand shadow-glow animate-pulse" />
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {hasMore && (
                    <button
                      onClick={loadMoreMessages}
                      disabled={loadingMore}
                      className="w-full py-2 border border-dashed border-border/30 rounded-xl text-xs text-muted-foreground hover:text-foreground hover:border-border/60 transition flex items-center justify-center gap-2"
                    >
                      {loadingMore ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current" />
                          Loading more...
                        </>
                      ) : "Load More Messages"}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Right Pane Detail Panel */}
          <div className="flex-1 flex flex-col bg-background/5 min-h-[300px]">
            {selectedMessage ? (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="p-5 border-b border-border/30 flex items-start justify-between gap-4 flex-wrap bg-card/5">
                  <div className="flex gap-3 items-start">
                    <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center text-white font-bold text-sm shadow-md">
                      {selectedMessage.sender_name?.[0]?.toUpperCase() || "V"}
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                        {selectedMessage.sender_name}
                      </h2>
                      <div className="text-xs text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="font-mono">{selectedMessage.sender_email}</span>
                        <button
                          onClick={() => handleCopyEmail(selectedMessage.sender_email)}
                          className="p-1 rounded hover:bg-accent hover:text-foreground text-muted-foreground transition flex items-center gap-1"
                        >
                          {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 text-right">
                    <div className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatFullDate(selectedMessage.created_at)}
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand/10 border border-brand/20 text-brand">
                      Portfolio: {selectedMessage.portfolio_name}
                    </div>
                  </div>
                </div>

                {/* Detail View Toolbar */}
                <div className="px-5 py-2.5 border-b border-border/10 flex items-center justify-between bg-card/10 gap-2 flex-wrap">
                  <button
                    onClick={() => toggleReadStatus(selectedMessage)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-background border border-border/30 hover:border-border/60 transition flex items-center gap-1.5"
                  >
                    {selectedMessage.is_read ? (
                      <><Mail className="w-3.5 h-3.5" /> Mark as Unread</>
                    ) : (
                      <><MailOpen className="w-3.5 h-3.5" /> Mark as Read</>
                    )}
                  </button>

                  <button
                    onClick={() => handleDeleteMessage(selectedMessage)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-500 transition flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete permanently
                  </button>
                </div>

                <div className="flex-1 p-6 overflow-y-auto min-h-0">
                  <div className="bg-card/10 p-5 rounded-2xl border border-border/20 text-sm leading-relaxed whitespace-pre-wrap font-sans text-foreground" style={{ minHeight: "200px" }}>
                    {selectedMessage.message}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground bg-card/2">
                <MessageSquare className="w-12 h-12 text-muted-foreground/30 mb-3" />
                <span className="text-sm font-semibold">Select a message</span>
                <p className="text-xs text-muted-foreground/60 mt-1">Select an item from the inbox list pane to view full sender details.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

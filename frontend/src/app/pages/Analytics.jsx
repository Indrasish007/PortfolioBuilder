import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Sparkles, ArrowUp, Eye, Users, Download, Globe } from "lucide-react";
import GlassCard from "../components/GlassCard.jsx";
import Badge from "../components/Badge.jsx";
import { useState, useEffect } from "react";
import api from "../services/api.js";

const COLORS = ["#a78bfa", "#22d3ee", "#f472b6"];

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await api.get('/analytics/');
        setData(response.data);
      } catch (error) {
        console.error("Failed to load analytics", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading analytics...</div>;
  if (!data) return <div className="p-8 text-center text-muted-foreground">Failed to load analytics.</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground text-sm">Insights from your last 14 days.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { l: "Total views", v: (data.total_views || 0).toLocaleString(), d: "Live", i: Eye },
          { l: "Visitors", v: (data.total_visitors || 0).toLocaleString(), d: "Live", i: Users },
          { l: "Resume DLs", v: (data.downloads || 0).toLocaleString(), d: "Live", i: Download },
          { l: "Countries", v: (data.countries ? data.countries.length : 0).toString(), d: "Live", i: Globe },
        ].map((s) => (
          <GlassCard key={s.l} className="p-5">
            <div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">{s.l}</span><s.i className="w-4 h-4 text-muted-foreground" /></div>
            <div className="text-2xl font-bold mt-1">{s.v}</div>
            <div className="text-xs text-emerald-400 inline-flex items-center gap-1 mt-1">{s.d}</div>
          </GlassCard>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <GlassCard className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="font-semibold">Views over time</div>
            <Badge variant="glass">Last 14 days</Badge>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.views}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="day" stroke="rgba(255,255,255,0.4)" fontSize={11} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} />
                <Tooltip contentStyle={{ background: "rgba(20,20,30,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} />
                <Area type="monotone" dataKey="views" stroke="#a78bfa" strokeWidth={2} fill="url(#g1)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="font-semibold mb-4">Devices</div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.devices} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={4}>
                  {data.devices.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "rgba(20,20,30,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5 mt-2">
            {data.devices.map((d, i) => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ background: COLORS[i] }} />{d.name}</span>
                <span className="text-muted-foreground">{d.value}%</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <GlassCard className="p-5 lg:col-span-2">
          <div className="font-semibold mb-4">Visitors by country</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.countries}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="country" stroke="rgba(255,255,255,0.4)" fontSize={11} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} />
                <Tooltip contentStyle={{ background: "rgba(20,20,30,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} />
                <Bar dataKey="visits" fill="#22d3ee" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard className="p-5" glow>
          <div className="flex items-center gap-2 mb-3"><Sparkles className="w-4 h-4 text-brand" /><span className="font-semibold">AI suggestions</span></div>
          <ul className="space-y-3">
            {data.suggestions.map((s) => (
              <li key={s} className="text-sm rounded-lg glass p-3">{s}</li>
            ))}
          </ul>
        </GlassCard>
      </div>
    </div>
  );
}

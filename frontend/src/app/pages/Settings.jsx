import { useState } from "react";
import { User, Bell, Lock, Globe, Trash2 } from "lucide-react";
import GlassCard from "../components/GlassCard.jsx";
import Input from "../components/Input.jsx";
import Button from "../components/Button.jsx";
import Badge from "../components/Badge.jsx";
import BackButton from "../components/BackButton.jsx";
import { useAuthStore } from "../store/authStore.js";

const tabs = [
  { id: "profile", label: "Profile", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Lock },
  { id: "domain", label: "Domain", icon: Globe },
];

export default function Settings() {
  const [tab, setTab] = useState("profile");
  const user = useAuthStore((s) => s.user) || {};
  return (
    <div className="space-y-6">
      <BackButton />
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm">Manage your account, billing and preferences.</p>
      </div>
      <div className="grid lg:grid-cols-[220px_1fr] gap-4">
        <GlassCard className="p-2 h-fit flex flex-row overflow-x-auto lg:flex-col lg:overflow-x-visible gap-1.5 no-scrollbar">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-shrink-0 lg:w-full flex items-center gap-2.5 px-4 lg:px-3 h-10 rounded-lg text-sm transition ${
                tab === t.id ? "bg-accent text-foreground font-semibold" : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
              }`}>
              <t.icon className="w-4 h-4 flex-shrink-0" /> {t.label}
            </button>
          ))}
        </GlassCard>

        <div className="space-y-4">
          {tab === "profile" && (
            <>
              <GlassCard>
                <div className="font-semibold mb-4">Profile</div>
                <div className="grid md:grid-cols-2 gap-4">
                  <Input label="Full name" defaultValue={user.name || ""} />
                  <Input label="Username" defaultValue={user.username || ""} hint="portfolio.ai/u/username" />
                  <Input label="Email" defaultValue={user.email || ""} />
                  <Input label="Location" defaultValue={user.location || ""} />
                </div>
                <div className="flex justify-end mt-4"><Button>Save changes</Button></div>
              </GlassCard>
              <GlassCard>
                <div className="font-semibold text-destructive mb-2">Danger zone</div>
                <p className="text-sm text-muted-foreground mb-4">Permanently delete your account and all portfolios. This can't be undone.</p>
                <Button variant="destructive"><Trash2 className="w-4 h-4" /> Delete account</Button>
              </GlassCard>
            </>
          )}
          {tab === "notifications" && (
            <GlassCard>
              <div className="font-semibold mb-4">Email notifications</div>
              {["Weekly analytics digest", "New visitor from a top-tier company", "AI suggestions ready", "Product updates"].map((l) => (
                <div key={l} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
                  <span className="text-sm">{l}</span>
                  <input type="checkbox" defaultChecked className="accent-[var(--brand)] scale-125" />
                </div>
              ))}
            </GlassCard>
          )}
          {tab === "security" && (
            <GlassCard>
              <div className="font-semibold mb-4">Security</div>
              <Input label="Current password" type="password" />
              <div className="grid md:grid-cols-2 gap-4 mt-3">
                <Input label="New password" type="password" />
                <Input label="Confirm new password" type="password" />
              </div>
              <div className="flex justify-end mt-4"><Button>Update password</Button></div>
            </GlassCard>
          )}
          {tab === "domain" && (
            <GlassCard>
              <div className="font-semibold mb-2">Custom domain</div>
              <p className="text-sm text-muted-foreground mb-4">Connect your own domain. We'll handle SSL.</p>
              <div className="flex gap-2">
                <Input placeholder="alexcarter.com" />
                <Button>Connect</Button>
              </div>
              <div className="mt-4 glass rounded-lg p-3 text-xs text-muted-foreground">
                Add a CNAME record pointing to <code className="text-foreground">cname.portfolio.ai</code>.
              </div>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
}

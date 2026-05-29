import { useState, useEffect, useRef, useCallback } from "react";
import {
  User, Phone, Lock, AlertTriangle, Camera, Check, X,
  Loader2, Eye, EyeOff, LogOut, Trash2, Save, Edit2,
  Mail, MapPin, Globe, Linkedin, Github, ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import GlassCard from "../components/GlassCard.jsx";
import Button from "../components/Button.jsx";
import { useAuthStore } from "../store/authStore.js";
import { useToast } from "../context/ToasterContext.jsx";
import api from "../services/api.js";
import BackButton from "../components/BackButton.jsx";


// ─── tiny helpers ────────────────────────────────────────────────────────────

function isValidEmail(e) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}
function isValidUsername(u) {
  return /^[a-zA-Z0-9_]{3,20}$/.test(u);
}
function isValidPhone(p) {
  return !p || /^[+\d\s\-().]{7,20}$/.test(p);
}
function isValidUrl(u) {
  if (!u) return true;
  try { new URL(u); return true; } catch { return false; }
}

// ─── Reusable field row ───────────────────────────────────────────────────────

function FieldRow({ icon: Icon, label, value, type = "text", error, onChange, onBlur, hint, disabled }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
        {Icon && <Icon className="w-3 h-3" />} {label}
      </label>
      <input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        disabled={disabled}
        className={`w-full h-10 px-3 rounded-xl bg-input/40 border text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 transition disabled:opacity-50 disabled:cursor-not-allowed ${
          error ? "border-red-500/60 focus:ring-red-500/30" : "border-border"
        }`}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
      {hint && !error && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function PasswordField({ label, value, onChange, error, disabled }) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
        <Lock className="w-3 h-3" /> {label}
      </label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={`w-full h-10 px-3 pr-10 rounded-xl bg-input/40 border text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 transition disabled:opacity-50 ${
            error ? "border-red-500/60 focus:ring-red-500/30" : "border-border"
          }`}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
          tabIndex={-1}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

function SectionHeader({ emoji, title, subtitle }) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center text-lg flex-shrink-0 shadow-glow">{emoji}</div>
      <div>
        <h2 className="font-bold text-base">{title}</h2>
        <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}

function SaveBar({ loading, onSave, onCancel, dirty }) {
  if (!dirty) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-border/50"
    >
      <Button variant="ghost" size="sm" onClick={onCancel} disabled={loading}>Cancel</Button>
      <Button size="sm" onClick={onSave} disabled={loading}>
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Save className="w-3.5 h-3.5 mr-1" />}
        Save Changes
      </Button>
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Settings() {
  const { user, updateUser, fetchUser, logout } = useAuthStore();
  const { toast } = useToast();
  const [loadingProfile, setLoadingProfile] = useState(true);
  const avatarInputRef = useRef(null);

  // ── Profile section state
  const [profile, setProfile] = useState({ name: "", username: "", avatar: null });
  const [profileErrors, setProfileErrors] = useState({});
  const [profileDirty, setProfileDirty] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState(null); // null | "checking" | "available" | "taken"

  // ── Contact section state
  const [contact, setContact] = useState({ phone: "", location: "", website: "", linkedin: "", github: "" });
  const [contactErrors, setContactErrors] = useState({});
  const [contactDirty, setContactDirty] = useState(false);
  const [savingContact, setSavingContact] = useState(false);

  // ── Change Email state
  const [emailForm, setEmailForm] = useState({ new_email: "", current_password: "" });
  const [emailErrors, setEmailErrors] = useState({});
  const [savingEmail, setSavingEmail] = useState(false);

  // ── Change Password state
  const [pwForm, setPwForm] = useState({ current_password: "", new_password: "", confirm_password: "" });
  const [pwErrors, setPwErrors] = useState({});
  const [savingPw, setSavingPw] = useState(false);

  // ── Sign out confirmation
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  // ── Delete account modal
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteUsername, setDeleteUsername] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);

  // ── Fetch user on mount
  useEffect(() => {
    (async () => {
      try {
        const data = await fetchUser();
        setProfile({
          name:     data.name || `${data.first_name || ""} ${data.last_name || ""}`.trim(),
          username: data.username || "",
          avatar:   data.avatar || null,
        });
        setContact({
          phone:    data.phone    || "",
          location: data.location || "",
          website:  data.website  || "",
          linkedin: data.linkedin || "",
          github:   data.github   || "",
        });
      } catch {
        toast({ title: "Could not load profile", type: "error" });
      } finally {
        setLoadingProfile(false);
      }
    })();
  }, []);

  // ── Username availability debounce
  const usernameTimeout = useRef(null);
  const checkUsername = useCallback((username) => {
    if (!username || username === (user?.username || "")) {
      setUsernameStatus(null);
      return;
    }
    if (!isValidUsername(username)) {
      setUsernameStatus(null);
      return;
    }
    setUsernameStatus("checking");
    clearTimeout(usernameTimeout.current);
    usernameTimeout.current = setTimeout(async () => {
      try {
        const res = await api.get(`/users/check-username/?username=${encodeURIComponent(username)}`);
        setUsernameStatus(res.data.available ? "available" : "taken");
      } catch {
        setUsernameStatus(null);
      }
    }, 500);
  }, [user?.username]);

  // ── Handlers: Profile
  const handleProfileChange = (field, value) => {
    setProfile((p) => ({ ...p, [field]: value }));
    setProfileDirty(true);
    if (field === "username") checkUsername(value);
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfile((p) => ({ ...p, avatar: reader.result }));
      setProfileDirty(true);
    };
    reader.readAsDataURL(file);
  };

  const validateProfile = () => {
    const errs = {};
    if (!profile.name?.trim()) errs.name = "Name is required.";
    if (!profile.username?.trim()) errs.username = "Username is required.";
    else if (!isValidUsername(profile.username)) errs.username = "3–20 chars, letters/numbers/underscore only.";
    else if (usernameStatus === "taken") errs.username = "Username is already taken.";
    return errs;
  };

  const saveProfile = async () => {
    const errs = validateProfile();
    if (Object.keys(errs).length) { setProfileErrors(errs); return; }
    setSavingProfile(true);
    try {
      const nameParts = profile.name.trim().split(" ");
      await api.patch("/users/me/", {
        first_name: nameParts[0] || "",
        last_name:  nameParts.slice(1).join(" ") || "",
        username:   profile.username,
        name:       profile.name,
        avatar:     profile.avatar,
      });
      updateUser({ name: profile.name, username: profile.username, avatar: profile.avatar });
      setProfileDirty(false);
      setProfileErrors({});
      toast({ title: "Profile updated successfully", type: "success" });
    } catch (err) {
      const msg = err.response?.data?.username?.[0] || err.response?.data?.detail || "Save failed.";
      toast({ title: msg, type: "error" });
    } finally {
      setSavingProfile(false);
    }
  };

  const resetProfile = async () => {
    setProfileDirty(false);
    setProfileErrors({});
    const data = await fetchUser().catch(() => null);
    if (data) setProfile({ name: data.name || "", username: data.username || "", avatar: data.avatar || null });
  };

  // ── Handlers: Contact
  const handleContactChange = (field, value) => {
    setContact((c) => ({ ...c, [field]: value }));
    setContactDirty(true);
  };

  const validateContact = () => {
    const errs = {};
    if (contact.phone && !isValidPhone(contact.phone)) errs.phone = "Invalid phone number.";
    if (contact.website && !isValidUrl(contact.website)) errs.website = "Invalid URL.";
    if (contact.linkedin && !isValidUrl(contact.linkedin)) errs.linkedin = "Invalid URL.";
    if (contact.github && !isValidUrl(contact.github)) errs.github = "Invalid URL.";
    return errs;
  };

  const saveContact = async () => {
    const errs = validateContact();
    if (Object.keys(errs).length) { setContactErrors(errs); return; }
    setSavingContact(true);
    try {
      await api.patch("/users/me/", contact);
      updateUser(contact);
      setContactDirty(false);
      setContactErrors({});
      toast({ title: "Contact information updated successfully", type: "success" });
    } catch {
      toast({ title: "Save failed. Please try again.", type: "error" });
    } finally {
      setSavingContact(false);
    }
  };

  const resetContact = async () => {
    setContactDirty(false);
    setContactErrors({});
    const data = await fetchUser().catch(() => null);
    if (data) setContact({ phone: data.phone || "", location: data.location || "", website: data.website || "", linkedin: data.linkedin || "", github: data.github || "" });
  };

  // ── Handlers: Change email
  const validateEmail = () => {
    const errs = {};
    if (!emailForm.new_email) errs.new_email = "New email is required.";
    else if (!isValidEmail(emailForm.new_email)) errs.new_email = "Enter a valid email address.";
    if (!emailForm.current_password) errs.current_password = "Current password is required.";
    return errs;
  };

  const saveEmail = async () => {
    const errs = validateEmail();
    if (Object.keys(errs).length) { setEmailErrors(errs); return; }
    setSavingEmail(true);
    try {
      await api.post("/users/change-email/", emailForm);
      updateUser({ email: emailForm.new_email });
      setEmailForm({ new_email: "", current_password: "" });
      setEmailErrors({});
      toast({ title: "Email updated successfully", description: "Please sign in again with your new email.", type: "success" });
      setTimeout(() => logout(), 2500);
    } catch (err) {
      const msg = err.response?.data?.error || "Email change failed.";
      setEmailErrors({ current_password: msg });
    } finally {
      setSavingEmail(false);
    }
  };

  // ── Handlers: Change password
  const validatePassword = () => {
    const errs = {};
    if (!pwForm.current_password) errs.current_password = "Current password is required.";
    if (!pwForm.new_password) errs.new_password = "New password is required.";
    else if (pwForm.new_password.length < 8) errs.new_password = "Minimum 8 characters.";
    if (!pwForm.confirm_password) errs.confirm_password = "Please confirm your new password.";
    else if (pwForm.new_password !== pwForm.confirm_password) errs.confirm_password = "Passwords do not match.";
    return errs;
  };

  const savePassword = async () => {
    const errs = validatePassword();
    if (Object.keys(errs).length) { setPwErrors(errs); return; }
    setSavingPw(true);
    try {
      await api.post("/users/change-password/", {
        current_password: pwForm.current_password,
        new_password: pwForm.new_password,
      });
      setPwForm({ current_password: "", new_password: "", confirm_password: "" });
      setPwErrors({});
      toast({ title: "Password updated successfully", type: "success" });
    } catch (err) {
      const msg = err.response?.data?.error || "Password change failed.";
      setPwErrors({ current_password: msg });
    } finally {
      setSavingPw(false);
    }
  };

  // ── Handlers: Delete account
  const confirmDelete = async () => {
    if (deleteUsername !== (user?.username || "")) {
      setDeleteError("Username doesn't match. Please type it exactly.");
      return;
    }
    if (!deletePassword) { setDeleteError("Please enter your password."); return; }
    setDeleting(true);
    try {
      await api.delete("/users/delete-account/", { data: { current_password: deletePassword } });
      toast({ title: "Account deleted", description: "All your data has been permanently removed.", type: "success" });
      setTimeout(() => logout(), 1500);
    } catch (err) {
      const msg = err.response?.data?.error || "Deletion failed. Check your password.";
      setDeleteError(msg);
      setDeleting(false);
    }
  };

  if (loadingProfile) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-16">
      <BackButton />
      {/* Page header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your account and preferences.</p>
      </div>

      {/* ══════════════════════════════════════════════
          1. PROFILE INFORMATION
      ══════════════════════════════════════════════ */}
      <GlassCard>
        <SectionHeader emoji="👤" title="Profile Information" subtitle="Your public name, username and profile picture." />

        {/* Avatar upload */}
        <div className="flex items-center flex-wrap gap-5 mb-6">
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-border shadow-card">
              {profile.avatar ? (
                <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full gradient-bg flex items-center justify-center text-2xl font-bold text-white">
                  {profile.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
                </div>
              )}
            </div>
            <button
              onClick={() => avatarInputRef.current?.click()}
              className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-lg gradient-bg flex items-center justify-center shadow-glow border-2 border-background hover:brightness-110 transition"
              title="Change photo"
            >
              <Camera className="w-3.5 h-3.5 text-white" />
            </button>
            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </div>
          <div>
            <div className="font-semibold text-sm">{profile.name || "Your Name"}</div>
            <div className="text-xs text-muted-foreground">@{profile.username || "username"}</div>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => avatarInputRef.current?.click()}
                className="text-xs text-brand hover:underline"
              >
                Upload photo
              </button>
              {profile.avatar && (
                <>
                  <span className="text-muted-foreground text-xs">·</span>
                  <button
                    onClick={() => { setProfile((p) => ({ ...p, avatar: null })); setProfileDirty(true); }}
                    className="text-xs text-red-400 hover:underline"
                  >
                    Remove
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <FieldRow
            icon={User} label="Full Name"
            value={profile.name}
            onChange={(v) => handleProfileChange("name", v)}
            error={profileErrors.name}
            disabled={savingProfile}
          />
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <User className="w-3 h-3" /> Username
            </label>
            <div className="relative">
              <input
                type="text"
                value={profile.username}
                onChange={(e) => handleProfileChange("username", e.target.value)}
                disabled={savingProfile}
                className={`w-full h-10 px-3 pr-9 rounded-xl bg-input/40 border text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 transition disabled:opacity-50 ${
                  profileErrors.username ? "border-red-500/60" : "border-border"
                }`}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {usernameStatus === "checking" && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                {usernameStatus === "available" && <Check className="w-4 h-4 text-emerald-400" />}
                {usernameStatus === "taken" && <X className="w-4 h-4 text-red-400" />}
              </div>
            </div>
            {profileErrors.username && <p className="text-xs text-red-400">{profileErrors.username}</p>}
            {!profileErrors.username && usernameStatus === "available" && <p className="text-xs text-emerald-400">Username is available ✓</p>}
            {!profileErrors.username && usernameStatus === "taken" && <p className="text-xs text-red-400">Username is already taken</p>}
            {!profileErrors.username && !usernameStatus && <p className="text-[11px] text-muted-foreground">3–20 chars · letters, numbers, underscore</p>}
          </div>
        </div>

        <AnimatePresence>
          <SaveBar dirty={profileDirty} loading={savingProfile} onSave={saveProfile} onCancel={resetProfile} />
        </AnimatePresence>
      </GlassCard>

      {/* ══════════════════════════════════════════════
          2. CONTACT INFORMATION
      ══════════════════════════════════════════════ */}
      <GlassCard>
        <SectionHeader emoji="📞" title="Contact Information" subtitle="Phone, location, and your social/professional links." />

        <div className="grid sm:grid-cols-2 gap-4">
          <FieldRow icon={Phone}   label="Phone Number" value={contact.phone}    onChange={(v) => handleContactChange("phone", v)}    error={contactErrors.phone}    disabled={savingContact} />
          <FieldRow icon={MapPin}  label="Location / City" value={contact.location} onChange={(v) => handleContactChange("location", v)} error={contactErrors.location} disabled={savingContact} />
          <FieldRow icon={Globe}   label="Website URL"  value={contact.website}  onChange={(v) => handleContactChange("website", v)}  error={contactErrors.website}  disabled={savingContact} hint="https://yoursite.com" />
          <FieldRow icon={Linkedin} label="LinkedIn URL" value={contact.linkedin} onChange={(v) => handleContactChange("linkedin", v)} error={contactErrors.linkedin} disabled={savingContact} hint="https://linkedin.com/in/you" />
          <FieldRow icon={Github}  label="GitHub URL"   value={contact.github}   onChange={(v) => handleContactChange("github", v)}   error={contactErrors.github}   disabled={savingContact} hint="https://github.com/you" />
        </div>

        <AnimatePresence>
          <SaveBar dirty={contactDirty} loading={savingContact} onSave={saveContact} onCancel={resetContact} />
        </AnimatePresence>
      </GlassCard>

      {/* ══════════════════════════════════════════════
          3. ACCOUNT & SECURITY
      ══════════════════════════════════════════════ */}
      <GlassCard>
        <SectionHeader emoji="🔐" title="Account & Security" subtitle="Update your email address and password." />

        {/* Current email display */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-accent/20 border border-border/50 mb-5">
          <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <div>
            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Current Email</div>
            <div className="text-sm font-semibold">{user?.email}</div>
          </div>
        </div>

        {/* Change email */}
        <div className="mb-6">
          <div className="text-sm font-semibold mb-3 text-foreground/80">Change Email Address</div>
          <div className="space-y-3">
            <FieldRow
              icon={Mail} label="New Email Address"
              type="email"
              value={emailForm.new_email}
              onChange={(v) => setEmailForm((f) => ({ ...f, new_email: v }))}
              error={emailErrors.new_email}
              disabled={savingEmail}
            />
            <PasswordField
              label="Confirm with Current Password"
              value={emailForm.current_password}
              onChange={(v) => setEmailForm((f) => ({ ...f, current_password: v }))}
              error={emailErrors.current_password}
              disabled={savingEmail}
            />
            <div className="flex justify-end">
              <Button size="sm" onClick={saveEmail} disabled={savingEmail || !emailForm.new_email}>
                {savingEmail ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Mail className="w-3.5 h-3.5 mr-1" />}
                Update Email
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">⚠ You will be signed out after changing your email.</p>
          </div>
        </div>

        <div className="border-t border-border/50 pt-5">
          <div className="text-sm font-semibold mb-3 text-foreground/80">Change Password</div>
          <div className="space-y-3">
            <PasswordField label="Current Password" value={pwForm.current_password} onChange={(v) => setPwForm((f) => ({ ...f, current_password: v }))} error={pwErrors.current_password} disabled={savingPw} />
            <div className="grid sm:grid-cols-2 gap-3">
              <PasswordField label="New Password" value={pwForm.new_password} onChange={(v) => setPwForm((f) => ({ ...f, new_password: v }))} error={pwErrors.new_password} disabled={savingPw} />
              <PasswordField label="Confirm New Password" value={pwForm.confirm_password} onChange={(v) => setPwForm((f) => ({ ...f, confirm_password: v }))} error={pwErrors.confirm_password} disabled={savingPw} />
            </div>
            <div className="flex justify-end">
              <Button size="sm" onClick={savePassword} disabled={savingPw}>
                {savingPw ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Lock className="w-3.5 h-3.5 mr-1" />}
                Update Password
              </Button>
            </div>
          </div>
        </div>

        {/* Sign out */}
        <div className="border-t border-border/50 pt-5 mt-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="text-sm font-semibold">Sign Out</div>
              <div className="text-xs text-muted-foreground">Sign out of your account on this device.</div>
            </div>
            {!showSignOutConfirm ? (
              <Button variant="outline" size="sm" onClick={() => setShowSignOutConfirm(true)}>
                <LogOut className="w-3.5 h-3.5 mr-1" /> Sign Out
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Are you sure?</span>
                <Button variant="outline" size="sm" onClick={() => setShowSignOutConfirm(false)}>Cancel</Button>
                <button
                  onClick={logout}
                  className="px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-semibold transition"
                >
                  Yes, Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </GlassCard>

      {/* ══════════════════════════════════════════════
          4. DANGER ZONE
      ══════════════════════════════════════════════ */}
      <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-5">
        <SectionHeader emoji="⚠️" title="Danger Zone" subtitle="Irreversible and destructive actions. Proceed with caution." />

        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="text-sm font-semibold text-red-400">Delete Account</div>
            <div className="text-xs text-muted-foreground mt-0.5">Permanently delete your account, all portfolios and analytics data.</div>
          </div>
          <button
            onClick={() => { setDeleteModal(true); setDeleteUsername(""); setDeletePassword(""); setDeleteError(""); }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/30 text-sm font-semibold transition"
          >
            <Trash2 className="w-4 h-4" /> Delete Account
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          DELETE ACCOUNT MODAL
      ══════════════════════════════════════════════ */}
      <AnimatePresence>
        {deleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => !deleting && setDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={(e) => e.stopPropagation()}
              className="glass rounded-2xl p-6 max-w-md w-full border border-red-500/30 shadow-2xl"
            >
              {/* Modal header */}
              <div className="flex items-start gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <div className="font-bold text-lg">Delete Your Account</div>
                  <div className="text-xs text-muted-foreground mt-0.5">This action is permanent and cannot be undone.</div>
                </div>
              </div>

              {/* Warning banner */}
              <div className="p-3 rounded-xl bg-red-500/8 border border-red-500/20 text-xs text-red-400 mb-5 leading-relaxed">
                ⚠ <strong>All your portfolios, analytics data and account information will be deleted forever.</strong> This cannot be reversed.
              </div>

              <div className="space-y-3">
                {/* Username confirmation */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Type your username to confirm: <span className="text-foreground font-mono">{user?.username}</span>
                  </label>
                  <input
                    type="text"
                    value={deleteUsername}
                    onChange={(e) => { setDeleteUsername(e.target.value); setDeleteError(""); }}
                    disabled={deleting}
                    placeholder={user?.username}
                    className="w-full h-10 px-3 rounded-xl bg-input/40 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 disabled:opacity-50"
                  />
                </div>

                {/* Password confirmation */}
                <PasswordField
                  label="Confirm with your password"
                  value={deletePassword}
                  onChange={(v) => { setDeletePassword(v); setDeleteError(""); }}
                  disabled={deleting}
                />

                {deleteError && (
                  <p className="text-xs text-red-400 font-medium">{deleteError}</p>
                )}
              </div>

              <div className="flex gap-2 justify-end mt-5 pt-4 border-t border-border/40">
                <Button variant="outline" size="sm" onClick={() => setDeleteModal(false)} disabled={deleting}>
                  Cancel
                </Button>
                <button
                  onClick={confirmDelete}
                  disabled={deleting || deleteUsername !== (user?.username || "") || !deletePassword}
                  className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition flex items-center gap-1.5"
                >
                  {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  Delete My Account
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

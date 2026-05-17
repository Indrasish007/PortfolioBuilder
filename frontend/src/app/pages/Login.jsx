import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Eye, EyeOff, Mail, Lock, ArrowRight } from "lucide-react";
import Input from "../components/Input.jsx";
import Button from "../components/Button.jsx";
import { useAuthStore } from "../store/authStore.js";
import { useToast } from "../context/ToasterContext.jsx";
import SocialButtons from "../components/SocialButtons.jsx";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const { toast } = useToast();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast({ title: "Welcome back!", description: "Redirecting to your dashboard." });
      navigate("/dashboard");
    } catch (error) {
      toast({ title: "Login failed", description: "Invalid email or password.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold">Welcome back</h1>
      <p className="text-sm text-muted-foreground mt-1 mb-6">Log in to keep building.</p>
      
      <SocialButtons className="mb-6" />
      <div className="my-6 flex items-center gap-3">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground">or with email</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <form onSubmit={submit} className="space-y-4">
        <Input label="Email" type="email" icon={Mail} placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        <div className="relative">
          <Input label="Password" type={show ? "text" : "password"} icon={Lock} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-[34px] text-muted-foreground hover:text-foreground">
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" className="accent-[var(--brand)]" /> Remember me</label>
          <Link to="/forgot-password" className="text-brand hover:underline">Forgot password?</Link>
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? "Signing in…" : <>Log in <ArrowRight className="w-4 h-4" /></>}
        </Button>
      </form>
      <p className="text-sm text-muted-foreground mt-6 text-center">
        New here? <Link to="/signup" className="text-foreground font-medium hover:underline">Create an account</Link>
      </p>
    </div>
  );
}

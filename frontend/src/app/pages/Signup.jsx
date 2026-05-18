import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Check } from "lucide-react";
import Input from "../components/Input.jsx";
import Button from "../components/Button.jsx";
import { useAuthStore } from "../store/authStore.js";
import { useToast } from "../context/ToasterContext.jsx";
import SocialButtons from "../components/SocialButtons.jsx";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const signup = useAuthStore((s) => s.signup);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!email || !password || !name) {
      toast({ title: "Validation Error", description: "All fields are required.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await signup(email, password, name);
      toast({ title: "Account created", description: "Let's set up your first portfolio." });
      navigate("/dashboard");
    } catch (error) {
      if (error.response?.status === 400) {
        const data = error.response.data;
        let errorMessage = "Invalid input.";
        
        if (data && typeof data === 'object') {
          const firstKey = Object.keys(data)[0];
          if (Array.isArray(data[firstKey])) {
            errorMessage = data[firstKey][0];
          } else if (typeof data[firstKey] === 'string') {
            errorMessage = data[firstKey];
          }
        }

        if (errorMessage.toLowerCase().includes("exist")) {
          toast({ title: "Account already exists", description: "Redirecting to login..." });
          setTimeout(() => navigate("/login"), 2000);
        } else {
          toast({ title: "Signup failed", description: errorMessage, variant: "destructive" });
        }
      } else {
        toast({ title: "Signup failed", description: "An error occurred during signup.", variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  };

  const strength = Math.min(4, [/.{8,}/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/].filter((r) => r.test(password)).length);

  return (
    <div>
      <h1 className="text-3xl font-bold">Create your account</h1>
      <p className="text-sm text-muted-foreground mt-1 mb-6">Free forever. Upgrade when you want.</p>
      
      <SocialButtons className="mb-6" />
      <div className="my-6 flex items-center gap-3">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground">or with email</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <form onSubmit={submit} className="space-y-4">
        <Input label="Full name" icon={User} placeholder="Alex Carter" value={name} onChange={(e) => setName(e.target.value)} />
        <Input label="Email" type="email" icon={Mail} placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        <div className="relative">
          <Input label="Password" type={show ? "text" : "password"} icon={Lock} placeholder="At least 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-[34px] text-muted-foreground hover:text-foreground">
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full ${i < strength ? "gradient-bg" : "bg-border"}`} />
          ))}
        </div>
        <ul className="text-xs text-muted-foreground space-y-1 mt-4 mb-4">
          <li className="flex items-center gap-2"><Check className="w-3 h-3 text-emerald-400" /> No credit card required</li>
        </ul>
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? "Creating account…" : <>Create account <ArrowRight className="w-4 h-4" /></>}
        </Button>
      </form>
      <p className="text-sm text-muted-foreground mt-6 text-center">
        Already have one? <Link to="/login" className="text-foreground font-medium hover:underline">Log in</Link>
      </p>
    </div>
  );
}

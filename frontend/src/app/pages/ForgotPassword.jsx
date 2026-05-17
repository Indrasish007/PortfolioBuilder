import { Link } from "react-router-dom";
import { useState } from "react";
import { Mail, ArrowLeft, Check } from "lucide-react";
import Input from "../components/Input.jsx";
import Button from "../components/Button.jsx";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <div>
      <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-6"><ArrowLeft className="w-4 h-4" /> Back to login</Link>
      <h1 className="text-3xl font-bold">Forgot password?</h1>
      <p className="text-sm text-muted-foreground mt-1">No worries — we'll email you a reset link.</p>
      {sent ? (
        <div className="mt-8 glass rounded-xl p-5 flex gap-3">
          <Check className="w-5 h-5 text-emerald-400 mt-0.5" />
          <div>
            <div className="font-medium">Check your inbox</div>
            <div className="text-sm text-muted-foreground">We sent a reset link to <span className="text-foreground">{email}</span>.</div>
          </div>
        </div>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); setSent(true); }} className="mt-6 space-y-4">
          <Input label="Email" icon={Mail} type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button type="submit" className="w-full" size="lg">Send reset link</Button>
        </form>
      )}
    </div>
  );
}

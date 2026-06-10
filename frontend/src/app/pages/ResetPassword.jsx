import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";
import Input from "../components/Input.jsx";
import Button from "../components/Button.jsx";
import { useToast } from "../context/ToasterContext.jsx";

export default function ResetPassword() {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [show, setShow] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  return (
    <div>
      <h1 className="text-3xl font-bold">Set a new password</h1>
      <p className="text-sm text-muted-foreground mt-1">Make it a good one.</p>
      <form
        onSubmit={(e) => { e.preventDefault(); toast({ title: "Password updated" }); navigate("/login"); }}
        className="mt-6 space-y-4"
      >
        <Input
          label="New password"
          type={show ? "text" : "password"}
          icon={Lock}
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          rightElement={
            <button type="button" onClick={() => setShow((s) => !s)} className="text-muted-foreground hover:text-foreground cursor-pointer">
              {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
        />
        <Input label="Confirm password" type="password" icon={Lock} value={pw2} onChange={(e) => setPw2(e.target.value)} error={pw && pw2 && pw !== pw2 ? "Passwords don't match" : ""} />
        <Button type="submit" className="w-full" size="lg">Update password</Button>
      </form>
      <p className="text-sm text-muted-foreground mt-6 text-center">
        <Link to="/login" className="text-foreground font-medium hover:underline">Back to login</Link>
      </p>
    </div>
  );
}

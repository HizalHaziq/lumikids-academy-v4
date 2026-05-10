import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sun, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { formatApiError } from "../lib/api";

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user && user !== false) {
      const dest = user.role === "admin" ? "/admin" : user.role === "teacher" ? "/teacher" : "/parent";
      navigate(dest, { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const u = await login(email, password);
      toast.success(`Welcome back, ${u.name}!`);
      const dest = u.role === "admin" ? "/admin" : u.role === "teacher" ? "/teacher" : "/parent";
      navigate(dest, { replace: true });
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex items-center justify-center p-6 bg-[#FFFAF5]">
        <div className="w-full max-w-md">
          <Link to="/" className="flex items-center gap-2 mb-10" data-testid="login-logo">
            <div className="w-12 h-12 rounded-2xl bg-[#FF8C73] flex items-center justify-center">
              <Sun className="text-white" strokeWidth={2.5} size={26} />
            </div>
            <div>
              <h2 className="font-heading font-semibold text-2xl leading-none">LumiKids</h2>
              <p className="text-xs text-slate-500">Academy</p>
            </div>
          </Link>
          <h1 className="font-heading text-4xl md:text-5xl font-semibold mb-3">Welcome back!</h1>
          <p className="text-slate-500 mb-8">Sign in to your portal to continue.</p>
          <form onSubmit={handleSubmit} className="space-y-5" data-testid="login-form">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                data-testid="login-email"
                placeholder="you@example.com"
                className="w-full rounded-2xl border-slate-200 bg-white focus:ring-2 focus:ring-[#A7E8D0] focus:border-transparent px-4 py-3.5 outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                data-testid="login-password"
                placeholder="••••••••"
                className="w-full rounded-2xl border-slate-200 bg-white focus:ring-2 focus:ring-[#A7E8D0] focus:border-transparent px-4 py-3.5 outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              data-testid="login-submit"
              className="btn-primary w-full inline-flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? "Signing in..." : <>Sign In <ArrowRight size={18} /></>}
            </button>
          </form>

          <div className="mt-8 p-5 rounded-2xl bg-[#FDF3B8] text-sm">
            <p className="font-bold text-slate-700 mb-2">Demo Credentials</p>
            <div className="space-y-1 text-slate-700">
              <p><strong>Admin:</strong> admin@lumikids.com / admin123</p>
              <p><strong>Teacher:</strong> sarah@lumikids.com / teacher123</p>
              <p><strong>Parent:</strong> emma@example.com / parent123</p>
            </div>
          </div>

          <p className="mt-8 text-sm text-slate-500 text-center">
            Don't have an account?{" "}
            <Link to="/" className="text-[#FF8C73] font-bold hover:underline">Submit an enrollment</Link>
          </p>
        </div>
      </div>

      <div className="hidden lg:block flex-1 relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1723750592050-e973050b6ee1?crop=entropy&cs=srgb&fm=jpg&w=940&q=85"
          alt="Children"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#FF8C73]/30 to-[#A7E8D0]/30" />
        <div className="absolute bottom-12 left-12 right-12 bg-white/80 backdrop-blur-xl rounded-[2rem] p-8">
          <p className="font-heading text-2xl font-semibold text-slate-900 leading-snug">
            "Every child deserves a champion who never gives up on them."
          </p>
          <p className="text-sm text-slate-500 mt-3">— LumiKids Promise</p>
        </div>
      </div>
    </div>
  );
}

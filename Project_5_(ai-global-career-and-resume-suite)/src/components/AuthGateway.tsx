import { useState, useEffect, FormEvent } from "react";
import { User, Mail, Lock, UserPlus, LogIn, Sparkles } from "lucide-react";
import { motion } from "motion/react";

interface AuthGatewayProps {
  onLoginSuccess: (name: string, email: string) => void;
  theme: "light" | "dark";
}

export function AuthGateway({ onLoginSuccess, theme }: AuthGatewayProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    setError("");
    setSuccess("");
  }, [isRegister]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email || !password || (isRegister && !name)) {
      setError("Please fill in all fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    // Load registered users
    const usersStr = localStorage.getItem("career_suite_users") || "[]";
    const users = JSON.parse(usersStr);

    if (isRegister) {
      // Register logic
      const userExists = users.some((u: any) => u.email.toLowerCase() === email.toLowerCase());
      if (userExists) {
        setError("This email is already registered. Please login instead.");
        return;
      }

      const newUser = { name, email: email.toLowerCase(), password };
      users.push(newUser);
      localStorage.setItem("career_suite_users", JSON.stringify(users));
      
      setSuccess("Registration successful! You can now log in with your credentials.");
      setIsRegister(false);
      setName("");
      setEmail(email.toLowerCase());
      setPassword("");
    } else {
      // Login logic
      const matchedUser = users.find(
        (u: any) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
      );

      if (!matchedUser) {
        // Build a default demo account so the app is instantly usable for testing
        if (email.toLowerCase() === "demo@example.com" && password === "password123") {
          onLoginSuccess("Ishank Walia", "demo@example.com");
          return;
        }
        setError("Invalid email or password. Or register a new account above.");
        return;
      }

      onLoginSuccess(matchedUser.name, matchedUser.email);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`w-full max-w-md rounded-2xl border ${
          theme === "dark" 
            ? "bg-slate-900 border-slate-800 text-slate-100 shadow-2xl" 
            : "bg-white border-slate-100 text-slate-900 shadow-xl"
        } p-8 overflow-hidden relative`}
      >
        {/* Subtle accent backdrop glow */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-600"></div>

        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white mb-4 shadow-lg shadow-teal-500/10">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            AI Global Career Suite
          </h1>
          <p className={`text-xs mt-1.5 ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
            Empower your professional journey. Optimize for ATS, Sponsorships, & AI.
          </p>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 mb-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-semibold">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-400">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Jane Doe"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-lg text-xs font-medium border focus:outline-none transition-all ${
                    theme === "dark"
                      ? "bg-slate-950 border-slate-800 text-slate-100 focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                      : "bg-slate-50 border-slate-200 text-slate-950 focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  }`}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-400">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="email"
                placeholder="jane.doe@example.com"
                className={`w-full pl-10 pr-4 py-2.5 rounded-lg text-xs font-medium border focus:outline-none transition-all ${
                  theme === "dark"
                    ? "bg-slate-950 border-slate-800 text-slate-100 focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                    : "bg-slate-50 border-slate-200 text-slate-950 focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                }`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-400">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="password"
                placeholder="••••••••"
                className={`w-full pl-10 pr-4 py-2.5 rounded-lg text-xs font-medium border focus:outline-none transition-all ${
                  theme === "dark"
                    ? "bg-slate-950 border-slate-800 text-slate-100 focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                    : "bg-slate-50 border-slate-200 text-slate-950 focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                }`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold text-xs tracking-wide shadow-md hover:from-emerald-600 hover:to-teal-700 active:scale-95 transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer"
          >
            {isRegister ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
            {isRegister ? "Create Account" : "Access Career Suite"}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-800/20 text-center text-xs">
          {isRegister ? (
            <p className="text-slate-400">
              Already have an account?{" "}
              <button
                onClick={() => setIsRegister(false)}
                className="text-emerald-500 font-bold hover:underline ml-1 cursor-pointer"
              >
                Log In
              </button>
            </p>
          ) : (
            <p className="text-slate-400">
              New here?{" "}
              <button
                onClick={() => setIsRegister(true)}
                className="text-emerald-500 font-bold hover:underline ml-1 cursor-pointer"
              >
                signUp
              </button>
            </p>
          )}
        </div>

        <div className={`mt-4 p-2.5 rounded text-[11px] leading-relaxed text-center ${
          theme === "dark" ? "bg-slate-950/50 text-slate-500" : "bg-slate-50 text-slate-400"
        }`}>
          💡 Use <span className="font-semibold text-teal-600">demo@example.com</span> & password <span className="font-semibold text-teal-600">password123</span> to login quickly for instant testing!
        </div>
      </motion.div>
    </div>
  );
}

"use client";

import React, { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  LogIn,
  Mail,
  Lock,
  GraduationCap,
  ShieldCheck,
  ArrowRight,
  UserPlus,
  User as UserIcon,
  CheckCircle2,
  Eye,
  EyeOff,
  Sparkles,
  KeyRound,
  X,
} from "lucide-react";
import { authAPI, LoginPayload, RegisterPayload, User } from "@/lib/api";
import { getRoleRedirect, saveAuth } from "@/lib/auth";

type Role = "admin" | "mentor" | "candidate";
type AuthMode = "signin" | "signup";

interface LoginFormProps {
  onSuccess?: (user: User) => void;
}

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const router = useRouter();

  const [mode, setMode] = useState<AuthMode>("signin");

  // Sign In fields
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<Role>("candidate");
  const [rememberMe, setRememberMe] = useState(true);

  // Sign Up (Candidate) fields
  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Modal for Forgot Password
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  // Form states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Quick auto-fill helper for testing
  const handleQuickFillAdmin = () => {
    setIdentifier("admin@portal.com");
    setPassword("admin");
    setRole("admin");
    setError("");
  };

  const handleSignIn = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const payload: LoginPayload = {
      username: identifier.trim(),
      email: identifier.trim(),
      password,
    };

    try {
      const res = await authAPI.login(payload);
      const { token, user } = res.data;
      saveAuth(token, user);
      if (rememberMe) {
        localStorage.setItem("remember_username", identifier.trim());
      } else {
        localStorage.removeItem("remember_username");
      }
      onSuccess?.(user);
      router.push(getRoleRedirect(user.role));
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? "Login failed. Please verify your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!regUsername.trim()) {
      setError("Please choose a username.");
      return;
    }

    if (regPassword.length < 4) {
      setError("Password must be at least 4 characters long.");
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setError("Passwords do not match. Please re-enter your password.");
      return;
    }

    setLoading(true);

    const payload: RegisterPayload = {
      username: regUsername.trim(),
      name: regUsername.trim(),
      email: regEmail.trim() || undefined,
      password: regPassword,
      role: "candidate",
    };

    try {
      const res = await authAPI.register(payload);
      const { token, user } = res.data;
      saveAuth(token, user);
      onSuccess?.(user);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setForgotLoading(true);
    setTimeout(() => {
      setForgotLoading(false);
      setForgotSuccess(true);
    }, 800);
  };

  const roleOptions: {
    value: Role;
    label: string;
    desc: string;
    icon: typeof GraduationCap;
  }[] = [
    {
      value: "candidate",
      label: "Candidate",
      desc: "Submit projects & track reviews",
      icon: GraduationCap,
    },
    {
      value: "mentor",
      label: "Mentor",
      desc: "Evaluate assigned candidates",
      icon: ShieldCheck,
    },
    {
      value: "admin",
      label: "Admin",
      desc: "Platform administration",
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="w-full max-w-[440px] mx-auto">
      {/* STATIC LOGIN CARD (No floating, tilt, parallax, or hover scale) */}
      <div className="w-full p-7 sm:p-8 rounded-[28px] bg-[#11182B] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden backdrop-blur-xl">
        
        {/* Soft Ambient Top Inner Lighting (Static) */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-24 bg-[#8B7CFF]/15 blur-2xl pointer-events-none" />

        {/* Card Header: Project Portal Logo & Greetings */}
        <div className="text-center mb-6 relative z-10">
          <div className="inline-flex items-center justify-center mb-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#8B7CFF] to-[#65DDF5] p-[1.5px] shadow-[0_0_20px_rgba(139,124,255,0.3)]">
              <div className="w-full h-full rounded-[14px] bg-[#11182B] flex items-center justify-center">
                <Sparkles size={22} className="text-[#65DDF5]" />
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-[#F7F7FF] tracking-tight">
            {mode === "signin" ? "Welcome back" : "Create Account"}
          </h2>
          <p className="text-xs text-[#A9B1C7] mt-1">
            {mode === "signin"
              ? "Sign in to continue to your workspace"
              : "Register as a candidate to submit your projects"}
          </p>
        </div>

        {/* Sign In / Create Account Tab Selector */}
        <div className="flex rounded-2xl bg-[#0B1020] p-1 border border-white/5 mb-6 relative z-10">
          <button
            type="button"
            onClick={() => {
              setMode("signin");
              setError("");
            }}
            className={`relative flex-1 py-2 text-xs font-semibold rounded-xl transition-colors duration-200 flex items-center justify-center gap-1.5 ${
              mode === "signin"
                ? "text-[#F7F7FF]"
                : "text-[#A9B1C7] hover:text-[#F7F7FF]"
            }`}
          >
            {mode === "signin" && (
              <motion.div
                layoutId="activeTabPill"
                className="absolute inset-0 rounded-xl bg-[#8B7CFF]/20 border border-[#8B7CFF]/40 -z-10"
                transition={{ type: "spring", stiffness: 400, damping: 35 }}
              />
            )}
            <LogIn size={15} />
            <span>Sign In</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setError("");
            }}
            className={`relative flex-1 py-2 text-xs font-semibold rounded-xl transition-colors duration-200 flex items-center justify-center gap-1.5 ${
              mode === "signup"
                ? "text-[#F7F7FF]"
                : "text-[#A9B1C7] hover:text-[#F7F7FF]"
            }`}
          >
            {mode === "signup" && (
              <motion.div
                layoutId="activeTabPill"
                className="absolute inset-0 rounded-xl bg-[#8B7CFF]/20 border border-[#8B7CFF]/40 -z-10"
                transition={{ type: "spring", stiffness: 400, damping: 35 }}
              />
            )}
            <UserPlus size={15} />
            <span>Create Account</span>
          </button>
        </div>

        {/* Error Alert Box */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              role="alert"
              className="mb-5 rounded-xl border border-rose-500/30 bg-rose-950/30 px-3.5 py-2.5 text-xs text-rose-200 font-medium flex items-center gap-2"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-rose-400 flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ======================================================== */}
        {/* SIGN IN FORM                                             */}
        {/* ======================================================== */}
        {mode === "signin" ? (
          <form onSubmit={handleSignIn} className="space-y-4 relative z-10">
            {/* Role Selection Cards */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-[#A9B1C7] tracking-wider uppercase">
                Role Selection
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {roleOptions.map((opt) => {
                  const Icon = opt.icon;
                  const active = role === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setRole(opt.value)}
                      className={`relative flex flex-col p-3 rounded-2xl border text-left transition-all duration-200 ${
                        active
                          ? "bg-[#162038] border-[#8B7CFF] shadow-[0_0_15px_rgba(139,124,255,0.2)]"
                          : "bg-[#0E1526] border-white/5 hover:border-white/15 hover:bg-[#131C32]"
                      }`}
                      aria-pressed={active}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div
                          className={`p-1.5 rounded-lg transition-colors ${
                            active
                              ? "bg-[#8B7CFF]/20 text-[#65DDF5]"
                              : "bg-white/5 text-[#A9B1C7]"
                          }`}
                        >
                          <Icon size={16} />
                        </div>
                        {active && (
                          <span className="w-2 h-2 rounded-full bg-[#65DDF5] shadow-[0_0_8px_rgba(101,221,245,0.8)]" />
                        )}
                      </div>
                      <span className="text-xs font-bold text-[#F7F7FF]">
                        {opt.label}
                      </span>
                      <span className="text-[10px] text-[#A9B1C7] mt-0.5 line-clamp-1">
                        {opt.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Username or Email Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#A9B1C7]">
                Username or Email
              </label>
              <div className="relative">
                <UserIcon
                  size={16}
                  className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${
                    focusedField === "identifier" ? "text-[#65DDF5]" : "text-[#A9B1C7]/60"
                  }`}
                />
                <input
                  type="text"
                  autoComplete="username"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  onFocus={() => setFocusedField("identifier")}
                  onBlur={() => setFocusedField(null)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0B1020] border border-white/10 text-xs text-[#F7F7FF] placeholder-[#A9B1C7]/40 outline-none transition-all focus:border-[#8B7CFF] focus:ring-1 focus:ring-[#8B7CFF]"
                  placeholder="Enter username or email"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#A9B1C7]">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-[11px] text-[#B8B4FF] hover:text-[#F7F7FF] transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock
                  size={16}
                  className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${
                    focusedField === "password" ? "text-[#65DDF5]" : "text-[#A9B1C7]/60"
                  }`}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#0B1020] border border-white/10 text-xs text-[#F7F7FF] placeholder-[#A9B1C7]/40 outline-none transition-all focus:border-[#8B7CFF] focus:ring-1 focus:ring-[#8B7CFF]"
                  placeholder="Enter password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A9B1C7]/60 hover:text-[#F7F7FF] transition-colors p-1"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Remember Me & Demo Fill */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-white/20 bg-[#0B1020] text-[#8B7CFF] focus:ring-0 cursor-pointer"
                />
                <span className="text-xs text-[#A9B1C7] hover:text-[#F7F7FF] transition-colors">
                  Remember me
                </span>
              </label>

              <button
                type="button"
                onClick={handleQuickFillAdmin}
                className="text-[11px] text-[#A9B1C7]/70 hover:text-[#65DDF5] transition-colors flex items-center gap-1"
                title="Fill default demo admin credentials"
              >
                <Sparkles size={11} className="text-[#8B7CFF]" />
                <span>Fill Demo Admin</span>
              </button>
            </div>

            {/* Primary Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#8B7CFF] to-[#65DDF5] text-[#0B1020] font-bold text-sm hover:shadow-[0_8px_25px_rgba(139,124,255,0.35)] hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        ) : (
          /* ======================================================== */
          /* SIGN UP FORM (Candidate Registration)                    */
          /* ======================================================== */
          <form onSubmit={handleSignUp} className="space-y-3.5 relative z-10">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#A9B1C7]">
                Username <span className="text-[#65DDF5]">*</span>
              </label>
              <div className="relative">
                <UserIcon
                  size={16}
                  className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${
                    focusedField === "regUsername" ? "text-[#65DDF5]" : "text-[#A9B1C7]/60"
                  }`}
                />
                <input
                  type="text"
                  autoComplete="username"
                  required
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  onFocus={() => setFocusedField("regUsername")}
                  onBlur={() => setFocusedField(null)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0B1020] border border-white/10 text-xs text-[#F7F7FF] placeholder-[#A9B1C7]/40 outline-none transition-all focus:border-[#8B7CFF] focus:ring-1 focus:ring-[#8B7CFF]"
                  placeholder="Choose username"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#A9B1C7]">
                Email Address <span className="text-[#A9B1C7]/50 font-normal">(optional)</span>
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${
                    focusedField === "regEmail" ? "text-[#65DDF5]" : "text-[#A9B1C7]/60"
                  }`}
                />
                <input
                  type="email"
                  autoComplete="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  onFocus={() => setFocusedField("regEmail")}
                  onBlur={() => setFocusedField(null)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0B1020] border border-white/10 text-xs text-[#F7F7FF] placeholder-[#A9B1C7]/40 outline-none transition-all focus:border-[#8B7CFF] focus:ring-1 focus:ring-[#8B7CFF]"
                  placeholder="candidate@university.edu"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#A9B1C7]">
                  Password <span className="text-[#65DDF5]">*</span>
                </label>
                <div className="relative">
                  <Lock
                    size={15}
                    className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${
                      focusedField === "regPassword" ? "text-[#65DDF5]" : "text-[#A9B1C7]/60"
                    }`}
                  />
                  <input
                    type={showRegPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    onFocus={() => setFocusedField("regPassword")}
                    onBlur={() => setFocusedField(null)}
                    className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-[#0B1020] border border-white/10 text-xs text-[#F7F7FF] placeholder-[#A9B1C7]/40 outline-none transition-all focus:border-[#8B7CFF] focus:ring-1 focus:ring-[#8B7CFF]"
                    placeholder="Min. 4 chars"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#A9B1C7]/60 hover:text-[#F7F7FF]"
                  >
                    {showRegPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#A9B1C7]">
                  Confirm Password <span className="text-[#65DDF5]">*</span>
                </label>
                <div className="relative">
                  <CheckCircle2
                    size={15}
                    className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${
                      focusedField === "regConfirmPassword" ? "text-[#65DDF5]" : "text-[#A9B1C7]/60"
                    }`}
                  />
                  <input
                    type="password"
                    autoComplete="new-password"
                    required
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    onFocus={() => setFocusedField("regConfirmPassword")}
                    onBlur={() => setFocusedField(null)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#0B1020] border border-white/10 text-xs text-[#F7F7FF] placeholder-[#A9B1C7]/40 outline-none transition-all focus:border-[#8B7CFF] focus:ring-1 focus:ring-[#8B7CFF]"
                    placeholder="Re-enter password"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#8B7CFF] to-[#65DDF5] text-[#0B1020] font-bold text-sm hover:shadow-[0_8px_25px_rgba(139,124,255,0.35)] hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        )}
      </div>

      {/* Forgot Password Modal Dialog */}
      <AnimatePresence>
        {showForgotModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm p-6 rounded-3xl bg-[#11182B] border border-white/15 shadow-[0_25px_60px_rgba(0,0,0,0.8)] relative"
            >
              <button
                type="button"
                onClick={() => {
                  setShowForgotModal(false);
                  setForgotSuccess(false);
                }}
                className="absolute top-4 right-4 p-1.5 rounded-xl bg-white/5 text-[#A9B1C7] hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={16} />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-[#8B7CFF]/20 border border-[#8B7CFF]/40 flex items-center justify-center text-[#65DDF5]">
                  <KeyRound size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#F7F7FF]">Reset Password</h3>
                  <p className="text-xs text-[#A9B1C7]">
                    Enter your email to receive recovery instructions
                  </p>
                </div>
              </div>

              {forgotSuccess ? (
                <div className="space-y-4 py-2 text-center">
                  <div className="w-10 h-10 rounded-full bg-[#65DDF5]/20 text-[#65DDF5] flex items-center justify-center mx-auto">
                    <CheckCircle2 size={20} />
                  </div>
                  <p className="text-xs text-[#A9B1C7]">
                    If an account exists with <strong className="text-white">{forgotEmail}</strong>, password reset instructions have been sent.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotModal(false);
                      setForgotSuccess(false);
                    }}
                    className="w-full py-2.5 rounded-xl bg-[#8B7CFF] text-[#0B1020] text-xs font-bold"
                  >
                    Return to Login
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotPasswordSubmit} className="space-y-3.5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#A9B1C7]">Email Address</label>
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="you@domain.com"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B1020] border border-white/10 text-xs text-[#F7F7FF] outline-none focus:border-[#8B7CFF]"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#8B7CFF] to-[#65DDF5] text-[#0B1020] text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    {forgotLoading ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Sending Request...
                      </>
                    ) : (
                      "Send Recovery Link"
                    )}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Compass,
  Eye,
  EyeOff,
  Lock,
  User as UserIcon,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { success, error: toastError } = useToast();

  const [loginInput, setLoginInput] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!loginInput.trim()) {
      setErrorMessage("Please enter your Employee ID or Email address.");
      return;
    }
    if (!password) {
      setErrorMessage("Please enter your password.");
      return;
    }

    setIsLoading(true);
    try {
      const user = await login(loginInput.trim(), password);
      success("Welcome back!", `Signed in as ${user.email}`);

      if (user.role.name === "ADMIN") {
        navigate("/admin/dashboard");
      } else {
        navigate("/employee/dashboard");
      }
    } catch (err: unknown) {
      const msg =
        (err instanceof Error ? err.message : undefined) ||
        "Invalid credentials. Please check your login details.";
      setErrorMessage(msg);
      toastError("Login Failed", msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#F8FAFC] relative">
      {/* Background Subtle Pattern */}
      <div
        className="fixed inset-0 z-0 opacity-40 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(#E2E8F0 1.5px, transparent 1.5px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Login Card Container */}
      <div className="w-full max-w-md bg-white rounded-modal border border-slate-200 shadow-modal flex flex-col overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Top Decorative Brand Bar */}
        <div className="h-2 w-full bg-brand-600" />

        <div className="p-8 sm:p-10 flex flex-col">
          {/* Logo & Brand Header */}
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="w-16 h-16 bg-brand-600 rounded-card flex items-center justify-center mb-4 text-white shadow-sm ring-4 ring-brand-50">
              <Compass className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              ETMS
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Enterprise Travel Management System
            </p>
          </div>

          {/* Error Alert Box */}
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs leading-normal flex items-start gap-2">
              <span className="font-semibold shrink-0">Error:</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* ID or Email Input */}
            <div className="space-y-1.5">
              <label
                htmlFor="login"
                className="block text-xs font-semibold text-slate-700 tracking-wide uppercase"
              >
                Employee ID or Email
              </label>
              <div className="relative rounded-lg">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  id="login"
                  type="text"
                  value={loginInput}
                  onChange={(e) => setLoginInput(e.target.value)}
                  placeholder="e.g. EMP001 or alice@company.com"
                  required
                  disabled={isLoading}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 transition-colors disabled:bg-slate-50"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-slate-700 tracking-wide uppercase"
                >
                  Password
                </label>
                <span className="text-xs text-brand-600 hover:text-brand-700 cursor-pointer">
                  Forgot?
                </span>
              </div>
              <div className="relative rounded-lg">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                  className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 transition-colors disabled:bg-slate-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center pt-1">
              <input
                id="remember_me"
                type="checkbox"
                defaultChecked
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
              />
              <label
                htmlFor="remember_me"
                className="ml-2 block text-xs text-slate-600 cursor-pointer"
              >
                Remember me on this device
              </label>
            </div>

            {/* Submit Action */}
            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full font-semibold shadow-sm"
                isLoading={isLoading}
              >
                Sign In
              </Button>
            </div>
          </form>

          {/* Support Footer */}
          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Need access? Contact your corporate IT Administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

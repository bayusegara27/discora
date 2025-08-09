import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { ICONS } from "../constants";

const FeatureHighlight: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
}> = ({ icon, title, description }) => (
  <div className="flex items-start space-x-4">
    <div className="flex-shrink-0 bg-white/10 p-3 rounded-lg text-accent">
      {icon}
    </div>
    <div>
      <h3 className="font-bold text-white">{title}</h3>
      <p className="text-text-secondary mt-1 text-sm">{description}</p>
    </div>
  </div>
);

const EyeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
    <path
      fillRule="evenodd"
      d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
      clipRule="evenodd"
    />
  </svg>
);
const EyeSlashIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path
      fillRule="evenodd"
      d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781z"
      clipRule="evenodd"
    />
    <path d="M12.454 16.697l-1.414-1.414a3 3 0 01-4.242-4.242L6.758 10.982a4.978 4.978 0 00-1.32 1.018A10.005 10.005 0 00.458 10c1.274 4.057 5.022 7 9.542 7 .848 0 1.67-.11 2.46-.317z" />
  </svg>
);
const DiscordIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    fill="currentColor"
    viewBox="0 0 16 16"
    aria-hidden="true"
    role="img"
  >
    <path d="M13.545 2.907a13.2 13.2 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.2 12.2 0 0 0-3.658 0 8 8 0 0 0-.412-.833.05.05 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.04.04 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032q.003.022.021.037a13.3 13.3 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019q.463-.63.818-1.329a.05.05 0 0 0-.01-.059l-.018-.011a9 9 0 0 1-1.248-.595.05.05 0 0 1-.02-.066l.015-.019q.127-.095.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.05.05 0 0 1 .053.007q.121.1.248.195a.05.05 0 0 1-.004.085 8 8 0 0 1-1.249.594.05.05 0 0 0-.03.03.05.05 0 0 0 .003.041c.24.465.515.909.817 1.329a.05.05 0 0 0 .056.019 13.2 13.2 0 0 0 4.001-2.02.05.05 0 0 0 .021-.037c.334-3.451-.559-6.449-2.366-9.106a.03.03 0 0 0-.02-.019m-8.198 7.307c-.789 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.45.73 1.438 1.613 0 .888-.637 1.612-1.438 1.612m5.316 0c-.788 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.451.73 1.438 1.613 0 .888-.631 1.612-1.438 1.612" />
  </svg>
);

const RegisterPage: React.FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, user, authError, setAuthError, loginWithDiscord } =
    useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/dashboard", { replace: true });
    }
    setAuthError(null);
  }, [user, navigate, setAuthError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (password !== confirmPassword) {
      setAuthError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      await register(name, email, password);
    } catch (error) {
      // Error is handled in context.
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDiscordLogin = async () => {
    setIsSubmitting(true);
    try {
      await loginWithDiscord();
    } catch (error) {
      // error is handled in context
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full lg:grid lg:grid-cols-2">
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <img
              src="/img/discord-logo.png"
              alt="Discora Logo"
              className="mx-auto h-16 w-16"
            />
            <h2 className="mt-6 text-3xl font-bold tracking-tight text-text-primary">
              Create an Account
            </h2>
            <p className="mt-2 text-text-secondary">
              Get started with your new mission control.
            </p>
          </div>

          {authError && (
            <div
              className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-md text-center text-sm"
              role="alert"
            >
              {authError}
            </div>
          )}

          <div className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-text-secondary mb-2"
                >
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-background border border-white/20 rounded-lg p-3 focus:ring-primary focus:border-primary placeholder:text-text-secondary/50"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-text-secondary mb-2"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-background border border-white/20 rounded-lg p-3 focus:ring-primary focus:border-primary placeholder:text-text-secondary/50"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-text-secondary mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-background border border-white/20 rounded-lg p-3 pr-10 focus:ring-primary focus:border-primary placeholder:text-text-secondary/50"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-secondary hover:text-text-primary"
                  >
                    {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-text-secondary mb-2"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-background border border-white/20 rounded-lg p-3 pr-10 focus:ring-primary focus:border-primary placeholder:text-text-secondary/50"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-secondary hover:text-text-primary"
                  >
                    {showConfirmPassword ? <EyeSlashIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>
              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-primary disabled:bg-opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Creating Account..." : "Sign Up"}
                </button>
              </div>
            </form>

            <div className="relative">
              <div
                className="absolute inset-0 flex items-center"
                aria-hidden="true"
              >
                <div className="w-full border-t border-white/20"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-background text-text-secondary">
                  Or sign up with
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDiscordLogin}
              disabled={isSubmitting}
              className="w-full inline-flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm bg-[#5865F2] text-sm font-medium text-white hover:bg-[#4752C4] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-primary disabled:opacity-50"
            >
              <DiscordIcon />
              Sign up with Discord
            </button>
          </div>

          <p className="text-center text-sm text-text-secondary">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-medium text-accent hover:underline"
            >
              Log In
            </Link>
          </p>
        </div>
      </div>
      <div className="hidden lg:flex flex-col items-center justify-center p-12 bg-gradient-to-br from-secondary to-background border-l border-white/10">
        <div className="w-full max-w-md">
          <div className="space-y-8">
            <h2 className="text-3xl font-bold text-white">
              Your All-in-One Mission Control
            </h2>
            <p className="text-text-secondary">
              Transform server management from a series of text commands into an
              intuitive and powerful visual experience.
            </p>
            <div className="space-y-6">
              <FeatureHighlight
                icon={ICONS.dashboard}
                title="Real-time Dashboard"
                description="Get a bird's-eye view of your server with stats on members, messages, and more."
              />
              <FeatureHighlight
                icon={ICONS.autoMod}
                title="Advanced Auto-Mod"
                description="Configure filters and leverage AI to keep your community safe and clean."
              />
              <FeatureHighlight
                icon={ICONS.commands}
                title="Custom Commands"
                description="Easily create, edit, and delete custom text or embed commands for your server."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;

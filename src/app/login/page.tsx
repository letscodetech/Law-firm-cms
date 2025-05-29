"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiMail, FiLock, FiUser, FiAlertCircle, FiEye, FiEyeOff, FiCheck } from "react-icons/fi";
import { useAuth } from "@/app/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login, signup } = useAuth(); // Removed unused verifyEmail
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formKey, setFormKey] = useState(Date.now());
  const [showPassword, setShowPassword] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  // Removed unused codeSent state

  useEffect(() => {
    setEmail("");
    setPassword("");
    setName("");
    setVerificationCode("");
    setError("");
    setSuccess("");
    setShowPassword(false);
    setShowVerification(false);
    setFormKey(Date.now());
  }, [isLogin]);

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (isLogin) {
        await login(email, password);
        router.push("/");
      } else {
        // For signup, first send verification code
        await sendVerificationCode();
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred.");
      }
      setLoading(false);
    }
  };

  const sendVerificationCode = async () => {
    try {
      // Call API to send verification code to email
      const response = await fetch('/backend/api/auth/send-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, name }),
      });

      if (!response.ok) {
        throw new Error('Failed to send verification code');
      }

      setShowVerification(true);
      setSuccess("Verification code sent to your email!");
      setLoading(false);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to send verification code.");
      }
      setLoading(false);
    }
  };

  const handleVerification = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Verify the code and create account
      const response = await fetch('/backend/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          name,
          password,
          verificationCode,
        }),
      });

      if (!response.ok) {
        throw new Error('Invalid verification code');
      }

      // Account created successfully, now login
      await signup(name, email, password);
      router.push("/");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Verification failed.");
      }
      setLoading(false);
    }
  };

  const resendCode = async () => {
    setLoading(true);
    setError("");
    try {
      await sendVerificationCode();
    } catch {
      // Error handling is done in sendVerificationCode
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-8 text-center">
          <h2 className="text-3xl font-bold text-white tracking-tight">
            {showVerification 
              ? "Verify Your Email" 
              : isLogin 
                ? "Welcome Back" 
                : "Join Us Today"
            }
          </h2>
          <p className="mt-2 text-blue-200">
            {showVerification
              ? "Enter the verification code sent to your email"
              : isLogin 
                ? "Sign in to your account" 
                : "Create your new account"
            }
          </p>
        </div>

        <div className="px-6 py-8">
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-start" role="alert">
              <FiAlertCircle className="h-5 w-5 text-red-500 mr-3 mt-0.5" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-md flex items-start" role="alert">
              <FiCheck className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
              <span className="text-sm text-green-700">{success}</span>
            </div>
          )}

          {showVerification ? (
            // Verification Form
            <form className="space-y-6" onSubmit={handleVerification}>
              <div className="text-center mb-6">
                <p className="text-sm text-gray-600">
                  We&apos;ve sent a 6-digit verification code to
                </p>
                <p className="font-medium text-gray-900">{email}</p>
              </div>

              <div className="space-y-2">
                <label htmlFor="verification-code" className="block text-sm font-medium text-gray-700">
                  Verification Code
                </label>
                <input
                  id="verification-code"
                  name="verification-code"
                  type="text"
                  required
                  maxLength={6}
                  className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out sm:text-sm text-center text-lg font-mono tracking-widest"
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading || verificationCode.length !== 6}
                  className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  ) : null}
                  Verify & Create Account
                </button>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Didn&apos;t receive the code?{" "}
                  <button
                    type="button"
                    onClick={resendCode}
                    disabled={loading}
                    className="font-medium text-blue-600 hover:text-blue-700 transition duration-150 ease-in-out disabled:opacity-50"
                  >
                    Resend Code
                  </button>
                </p>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setShowVerification(false);
                    setVerificationCode("");
                    setSuccess("");
                  }}
                  className="text-sm font-medium text-gray-600 hover:text-gray-700 transition duration-150 ease-in-out"
                >
                  ← Back to signup
                </button>
              </div>
            </form>
          ) : (
            // Login/Signup Form
            <form
              key={formKey}
              className="space-y-6"
              onSubmit={handleSubmit}
              autoComplete={isLogin ? "on" : "off"}
            >
              {!isLogin && (
                <div className="space-y-2">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiUser className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required={!isLogin}
                      autoComplete="off"
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out sm:text-sm"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="email-address" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiMail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email-address"
                    name="email"
                    type="email"
                    autoComplete={isLogin ? "email" : "off"}
                    required
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out sm:text-sm"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  {isLogin && (
                    <Link
                      href="/forgot-password"
                      className="text-sm font-medium text-blue-600 hover:text-blue-500 transition duration-150 ease-in-out"
                    >
                      Forgot password?
                    </Link>
                  )}
                </div>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={isLogin ? "current-password" : "new-password"}
                    required
                    className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out sm:text-sm"
                    placeholder={isLogin ? "••••••••" : "Create a strong password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none"
                    tabIndex={-1}
                  >
                    {showPassword ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {isLogin && (
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                    Remember me
                  </label>
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out"
                >
                  {loading ? (
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  ) : null}
                  {isLogin ? "Sign in" : "Send Verification Code"}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="px-6 py-4 bg-gray-50 text-center">
          <p className="text-sm text-gray-600">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="font-medium text-blue-600 hover:text-blue-700 transition duration-150 ease-in-out"
            >
              {isLogin ? "Sign up now" : "Sign in"}
            </button>
          </p>
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-gray-500">
        By signing in, you agree to our{" "}
        <Link href="/terms" className="font-medium text-blue-600 hover:text-blue-500">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="font-medium text-blue-600 hover:text-blue-500">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}
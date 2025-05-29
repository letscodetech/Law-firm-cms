'use client';

import { useState } from 'react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    //  backend endpoint
    await fetch('/backend/api/auth/request-reset', {
      method: 'POST',
      body: JSON.stringify({ email }),
      headers: { 'Content-Type': 'application/json' },
    });

    setSubmitted(true);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <h1 className="text-xl font-bold mb-4">Forgot Password</h1>
      {submitted ? (
        <p className="text-green-600">
          If the email exists, a reset link has been sent.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Email address</label>
            <input
              type="email"
              required
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
          >
            Send Reset Link
          </button>
        </form>
      )}
    </div>
  );
}

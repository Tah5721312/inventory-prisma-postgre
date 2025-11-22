"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "react-toastify";
import { DOMAIN } from "@/lib/constants";

const ResetPasswordForm = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return; // Prevent double submission while loading
    if (!email || !password) {
      return toast.error("Please enter email and password");
    }
    try {
      setLoading(true);
      const trimmedEmail = email.trim();
      console.log('Sending reset password request for email:', trimmedEmail);
      const response = await fetch(`${DOMAIN}/api/users/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: trimmedEmail,
          password 
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to reset password');
      }

      toast.success(data.message || "Password updated successfully");
      setEmail("");
      setPassword("");
      // ✅ Redirect to login page after success
      setTimeout(() => router.push("/login"), 1500);
    } catch (error: any) {
      console.error('Reset password error:', error);
      toast.error(error.message || "Error occurred while resetting password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="grid text-center items-center min-h-[80vh]">
      <div>
        <h3 className="text-3xl font-bold text-blue-gray-800 mb-2">
          Reset Password
        </h3>
        <p className="mb-8  font-normal text-[18px]">
          Enter your email and new password
        </p>
        <form onSubmit={handleSubmit} className="card mx-auto max-w-[24rem] text-left p-6 rounded-lg shadow-md space-y-4" noValidate>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              className="w-full px-3 py-2.5 border border-blue-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <input
              id="password"
              className="w-full px-3 py-2.5 border border-blue-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2.5 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
          
          <p className="mt-4 text-gray-600 text-sm text-center">
            Remember your password?{" "}
            <a href="/login" className="font-medium text-gray-900 hover:text-blue-600">
              Sign In
            </a>
          </p>
        </form>
      </div>
    </section>
  );
};

export default ResetPasswordForm;
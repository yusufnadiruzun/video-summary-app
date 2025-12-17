import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";

export default function SignUp() {
  const router = useRouter(); 
  
  // Google Auth States
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false); 
  
  // Email/Password Auth States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false); 
  
  // General Error State
  const [error, setError] = useState(""); 
  
  // If token exists → redirect to checkPackage
  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("auth_token")) {
      router.replace("/checkPackage"); 
    }
  }, [router]); 

  // Inject Google script into DOM
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => setGoogleLoaded(true);
    document.body.appendChild(script); 
  }, []); 
  
  // Render Google Login button
  useEffect(() => {
    if (!googleLoaded || !window.google) return;

    window.google.accounts.id.initialize({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID, 
      callback: handleGoogleResponse,
    });

    window.google.accounts.id.renderButton(
      document.getElementById("googleSignUpBtn"), 
      { theme: "outline", size: "large", width: "100%" }
    );
  }, [googleLoaded]); 

  /** 🔥 Handle Google Auth backend verification */
  const handleGoogleResponse = async (response) => {
    setGoogleLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/auth?action=google`, { // Updated to match your single endpoint logic
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: response.credential }),
      });

      const data = await res.json();

      if (!res.ok || !data.token) {
        setError("Google signup failed. " + (data.error || ""));
        setGoogleLoading(false);
        return;
      }

      localStorage.setItem("auth_token", data.token); 
      router.push("/checkPackage"); 
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred during Google signup.");
      setGoogleLoading(false);
    }
  }; 
  
  /** 📧 Handle Email/Password registration */
  const handleEmailSignUp = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/auth?action=register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Signup failed. Please try a different email address.");
        setIsSubmitting(false);
        return;
      }

      // If register action returns a token directly, login immediately
      if (data.token) {
        localStorage.setItem("auth_token", data.token);
        router.push("/checkPackage");
      } else {
        // If your register action doesn't return a token, redirect to signin
        router.push("/signin?message=Registered successfully. Please login.");
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred during registration.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 p-6">
      
      {/* FORM CARD */}
      <div className="bg-white p-10 rounded-2xl shadow-2xl w-full max-w-md border border-gray-100">
        
        <h2 className="text-3xl font-extrabold text-center text-purple-700 mb-8">
          Create Your Account ✨
        </h2>
        
        {/* GOOGLE SIGN UP BUTTON */}
        <div id="googleSignUpBtn" className="w-full flex justify-center mb-6" />
        
        {googleLoading && (
          <p className="text-center text-green-600 mb-4 text-sm font-medium">
            Signing up with Google...
          </p>
        )}
        
        {/* Divider */}
        <div className="flex items-center my-6">
          <hr className="flex-1 border-gray-300" />
          <span className="px-3 text-gray-500 text-sm">
            or register with email
          </span>
          <hr className="flex-1 border-gray-300" />
        </div>
        
        {/* EMAIL AND PASSWORD FORM */}
        <form onSubmit={handleEmailSignUp}>
          
          <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 transition duration-150"
              placeholder="email@example.com"
              disabled={isSubmitting || googleLoading}
            />
          </div>
          
          <div className="mb-6">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 transition duration-150"
              placeholder="At least 6 characters"
              disabled={isSubmitting || googleLoading}
            />
          </div>
          
          {error && <p className="text-red-600 text-center mb-4 text-sm font-medium">{error}</p>}
          
          <button
            type="submit"
            className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-4 focus:ring-purple-500 focus:ring-opacity-50 transition duration-150 ease-in-out font-semibold disabled:bg-purple-400 disabled:cursor-not-allowed uppercase tracking-wide"
            disabled={isSubmitting || googleLoading}
          >
            {isSubmitting ? "Processing..." : "Create Account"}
          </button>
        
        </form>
        
        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account? 
          <a href="/signin" className="text-purple-600 font-medium hover:text-purple-800 ml-1 transition duration-150 underline">
            Sign In
          </a>
        </p>
        
      </div>
    </div>
  );
}
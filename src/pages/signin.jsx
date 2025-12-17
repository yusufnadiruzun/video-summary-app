// pages/signin.jsx
import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";

export default function SignIn() {
    const router = useRouter();

    // Auth States
    const [googleLoaded, setGoogleLoaded] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    /**
     * Handles redirection after a successful login.
     * Logic:
     * 1. Check URL for 'callbackUrl' (from Package button or Admin guard).
     * 2. If no callback, and user is Admin, go to '/admin'.
     * 3. Fallback to Homepage '/'.
     */
    const handleSuccessfulLogin = (isAdmin) => {
        const { callbackUrl } = router.query;

        // Cleanup old localStorage values to prevent conflicts with the new logic
        if (typeof window !== "undefined") {
            localStorage.removeItem("redirect_to");
        }

        let finalRoute = "/"; // Default: Homepage

        if (callbackUrl) {
            finalRoute = callbackUrl;
        } else if (isAdmin) {
            finalRoute = "/admin";
        }

        router.push(finalRoute);
    };

    // Redirect if already authenticated
    useEffect(() => {
        if (typeof window !== "undefined" && localStorage.getItem("auth_token")) {
            router.push("/");
        }
    }, [router]);

    // Google Script Injection
    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.onload = () => setGoogleLoaded(true);
        document.body.appendChild(script);
    }, []);

    // Initialize Google Auth
    useEffect(() => {
        if (!googleLoaded || !window.google) return;

        window.google.accounts.id.initialize({
            client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
            callback: handleGoogleResponse,
        });

        window.google.accounts.id.renderButton(
            document.getElementById("googleLoginBtn"),
            { theme: "outline", size: "large", width: "100%" }
        );
    }, [googleLoaded]);

    /** Google Login Handler */
    const handleGoogleResponse = async (response) => {
        setGoogleLoading(true);
        setError("");

        try {
            const res = await fetch(`/api/auth/auth?action=google`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ credential: response.credential }),
            });

            const data = await res.json();

            if (!res.ok || !data.token) {
                setError(data.message || "Google verification failed.");
                setGoogleLoading(false);
                return;
            }

            localStorage.setItem("auth_token", data.token);
            handleSuccessfulLogin(data.isAdmin);
        } catch (err) {
            console.error(err);
            setError("An unexpected error occurred during Google sign-in.");
            setGoogleLoading(false);
        }
    };

    /** Email/Password Login Handler */
    const handleEmailSignIn = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError("");

        try {
            const res = await fetch(`/api/auth/auth?action=login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok || !data.token) {
                setError(data.message || "Login failed. Please check your credentials.");
                setIsSubmitting(false);
                return;
            }

            localStorage.setItem("auth_token", data.token);
            handleSuccessfulLogin(data.isAdmin);
        } catch (err) {
            console.error(err);
            setError("An unexpected error occurred during sign-in.");
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 p-6">
            <div className="bg-white p-10 rounded-2xl shadow-2xl w-full max-w-md">
                <h2 className="text-3xl font-extrabold text-center text-purple-700 mb-8">
                    Welcome Back 👋
                </h2>

                {/* Google Sign In Button */}
                <div id="googleLoginBtn" className="w-full flex justify-center mb-6" />

                {googleLoading && (
                    <p className="text-center text-green-600 mb-3 text-sm font-medium">
                        Signing in with Google...
                    </p>
                )}

                <div className="flex items-center my-6">
                    <hr className="flex-1 border-gray-300" />
                    <span className="px-3 text-gray-500 text-sm">
                        or sign in with email
                    </span>
                    <hr className="flex-1 border-gray-300" />
                </div>

                {/* Form */}
                <form onSubmit={handleEmailSignIn}>
                    <div className="mb-4">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                            Email Address
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 transition duration-150 text-gray-900"
                            placeholder="email@example.com"
                            disabled={isSubmitting || googleLoading}
                        />
                    </div>

                    <div className="mb-6">
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 transition duration-150 text-gray-900"
                            placeholder="••••••••"
                            disabled={isSubmitting || googleLoading}
                        />
                    </div>

                    {error && <p className="text-red-600 text-center mb-4 text-sm">{error}</p>}

                    <button
                        type="submit"
                        className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-4 focus:ring-purple-500 focus:ring-opacity-50 transition duration-150 ease-in-out font-semibold disabled:bg-purple-400 disabled:cursor-not-allowed"
                        disabled={isSubmitting || googleLoading}
                    >
                        {isSubmitting ? "Signing In..." : "Sign In"}
                    </button>
                </form>

                <p className="text-center text-sm text-gray-500 mt-6">
                    Don't have an account?
                    <a href="/signup" className="text-purple-600 font-medium hover:text-purple-800 ml-1 transition duration-150">
                        Create an account
                    </a>
                </p>
            </div>
        </div>
    );
}
"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "../context/LanguageContext";

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WelcomeModal({ isOpen, onClose }: WelcomeModalProps) {
  const { t, language } = useLanguage();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const visited = typeof window !== "undefined" ? localStorage.getItem("hasVisited") : null;
    if (visited === "true") {
      onClose();
    }
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      onClose();
      return;
    }
    try {
      setIsSubmitting(true);
      await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, language }),
      });
    } catch (error) {
      console.error("Subscribe failed:", error);
    } finally {
      if (typeof window !== "undefined") localStorage.setItem("hasVisited", "true");
      setIsSubmitting(false);
      onClose();
    }
  };

  const handleSkip = () => {
    if (typeof window !== "undefined") localStorage.setItem("hasVisited", "true");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50">
      <div className="w-full max-w-md bg-paper-warm rounded-3xl border-2 border-dashed border-moss-green/30 shadow-lg shadow-moss-green/20 p-6 sm:p-8 relative">
        <h2 className="text-2xl font-bold text-ink-dark tracking-wide mb-3 text-center font-cute">
          {t.welcome.title}
        </h2>
        <p className="text-ink-dark text-center mb-5 font-sans">
          {t.welcome.text}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full px-4 py-3 rounded-2xl border-2 border-dashed border-moss-green/30 focus:border-deep-teal outline-none text-ink-dark placeholder-ink-light/60 bg-white"
          />
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleSkip}
              className="flex-1 py-3 rounded-2xl border-2 border-dashed border-moss-green/30 text-ink-dark bg-white hover:border-deep-teal transition-all font-semibold"
            >
              {t.welcome.skip}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 rounded-2xl bg-deep-teal text-white font-bold border-2 border-moss-green hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
            >
              {isSubmitting ? "..." : t.welcome.start}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


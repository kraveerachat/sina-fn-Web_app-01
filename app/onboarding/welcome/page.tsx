"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

export default function WelcomePage() {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [lang, setLang] = useState<"TH" | "EN">("TH");

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === "dark";

  const toggleLanguage = () => {
    setLang((prev) => (prev === "TH" ? "EN" : "TH"));
  };

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white dark:bg-[#0A0A0A] overflow-hidden">
      {/* TOP-RIGHT CONTROLS (Theme & Language) */}
      {mounted && (
        <div className="absolute top-6 right-6 z-50 flex items-center gap-3">
          {/* Language Toggle */}
          <button
            onClick={toggleLanguage}
            type="button"
            className="px-3.5 py-1.5 rounded-full bg-white/20 dark:bg-black/30 backdrop-blur-md border border-white/30 dark:border-white/15 text-xs font-semibold text-neutral-800 dark:text-neutral-100 hover:bg-white/30 dark:hover:bg-black/40 transition-all cursor-pointer shadow-sm"
          >
            {lang}
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            type="button"
            aria-label="Toggle theme"
            className="p-2 rounded-full bg-white/20 dark:bg-black/30 backdrop-blur-md border border-white/30 dark:border-white/15 text-neutral-800 dark:text-neutral-100 hover:bg-white/30 dark:hover:bg-black/40 transition-all cursor-pointer shadow-sm"
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      )}

      {/* CLEAN THEME-AWARE HERO IMAGE (NO OVERLAYS / NO GRADIENT MASKS) */}
      <div className="absolute inset-0 w-full h-full">
        {mounted && (
          <Image
            src={
              isDark
                ? "/assets/images/welcome/WELCOME_SINA_FN_4K_DarkMode.png"
                : "/assets/images/welcome/WELCOME_SINA_FN_4K_LightMode.png"
            }
            alt="Sina_FN Welcome"
            fill
            priority
            style={{ objectFit: "cover" }}
            className="pointer-events-none"
          />
        )}
      </div>

      {/* BOTTOM ACTION BUTTONS */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, type: "spring", damping: 20 }}
        className="absolute bottom-12 left-1/2 -translate-x-1/2 w-full max-w-[320px] flex flex-col gap-3 z-50 px-4"
      >
        <button
          onClick={() => router.push("/register")}
          type="button"
          className="w-full rounded-full py-3.5 px-6 font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-lg text-center cursor-pointer text-base"
        >
          {lang === "TH" ? "เริ่มต้นใช้งาน / สร้างบัญชี" : "Get Started / Sign Up"}
        </button>

        <button
          onClick={() => router.push("/login")}
          type="button"
          className="w-full rounded-full py-3.5 px-6 font-medium text-neutral-900 dark:text-neutral-100 bg-white/20 dark:bg-black/30 backdrop-blur-md border border-white/30 dark:border-white/15 hover:bg-white/30 dark:hover:bg-black/40 transition-colors text-center cursor-pointer text-base"
        >
          {lang === "TH" ? "เข้าสู่ระบบสำหรับสมาชิกเดิม" : "Sign In for Existing Users"}
        </button>
      </motion.div>
    </div>
  );
}

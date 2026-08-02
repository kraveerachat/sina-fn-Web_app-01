"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";

export default function WelcomePage() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === "dark";

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white dark:bg-[#0A0A0A] overflow-hidden">
      {/* THEME-AWARE HERO IMAGE */}
      <motion.div
        className="absolute inset-0 w-full h-full"
        animate={{ y: [0, -10, 0] }}
        transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
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
      </motion.div>

      {/* GLASSMORPHIC ACTION DOCK */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, type: "spring", damping: 20 }}
        className="absolute bottom-0 w-full p-8 pb-12 z-20 bg-gradient-to-t from-white/90 via-white/40 dark:from-[#0A0A0A]/90 dark:via-[#0A0A0A]/40 to-transparent"
      >
        <div className="max-w-md mx-auto flex flex-col items-center">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            onClick={() => router.push("/register")}
            className="rounded-full py-4 px-8 w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold tracking-wide text-lg shadow-lg"
          >
            เริ่มต้นใช้งาน / สร้างบัญชี
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            onClick={() => router.push("/login")}
            className="bg-white/10 dark:bg-white/5 backdrop-blur-2xl border border-black/10 dark:border-white/10 mt-4 rounded-full py-3 w-full text-neutral-800 dark:text-neutral-200 font-medium"
          >
            เข้าสู่ระบบสำหรับสมาชิกเดิม
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

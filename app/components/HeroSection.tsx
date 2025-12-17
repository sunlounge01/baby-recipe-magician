"use client";

import Image from "next/image";
import { useState } from "react";
import { useLanguage } from "../context/LanguageContext";

export default function HeroSection() {
  const [imageError, setImageError] = useState(false);
  const { t } = useLanguage();

  return (
    <div className="w-full bg-paper-warm-cream py-8 sm:py-12 flex flex-col items-center justify-center">
      {/* 中央插畫區 */}
      <div className="relative mb-6">
        {!imageError ? (
          <div className="relative animate-float">
            <Image
              src="/hero-image.png"
              alt="食材奇幻漂流"
              width={400}
              height={400}
              className="w-48 sm:w-60 md:w-[300px] lg:w-[400px] h-auto drop-shadow-lg"
              onError={() => setImageError(true)}
              priority
            />
          </div>
        ) : (
          // Placeholder - 暫位圖
          <div className="w-48 sm:w-60 md:w-[300px] lg:w-[400px] h-48 sm:h-60 md:h-[300px] lg:h-[400px] rounded-full bg-paper-warm flex items-center justify-center relative overflow-hidden shadow-lg">
            <div className="relative w-full h-full flex items-center justify-center">
              {/* 弧形排列的 Emoji */}
              <span 
                className="absolute text-6xl sm:text-7xl animate-bounce" 
                style={{ 
                  animationDelay: '0s', 
                  animationDuration: '2s',
                  left: '20%',
                  top: '30%',
                  transform: 'translate(-50%, -50%)'
                }}
              >
                🎃
              </span>
              <span 
                className="absolute text-6xl sm:text-7xl animate-bounce" 
                style={{ 
                  animationDelay: '0.3s', 
                  animationDuration: '2s',
                  left: '50%',
                  top: '20%',
                  transform: 'translate(-50%, -50%)'
                }}
              >
                🥕
              </span>
              <span 
                className="absolute text-6xl sm:text-7xl animate-bounce" 
                style={{ 
                  animationDelay: '0.6s', 
                  animationDuration: '2s',
                  left: '80%',
                  top: '30%',
                  transform: 'translate(-50%, -50%)'
                }}
              >
                🥦
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 標題 */}
      <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-deep-teal tracking-wide font-sans mb-3 text-center px-4 break-words text-balance">
        {t.hero.title}
      </h1>

      {/* 副標題 */}
      <p className="text-lg sm:text-xl md:text-2xl text-moss-green font-medium tracking-wide font-cute text-center px-4">
        {t.hero.subtitle}
      </p>
    </div>
  );
}


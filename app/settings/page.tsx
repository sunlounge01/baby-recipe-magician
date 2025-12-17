"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Save, ArrowLeft } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

interface UserProfile {
  nickname?: string;
  birthday?: string;
  allergies?: string[];
  dietPreference?: string;
  cookingTools?: string[];
  guest?: boolean;
}

export default function SettingsPage() {
  const router = useRouter();
  const { language, t } = useLanguage();
  const [profile, setProfile] = useState<UserProfile>({});
  const [nickname, setNickname] = useState("");
  const [birthday, setBirthday] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("userProfile");
    if (stored) {
      try {
        const parsed: UserProfile = JSON.parse(stored);
        setProfile(parsed);
        setNickname(parsed.nickname || "");
        setBirthday(parsed.birthday || "");
      } catch {
        // ignore parse error
      }
    }
  }, []);

  const tr = (zh: string, en: string) => (language === "en" ? en : zh);

  const handleSave = () => {
    const nextProfile: UserProfile = {
      ...profile,
      nickname: nickname.trim(),
      birthday: birthday || undefined,
    };
    localStorage.setItem("userProfile", JSON.stringify(nextProfile));
    alert(tr("你太棒了！資料已更新！", "You rock! Profile updated!"));
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-paper-light">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl border-2 border-dashed border-moss-green/30 hover:border-deep-teal transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-ink-dark" />
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-ink-dark tracking-wide">
            {tr("設定", "Settings")}
          </h1>
        </div>

        <div className="rounded-[2rem] border-2 border-dashed border-moss-green/30 bg-white shadow-lg shadow-moss-green/20 p-6 sm:p-8">
          <div className="space-y-5">
            <div>
              <label className="block text-base font-semibold text-ink-dark mb-2">
                {tr("寶寶暱稱", "Baby nickname")}
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder={tr("輸入暱稱", "Enter nickname")}
                className="w-full px-4 py-3 rounded-2xl border-2 border-dashed border-moss-green/30 focus:border-deep-teal outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-base font-semibold text-ink-dark mb-2">
                {tr("生日 / 月齡", "Birthday / Age")}
              </label>
              <input
                type="date"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border-2 border-dashed border-moss-green/30 focus:border-deep-teal outline-none transition-all"
              />
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <button
              onClick={() => router.push('/')}
              className="flex-1 py-3 rounded-2xl border-2 border-dashed border-moss-green/30 text-ink-dark hover:border-deep-teal transition-all"
            >
              {tr("先不存，返回", "Cancel")}
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-3 rounded-2xl bg-deep-teal text-white font-semibold border-2 border-moss-green hover:scale-105 active:scale-100 transition-transform flex items-center justify-center gap-2 shadow-lg shadow-moss-green/20"
            >
              <Save className="w-5 h-5" />
              <span>{tr("儲存設定", "Save settings")}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}




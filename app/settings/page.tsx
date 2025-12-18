"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Save, ArrowLeft, Plus, Users, Trash2 } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { supabase } from "../../lib/supabaseClient";

interface UserProfile {
  nickname?: string;
  birthday?: string;
  allergies?: string[];
  dietPreference?: string;
  cookingTools?: string[];
  guest?: boolean;
  email?: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const { language, t } = useLanguage();
  const [profile, setProfile] = useState<UserProfile>({});
  const [nickname, setNickname] = useState("");
  const [birthday, setBirthday] = useState("");
  const [email, setEmail] = useState("");
  const [babies, setBabies] = useState<Array<{ id: number; name: string; months_old: number | null }>>([]);
  const [newBabyName, setNewBabyName] = useState("");
  const [newBabyMonths, setNewBabyMonths] = useState<number | null>(null);
  const [isSavingBaby, setIsSavingBaby] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [deletingBabyId, setDeletingBabyId] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("userProfile");
    const storedEmail = localStorage.getItem("userEmail") || "";
    const storedUserId = localStorage.getItem("userId") || "";
    if (stored) {
      try {
        const parsed: UserProfile = JSON.parse(stored);
        setProfile(parsed);
        setNickname(parsed.nickname || "");
        setBirthday(parsed.birthday || "");
        if (parsed.email) setEmail(parsed.email);
      } catch {
        // ignore parse error
      }
    }
    if (storedEmail) setEmail(storedEmail);
    if (storedUserId) setUserId(storedUserId);
  }, []);

  const getUserIdByEmail = async (targetEmail: string) => {
    if (!supabase || !targetEmail) return null;
    const { data, error } = await supabase
      .from("users")
      .select("id")
      .eq("email", targetEmail)
      .single();
    if (error) return null;
    return data?.id as string;
  };

  useEffect(() => {
    const fetchBabies = async () => {
      if (!email || !supabase) return;
      let uid = userId;
      if (!uid) {
        uid = await getUserIdByEmail(email);
        if (uid) {
          setUserId(uid);
          if (typeof window !== "undefined") localStorage.setItem("userId", uid);
        }
      }
      if (!uid) return;
      const { data, error } = await supabase
        .from("babies")
        .select("*")
        .eq("user_id", uid)
        .order("id", { ascending: true });
      if (!error && data) {
        setBabies(data);
        localStorage.setItem("babies", JSON.stringify(data));
        if (data.length > 0) {
          localStorage.setItem("activeBabyIds", JSON.stringify([data[0].id]));
        }
      }
    };
    fetchBabies();
  }, [email]);

  const tr = (zh: string, en: string) => (language === "en" ? en : zh);

  const handleSave = () => {
    const nextProfile: UserProfile = {
      ...profile,
      nickname: nickname.trim(),
      birthday: birthday || undefined,
      email: email || profile.email,
    };
    localStorage.setItem("userProfile", JSON.stringify(nextProfile));
    alert(tr("你太棒了！資料已更新！", "You rock! Profile updated!"));
    router.push("/");
  };

  const handleAddBaby = async () => {
    if (!email) {
      alert(tr("請先填寫 Email", "Please fill email first"));
      return;
    }
    if (!newBabyName || newBabyMonths === null) {
      alert(tr("請輸入寶寶姓名與月齡", "Enter baby name and months old"));
      return;
    }
    setIsSavingBaby(true);
    try {
      if (supabase) {
        let uid = userId;
        if (!uid) {
          const upsertRes = await supabase
            .from("users")
            .upsert({ email }, { onConflict: "email" })
            .select("id")
            .single();
          if (upsertRes.error) throw upsertRes.error;
          uid = upsertRes.data?.id as string;
          setUserId(uid);
          localStorage.setItem("userId", uid);
        }
        const { data, error } = await supabase
          .from("babies")
          .insert({ user_id: uid, name: newBabyName, months_old: newBabyMonths })
          .select();
        if (error) throw error;
        const newList = [...babies, ...(data || [])];
        setBabies(newList);
        localStorage.setItem("babies", JSON.stringify(newList));
        localStorage.setItem("activeBabyIds", JSON.stringify([...(JSON.parse(localStorage.getItem("activeBabyIds") || "[]")), data?.[0]?.id].filter(Boolean)));
      } else {
        const tempBaby = { id: Date.now(), name: newBabyName, months_old: newBabyMonths };
        const newList = [...babies, tempBaby];
        setBabies(newList);
        localStorage.setItem("babies", JSON.stringify(newList));
      }
      alert("你太棒了！魔法師已經記住這一切了！");
      setNewBabyName("");
      setNewBabyMonths(null);
    } catch (error) {
      console.error("新增寶寶失敗", error);
      alert(tr("哎呀，魔法失手，稍後再試", "Oops, please try again"));
    } finally {
      setIsSavingBaby(false);
    }
  };

  const handleDeleteBaby = async (babyId: number, babyName?: string) => {
    if (!supabase) {
      alert(tr("Supabase 未正確設定，暫時無法刪除寶寶", "Supabase is not configured, cannot delete baby right now."));
      return;
    }

    const confirmed = window.confirm(
      tr(
        `確定要刪除「${babyName || "這位寶寶"}」嗎？\n刪除後無法從雲端復原。`,
        `Are you sure you want to delete "${babyName || "this baby"}"? This cannot be undone.`
      )
    );
    if (!confirmed) return;

    setDeletingBabyId(babyId);
    try {
      const { error } = await supabase.from("babies").delete().eq("id", babyId);
      if (error) {
        console.error("刪除寶寶失敗", error);
        alert(tr("刪除失敗，請稍後再試", "Delete failed, please try again."));
        return;
      }

      const nextBabies = babies.filter((b) => b.id !== babyId);
      setBabies(nextBabies);
      if (typeof window !== "undefined") {
        localStorage.setItem("babies", JSON.stringify(nextBabies));
        const storedActive = localStorage.getItem("activeBabyIds");
        let activeIds: number[] = [];
        if (storedActive) {
          try {
            activeIds = JSON.parse(storedActive);
          } catch {
            activeIds = [];
          }
        }
        const filteredActive = activeIds.filter((id) => id !== babyId);
        if (filteredActive.length === 0 && nextBabies.length > 0) {
          localStorage.setItem("activeBabyIds", JSON.stringify([nextBabies[0].id]));
        } else {
          localStorage.setItem("activeBabyIds", JSON.stringify(filteredActive));
        }
      }

      alert(tr("已幫你優雅地刪除這位寶寶 🌈", "Baby has been removed from your account."));
    } catch (error) {
      console.error("刪除寶寶例外錯誤", error);
      alert(tr("刪除過程發生錯誤，請稍後再試", "An error occurred while deleting, please try again."));
    } finally {
      setDeletingBabyId(null);
    }
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
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-2xl border-2 border-dashed border-moss-green/30 focus:border-deep-teal outline-none transition-all"
              />
              <p className="mt-2 text-sm text-ink-light">
                我們重視您的隱私，您的 Email 僅用於同步寶寶資料與發送營養建議。
              </p>
            </div>
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

          <div className="mt-6">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-ink-dark" />
              <h2 className="text-lg font-bold text-ink-dark">{tr("我的寶寶們", "My babies")}</h2>
            </div>
            <div className="space-y-3">
              {babies.length === 0 && (
                <div className="text-ink-light">{tr("尚未新增寶寶", "No babies yet")}</div>
              )}
              {babies.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between p-3 rounded-xl border-2 border-dashed border-moss-green/30 gap-3"
                >
                  <div className="flex flex-col">
                    <span className="font-semibold text-ink-dark">{b.name}</span>
                    <span className="text-xs text-ink-light">
                      {b.months_old !== null && b.months_old !== undefined ? `${b.months_old} mo` : "-"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteBaby(b.id, b.name)}
                    disabled={deletingBabyId === b.id}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border-2 text-xs font-semibold bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:border-red-400 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{deletingBabyId === b.id ? tr("刪除中...", "Deleting...") : tr("刪除", "Delete")}</span>
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                value={newBabyName}
                onChange={(e) => setNewBabyName(e.target.value)}
                placeholder={tr("新寶寶姓名", "Baby name")}
                className="px-4 py-3 rounded-2xl border-2 border-dashed border-moss-green/30 focus:border-deep-teal outline-none transition-all"
              />
              <input
                type="number"
                value={newBabyMonths ?? ""}
                onChange={(e) => setNewBabyMonths(Number(e.target.value))}
                placeholder={tr("月齡 (m)", "Months old")}
                className="px-4 py-3 rounded-2xl border-2 border-dashed border-moss-green/30 focus:border-deep-teal outline-none transition-all"
              />
              <button
                onClick={handleAddBaby}
                disabled={isSavingBaby}
                className="px-4 py-3 rounded-2xl bg-deep-teal text-white font-semibold border-2 border-moss-green hover:scale-105 active:scale-100 transition-transform flex items-center justify-center gap-2 shadow-lg shadow-moss-green/20 disabled:opacity-60"
              >
                <Plus className="w-4 h-4" />
                {tr("新增寶寶", "Add baby")}
              </button>
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




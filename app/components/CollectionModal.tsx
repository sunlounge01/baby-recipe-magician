"use client";

import { useState, useEffect } from "react";
import { X, Plus, Heart } from "lucide-react";

interface CollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipeData: {
    title: string;
    ingredients: string[];
    steps: string[];
    time?: string;
    nutrition: any;
    searchKeywords?: string;
  };
}

interface Collection {
  id: string;
  name: string;
  recipes: any[];
}

// 卡片材質背景
const cardTexture = "data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='paper'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.04' numOctaves='3'/%3E%3CfeColorMatrix values='0 0 0 0 0.95 0 0 0 0 0.95 0 0 0 0 0.95 0 0 0 0.15 0'/%3E%3C/filter%3E%3Crect width='200' height='200' fill='%23FFFFFF'/%3E%3Crect width='200' height='200' filter='url(%23paper)'/%3E%3C/svg%3E";

export default function CollectionModal({
  isOpen,
  onClose,
  recipeData,
}: CollectionModalProps) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");

  // 載入收藏清單
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      const stored = localStorage.getItem('collections');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setCollections(parsed);
        } catch (error) {
          console.error('解析 collections 失敗:', error);
          // 初始化預設清單
          const defaultCollection: Collection = {
            id: 'default',
            name: '我的最愛',
            recipes: []
          };
          setCollections([defaultCollection]);
          localStorage.setItem('collections', JSON.stringify([defaultCollection]));
        }
      } else {
        // 初始化預設清單
        const defaultCollection: Collection = {
          id: 'default',
          name: '我的最愛',
          recipes: []
        };
        setCollections([defaultCollection]);
        localStorage.setItem('collections', JSON.stringify([defaultCollection]));
      }
    }
  }, [isOpen]);

  const handleCreateCollection = () => {
    if (!newCollectionName.trim()) {
      alert("請輸入清單名稱");
      return;
    }

    const newCollection: Collection = {
      id: Date.now().toString(),
      name: newCollectionName.trim(),
      recipes: []
    };

    const updated = [...collections, newCollection];
    setCollections(updated);
    localStorage.setItem('collections', JSON.stringify(updated));
    setNewCollectionName("");
    setIsCreatingNew(false);
  };

  const handleSelectCollection = (collectionId: string) => {
    const updated = collections.map(col => {
      if (col.id === collectionId) {
        // 檢查是否已存在相同食譜
        const exists = col.recipes.some(r => r.title === recipeData.title);
        if (!exists) {
          return {
            ...col,
            recipes: [...col.recipes, {
              ...recipeData,
              savedAt: new Date().toISOString()
            }]
          };
        }
      }
      return col;
    });

    setCollections(updated);
    localStorage.setItem('collections', JSON.stringify(updated));
    alert("已加入收藏！");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div
        className="w-full max-w-md rounded-[2rem] border-2 border-dashed border-moss-green/30 shadow-lg shadow-moss-green/20 p-6 bg-white relative"
        style={{
          backgroundImage: `url("${cardTexture}")`,
          backgroundSize: 'cover',
        }}
      >
        {/* 關閉按鈕 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-stone-100 transition-colors"
        >
          <X className="w-5 h-5 text-ink-dark" />
        </button>

        {/* 標題 */}
        <h2 className="text-2xl font-bold text-ink-dark mb-2 tracking-wide font-sans">
          ❤️ 收藏食譜
        </h2>
        <p className="text-lg text-ink-dark mb-6 font-sans">{recipeData.title}</p>

        {/* 收藏清單 */}
        <div className="mb-6 space-y-3 max-h-64 overflow-y-auto">
          {collections.map((collection) => {
            const isAlreadySaved = collection.recipes.some(r => r.title === recipeData.title);
            return (
              <button
                key={collection.id}
                onClick={() => !isAlreadySaved && handleSelectCollection(collection.id)}
                disabled={isAlreadySaved}
                className={`w-full p-4 rounded-2xl border-2 border-dashed transition-all text-left ${
                  isAlreadySaved
                    ? 'border-moss-green/20 bg-paper-warm/50 cursor-not-allowed opacity-60'
                    : 'border-moss-green/30 hover:border-deep-teal hover:bg-sage-green/10 cursor-pointer'
                }`}
                style={{
                  backgroundImage: isAlreadySaved ? 'none' : `url("${cardTexture}")`,
                  backgroundSize: 'cover',
                }}
              >
                <div className="flex items-center gap-3">
                  <Heart className={`w-5 h-5 ${isAlreadySaved ? 'text-ink-light' : 'text-deep-teal'}`} />
                  <div className="flex-1">
                    <div className="font-semibold text-ink-dark tracking-wide font-sans">
                      {collection.name}
                    </div>
                    <div className="text-sm text-ink-dark/70 font-sans">
                      {collection.recipes.length} 道食譜
                    </div>
                  </div>
                  {isAlreadySaved && (
                    <span className="text-sm text-stone-500 font-sans">已收藏</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* 新增清單 */}
        {isCreatingNew ? (
          <div className="mb-6">
            <input
              type="text"
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              placeholder="輸入清單名稱..."
              className="w-full px-4 py-3 rounded-2xl border-2 border-dashed border-moss-green/30 focus:border-deep-teal outline-none text-ink-dark placeholder-ink-light/50 transition-all tracking-wide font-sans"
              style={{
                backgroundImage: `url("${cardTexture}")`,
                backgroundSize: 'cover',
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateCollection();
                } else if (e.key === 'Escape') {
                  setIsCreatingNew(false);
                  setNewCollectionName("");
                }
              }}
              autoFocus
            />
            <div className="flex gap-3 mt-3">
              <button
                onClick={() => {
                  setIsCreatingNew(false);
                  setNewCollectionName("");
                }}
                className="flex-1 py-2 bg-white text-ink-dark rounded-xl font-semibold border-2 border-dashed border-moss-green/30 hover:border-deep-teal transition-all tracking-wide"
                style={{
                  backgroundImage: `url("${cardTexture}")`,
                  backgroundSize: 'cover',
                }}
              >
                取消
              </button>
              <button
                onClick={handleCreateCollection}
                className="flex-1 py-2 bg-deep-teal text-white rounded-xl font-bold border-2 border-moss-green hover:scale-105 active:scale-100 transition-transform tracking-wide shadow-lg shadow-moss-green/20"
              >
                建立
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsCreatingNew(true)}
            className="w-full py-3 rounded-2xl border-2 border-dashed border-moss-green/30 hover:border-deep-teal transition-all flex items-center justify-center gap-2 text-ink-dark font-semibold tracking-wide mb-4"
            style={{
              backgroundImage: `url("${cardTexture}")`,
              backgroundSize: 'cover',
            }}
          >
            <Plus className="w-5 h-5" />
            <span>➕ 新增清單</span>
          </button>
        )}

        {/* 關閉按鈕 */}
        <button
          onClick={onClose}
          className="w-full py-3 bg-deep-teal text-white rounded-2xl font-bold border-2 border-moss-green hover:scale-105 active:scale-100 transition-transform tracking-wide shadow-lg shadow-moss-green/20"
        >
          關閉
        </button>
      </div>
    </div>
  );
}


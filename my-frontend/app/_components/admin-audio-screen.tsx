"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import AdminSidebar from "./admin-sidebar";
import { api, apiFetch } from "../../lib/api";

/* ───────── Types ───────── */

type AudioItem = {
  id: string;
  name: string;
  audio_url: string;
  category: string;
  createdAt?: string;
  updatedAt?: string;
};

type AudioModal = "add" | "edit" | "delete" | null;

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

/* ───────── helpers ───────── */

const resolveAudioUrl = (url: string) => {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return url.startsWith("/") ? `${API_BASE_URL}${url}` : `${API_BASE_URL}/${url}`;
};

const getFileName = (url?: string) => {
  if (!url) return "";
  const parts = url.split("/");
  return parts[parts.length - 1] || url;
};

const formatDate = (iso?: string) => {
  if (!iso) return "--";
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
};

/* ───────── Component ───────── */

export default function AdminAudioScreen() {
  /* data */
  const [items, setItems] = useState<AudioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* filters */
  const [activeFilter, setActiveFilter] = useState("Tất cả");
  const [query, setQuery] = useState("");

  /* modals */
  const [activeModal, setActiveModal] = useState<AudioModal>(null);
  const [selectedItem, setSelectedItem] = useState<AudioItem | null>(null);

  /* toast */
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  /* audio player */
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioProgress, setAudioProgress] = useState<Record<string, number>>({});
  const [audioDurations, setAudioDurations] = useState<Record<string, number>>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);

  /* add/edit form state */
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formFile, setFormFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  /* ───────── Fetch data ───────── */

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<{ data: AudioItem[] }>("/environment-sounds", {
        skipAuth: true,
      });
      setItems(res.data ?? []);
    } catch (err) {
      console.error("Failed to fetch environment sounds:", err);
      setError("Không thể tải danh sách tạp âm.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  /* ───────── Derived filter values ───────── */

  const categories = useMemo(() => {
    const cats = new Set(items.map((i) => i.category || "Khác"));
    return ["Tất cả", ...Array.from(cats).sort()];
  }, [items]);

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    let result = items;
    if (activeFilter !== "Tất cả") {
      result = result.filter((item) => item.category === activeFilter);
    }
    if (normalized) {
      result = result.filter((item) =>
        [item.name, getFileName(item.audio_url)].some((v) =>
          v.toLowerCase().includes(normalized),
        ),
      );
    }
    return result;
  }, [activeFilter, query, items]);

  /* ───────── Audio playback ───────── */

  const togglePlay = (item: AudioItem) => {
    if (playingId === item.id) {
      // pause
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }

    // stop previous
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    const url = resolveAudioUrl(item.audio_url);
    if (!url) return;

    const audio = new Audio(url);
    audioRef.current = audio;

    audio.addEventListener("timeupdate", () => {
      setAudioProgress((prev) => ({ ...prev, [item.id]: audio.currentTime }));
    });
    audio.addEventListener("loadedmetadata", () => {
      setAudioDurations((prev) => ({ ...prev, [item.id]: audio.duration }));
    });
    audio.addEventListener("ended", () => {
      setPlayingId(null);
      setAudioProgress((prev) => ({ ...prev, [item.id]: 0 }));
    });
    audio.addEventListener("error", () => {
      console.error("Audio playback error for:", url);
      setPlayingId(null);
      showToastMsg("Không thể phát file âm thanh này.");
    });

    audio.play().then(() => {
      setPlayingId(item.id);
    }).catch((err) => {
      console.error("Play failed:", err);
      showToastMsg("Không thể phát file âm thanh.");
    });
  };

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  const formatTime = (seconds: number) => {
    if (!seconds || !isFinite(seconds)) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  const getProgressPercent = (itemId: string) => {
    const current = audioProgress[itemId] ?? 0;
    const total = audioDurations[itemId] ?? 1;
    if (total <= 0) return 0;
    return Math.min(100, (current / total) * 100);
  };

  /* ───────── Modal helpers ───────── */

  const openModal = (modal: AudioModal, item?: AudioItem) => {
    setSelectedItem(item ?? null);
    setActiveModal(modal);
    if (modal === "add") {
      setFormName("");
      setFormCategory("Trong nhà");
      setFormFile(null);
    } else if (modal === "edit" && item) {
      setFormName(item.name);
      setFormCategory(item.category || "Khác");
      setFormFile(null);
    }
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedItem(null);
    setFormFile(null);
    setSaving(false);
  };

  const showToastMsg = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    window.setTimeout(() => setShowToast(false), 2800);
  };

  /* ───────── CRUD handlers ───────── */

  const handleAdd = async () => {
    if (!formName.trim()) return;
    setSaving(true);

    try {
      let audioUrl = "";

      // If a file was selected, upload it first
      if (formFile) {
        const formData = new FormData();
        formData.append("file", formFile);
        const uploadRes = await apiFetch<{ audioUrl: string }>(
          "/environment-sounds/upload-audio",
          {
            method: "POST",
            body: formData,
          },
        );
        audioUrl = uploadRes.audioUrl;
      }

      await api.post("/environment-sounds", {
        name: formName.trim(),
        audio_url: audioUrl,
        category: formCategory || "Khác",
      });

      closeModal();
      showToastMsg(`Đã thêm tạp âm "${formName.trim()}"`);
      await fetchItems();
    } catch (err) {
      console.error("Failed to create environment sound:", err);
      showToastMsg("Thêm tạp âm thất bại.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedItem || !formName.trim()) return;
    setSaving(true);

    try {
      const updateBody: Record<string, string> = {
        name: formName.trim(),
        category: formCategory || "Khác",
      };

      // If a new file was selected, upload it
      if (formFile) {
        const formData = new FormData();
        formData.append("file", formFile);
        const uploadRes = await apiFetch<{ audioUrl: string }>(
          "/environment-sounds/upload-audio",
          {
            method: "POST",
            body: formData,
          },
        );
        updateBody.audio_url = uploadRes.audioUrl;
      }

      await api.put(`/environment-sounds/${selectedItem.id}`, updateBody);

      closeModal();
      showToastMsg(`Đã cập nhật tạp âm "${formName.trim()}"`);
      await fetchItems();
    } catch (err) {
      console.error("Failed to update environment sound:", err);
      showToastMsg("Cập nhật tạp âm thất bại.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    setSaving(true);

    try {
      // Stop if this audio is playing
      if (playingId === selectedItem.id) {
        audioRef.current?.pause();
        setPlayingId(null);
      }

      await api.delete(`/environment-sounds/${selectedItem.id}`);
      showToastMsg(`Đã xóa tạp âm "${selectedItem.name}"`);
      closeModal();
      await fetchItems();
    } catch (err) {
      console.error("Failed to delete environment sound:", err);
      showToastMsg("Xóa tạp âm thất bại.");
    } finally {
      setSaving(false);
    }
  };

  /* ───────── Render ───────── */

  return (
    <div className="min-h-screen w-full text-[#1f2b27]">
      <div className="relative min-h-screen w-full">
        <AdminSidebar active="audio" />

        <main className="ml-56 min-h-screen w-[calc(100%-14rem)] bg-[#F2F4F2]">
          <div className="min-h-[120vh] bg-[#F2F4F2] pl-8 pb-16 ">
            <header className="p-8 border-b border-white/90 bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-semibold">Kho tạp âm</h1>
                  <p className="my-2 text-xs text-[#9aa8a2]">
                    {loading
                      ? "Đang tải..."
                      : `${items.length} file âm thanh môi trường`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openModal("add")}
                  className="inline-flex items-center gap-2 rounded-full bg-[#2f5d50] px-4 py-3 text-xs font-semibold text-white"
                >
                  <PlusIcon className="h-3.5 w-3.5" />
                  Thêm tạp âm
                </button>
              </div>
              <div className="mt-6 flex items-center gap-3">
                <div className="flex flex-1 items-center gap-2 rounded-[14px] border border-[#e6ece6] bg-(--vv-search) px-4 py-2 text-xs text-[#9aa8a2]">
                  <SearchIcon className="h-4 w-4" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Tìm kiếm theo tên hoặc file..."
                    className="w-full bg-transparent text-xs text-[#1f2b27] placeholder:text-[#9aa8a2] focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-2 text-xs">
                  {categories.map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setActiveFilter(filter)}
                      className={`rounded-full px-3 py-2 font-semibold transition ${
                        activeFilter === filter
                          ? "bg-[#2f5d50] text-white"
                          : "bg-[#f2f5f2] text-[#7b8b83]"
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>
            </header>

            {/* Error state */}
            {error ? (
              <div className="flex flex-col items-center justify-center py-20 text-[#9aa8a2]">
                <p className="text-sm">{error}</p>
                <button
                  type="button"
                  onClick={fetchItems}
                  className="mt-4 rounded-full bg-[#2f5d50] px-4 py-2 text-xs text-white"
                >
                  Thử lại
                </button>
              </div>
            ) : loading ? (
              /* Loading skeleton */
              <div className="grid grid-cols-3 gap-5 pt-6 px-8">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border border-[#eef2ee] bg-white p-4 animate-pulse"
                  >
                    <div className="h-4 w-2/3 rounded bg-[#eef2ee]" />
                    <div className="mt-2 h-3 w-1/2 rounded bg-[#f6f8f6]" />
                    <div className="mt-4 h-12 rounded-2xl bg-[#f6f8f6]" />
                    <div className="mt-4 flex justify-between">
                      <div className="h-5 w-16 rounded-full bg-[#eef2ee]" />
                      <div className="h-4 w-20 rounded bg-[#f6f8f6]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredItems.length === 0 ? (
              /* Empty state */
              <div className="flex flex-col items-center justify-center py-20 text-[#9aa8a2]">
                <VolumeIcon className="h-12 w-12 mb-4 opacity-40" />
                <p className="text-sm">
                  {query || activeFilter !== "Tất cả"
                    ? "Không tìm thấy tạp âm phù hợp."
                    : "Chưa có tạp âm nào. Hãy thêm tạp âm mới!"}
                </p>
              </div>
            ) : (
              /* Card grid */
              <div className="grid grid-cols-3 gap-5 pt-6 px-8">
                {filteredItems.map((item) => {
                  const isPlaying = playingId === item.id;
                  const progress = getProgressPercent(item.id);
                  const duration = audioDurations[item.id];
                  const currentTime = audioProgress[item.id] ?? 0;

                  return (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-[#eef2ee] bg-white p-4 shadow-[0_10px_20px_rgba(31,43,39,0.06)]"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-semibold">{item.name}</p>
                          <p className="text-[11px] text-[#9aa8a2]">
                            {getFileName(item.audio_url) || "Chưa có file"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <IconButton
                            ariaLabel="Edit"
                            onClick={() => openModal("edit", item)}
                          >
                            <EditIcon className="h-4 w-4" />
                          </IconButton>
                          <IconButton
                            ariaLabel="Delete"
                            onClick={() => openModal("delete", item)}
                          >
                            <TrashIcon className="h-4 w-4 text-[#d46b6b]" />
                          </IconButton>
                        </div>
                      </div>

                      {/* Audio player */}
                      <div className="mt-4 rounded-2xl bg-[#f6f8f6] p-3">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => togglePlay(item)}
                            disabled={!item.audio_url}
                            className={`flex h-8 w-8 items-center justify-center rounded-full text-white transition-all ${
                              !item.audio_url
                                ? "bg-[#b6c4bf] cursor-not-allowed"
                                : isPlaying
                                  ? "bg-[#9f3d3a] hover:bg-[#8a3432]"
                                  : "bg-[#2f5d50] hover:bg-[#254a40]"
                            }`}
                          >
                            {isPlaying ? (
                              <PauseIcon className="h-3.5 w-3.5" />
                            ) : (
                              <PlayIcon className="h-3.5 w-3.5" />
                            )}
                          </button>
                          <div className="flex-1">
                            <div className="h-1.5 w-full rounded-full bg-[#dce4de] overflow-hidden">
                              <div
                                className="h-full rounded-full bg-[#2f5d50] transition-all duration-200"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                          <span className="text-[11px] text-[#7b8b83] min-w-[32px] text-right">
                            {isPlaying
                              ? formatTime(currentTime)
                              : duration
                                ? formatTime(duration)
                                : "--:--"}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <span className={getCategoryClass(item.category)}>
                          {item.category || "Khác"}
                        </span>
                        <div className="text-right text-[11px] text-[#9aa8a2]">
                          <p>{formatDate(item.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ───────── Add Modal ───────── */}
      {activeModal === "add" ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 px-6">
          <div className="w-full max-w-2xl rounded-3xl bg-white shadow-[0_20px_40px_rgba(0,0,0,0.18)]">
            <div className="flex items-center justify-between border-b border-[#f0f2f0] px-6 py-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <VolumeIcon className="h-4 w-4 text-[#2f5d50]" />
                Thêm tạp âm
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="text-[#9aa8a2]"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="px-6 pb-6 pt-4">
              <div className="space-y-4 text-xs text-[#7b8b83]">
                <label className="flex flex-col gap-2">
                  Tên tạp âm
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="VD: Quán cafe, Đường phố..."
                    className="h-12 rounded-2xl border border-transparent bg-[#f7f9f7] px-4 text-sm text-[#1f2b27] ring-1 ring-[#eef2ee] focus:outline-none"
                  />
                </label>
                <label className="flex flex-col gap-2">
                  Phân loại
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="h-12 rounded-2xl border border-transparent bg-[#f7f9f7] px-4 text-sm text-[#1f2b27] ring-1 ring-[#eef2ee] focus:outline-none"
                  >
                    <option value="Trong nhà">Trong nhà</option>
                    <option value="Ngoài trời">Ngoài trời</option>
                    <option value="Phương tiện">Phương tiện</option>
                    <option value="Khác">Khác</option>
                  </select>
                </label>
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-[#1f2b27]">
                    File âm thanh
                  </p>
                  <div
                    className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#d7dfd9] bg-[#f7f9f7] px-6 py-8 text-center cursor-pointer"
                    onClick={() =>
                      document.getElementById("add-audio-input")?.click()
                    }
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (e.dataTransfer.files?.[0]) {
                        setFormFile(e.dataTransfer.files[0]);
                      }
                    }}
                  >
                    <input
                      id="add-audio-input"
                      type="file"
                      accept=".mp3,.wav,.m4a,.mp4"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) setFormFile(e.target.files[0]);
                      }}
                    />
                    {formFile ? (
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#d8eee2] text-[#2f5d50]">
                          <VolumeIcon className="h-5 w-5" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-semibold text-[#1f2b27]">
                            {formFile.name}
                          </p>
                          <p className="text-[11px] text-[#9aa8a2]">
                            {(formFile.size / (1024 * 1024)).toFixed(1)} MB
                          </p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef2ee] text-[#7b8b83]">
                          <UploadIcon className="h-5 w-5" />
                        </div>
                        <p className="mt-4 text-xs text-[#7b8b83]">
                          Kéo thả vào đây hoặc{" "}
                          <span className="font-semibold text-[#2f5d50]">
                            chọn file
                          </span>
                        </p>
                        <p className="mt-2 text-[11px] text-[#9aa8a2]">
                          MP3, WAV, M4A · Tối đa 50MB
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-4 border-t border-[#f0f2f0] px-6 py-4">
              <button
                type="button"
                onClick={closeModal}
                className="text-sm font-semibold text-[#7b8b83]"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleAdd}
                disabled={!formName.trim() || saving}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-white transition ${
                  !formName.trim() || saving
                    ? "bg-[#b6c4bf] cursor-not-allowed"
                    : "bg-[#2f5d50] hover:bg-[#254a40]"
                }`}
              >
                <SaveIcon className="h-4 w-4" />
                {saving ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* ───────── Edit Modal ───────── */}
      {activeModal === "edit" && selectedItem ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 px-6">
          <div className="w-full max-w-2xl rounded-3xl bg-white shadow-[0_20px_40px_rgba(0,0,0,0.18)]">
            <div className="flex items-center justify-between border-b border-[#f0f2f0] px-6 py-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <EditIcon className="h-4 w-4 text-[#2f5d50]" />
                Chỉnh sửa tạp âm
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="text-[#9aa8a2]"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="px-6 pb-6 pt-4">
              <div className="space-y-4 text-xs text-[#7b8b83]">
                <label className="flex flex-col gap-2">
                  Tên tạp âm
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="h-12 rounded-2xl border border-transparent bg-[#f7f9f7] px-4 text-sm text-[#1f2b27] ring-1 ring-[#eef2ee] focus:outline-none"
                  />
                </label>
                <label className="flex flex-col gap-2">
                  Phân loại
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="h-12 rounded-2xl border border-transparent bg-[#f7f9f7] px-4 text-sm text-[#1f2b27] ring-1 ring-[#eef2ee] focus:outline-none"
                  >
                    <option value="Trong nhà">Trong nhà</option>
                    <option value="Ngoài trời">Ngoài trời</option>
                    <option value="Phương tiện">Phương tiện</option>
                    <option value="Khác">Khác</option>
                  </select>
                </label>
                <div className="rounded-2xl border border-[#eef2ee] bg-[#f7f9f7] px-4 py-3 text-[11px] text-[#7b8b83]">
                  <p>
                    File hiện tại:{" "}
                    <span className="font-semibold text-[#1f2b27]">
                      {getFileName(selectedItem.audio_url) || "Chưa có file"}
                    </span>
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-[#1f2b27]">
                    Thay file âm thanh (tuỳ chọn)
                  </p>
                  <div
                    className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#d7dfd9] bg-[#f7f9f7] px-6 py-6 text-center cursor-pointer"
                    onClick={() =>
                      document.getElementById("edit-audio-input")?.click()
                    }
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (e.dataTransfer.files?.[0]) {
                        setFormFile(e.dataTransfer.files[0]);
                      }
                    }}
                  >
                    <input
                      id="edit-audio-input"
                      type="file"
                      accept=".mp3,.wav,.m4a,.mp4"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) setFormFile(e.target.files[0]);
                      }}
                    />
                    {formFile ? (
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#d8eee2] text-[#2f5d50]">
                          <VolumeIcon className="h-5 w-5" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-semibold text-[#1f2b27]">
                            {formFile.name}
                          </p>
                          <p className="text-[11px] text-[#9aa8a2]">
                            {(formFile.size / (1024 * 1024)).toFixed(1)} MB
                          </p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eef2ee] text-[#7b8b83]">
                          <UploadIcon className="h-4 w-4" />
                        </div>
                        <p className="mt-3 text-xs text-[#7b8b83]">
                          Kéo thả hoặc{" "}
                          <span className="font-semibold text-[#2f5d50]">
                            chọn file mới
                          </span>
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-4 border-t border-[#f0f2f0] px-6 py-4">
              <button
                type="button"
                onClick={closeModal}
                className="text-sm font-semibold text-[#7b8b83]"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleEdit}
                disabled={!formName.trim() || saving}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-white transition ${
                  !formName.trim() || saving
                    ? "bg-[#b6c4bf] cursor-not-allowed"
                    : "bg-[#2f5d50] hover:bg-[#254a40]"
                }`}
              >
                <SaveIcon className="h-4 w-4" />
                {saving ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* ───────── Delete Modal ───────── */}
      {activeModal === "delete" && selectedItem ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 px-6">
          <div className="w-full max-w-lg rounded-3xl bg-white shadow-[0_20px_40px_rgba(0,0,0,0.18)]">
            <div className="flex items-center justify-between border-b border-[#f0f2f0] px-6 py-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#9f3d3a]">
                <TrashIcon className="h-4 w-4" />
                Xóa tạp âm
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="text-[#9aa8a2]"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="px-6 pb-6 pt-4">
              <p className="text-sm text-[#7b8b83]">
                Bạn có chắc chắn muốn xóa &quot;{selectedItem.name}&quot;?
              </p>
              <p className="mt-2 text-[11px] text-[#9aa8a2]">
                File âm thanh liên quan cũng sẽ bị xóa khỏi server.
              </p>
            </div>
            <div className="flex items-center justify-end gap-4 border-t border-[#f0f2f0] px-6 py-4">
              <button
                type="button"
                onClick={closeModal}
                className="text-sm font-semibold text-[#7b8b83]"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={saving}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-white transition ${
                  saving
                    ? "bg-[#d4a0a0] cursor-not-allowed"
                    : "bg-[#9f3d3a] hover:bg-[#8a3432]"
                }`}
              >
                <TrashIcon className="h-4 w-4" />
                {saving ? "Đang xóa..." : "Xóa"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* ───────── Toast ───────── */}
      {showToast ? (
        <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-[0_16px_32px_rgba(0,0,0,0.12)]">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#d8eee2] text-[#2f5d50]">
            ✓
          </div>
          <p className="text-sm text-[#1f2b27]">{toastMessage}</p>
          <button
            type="button"
            onClick={() => setShowToast(false)}
            className="text-[#9aa8a2]"
          >
            ×
          </button>
        </div>
      ) : null}
    </div>
  );
}

/* ───────── Utilities ───────── */

function getCategoryClass(category: string) {
  switch (category) {
    case "Trong nhà":
      return "rounded-full bg-[#d8eee2] px-3 py-1 text-[11px] font-semibold text-[#2f5d50]";
    case "Ngoài trời":
      return "rounded-full bg-[#eaf2fb] px-3 py-1 text-[11px] font-semibold text-[#4c6fa3]";
    case "Phương tiện":
      return "rounded-full bg-[#fff2d9] px-3 py-1 text-[11px] font-semibold text-[#c47b1f]";
    default:
      return "rounded-full bg-[#eef2ee] px-3 py-1 text-[11px] font-semibold text-[#7b8b83]";
  }
}

/* ───────── Icons ───────── */

function IconButton({
  children,
  ariaLabel,
  onClick,
}: {
  children: ReactNode;
  ariaLabel: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      className="flex h-7 w-7 items-center justify-center rounded-full border border-[#eef2ee] text-[#9aa8a2]"
      aria-label={ariaLabel}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  );
}

function EditIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </svg>
  );
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 16V6" />
      <path d="M8 10l4-4 4 4" />
      <path d="M20 16v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2" />
    </svg>
  );
}

function VolumeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M11 5 6 9H2v6h4l5 4V5z" />
      <path d="M19 9a5 5 0 0 1 0 6" />
    </svg>
  );
}

function SaveIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />
      <path d="M17 21v-8H7v8" />
      <path d="M7 3v5h8" />
    </svg>
  );
}

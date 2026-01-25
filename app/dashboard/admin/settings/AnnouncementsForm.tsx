"use client";

import { useState, useTransition } from "react";
import { createAnnouncement } from "@/app/actions/admin/announcements";

export default function AnnouncementsForm() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<"SYSTEM" | "ASSOCIATION">("SYSTEM");
  const [status, setStatus] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setStatus(null);

    if (!title.trim() || !content.trim()) {
      setStatus("Uzupełnij tytuł i treść.");
      return;
    }

    startTransition(async () => {
      const result = await createAnnouncement({
        title: title.trim(),
        content: content.trim(),
        type
      });

      if (result.success) {
        setTitle("");
        setContent("");
        setType("SYSTEM");
        setStatus("Wiadomość została wysłana.");
      } else {
        setStatus(result.error || "Wystąpił błąd.");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-white/80 mb-2">Tytuł</label>
        <input
          type="text"
          value={title}
          onChange={event => setTitle(event.target.value)}
          className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-2 text-white"
          placeholder="Wpisz tytuł wiadomości"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-white/80 mb-2">Treść</label>
        <textarea
          value={content}
          onChange={event => setContent(event.target.value)}
          className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-2 text-white min-h-[120px]"
          placeholder="Wpisz treść wiadomości"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-white/80 mb-2">Typ</label>
        <select
          value={type}
          onChange={event => setType(event.target.value as "SYSTEM" | "ASSOCIATION")}
          className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-2 text-white"
        >
          <option value="SYSTEM">Systemowe</option>
          <option value="ASSOCIATION">Związkowe</option>
        </select>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-white/60">{status}</span>
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2 rounded-xl bg-primary text-brown-900 font-semibold hover:opacity-90 disabled:opacity-50"
        >
          {isPending ? "Wysyłanie..." : "Wyślij"}
        </button>
      </div>
    </form>
  );
}

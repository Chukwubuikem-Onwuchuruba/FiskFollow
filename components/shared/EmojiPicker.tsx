"use client";

import { useState, useRef, useEffect } from "react";
import { Smile } from "lucide-react";
import dynamic from "next/dynamic";

const Picker = dynamic(
  () => import("emoji-picker-react").then((mod) => mod.default),
  {
    ssr: false,
    loading: () => null,
  },
);

interface Props {
  onEmojiSelect: (emoji: string) => void;
  position?: "top" | "bottom";
}

export default function EmojiPicker({
  onEmojiSelect,
  position = "top",
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="text-light-3 hover:text-primary-500 transition cursor-pointer"
      >
        <Smile className="w-5 h-5" />
      </button>

      {open && (
        <div
          className={`absolute z-50 ${
            position === "top" ? "bottom-10" : "top-10"
          } right-0`}
          onClick={(e) => e.stopPropagation()}
        >
          <Picker
            onEmojiClick={(emojiData) => {
              onEmojiSelect(emojiData.emoji);
              setOpen(false);
            }}
            theme={"dark" as any}
            lazyLoadEmojis
            skinTonesDisabled
            searchDisabled={false}
            width={300}
            height={400}
          />
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowUp, CornerDownLeft, Delete, Globe } from "lucide-react";
import { cn } from "@/lib/cn";
import { useKeyboardStore } from "@/stores/use-keyboard-store";

const ROW_TOP = ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"];
const ROW_HOME = ["a", "s", "d", "f", "g", "h", "j", "k", "l"];
const ROW_BOTTOM = ["z", "x", "c", "v", "b", "n", "m"];

function Key({
  label,
  onPress,
  className,
  active,
  ariaLabel,
}: {
  label: React.ReactNode;
  onPress: () => void;
  className?: string;
  active?: boolean;
  ariaLabel?: string;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.88 }}
      transition={{ type: "spring", stiffness: 600, damping: 28 }}
      onClick={onPress}
      aria-label={ariaLabel ?? (typeof label === "string" ? label : undefined)}
      className={cn(
        "flex h-11 min-w-0 flex-1 items-center justify-center rounded-lg border text-sm font-medium shadow-sm transition-colors",
        active
          ? "border-cx-purple bg-cx-purpleLight text-cx-purpleDark"
          : "border-white/60 bg-cx-surface text-slate-700 hover:bg-cx-bg shadow-cx-inset-sm active:bg-slate-100",
        className
      )}
    >
      {label}
    </motion.button>
  );
}

/**
 * Rendered QWERTY preview of the Client X keyboard.
 * Typing writes into the preview input bound to the keyboard store.
 */
export function VirtualKeyboard() {
  const kbInput = useKeyboardStore((s) => s.kbInput);
  const setKbInput = useKeyboardStore((s) => s.setKbInput);
  const language = useKeyboardStore((s) => s.language);
  const setLanguage = useKeyboardStore((s) => s.setLanguage);
  const [shift, setShift] = useState(false);

  const typeChar = (c: string) => {
    setKbInput(kbInput + (shift ? c.toUpperCase() : c));
    if (shift) setShift(false); // shift applies to the next key only
  };
  const backspace = () => setKbInput(kbInput.slice(0, -1));

  return (
    <div className="flex flex-col gap-3">
      <textarea
        value={kbInput}
        onChange={(e) => setKbInput(e.target.value)}
        placeholder="Tap the keys below — or type here — to preview the Client X keyboard."
        rows={4}
        className="w-full resize-none rounded-2xl  bg-cx-surface px-4 py-3 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-cx-purple focus:outline-none focus:ring-2 focus:ring-cx-purple/15"
      />
      <div className="rounded-2xl  bg-slate-100/60 p-2.5 shadow-inner sm:p-3">
        <div className="flex flex-col gap-1.5">
          <div className="flex gap-1.5">
            {ROW_TOP.map((k) => (
              <Key key={k} label={shift ? k.toUpperCase() : k} onPress={() => typeChar(k)} />
            ))}
          </div>
          <div className="flex gap-1.5 px-3">
            {ROW_HOME.map((k) => (
              <Key key={k} label={shift ? k.toUpperCase() : k} onPress={() => typeChar(k)} />
            ))}
          </div>
          <div className="flex gap-1.5">
            <Key
              label={<ArrowUp size={17} />}
              ariaLabel="Shift"
              active={shift}
              onPress={() => setShift((v) => !v)}
              className="max-w-[64px]"
            />
            {ROW_BOTTOM.map((k) => (
              <Key key={k} label={shift ? k.toUpperCase() : k} onPress={() => typeChar(k)} />
            ))}
            <Key
              label={<Delete size={17} />}
              ariaLabel="Backspace"
              onPress={backspace}
              className="max-w-[64px]"
            />
          </div>
          <div className="flex gap-1.5">
            <Key
              label={
                <span className="flex items-center gap-1 text-xs font-semibold">
                  <Globe size={14} />
                  {language.toUpperCase()}
                </span>
              }
              ariaLabel="Toggle input language"
              onPress={() => setLanguage(language === "en" ? "ur" : "en")}
              className="max-w-[76px]"
            />
            <Key label="space" ariaLabel="Space" onPress={() => setKbInput(kbInput + " ")} />
            <Key label="." onPress={() => typeChar(".")} className="max-w-[52px]" />
            <Key
              label={<CornerDownLeft size={17} />}
              ariaLabel="Enter"
              onPress={() => setKbInput(kbInput + "\n")}
              className="max-w-[64px]"
            />
          </div>
        </div>
      </div>
      <p className="text-xs text-slate-400">
        Shift applies to the next key only · the globe key switches EN / UR input language.
      </p>
    </div>
  );
}

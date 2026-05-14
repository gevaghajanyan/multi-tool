"use client";

import { useState } from "react";

interface Perms { r: boolean; w: boolean; x: boolean }

const PRESETS: { label: string; desc: string }[] = [
  { label: "400", desc: "Read-only" },
  { label: "600", desc: "Private file" },
  { label: "644", desc: "Standard file" },
  { label: "700", desc: "Private dir" },
  { label: "755", desc: "Executable / dir" },
  { label: "777", desc: "Full access" },
];

function permToNum(p: Perms) {
  return (p.r ? 4 : 0) + (p.w ? 2 : 0) + (p.x ? 1 : 0);
}

function numToPerm(n: number): Perms {
  return { r: !!(n & 4), w: !!(n & 2), x: !!(n & 1) };
}

function describePerms(o: Perms, g: Perms, ot: Perms) {
  function part(p: Perms, name: string) {
    const bits = [p.r && "read", p.w && "write", p.x && "execute"].filter(Boolean) as string[];
    if (!bits.length) return `${name}: no access`;
    if (bits.length === 3) return `${name}: full access`;
    return `${name}: ${bits.join(" + ")}`;
  }
  return [part(o, "Owner"), part(g, "Group"), part(ot, "Others")].join(" · ");
}

export function ChmodCalculator() {
  const [owner, setOwner] = useState<Perms>({ r: true, w: true, x: false });
  const [group, setGroup] = useState<Perms>({ r: true, w: false, x: false });
  const [other, setOther] = useState<Perms>({ r: true, w: false, x: false });
  const [special, setSpecial] = useState({ setuid: false, setgid: false, sticky: false });
  const [octalInput, setOctalInput] = useState("644");
  const [copied, setCopied] = useState(false);

  // Derived values
  const spNum = (special.setuid ? 4 : 0) + (special.setgid ? 2 : 0) + (special.sticky ? 1 : 0);
  const octal = spNum > 0
    ? `${spNum}${permToNum(owner)}${permToNum(group)}${permToNum(other)}`
    : `${permToNum(owner)}${permToNum(group)}${permToNum(other)}`;

  function ownerX() { return special.setuid ? (owner.x ? "s" : "S") : owner.x ? "x" : "-"; }
  function groupX() { return special.setgid ? (group.x ? "s" : "S") : group.x ? "x" : "-"; }
  function otherX() { return special.sticky  ? (other.x ? "t" : "T") : other.x ? "x" : "-"; }

  const symbolic =
    (owner.r ? "r" : "-") + (owner.w ? "w" : "-") + ownerX() +
    (group.r ? "r" : "-") + (group.w ? "w" : "-") + groupX() +
    (other.r ? "r" : "-") + (other.w ? "w" : "-") + otherX();

  // Sync octalInput from the bits whenever a checkbox changes
  function bitsToOctalStr(o: Perms, g: Perms, ot: Perms, sp: typeof special) {
    const s = (sp.setuid ? 4 : 0) + (sp.setgid ? 2 : 0) + (sp.sticky ? 1 : 0);
    const str = `${permToNum(o)}${permToNum(g)}${permToNum(ot)}`;
    return s > 0 ? `${s}${str}` : str;
  }

  function toggleBit(who: "owner" | "group" | "other", bit: keyof Perms) {
    let o = owner, g = group, ot = other;
    if (who === "owner")      { o  = { ...owner, [bit]: !owner[bit]  }; setOwner(o); }
    else if (who === "group") { g  = { ...group, [bit]: !group[bit]  }; setGroup(g); }
    else                      { ot = { ...other, [bit]: !other[bit]  }; setOther(ot); }
    setOctalInput(bitsToOctalStr(o, g, ot, special));
  }

  function toggleSpecial(key: keyof typeof special) {
    const sp = { ...special, [key]: !special[key] };
    setSpecial(sp);
    setOctalInput(bitsToOctalStr(owner, group, other, sp));
  }

  function handleOctalInput(val: string) {
    const clean = val.replace(/[^0-7]/g, "").slice(0, 4);
    setOctalInput(clean);
    if (clean.length === 3) {
      setOwner(numToPerm(parseInt(clean[0])));
      setGroup(numToPerm(parseInt(clean[1])));
      setOther(numToPerm(parseInt(clean[2])));
      setSpecial({ setuid: false, setgid: false, sticky: false });
    } else if (clean.length === 4) {
      const sp = parseInt(clean[0]);
      setSpecial({ setuid: !!(sp & 4), setgid: !!(sp & 2), sticky: !!(sp & 1) });
      setOwner(numToPerm(parseInt(clean[1])));
      setGroup(numToPerm(parseInt(clean[2])));
      setOther(numToPerm(parseInt(clean[3])));
    }
  }

  async function copyCommand() {
    await navigator.clipboard.writeText(`chmod ${octal} <file>`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const checkboxCls = (on: boolean) =>
    `h-5 w-5 rounded border transition-colors duration-100 cursor-pointer ${
      on
        ? "border-amber-400 bg-amber-400 text-zinc-900"
        : "border-zinc-600 bg-zinc-800 hover:border-zinc-500"
    }`;

  function PermColumn({
    label,
    perms,
    who,
  }: {
    label: string;
    perms: Perms;
    who: "owner" | "group" | "other";
  }) {
    return (
      <div className="flex flex-col items-center gap-3">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
          {label}
        </span>
        {(["r", "w", "x"] as (keyof Perms)[]).map((bit) => (
          <label key={bit} className="flex flex-col items-center gap-1 cursor-pointer">
            <span className="text-[10px] font-mono text-zinc-600">{bit.toUpperCase()}</span>
            <button
              type="button"
              role="checkbox"
              aria-checked={perms[bit]}
              onClick={() => toggleBit(who, bit)}
              className={checkboxCls(perms[bit])}
            >
              {perms[bit] && (
                <svg viewBox="0 0 10 8" fill="none" className="h-full w-full p-0.5">
                  <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
            <span className="text-xs font-medium text-zinc-300">{perms[bit] ? "1" : "0"}</span>
          </label>
        ))}
        <span className="mt-1 text-lg font-bold tabular-nums text-amber-400">
          {permToNum(perms)}
        </span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Chmod Calculator</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Build Unix file permissions visually or type an octal value.
        </p>
      </header>

      <div className="flex flex-col gap-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl">

        {/* Octal input */}
        <div className="flex items-center gap-4">
          <div className="flex flex-1 flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-300">Octal</label>
            <input
              type="text"
              value={octalInput}
              onChange={(e) => handleOctalInput(e.target.value)}
              maxLength={4}
              placeholder="644"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-lg text-zinc-100 outline-none transition-colors focus:border-amber-400/60"
            />
          </div>
          <div className="flex flex-1 flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-300">Symbolic</label>
            <div className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2">
              <span className="font-mono text-lg tracking-wide text-zinc-100">{symbolic}</span>
            </div>
          </div>
        </div>

        {/* Permission grid */}
        <div className="flex justify-around rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-5">
          <PermColumn label="Owner" perms={owner} who="owner" />
          <div className="w-px self-stretch bg-zinc-800" />
          <PermColumn label="Group" perms={group} who="group" />
          <div className="w-px self-stretch bg-zinc-800" />
          <PermColumn label="Others" perms={other} who="other" />
        </div>

        {/* Special bits */}
        <div className="flex gap-3">
          {(["setuid", "setgid", "sticky"] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => toggleSpecial(key)}
              className={`flex-1 rounded-lg border py-2 text-xs font-medium transition-colors ${
                special[key]
                  ? "border-amber-400/50 bg-amber-400/10 text-amber-400"
                  : "border-zinc-700 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
              }`}
            >
              {key === "setuid" ? "setuid" : key === "setgid" ? "setgid" : "sticky"}
            </button>
          ))}
        </div>

        {/* Presets */}
        <div>
          <p className="mb-2 text-xs font-medium text-zinc-500">Common presets</p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {PRESETS.map(({ label, desc }) => (
              <button
                key={label}
                type="button"
                onClick={() => handleOctalInput(label)}
                className={`rounded-lg border px-2 py-2 text-center transition-colors ${
                  octal === label
                    ? "border-amber-400/50 bg-amber-400/10 text-amber-400"
                    : "border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-100"
                }`}
              >
                <p className="font-mono text-sm font-bold">{label}</p>
                <p className="mt-0.5 text-[10px] text-zinc-600">{desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Description + copy */}
        <div className="flex items-start justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3">
          <div>
            <p className="font-mono text-sm text-zinc-300">chmod {octal} &lt;file&gt;</p>
            <p className="mt-1 text-xs text-zinc-500">{describePerms(owner, group, other)}</p>
          </div>
          <button
            type="button"
            onClick={copyCommand}
            className="shrink-0 rounded-lg border border-zinc-700 px-3 py-1 text-xs text-zinc-400 transition-colors hover:text-zinc-100"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-zinc-600">
        All processing runs locally — your data never leaves this tab.
      </p>
    </div>
  );
}

"use client";

import { useState, useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

export function InviteLink({ code }: { code: string }) {
  const origin = useSyncExternalStore(
    noopSubscribe,
    () => window.location.origin,
    () => "",
  );
  const [copied, setCopied] = useState(false);
  const url = `${origin}/join/${code}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Sin permiso de portapapeles: el enlace queda visible para copiarlo a mano.
    }
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <input
        readOnly
        value={url}
        aria-label="Enlace de invitación"
        className="input flex-1 font-mono text-sm"
        onFocus={(event) => event.currentTarget.select()}
      />
      <button type="button" className="btn btn-gold shrink-0" onClick={copy}>
        {copied ? "¡Copiado! ✓" : "Copiar enlace"}
      </button>
    </div>
  );
}

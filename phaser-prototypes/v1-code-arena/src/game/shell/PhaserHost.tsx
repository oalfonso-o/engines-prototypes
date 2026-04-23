import { useEffect, useRef } from "react";
import type { PrototypeSettings } from "../../settings/prototypeSettings";
import type { SupportedLocale } from "../../app/routing/appState";
import { createGameRuntime } from "../main";
import type { GameBridge } from "../../bridge/GameBridge";
import { i18n } from "../../app/i18n/i18n";
import type { RuntimeContentCatalog } from "../content/runtimeContent";

interface PhaserHostProps {
  bridge: GameBridge;
  settings: PrototypeSettings;
  runtimeContent: RuntimeContentCatalog;
  locale: SupportedLocale;
}

export function PhaserHost({ bridge, settings, runtimeContent, locale }: PhaserHostProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const runtimeRef = useRef<ReturnType<typeof createGameRuntime> | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || runtimeRef.current) {
      return;
    }

    runtimeRef.current = createGameRuntime(root, settings, runtimeContent, bridge, i18n, locale);
    return () => {
      runtimeRef.current?.destroy();
      runtimeRef.current = null;
    };
  }, [bridge]);

  return <div className="game-root" ref={rootRef} />;
}

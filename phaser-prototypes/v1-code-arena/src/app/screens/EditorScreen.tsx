import { useEffect, useMemo, useRef, useState } from "react";
import type { SupportedLocale } from "../routing/appState";
import { createEditorApp } from "../../editor/app/createEditorApp";
import { MemoryEditorRouter } from "../../editor/app/MemoryEditorRouter";
import type { GameBridge } from "../../bridge/GameBridge";
import { i18n } from "../i18n/i18n";

interface EditorScreenProps {
  bridge: GameBridge;
  locale: SupportedLocale;
  onReturnToMainMenu: () => void;
}

export function EditorScreen({ bridge, locale, onReturnToMainMenu }: EditorScreenProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const router = useMemo(() => new MemoryEditorRouter({ kind: "library" }), []);
  const [isSupportedWidth, setIsSupportedWidth] = useState(() => window.innerWidth >= 1000);

  useEffect(() => {
    const syncWidth = () => {
      setIsSupportedWidth(window.innerWidth >= 1000);
    };

    syncWidth();
    window.addEventListener("resize", syncWidth);
    return () => {
      window.removeEventListener("resize", syncWidth);
    };
  }, []);

  useEffect(() => {
    bridge.setEditorPreviewState({ kind: "ambient-grid" });
    return () => {
      bridge.setEditorPreviewState({ kind: "hidden" });
    };
  }, [bridge]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) {
      return;
    }

    let disposed = false;
    let cleanup: (() => Promise<void>) | null = null;

    void createEditorApp(root, {
      i18n,
      router,
      onReturnToMainMenu,
    }).then((nextCleanup) => {
      if (disposed) {
        void nextCleanup();
        return;
      }
      cleanup = nextCleanup;
    });

    return () => {
      disposed = true;
      if (cleanup) {
        void cleanup();
      }
    };
  }, [locale, onReturnToMainMenu, router]);

  return (
    <div className="editor-screen">
      <div className="editor-screen-root" ref={rootRef} />
      {!isSupportedWidth ? (
        <div className="editor-unsupported-overlay">
          <div className="editor-unsupported-panel">
            <strong>{i18n.t("editor.shell.unsupportedWidthTitle")}</strong>
            <p>{i18n.t("editor.shell.unsupportedWidthBody")}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

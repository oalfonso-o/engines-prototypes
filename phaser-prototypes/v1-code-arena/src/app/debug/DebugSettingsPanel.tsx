import { useTranslation } from "react-i18next";
import type { PrototypeSettings } from "../../settings/prototypeSettings";

type SettingsPath = Array<string | number>;
type SettingsValue = string | number | boolean | SettingsValue[] | { [key: string]: SettingsValue };

interface DebugSettingsPanelProps {
  isOpen: boolean;
  settings: PrototypeSettings;
  isDirty: boolean;
  isSaving: boolean;
  saveError: string | null;
  onClose: () => void;
  onSave: () => void;
  onRevert: () => void;
  onSettingsChange: (nextSettings: PrototypeSettings) => void;
}

export function DebugSettingsPanel({
  isOpen,
  settings,
  isDirty,
  isSaving,
  saveError,
  onClose,
  onSave,
  onRevert,
  onSettingsChange,
}: DebugSettingsPanelProps) {
  const { t } = useTranslation();

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="debug-settings-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <aside
        className="debug-settings-panel overlay-panel"
        onMouseDown={(event) => {
          event.stopPropagation();
        }}
      >
        <div className="debug-settings-toolbar">
          <div className="debug-settings-titleline">
            <span className="debug-settings-badge">debug</span>
            <span className="debug-settings-filename">settings.yaml</span>
            {isDirty && (
              <span className="debug-settings-inline-status">
                {t("debug.unsaved")}
              </span>
            )}
          </div>
          <button
            type="button"
            className="debug-close-button"
            aria-label={t("debug.close")}
            title={t("debug.close")}
            onClick={onClose}
          >
            ×
          </button>
        </div>

        {saveError && <div className="debug-status-error">{saveError}</div>}

        <div className="debug-settings-content">
          {Object.entries(settings).map(([key, value]) => (
            <SettingsNode
              key={key}
              rootSettings={settings}
              path={[key]}
              value={value as SettingsValue}
              onValueChange={(nextValue) => {
                onSettingsChange(
                  setValueAtPath(
                    settings as unknown as SettingsValue,
                    [key],
                    nextValue,
                  ) as unknown as PrototypeSettings,
                );
              }}
            />
          ))}
        </div>

        <div className="debug-settings-actions">
          <button
            type="button"
            className="menu-button secondary debug-action-button"
            onClick={onRevert}
            disabled={!isDirty || isSaving}
          >
            {t("debug.revert")}
          </button>
          <button
            type="button"
            className="menu-button debug-action-button"
            onClick={onSave}
            disabled={isSaving}
          >
            {isSaving ? t("debug.saving") : t("debug.save")}
          </button>
        </div>
      </aside>
    </div>
  );
}

interface SettingsNodeProps {
  rootSettings: PrototypeSettings;
  path: SettingsPath;
  value: SettingsValue;
  onValueChange: (nextValue: SettingsValue) => void;
}

function SettingsNode({ rootSettings, path, value, onValueChange }: SettingsNodeProps) {
  const { t } = useTranslation();
  const label = getLabel(t, path);
  const disabled = isDebugDescendant(path) && !rootSettings.debug.enabled;

  if (Array.isArray(value)) {
    return (
      <details className="debug-settings-group" open>
        <summary>{label}</summary>
        <div className="debug-settings-group-body">
          {value.map((item, index) => (
            <div key={index} className="debug-settings-array-item">
              <div className="debug-settings-array-label">{t("debug.item", { index: index + 1 })}</div>
              <SettingsNode
                rootSettings={rootSettings}
                path={[...path, index]}
                value={item as SettingsValue}
                onValueChange={(nextValue) => {
                  const nextArray = value.map((entry, entryIndex) => (entryIndex === index ? nextValue : entry));
                  onValueChange(nextArray as SettingsValue);
                }}
              />
            </div>
          ))}
        </div>
      </details>
    );
  }

  if (isPlainObject(value)) {
    return (
      <details className="debug-settings-group" open>
        <summary>{label}</summary>
        <div className="debug-settings-group-body">
          {Object.entries(value).map(([key, childValue]) => (
            <SettingsNode
              key={key}
              rootSettings={rootSettings}
              path={[...path, key]}
              value={childValue as SettingsValue}
              onValueChange={(nextValue) => {
                onValueChange({
                  ...value,
                  [key]: nextValue,
                });
              }}
            />
          ))}
        </div>
      </details>
    );
  }

  if (typeof value === "boolean") {
    return (
      <label className={disabled ? "debug-settings-field is-disabled" : "debug-settings-field"}>
        <span>{label}</span>
        <input
          type="checkbox"
          checked={value}
          disabled={disabled}
          onChange={(event) => onValueChange(event.currentTarget.checked)}
        />
      </label>
    );
  }

  if (typeof value === "number") {
    return (
      <label className={disabled ? "debug-settings-field is-disabled" : "debug-settings-field"}>
        <span>{label}</span>
        <input
          className="debug-settings-input"
          type="number"
          step="any"
          value={value}
          disabled={disabled}
          onChange={(event) => {
            if (event.currentTarget.value === "") {
              return;
            }
            onValueChange(Number(event.currentTarget.value));
          }}
        />
      </label>
    );
  }

  return (
    <label className={disabled ? "debug-settings-field is-disabled" : "debug-settings-field"}>
      <span>{label}</span>
      <div className="debug-settings-text-row">
        {looksLikeHexColor(value) && (
          <input
            className="debug-settings-color"
            type="color"
            value={normalizeColorValue(value)}
            disabled={disabled}
            onChange={(event) => onValueChange(event.currentTarget.value)}
          />
        )}
        <input
          className="debug-settings-input"
          type="text"
          value={value}
          disabled={disabled}
          onChange={(event) => onValueChange(event.currentTarget.value)}
        />
      </div>
    </label>
  );
}

function getLabel(
  t: ReturnType<typeof useTranslation>["t"],
  path: SettingsPath,
): string {
  const key = path[path.length - 1];
  if (typeof key === "number") {
    return t("debug.item", { index: key + 1 });
  }

  return t(`debug.settings.${path.join(".")}`, {
    defaultValue: humanizeKey(key),
  });
}

function humanizeKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function setValueAtPath(root: SettingsValue, path: SettingsPath, nextValue: SettingsValue): SettingsValue {
  if (path.length === 0) {
    return nextValue;
  }

  const [segment, ...rest] = path;

  if (Array.isArray(root)) {
    return root.map((item, index) => {
      if (index !== segment) {
        return item;
      }

      return setValueAtPath(item as SettingsValue, rest, nextValue);
    }) as SettingsValue;
  }

  if (!isPlainObject(root)) {
    return root;
  }

  return {
    ...root,
    [segment]: rest.length === 0
      ? nextValue
      : setValueAtPath((root as Record<string, SettingsValue>)[String(segment)], rest, nextValue),
  };
}

function isPlainObject(value: unknown): value is Record<string, SettingsValue> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isDebugDescendant(path: SettingsPath): boolean {
  return path[0] === "debug" && path[1] !== "enabled";
}

function looksLikeHexColor(value: string): boolean {
  return /^#([0-9a-f]{6})$/i.test(value);
}

function normalizeColorValue(value: string): string {
  return looksLikeHexColor(value) ? value : "#ffffff";
}

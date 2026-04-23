import type { i18n as I18nInstance } from "i18next";
import type { AssetEntityType, AssetStatus, DependencyStatus, RawAssetKind } from "../domain/editorTypes";

const LOCALE_TAGS = {
  en: "en-US",
  es: "es-ES",
  ca: "ca-ES",
} as const;

export class EditorTranslator {
  constructor(private readonly i18n: I18nInstance) {}

  t(key: string, options?: Record<string, unknown>): string {
    return this.i18n.t(key, options);
  }

  formatBytes(sizeBytes: number): string {
    if (sizeBytes < 1024) {
      return `${this.formatNumber(sizeBytes)} ${this.t("editor.units.bytes")}`;
    }

    if (sizeBytes < 1024 * 1024) {
      return `${this.formatNumber(sizeBytes / 1024, 1)} ${this.t("editor.units.kilobytes")}`;
    }

    return `${this.formatNumber(sizeBytes / (1024 * 1024), 1)} ${this.t("editor.units.megabytes")}`;
  }

  formatTimestamp(value: string | null): string {
    if (!value) {
      return this.t("editor.common.no");
    }

    return new Intl.DateTimeFormat(this.resolveLocaleTag(), {
      dateStyle: "short",
      timeStyle: "medium",
    }).format(new Date(value));
  }

  formatAssetTypeLabel(entityType: AssetEntityType, sourceKind?: RawAssetKind): string {
    if (entityType === "raw-asset") {
      if (sourceKind === "tileset-source") {
        return this.t("editor.assetTypes.rawTilesetPng");
      }
      if (sourceKind === "image-source") {
        return this.t("editor.assetTypes.rawImagePng");
      }
      return this.t("editor.assetTypes.rawSpritesheetPng");
    }

    return this.t(`editor.assetTypes.${entityType}`);
  }

  formatEntityType(entityType: AssetEntityType | "missing"): string {
    return this.t(`editor.entities.${entityType}`);
  }

  formatDependencyStatus(status: DependencyStatus | AssetStatus): string {
    return this.t(`editor.statuses.${status}`);
  }

  formatDependencyMeta(entityType: AssetEntityType | "missing", status: DependencyStatus | AssetStatus): string {
    return this.t("editor.details.referenceMeta", {
      entityType: this.formatEntityType(entityType),
      status: this.formatDependencyStatus(status),
    });
  }

  validatePositiveInteger(value: string, label: string): string | null {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      return this.t("editor.validation.positiveInteger", { label });
    }

    return null;
  }

  validateNonNegativeInteger(value: string, label: string): string | null {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isInteger(parsed) || parsed < 0) {
      return this.t("editor.validation.nonNegativeInteger", { label });
    }

    return null;
  }

  validateRequiredName(name: string): string | null {
    if (name.trim().length === 0) {
      return this.t("editor.validation.requiredName");
    }

    return null;
  }

  private resolveLocaleTag(): string {
    const language = this.i18n.language.startsWith("es")
      ? "es"
      : this.i18n.language.startsWith("ca")
        ? "ca"
        : "en";
    return LOCALE_TAGS[language];
  }

  private formatNumber(value: number, maximumFractionDigits = 0): string {
    return new Intl.NumberFormat(this.resolveLocaleTag(), {
      minimumFractionDigits: maximumFractionDigits,
      maximumFractionDigits,
    }).format(value);
  }
}

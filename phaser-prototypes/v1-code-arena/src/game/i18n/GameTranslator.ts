import type { i18n as I18nInstance } from "i18next";

export class GameTranslator {
  constructor(private readonly i18n: I18nInstance) {}

  t(key: string, options?: Record<string, unknown>): string {
    return this.i18n.t(key, options);
  }
}

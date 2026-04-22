export class ObjectUrlRegistry {
  private readonly urls = new Map<string, string>();

  resolve(key: string, blob: Blob): string {
    const existing = this.urls.get(key);
    if (existing) {
      return existing;
    }

    const next = URL.createObjectURL(blob);
    this.urls.set(key, next);
    return next;
  }

  revoke(key: string): void {
    const existing = this.urls.get(key);
    if (!existing) {
      return;
    }

    URL.revokeObjectURL(existing);
    this.urls.delete(key);
  }

  revokeAll(): void {
    this.urls.forEach((url) => URL.revokeObjectURL(url));
    this.urls.clear();
  }
}

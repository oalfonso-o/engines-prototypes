import { cp, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, extname, resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

function createSettingsPersistencePlugin(): Plugin {
  return {
    name: "canuter-dev-settings-persistence",
    apply: "serve",
    configureServer(server) {
      const editorAssetsRoot = resolve(__dirname, "editor-assets");
      const devResetTokenPath = resolve(__dirname, ".editor-reset-token.json");

      server.middlewares.use("/editor-assets", async (req, res, next) => {
        if (req.method !== "GET" || !req.url) {
          next();
          return;
        }

        const relativePath = decodeURIComponent(req.url.replace(/^\/+/, ""));
        const filePath = resolve(editorAssetsRoot, relativePath);
        if (!filePath.startsWith(editorAssetsRoot)) {
          res.statusCode = 400;
          res.end("Invalid editor-assets path");
          return;
        }

        try {
          const file = await readFile(filePath);
          res.statusCode = 200;
          res.setHeader("Content-Type", guessContentType(filePath));
          res.end(file);
        } catch {
          next();
        }
      });

      server.middlewares.use("/__dev/settings", (req, res, next) => {
        if (req.method !== "POST") {
          next();
          return;
        }

        let body = "";
        req.on("data", (chunk) => {
          body += chunk;
        });

        req.on("end", async () => {
          try {
            await writeFile(resolve(__dirname, "settings.yaml"), body, "utf8");
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ ok: true }));
          } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to write settings.yaml";
            res.statusCode = 500;
            res.setHeader("Content-Type", "text/plain; charset=utf-8");
            res.end(message);
          }
        });
      });

      server.middlewares.use("/__dev/editor/reset-token", async (req, res, next) => {
        if (req.method !== "GET") {
          next();
          return;
        }

        try {
          const body = await readFile(devResetTokenPath, "utf8");
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json; charset=utf-8");
          res.end(body);
        } catch {
          res.statusCode = 404;
          res.end("");
        }
      });

      const userAssetsRoot = resolve(editorAssetsRoot, "user");
      server.middlewares.use("/__dev/editor/folders", (req, res, next) => {
        if (req.method !== "POST") {
          next();
          return;
        }

        readRequestBody(req).then(async (body) => {
          try {
            const payload = JSON.parse(body) as { relativePath?: string };
            const relativePath = sanitizeRelativePath(payload.relativePath ?? "");
            const targetDir = resolve(userAssetsRoot, relativePath);
            if (!targetDir.startsWith(userAssetsRoot)) {
              throw new Error("Invalid folder path");
            }

            await mkdir(targetDir, { recursive: true });
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ ok: true }));
          } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to create folder";
            res.statusCode = 500;
            res.setHeader("Content-Type", "text/plain; charset=utf-8");
            res.end(message);
          }
        }).catch(next);
      });

      server.middlewares.use("/__dev/editor/import-png", (req, res, next) => {
        if (req.method !== "POST") {
          next();
          return;
        }

        const relativePath = sanitizeRelativePath(String(req.headers["x-relative-path"] ?? ""));
        if (!relativePath) {
          res.statusCode = 400;
          res.end("Missing x-relative-path header");
          return;
        }

        readBinaryBody(req).then(async (buffer) => {
          try {
            const targetFile = resolve(userAssetsRoot, relativePath);
            if (!targetFile.startsWith(userAssetsRoot)) {
              throw new Error("Invalid file path");
            }

            await mkdir(dirname(targetFile), { recursive: true });
            await writeFile(targetFile, buffer);
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ ok: true }));
          } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to import PNG";
            res.statusCode = 500;
            res.setHeader("Content-Type", "text/plain; charset=utf-8");
            res.end(message);
          }
        }).catch(next);
      });

      server.middlewares.use("/__dev/editor/write-json", (req, res, next) => {
        if (req.method !== "POST") {
          next();
          return;
        }

        const relativePath = sanitizeRelativePath(String(req.headers["x-relative-path"] ?? ""));
        const storageRoot = String(req.headers["x-storage-root"] ?? "user") as "core" | "user" | "archived";
        if (!relativePath) {
          res.statusCode = 400;
          res.end("Missing x-relative-path header");
          return;
        }

        readRequestBody(req).then(async (body) => {
          try {
            const rootPath = resolveStorageRootPath(editorAssetsRoot, storageRoot);
            const targetFile = resolve(rootPath, relativePath);
            if (!targetFile.startsWith(rootPath)) {
              throw new Error("Invalid file path");
            }

            await mkdir(dirname(targetFile), { recursive: true });
            await writeFile(targetFile, body, "utf8");
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ ok: true }));
          } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to write JSON";
            res.statusCode = 500;
            res.setHeader("Content-Type", "text/plain; charset=utf-8");
            res.end(message);
          }
        }).catch(next);
      });

      server.middlewares.use("/__dev/editor/move-path", (req, res, next) => {
        if (req.method !== "POST") {
          next();
          return;
        }

        readRequestBody(req).then(async (body) => {
          try {
            const payload = JSON.parse(body) as {
              kind?: "file" | "directory";
              fromRoot?: "core" | "user" | "archived";
              fromRelativePath?: string;
              toRoot?: "core" | "user" | "archived";
              toRelativePath?: string;
            };
            const kind = payload.kind === "directory" ? "directory" : "file";
            const fromRoot = resolveStorageRootPath(editorAssetsRoot, payload.fromRoot);
            const toRoot = resolveStorageRootPath(editorAssetsRoot, payload.toRoot);
            const fromRelativePath = sanitizeRelativePath(payload.fromRelativePath ?? "");
            const toRelativePath = sanitizeRelativePath(payload.toRelativePath ?? "");
            if (!fromRelativePath || !toRelativePath) {
              throw new Error("Missing path to move");
            }

            const sourcePath = resolve(fromRoot, fromRelativePath);
            const targetPath = resolve(toRoot, toRelativePath);
            if (!sourcePath.startsWith(fromRoot) || !targetPath.startsWith(toRoot)) {
              throw new Error("Invalid move path");
            }

            await mkdir(dirname(targetPath), { recursive: true });
            await rename(sourcePath, targetPath);
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ ok: true, kind }));
          } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to move path";
            res.statusCode = 500;
            res.setHeader("Content-Type", "text/plain; charset=utf-8");
            res.end(message);
          }
        }).catch(next);
      });
    },
  };
}

function createEditorAssetsBuildPlugin(): Plugin {
  return {
    name: "canuter-editor-assets-build-copy",
    apply: "build",
    async closeBundle() {
      const source = resolve(__dirname, "editor-assets");
      if (!existsSync(source)) {
        return;
      }

      const destination = resolve(__dirname, "dist", "editor-assets");
      await mkdir(resolve(__dirname, "dist"), { recursive: true });
      await cp(source, destination, { recursive: true });
    },
  };
}

function guessContentType(filePath: string): string {
  const extension = extname(filePath).toLowerCase();
  switch (extension) {
    case ".png":
      return "image/png";
    case ".json":
      return "application/json; charset=utf-8";
    case ".yaml":
    case ".yml":
      return "application/yaml; charset=utf-8";
    default:
      return "application/octet-stream";
  }
}

function sanitizeRelativePath(relativePath: string): string {
  return relativePath
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/{2,}/g, "/")
    .replace(/\.\.(\/|$)/g, "");
}

function resolveStorageRootPath(
  editorAssetsRoot: string,
  root: "core" | "user" | "archived" | undefined,
): string {
  switch (root) {
    case "core":
      return resolve(editorAssetsRoot, "core");
    case "archived":
      return resolve(editorAssetsRoot, "archived");
    case "user":
    default:
      return resolve(editorAssetsRoot, "user");
  }
}

function readRequestBody(req: NodeJS.ReadableStream): Promise<string> {
  return new Promise((resolvePromise, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => resolvePromise(body));
    req.on("error", reject);
  });
}

function readBinaryBody(req: NodeJS.ReadableStream): Promise<Buffer> {
  return new Promise((resolvePromise, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    req.on("end", () => resolvePromise(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

export default defineConfig({
  plugins: [react(), createSettingsPersistencePlugin(), createEditorAssetsBuildPlugin()],
  base: "./",
  server: {
    port: 8080,
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
      },
    },
  },
});

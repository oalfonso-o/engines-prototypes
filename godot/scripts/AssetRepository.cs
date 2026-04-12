using System;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;
using Godot;

namespace Canuter
{
    public static class AssetRepository
    {
        public static SpriteFrames LoadCharacterSpriteFrames(string characterAssetId)
        {
            var frames = new SpriteFrames();
            var sheetRoot = RepoPaths.CombineFromRepo(
                "game-assets",
                "source",
                "generated",
                "svg",
                "sheets",
                characterAssetId
            );

            AddAnimation(frames, "idle", Path.Combine(sheetRoot, "idle_south.png"), Path.Combine(sheetRoot, "idle_south.json"));
            AddAnimation(frames, "move", Path.Combine(sheetRoot, "move_south.png"), Path.Combine(sheetRoot, "move_south.json"));
            return frames;
        }

        public static Texture2D LoadWeaponTexture(string weaponAssetId, string animation = "idle", string direction = "south", string frameFile = "frame_000.png")
        {
            var weaponPath = RepoPaths.CombineFromRepo(
                "game-assets",
                "source",
                "generated",
                "svg",
                "rendered",
                weaponAssetId,
                animation,
                direction,
                frameFile
            );

            if (!File.Exists(weaponPath))
            {
                throw new InvalidOperationException($"Missing weapon texture: {weaponPath}");
            }

            return LoadTexture(weaponPath);
        }

        public static string GetRepoFilePath(string repoRelativePath)
        {
            return RepoPaths.CombineFromRepo(repoRelativePath);
        }

        public static string ReadRepoText(string repoRelativePath)
        {
            var fullPath = GetRepoFilePath(repoRelativePath);
            if (!File.Exists(fullPath))
            {
                throw new FileNotFoundException($"Repo file not found: {fullPath}");
            }

            return File.ReadAllText(fullPath);
        }

        private static void AddAnimation(SpriteFrames frames, string animationName, string imagePath, string jsonPath)
        {
            if (!File.Exists(imagePath) || !File.Exists(jsonPath))
            {
                GD.PushError($"Missing animation assets for {animationName}: {imagePath} / {jsonPath}");
                return;
            }

            var texture = LoadTexture(imagePath);
            var sheet = JsonSerializer.Deserialize<SheetData>(File.ReadAllText(jsonPath));
            if (sheet == null)
            {
                GD.PushError($"Failed to parse spritesheet metadata for {animationName}: {jsonPath}");
                return;
            }

            frames.AddAnimation(animationName);
            frames.SetAnimationLoop(animationName, true);
            frames.SetAnimationSpeed(animationName, Math.Max(sheet.meta.fps, 1));

            foreach (var frameData in sheet.frames)
            {
                var atlasTexture = new AtlasTexture
                {
                    Atlas = texture,
                    Region = new Rect2(frameData.frame.x, frameData.frame.y, frameData.frame.w, frameData.frame.h),
                };
                frames.AddFrame(animationName, atlasTexture);
            }
        }

        private static Texture2D LoadTexture(string imagePath)
        {
            var image = Image.LoadFromFile(imagePath);
            if (image == null)
            {
                throw new InvalidOperationException($"Unable to load image from {imagePath}");
            }

            return ImageTexture.CreateFromImage(image);
        }

        private sealed class SheetData
        {
            public SheetMeta meta { get; init; } = new();
            public List<SheetFrame> frames { get; init; } = new();
        }

        private sealed class SheetMeta
        {
            public int fps { get; init; }
        }

        private sealed class SheetFrame
        {
            public FrameRect frame { get; init; } = new();
        }

        private sealed class FrameRect
        {
            public int x { get; init; }
            public int y { get; init; }
            public int w { get; init; }
            public int h { get; init; }
        }
    }
}

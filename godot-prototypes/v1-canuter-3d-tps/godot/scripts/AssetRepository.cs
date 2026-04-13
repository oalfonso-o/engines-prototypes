using System;
using System.IO;

namespace Canuter
{
    public static class AssetRepository
    {
        public static string GetRepoFilePath(string repoRelativePath)
        {
            var path = RepoPaths.CombineFromRepo(repoRelativePath);
            if (!File.Exists(path))
            {
                throw new InvalidOperationException($"Repo file not found: {path}");
            }

            return path;
        }
    }
}

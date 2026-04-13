using System;
using System.IO;
using Godot;

namespace Canuter
{
    public static class RepoPaths
    {
        public static string GetRepoRoot()
        {
            var godotRoot = ProjectSettings.GlobalizePath("res://");
            var directory = Directory.GetParent(godotRoot.TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar));
            if (directory == null)
            {
                throw new InvalidOperationException("Unable to resolve repository root from Godot project path.");
            }

            return directory.FullName;
        }

        public static string CombineFromRepo(params string[] segments)
        {
            return Path.Combine(GetRepoRoot(), Path.Combine(segments));
        }
    }
}

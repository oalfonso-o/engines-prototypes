using System;
using System.Collections.Generic;
using System.IO;
using Godot;

namespace Canuter
{
    public partial class MapView3D : Node3D
    {
        [Export]
        public string RepoMapPath { get; set; } = AssetCatalog.PrototypeCrossroadsMapPath;

        [Export]
        public float CellSize { get; set; } = 4.0f;

        [Export]
        public float WallHeight { get; set; } = 3.0f;

        private readonly List<string> _layout = new();
        private readonly Dictionary<char, string> _legend = new();
        private readonly List<Vector2I> _allySpawns = new();
        private readonly List<Vector2I> _dummyTargets = new();
        private readonly List<DummyTarget3D> _targets = new();
        private Node3D _floorRoot = null!;
        private Node3D _wallRoot = null!;
        private Node3D _targetRoot = null!;

        private StandardMaterial3D _floorVisible = null!;
        private StandardMaterial3D _wallVisible = null!;

        private int _mapWidth;
        private int _mapHeight;
        private int _tileSizePixels = 64;

        public override void _Ready()
        {
            _floorRoot = GetNode<Node3D>("Floor");
            _wallRoot = GetNode<Node3D>("Walls");
            _targetRoot = GetNode<Node3D>("Targets");
            BuildMaterials();
            LoadMap();
            BuildGeometry();
        }

        public Vector3? GetFirstAllySpawnWorldPosition()
        {
            if (_allySpawns.Count == 0)
            {
                return null;
            }

            return CellCenterToWorld(_allySpawns[0]) + Vector3.Up * 0.1f;
        }

        public Vector2 GetMinimapHalfWorldSize()
        {
            return new Vector2(Mathf.Max(24.0f, _mapWidth * CellSize * 0.35f), Mathf.Max(24.0f, _mapHeight * CellSize * 0.35f));
        }

        private void LoadMap()
        {
            _layout.Clear();
            _legend.Clear();
            _allySpawns.Clear();
            _dummyTargets.Clear();

            var fullPath = AssetRepository.GetRepoFilePath(RepoMapPath);
            if (!File.Exists(fullPath))
            {
                throw new FileNotFoundException($"Map file not found: {fullPath}");
            }

            var section = string.Empty;
            foreach (var rawLine in File.ReadAllLines(fullPath))
            {
                var line = rawLine.Trim();
                if (string.IsNullOrWhiteSpace(line) || line.StartsWith(";") || line.StartsWith("//"))
                {
                    continue;
                }

                if (line.StartsWith("[") && line.EndsWith("]"))
                {
                    section = line[1..^1].Trim().ToLowerInvariant();
                    continue;
                }

                switch (section)
                {
                    case "meta":
                        ParseMeta(line);
                        break;
                    case "legend":
                        ParseLegend(line);
                        break;
                    case "layout":
                        _layout.Add(line);
                        break;
                }
            }

            _mapWidth = _layout[0].Length;
            _mapHeight = _layout.Count;

            for (var rowIndex = 0; rowIndex < _layout.Count; rowIndex++)
            {
                var row = _layout[rowIndex];
                for (var x = 0; x < row.Length; x++)
                {
                    var cell = new Vector2I(x, rowIndex);
                    var id = _legend[row[x]];
                    if (id.StartsWith("spawn_allies", StringComparison.Ordinal))
                    {
                        _allySpawns.Add(cell);
                    }
                    else if (id.StartsWith("target_dummy", StringComparison.Ordinal))
                    {
                        _dummyTargets.Add(cell);
                    }
                }
            }
        }

        private void BuildGeometry()
        {
            foreach (var child in _floorRoot.GetChildren())
            {
                child.QueueFree();
            }
            foreach (var child in _wallRoot.GetChildren())
            {
                child.QueueFree();
            }
            foreach (var child in _targetRoot.GetChildren())
            {
                child.QueueFree();
            }

            _targets.Clear();

            for (var y = 0; y < _mapHeight; y++)
            {
                for (var x = 0; x < _mapWidth; x++)
                {
                    var cell = new Vector2I(x, y);
                    if (IsWall(cell))
                    {
                        BuildWallCell(cell);
                    }
                    else
                    {
                        BuildFloorCell(cell);
                    }
                }
            }

            foreach (var targetCell in _dummyTargets)
            {
                var target = new DummyTarget3D
            {
                Position = CellCenterToWorld(targetCell) + Vector3.Up * 0.9f,
            };
            _targetRoot.AddChild(target);
            target.SetPresentation(VisibilityPresentationState3D.FrontVisible);
            _targets.Add(target);
        }
        }

        private void BuildFloorCell(Vector2I cell)
        {
            var mesh = new MeshInstance3D
            {
                Mesh = new BoxMesh
                {
                    Size = new Vector3(CellSize, 0.08f, CellSize),
                },
                Position = CellCenterToWorld(cell) + Vector3.Down * 0.04f,
                MaterialOverride = _floorVisible,
            };
            _floorRoot.AddChild(mesh);
        }

        private void BuildWallCell(Vector2I cell)
        {
            var body = new StaticBody3D
            {
                Position = CellCenterToWorld(cell) + Vector3.Up * (WallHeight * 0.5f),
            };

            var collision = new CollisionShape3D
            {
                Shape = new BoxShape3D
                {
                    Size = new Vector3(CellSize, WallHeight, CellSize),
                },
            };
            body.AddChild(collision);

            var mesh = new MeshInstance3D
            {
                Mesh = new BoxMesh
                {
                    Size = new Vector3(CellSize, WallHeight, CellSize),
                },
                MaterialOverride = _wallVisible,
            };
            body.AddChild(mesh);
            _wallRoot.AddChild(body);
        }

        private void BuildMaterials()
        {
            _floorVisible = CreateMaterial(new Color(0.80f, 0.76f, 0.69f, 1.0f));
            _wallVisible = CreateMaterial(new Color(0.38f, 0.40f, 0.44f, 1.0f));
        }

        private static StandardMaterial3D CreateMaterial(Color color)
        {
            return new StandardMaterial3D
            {
                ShadingMode = BaseMaterial3D.ShadingModeEnum.PerPixel,
                AlbedoColor = color,
                Metallic = 0.0f,
                Roughness = 1.0f,
            };
        }

        private void ParseMeta(string line)
        {
            var parts = line.Split('=', 2, StringSplitOptions.TrimEntries);
            if (parts.Length == 2 && parts[0].Equals("tile_size", StringComparison.OrdinalIgnoreCase) && int.TryParse(parts[1], out var tileSize))
            {
                _tileSizePixels = tileSize;
            }
        }

        private void ParseLegend(string line)
        {
            var parts = line.Split('=', 2, StringSplitOptions.TrimEntries);
            if (parts.Length == 2 && !string.IsNullOrEmpty(parts[0]))
            {
                _legend[parts[0][0]] = parts[1];
            }
        }

        private bool IsWall(Vector2I cell)
        {
            var id = GetCellId(cell);
            return id != null && id.StartsWith("wall_", StringComparison.Ordinal);
        }

        private string? GetCellId(Vector2I cell)
        {
            if (cell.X < 0 || cell.Y < 0 || cell.X >= _mapWidth || cell.Y >= _mapHeight)
            {
                return null;
            }

            return _legend.GetValueOrDefault(_layout[cell.Y][cell.X]);
        }

        private Vector3 CellCenterToWorld(Vector2I cell)
        {
            return new Vector3(
                cell.X * CellSize + CellSize * 0.5f,
                0.0f,
                cell.Y * CellSize + CellSize * 0.5f);
        }

    }
}

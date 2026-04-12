using System;
using System.Collections.Generic;
using System.IO;
using Godot;

namespace Canuter
{
    public partial class MapView : Node2D
    {
        private static readonly Color FloorBase = new(0.82f, 0.74f, 0.62f, 1.0f);
        private static readonly Color WallFillBase = new(0.63f, 0.63f, 0.61f, 1.0f);
        private static readonly Color WallLine = new(0.20f, 0.20f, 0.19f, 1.0f);
        private static readonly Color UnexploredBase = new(0.10f, 0.10f, 0.10f, 1.0f);
        private static readonly Color AllySpawn = new(0.32f, 0.60f, 0.85f, 0.9f);
        private static readonly Color EnemySpawn = new(0.82f, 0.48f, 0.34f, 0.9f);

        [Export]
        public string RepoMapPath { get; set; } = AssetCatalog.PrototypeCrossroadsMapPath;

        private readonly List<string> _layout = new();
        private readonly Dictionary<char, string> _legend = new();
        private readonly List<Vector2I> _allySpawns = new();
        private readonly List<Vector2I> _enemySpawns = new();
        private readonly List<Vector2I> _dummyTargets = new();

        private int _tileSize = 64;
        private int _mapWidth;
        private int _mapHeight;
        private bool[,]? _exploredCells;
        private StaticBody2D _wallBody = null!;
        private Node2D _occludersRoot = null!;
        private Node2D _targetsRoot = null!;
        private VisionSystem? _visionSystem;

        public override void _Ready()
        {
            _wallBody = GetNode<StaticBody2D>("WallCollisions");
            _occludersRoot = GetNode<Node2D>("WallOccluders");
            _targetsRoot = GetNode<Node2D>("Targets");
            LoadMap();
            BuildWallCollisions();
            BuildWallOccluders();
            BuildTargets();
            QueueRedraw();
        }

        public override void _Process(double delta)
        {
            if (_visionSystem == null || _exploredCells == null)
            {
                return;
            }

            var anyExplorationChanged = false;
            for (var y = 0; y < _mapHeight; y++)
            {
                for (var x = 0; x < _mapWidth; x++)
                {
                    if (_exploredCells[x, y])
                    {
                        continue;
                    }

                    var cell = new Vector2I(x, y);
                    if (!IsCellCurrentlyVisible(cell))
                    {
                        continue;
                    }

                    _exploredCells[x, y] = true;
                    anyExplorationChanged = true;
                }
            }

            UpdateTargetVisibility();

            if (anyExplorationChanged)
            {
                QueueRedraw();
            }
        }

        public void BindVisionSystem(VisionSystem visionSystem)
        {
            _visionSystem = visionSystem;
            QueueRedraw();
        }

        public Vector2? GetFirstAllySpawnWorldPosition()
        {
            if (_allySpawns.Count == 0)
            {
                return null;
            }

            return CellCenterToWorld(_allySpawns[0]);
        }

        public override void _Draw()
        {
            if (_mapWidth == 0 || _mapHeight == 0)
            {
                return;
            }

            for (var y = 0; y < _mapHeight; y++)
            {
                for (var x = 0; x < _mapWidth; x++)
                {
                    var cell = new Vector2I(x, y);
                    var rect = new Rect2(x * _tileSize, y * _tileSize, _tileSize, _tileSize);

                    if (!IsExplored(cell))
                    {
                        DrawUnexploredCell(cell, rect);
                        continue;
                    }

                    DrawRect(rect, FloorColorForCell(cell));

                    if (IsWall(cell))
                    {
                        DrawWallForCell(cell, rect);
                    }
                    else if (IsAllySpawn(cell))
                    {
                        DrawArc(rect.GetCenter(), _tileSize * 0.14f, 0.0f, Mathf.Tau, 24, AllySpawn, 3.0f, true);
                    }
                    else if (IsEnemySpawn(cell))
                    {
                        DrawArc(rect.GetCenter(), _tileSize * 0.14f, 0.0f, Mathf.Tau, 24, EnemySpawn, 3.0f, true);
                    }
                }
            }
        }

        private void LoadMap()
        {
            _layout.Clear();
            _legend.Clear();
            _allySpawns.Clear();
            _enemySpawns.Clear();
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

            if (_layout.Count == 0)
            {
                throw new InvalidOperationException("Map layout is empty.");
            }

            _mapWidth = _layout[0].Length;
            _mapHeight = _layout.Count;
            _exploredCells = new bool[_mapWidth, _mapHeight];

            for (var rowIndex = 0; rowIndex < _layout.Count; rowIndex++)
            {
                var row = _layout[rowIndex];
                if (row.Length != _mapWidth)
                {
                    throw new InvalidOperationException($"Layout row {rowIndex} has inconsistent width.");
                }

                for (var x = 0; x < row.Length; x++)
                {
                    var symbol = row[x];
                    if (!_legend.ContainsKey(symbol))
                    {
                        throw new InvalidOperationException($"Layout symbol '{symbol}' is not declared in legend.");
                    }

                    var id = _legend[symbol];
                    var cell = new Vector2I(x, rowIndex);
                    if (id.StartsWith("spawn_allies", StringComparison.Ordinal))
                    {
                        _allySpawns.Add(cell);
                    }
                    else if (id.StartsWith("spawn_enemies", StringComparison.Ordinal))
                    {
                        _enemySpawns.Add(cell);
                    }
                    else if (id.StartsWith("target_dummy", StringComparison.Ordinal))
                    {
                        _dummyTargets.Add(cell);
                    }
                }
            }
        }

        private void ParseMeta(string line)
        {
            var parts = line.Split('=', 2, StringSplitOptions.TrimEntries);
            if (parts.Length != 2)
            {
                return;
            }

            if (parts[0].Equals("tile_size", StringComparison.OrdinalIgnoreCase) && int.TryParse(parts[1], out var tileSize))
            {
                _tileSize = tileSize;
            }
        }

        private void ParseLegend(string line)
        {
            var parts = line.Split('=', 2, StringSplitOptions.TrimEntries);
            if (parts.Length != 2 || string.IsNullOrEmpty(parts[0]))
            {
                return;
            }

            _legend[parts[0][0]] = parts[1];
        }

        private void BuildWallCollisions()
        {
            foreach (var child in _wallBody.GetChildren())
            {
                child.QueueFree();
            }

            for (var y = 0; y < _mapHeight; y++)
            {
                for (var x = 0; x < _mapWidth; x++)
                {
                    var cell = new Vector2I(x, y);
                    if (!IsWall(cell))
                    {
                        continue;
                    }

                    var collision = new CollisionShape2D();
                    collision.Position = CellCenterToWorld(cell);
                    collision.Shape = new RectangleShape2D
                    {
                        Size = new Vector2(_tileSize, _tileSize),
                    };
                    _wallBody.AddChild(collision);
                }
            }
        }

        private void BuildTargets()
        {
            foreach (var child in _targetsRoot.GetChildren())
            {
                child.QueueFree();
            }

            foreach (var cell in _dummyTargets)
            {
                var target = new DummyTarget
                {
                    Position = CellCenterToWorld(cell),
                };
                _targetsRoot.AddChild(target);
            }
        }

        private void UpdateTargetVisibility()
        {
            if (_visionSystem == null)
            {
                return;
            }

            foreach (var child in _targetsRoot.GetChildren())
            {
                if (child is not DummyTarget target)
                {
                    continue;
                }

                target.Visible = _visionSystem.CanSeeWorldPoint(target.GlobalPosition);
            }
        }

        private void BuildWallOccluders()
        {
            foreach (var child in _occludersRoot.GetChildren())
            {
                child.QueueFree();
            }

            var half = _tileSize * 0.5f;
            var polygon = new OccluderPolygon2D
            {
                Polygon = new[]
                {
                    new Vector2(-half, -half),
                    new Vector2(half, -half),
                    new Vector2(half, half),
                    new Vector2(-half, half),
                },
                Closed = true,
            };

            for (var y = 0; y < _mapHeight; y++)
            {
                for (var x = 0; x < _mapWidth; x++)
                {
                    var cell = new Vector2I(x, y);
                    if (!IsWall(cell))
                    {
                        continue;
                    }

                    var occluder = new LightOccluder2D
                    {
                        Position = CellCenterToWorld(cell),
                        Occluder = polygon,
                    };
                    _occludersRoot.AddChild(occluder);
                }
            }
        }

        private void DrawWallForCell(Vector2I cell, Rect2 rect)
        {
            const float width = 4.0f;
            var topLeft = rect.Position;
            var topRight = rect.Position + new Vector2(rect.Size.X, 0);
            var bottomLeft = rect.Position + new Vector2(0, rect.Size.Y);
            var bottomRight = rect.Position + rect.Size;

            DrawRect(rect, WallFillColorForCell(cell));

            if (!IsWall(cell + Vector2I.Up))
            {
                DrawLine(topLeft, topRight, WallLine, width);
            }

            if (!IsWall(cell + Vector2I.Right))
            {
                DrawLine(topRight, bottomRight, WallLine, width);
            }

            if (!IsWall(cell + Vector2I.Down))
            {
                DrawLine(bottomLeft, bottomRight, WallLine, width);
            }

            if (!IsWall(cell + Vector2I.Left))
            {
                DrawLine(topLeft, bottomLeft, WallLine, width);
            }
        }

        private void DrawUnexploredCell(Vector2I cell, Rect2 rect)
        {
            var seed = cell.X * 7027 + cell.Y * 2593;
            var variation = ((seed % 7) - 3) * 0.015f;
            var fill = new Color(
                Mathf.Clamp(UnexploredBase.R + variation, 0.0f, 1.0f),
                Mathf.Clamp(UnexploredBase.G + variation, 0.0f, 1.0f),
                Mathf.Clamp(UnexploredBase.B + variation, 0.0f, 1.0f),
                1.0f
            );

            DrawRect(rect, fill);
            DrawRect(rect.Grow(-8.0f), new Color(fill.R + 0.02f, fill.G + 0.02f, fill.B + 0.02f, 0.15f));
        }

        private bool IsWall(Vector2I cell)
        {
            var id = GetCellId(cell);
            return id != null && id.StartsWith("wall_", StringComparison.Ordinal);
        }

        private bool IsAllySpawn(Vector2I cell)
        {
            var id = GetCellId(cell);
            return id != null && id.StartsWith("spawn_allies", StringComparison.Ordinal);
        }

        private bool IsEnemySpawn(Vector2I cell)
        {
            var id = GetCellId(cell);
            return id != null && id.StartsWith("spawn_enemies", StringComparison.Ordinal);
        }

        private bool IsExplored(Vector2I cell)
        {
            return _exploredCells != null &&
                   cell.X >= 0 &&
                   cell.Y >= 0 &&
                   cell.X < _mapWidth &&
                   cell.Y < _mapHeight &&
                   _exploredCells[cell.X, cell.Y];
        }

        private bool IsCellCurrentlyVisible(Vector2I cell)
        {
            if (_visionSystem == null)
            {
                return false;
            }

            var center = CellCenterToWorld(cell);
            if (_visionSystem.CanSeeWorldPoint(center))
            {
                return true;
            }

            var half = _tileSize * 0.42f;
            return _visionSystem.CanSeeWorldPoint(center + new Vector2(-half, -half)) ||
                   _visionSystem.CanSeeWorldPoint(center + new Vector2(half, -half)) ||
                   _visionSystem.CanSeeWorldPoint(center + new Vector2(half, half)) ||
                   _visionSystem.CanSeeWorldPoint(center + new Vector2(-half, half));
        }

        private string? GetCellId(Vector2I cell)
        {
            if (cell.X < 0 || cell.Y < 0 || cell.X >= _mapWidth || cell.Y >= _mapHeight)
            {
                return null;
            }

            var symbol = _layout[cell.Y][cell.X];
            return _legend.GetValueOrDefault(symbol);
        }

        private Vector2 CellCenterToWorld(Vector2I cell)
        {
            return new Vector2(
                cell.X * _tileSize + _tileSize * 0.5f,
                cell.Y * _tileSize + _tileSize * 0.5f
            );
        }

        private Color FloorColorForCell(Vector2I cell)
        {
            var seed = cell.X * 928371 + cell.Y * 364479;
            var variation = ((seed % 11) - 5) * 0.01f;
            return new Color(
                Mathf.Clamp(FloorBase.R + variation, 0.0f, 1.0f),
                Mathf.Clamp(FloorBase.G + variation, 0.0f, 1.0f),
                Mathf.Clamp(FloorBase.B + variation, 0.0f, 1.0f),
                1.0f
            );
        }

        private Color WallFillColorForCell(Vector2I cell)
        {
            var seed = cell.X * 6151 + cell.Y * 3583;
            var variation = ((seed % 9) - 4) * 0.008f;
            return new Color(
                Mathf.Clamp(WallFillBase.R + variation, 0.0f, 1.0f),
                Mathf.Clamp(WallFillBase.G + variation, 0.0f, 1.0f),
                Mathf.Clamp(WallFillBase.B + variation, 0.0f, 1.0f),
                1.0f
            );
        }
    }
}

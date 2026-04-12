# Asset Pipeline

This folder defines the current asset and map pipeline that the MVP is actually using.

Current document set:

- `01-map-format-v0.md`: text map structure and parsing rules.
- `08-svg-validation-preview.md`: render-and-preview flow for validating the deterministic SVG animation branch.

Supporting project folders:

- `game-assets/`: current runtime assets, SVG sources, sheets, and specs.
- `maps/`: playable map text definitions and map-specific data.
- `godot/`: the actual Godot project and runtime content.
- `tools/render_svg_sequence.py` and related SVG preview scripts: deterministic render/export path for the current MVP character and weapon base assets.

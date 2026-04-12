# Asset Pipeline

This folder defines how map text files, registries, assets, prompts, and metadata fit together.

Current document set:

- `01-map-format-v0.md`: text map structure and parsing rules.
- `02-asset-registry-spec-v0.md`: registries for tiles, entities, themes, and runtime asset lookup.
- `03-ai-asset-pipeline-v0.md`: asset production flow, metadata, and review process.
- `04-prompt-generator-spec-v0.md`: prompt grammar and the automated prompt generation approach.
- `05-aseprite-integration-note.md`: sprite cleanup, spritesheet packaging, and export guidance.
- `06-asset-manifest-policy.md`: mandatory manifest requirements for AI-assisted assets.
- `07-openai-local-generation-pipeline.md`: local Python pipeline for prompt, image generation, manifests, and Aseprite packaging.
- `08-svg-validation-preview.md`: render-and-preview flow for validating SVG animation bases.

Supporting project folders:

- `game-assets/`: approved assets, registries, source manifests, and prompt templates.
- `maps/`: playable map text definitions and map-specific data.
- `godot/`: the actual Godot project and runtime content.
- `tools/asset_prompt_builder.py`: prompt and manifest generator script.

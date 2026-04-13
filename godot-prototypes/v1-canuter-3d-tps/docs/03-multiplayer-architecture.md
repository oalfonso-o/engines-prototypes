# Multiplayer Architecture

## Direction

- The game is planned as a multiplayer-first project.
- Godot will be used for both client and dedicated game server responsibilities.
- Dedicated servers are expected to run in headless mode.

## Why Godot For The Server

- Godot supports multiplayer APIs and dedicated headless execution.
- Using Godot on both sides reduces integration friction between gameplay code and network code.
- This is a better fit for the real-time match simulation than pushing the main game server into Python.

## Python Scope

- Python remains a possible option for out-of-match backend services later.
- Suitable future Python responsibilities could include:
- authentication
- matchmaking support services
- player data APIs
- admin tools
- analytics or background jobs
- Python is not the preferred choice for the authoritative real-time match server.

## Server Authority

- The intended direction is an authoritative server model.
- The server should own the actual state for:
- movement validation
- damage application
- grenade effects
- visibility-relevant events
- match flow and round state

## Shared Logic

- Gameplay logic should be split cleanly between:
- shared simulation/domain rules
- client presentation and local input handling
- server authority and validation

## Important Constraint

- Godot provides multiplayer features, but not a complete competitive shooter netcode stack.
- We should expect to implement project-specific logic for:
- client prediction
- server reconciliation
- interpolation
- visibility rules
- anti-cheat-sensitive validation
- match-specific replication rules

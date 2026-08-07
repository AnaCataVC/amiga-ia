# CLI UX and Dependency Bloat

## Context
When building CLI tools, especially configuration wizards or setup scripts that are executed infrequently, providing an elegant User Experience (UX) is crucial for a strong first impression. Features like arrow-key navigation, checkbox selections, and colorized output elevate a script from a raw tool to a premium product.

In `amiga-ia-setup`, we initially reached for `@inquirer/prompts` to achieve this.

## The Problem
While `@inquirer/prompts` is the industry standard for CLI interaction, it is heavily modularized and relies on an extensive tree of transitive dependencies (e.g., `ansi-escapes`, `mute-stream`, `chalk`, `cli-spinners`, etc.). 
For a small, globally installed script (`npm install -g`), adding ~25 transitive packages creates an unnecessary burden:
- **Supply Chain Vulnerability**: A wider dependency tree increases the attack surface.
- **Install Time/Bloat**: Increases the global `node_modules` footprint for a command used very infrequently.

## The Solution (Architectural Decision)
**Do not build native alternatives, but choose micro-libraries.**

Building native arrow-key navigation using raw `readline` and ANSI escape parsing is a maintenance trap due to cross-platform quirks (especially Windows vs POSIX terminal behaviors).

Instead, we migrated to **`@clack/prompts`**. 
Clack provides the exact same high-quality, modern interactive UX as Inquirer but is intentionally designed as an ultra-lightweight library. It relies on a bare minimum of dependencies (like `sisteransi`), effectively reducing the transitive dependency bloat by ~85-90% without sacrificing any user experience.

## Lesson Learned
For simple Node.js CLI applications, always weigh the UX benefits against dependency footprint. Prefer ultra-lightweight, modern libraries like `@clack/prompts` over massive legacy ecosystems like Inquirer to maintain a lean, secure, and fast-installing package.

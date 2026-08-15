---
id: P-GL75LQ73
type: project
title: Windows Terminal PATH Refresh After Visual Studio Build Tools Install
created_at: 2026-06-29T12:22:34Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: c46a03f7ee1b336d451520017bcab9830e2ea3de276e5f4e84216aa5cef68429
related: [rust-crate-installation-workflow-with-c-dependencies-on-wind, sessionstart-hook-activation-narrow-restart-caveat, sessionstart-hook-requires-reopen-after-install]
---

When installing Visual Studio C++ build tools (MSVC v143, Windows 11 SDK) on Windows, the PATH environment variable is not updated in existing terminal sessions. The C++ linker (`link.exe`) only becomes available in newly-opened PowerShell windows. Existing terminals must be closed completely; reopening the same window is not sufficient.

**Why:** Windows/PowerShell-specific behavior: PATH caching requires full shell restart to load new binaries into the process environment.

**How to apply:** After VC++ tools finish installing, close all existing terminals and open a fresh one before running build commands (cargo, cmake, etc.).

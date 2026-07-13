# `.skill` as an OS-recognized file type

This document describes how a real deployment would register `.skill` as a
recognized file type in Finder / Explorer / a Linux file manager, with the
[Skillerr brand mark](../assets/skillerr-mark.svg) as its icon. **It is
documentation only** — this repo does not ship an OS installer, `.plist`,
registry script, or `.desktop` file. Building one is a good "Next" item;
see [ROADMAP.md](./ROADMAP.md)'s "Next (great contribution targets)"
section.

> **Provenance of the mark:** `assets/skillerr-mark.svg` (icon only) and
> `assets/skillerr-lockup.svg` (icon + "skill" wordmark) are hand-authored
> vector traces of `assets/source/dot-skill-official.png` — the official
> reference PNG supplied by the brand owner. That source file is kept in
> the repo as the permanent ground truth the vectors are derived from;
> re-trace against it (ideally with a proper vectorization tool) if the
> SVGs ever need to be redone.

## Why this matters: `.skill` is not exclusively Skillerr's

As [FAQ.md](./FAQ.md#claude-desktop-claims-skill-on-macos--is-that-skillerr)
explains, **Claude Desktop already claims the `.skill` extension on macOS**
for its own, unrelated *Agent Skills* format (a plain zip with `SKILL.md`
inside). Skillerr's `.skill` is a **different, sealed** package format
(typed contract, digests, mint attestation, `manifest.content[]`) that
happens to share the same file extension. Any OS-level registration for
Skillerr's `.skill` must be **visually and programmatically distinct** from
Claude Desktop's claim, not a second app fighting over the same extension
with an ambiguous default handler. Concretely:

- The icon rendered for a Skillerr `.skill` file (the
  [Skillerr mark](../assets/skillerr-mark.svg) — scroll + teal wave) must
  not be confusable with Claude's own `.skill` icon.
- The declared type identifier is namespaced to this project
  (`org.dot-skill.skill` below), not a bare, collidable `skill` id.
- Users should be able to tell the two apart without opening the file —
  see FAQ.md's guidance to use `skill inspect` / **Open With** when unsure.

## macOS — Uniform Type Identifier (UTI)

macOS resolves file-type icons and default-app associations through UTIs
declared in an app's `Info.plist`, via `UTExportedTypeDeclaration` (the app
that "owns" the type) or `UTImportedTypeDeclaration` (an app that merely
understands it). A Skillerr-aware app (e.g. a future Skillerr Desktop, or
any GUI wrapper around the CLI) would export:

```xml
<key>UTExportedTypeDeclarations</key>
<array>
  <dict>
    <key>UTTypeIdentifier</key>
    <string>org.dot-skill.skill</string>
    <key>UTTypeDescription</key>
    <string>Skillerr .skill package</string>
    <key>UTTypeConformsTo</key>
    <array>
      <string>public.zip-archive</string>
      <string>public.data</string>
    </array>
    <key>UTTypeTagSpecification</key>
    <dict>
      <key>public.filename-extension</key>
      <string>skill</string>
      <key>public.mime-type</key>
      <string>application/vnd.dot-skill+zip</string>
    </dict>
    <key>UTTypeIconFile</key>
    <string>skillerr-mark.icns</string>
  </dict>
</array>
```

Notes:

- `application/vnd.dot-skill+zip` is the exact media type this repo
  already declares — see `MEDIA_TYPE` in
  [`packages/protocol/src/types.ts`](../packages/protocol/src/types.ts).
- `UTTypeIconFile` points at an `.icns` icon container built from
  `assets/skillerr-mark.svg`. `scripts/build-brand.mjs` deliberately does
  **not** generate the `.icns` itself (see the comment in that script) —
  producing one requires Apple's `iconutil`, which only runs on macOS and
  isn't installable on Linux/Windows CI. Build it locally when packaging a
  real macOS app:

  ```bash
  mkdir skillerr-mark.iconset
  sips -z 16 16     assets/skillerr-mark-32.png   --out skillerr-mark.iconset/icon_16x16.png
  sips -z 32 32     assets/skillerr-mark-64.png   --out skillerr-mark.iconset/icon_16x16@2x.png
  sips -z 32 32     assets/skillerr-mark-32.png   --out skillerr-mark.iconset/icon_32x32.png
  sips -z 64 64     assets/skillerr-mark-128.png  --out skillerr-mark.iconset/icon_32x32@2x.png
  sips -z 128 128   assets/skillerr-mark-128.png  --out skillerr-mark.iconset/icon_128x128.png
  sips -z 256 256   assets/skillerr-mark-256.png  --out skillerr-mark.iconset/icon_128x128@2x.png
  sips -z 256 256   assets/skillerr-mark-256.png  --out skillerr-mark.iconset/icon_256x256.png
  sips -z 512 512   assets/skillerr-mark-512.png  --out skillerr-mark.iconset/icon_256x256@2x.png
  sips -z 512 512   assets/skillerr-mark-512.png  --out skillerr-mark.iconset/icon_512x512.png
  sips -z 1024 1024 assets/skillerr-mark-1024.png --out skillerr-mark.iconset/icon_512x512@2x.png
  iconutil -c icns skillerr-mark.iconset -o assets/skillerr-mark.icns
  ```

- Because Claude Desktop already exports its own type for `.skill`, macOS
  Launch Services resolves the *default* app for a given file by
  per-file/last-registered-wins heuristics when two apps claim the same
  extension with different UTIs. A real Skillerr Desktop app should not
  assume it wins by default — document the **Open With** workaround (as
  FAQ.md already does) rather than relying on silently becoming the
  default handler.

## Windows — registry association + icon resource

Windows associates extensions through `HKEY_CLASSES_ROOT` (or
per-user `HKEY_CURRENT_USER\Software\Classes`):

```
HKEY_CLASSES_ROOT\.skill
    (Default) = "DotSkill.SkillFile"

HKEY_CLASSES_ROOT\DotSkill.SkillFile
    (Default) = "Skillerr .skill package"

HKEY_CLASSES_ROOT\DotSkill.SkillFile\DefaultIcon
    (Default) = "C:\Program Files\Skillerr\skillerr-mark.ico,0"

HKEY_CLASSES_ROOT\DotSkill.SkillFile\shell\open\command
    (Default) = "\"C:\Program Files\Skillerr\skillerr-gui.exe\" \"%1\""
```

- `skillerr-mark.ico` here is exactly `assets/favicon.ico` (already a
  multi-resolution `.ico` — 256/48/32/16 — generated by
  `scripts/build-brand.mjs`); Windows `DefaultIcon` accepts the same `.ico`
  container format browsers use for favicons, so no separate build step is
  needed on this platform.
- Writing to `HKEY_CLASSES_ROOT` requires elevation; a real installer
  would use an MSI/NSIS/Inno Setup script with a proper uninstall path
  that removes the registration, not a bare `reg add` one-liner.
- Prefer a ProgID like `DotSkill.SkillFile` over squatting a bare
  `.skill` claim silently — if another installed app (e.g. a Claude
  Desktop Windows build, should one register `.skill` there too) already
  owns the extension, Windows will prompt the user to choose, rather than
  one installer silently overwriting the other's association.

## Linux — `.desktop` MIME-type association

Linux desktop environments (GNOME, KDE, …) resolve icons/handlers via the
shared MIME database (`update-mime-info` / `xdg-mime`) plus a `.desktop`
file's `MimeType=` key. A Skillerr GUI would ship:

`/usr/share/mime/packages/org.dot-skill.skill.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<mime-info xmlns="http://www.freedesktop.org/standards/shared-mime-info">
  <mime-type type="application/vnd.dot-skill+zip">
    <comment>Skillerr .skill package</comment>
    <glob pattern="*.skill"/>
    <icon name="org.dot-skill.skill"/>
  </mime-type>
</mime-info>
```

`/usr/share/applications/org.dot-skill.skillerr.desktop`:

```ini
[Desktop Entry]
Type=Application
Name=Skillerr
Exec=skillerr-gui %f
MimeType=application/vnd.dot-skill+zip;
Icon=org.dot-skill.skill
Categories=Development;Utility;
```

- `application/vnd.dot-skill+zip` is, again, the exact `MEDIA_TYPE`
  constant from `packages/protocol/src/types.ts` — the same media type is
  cited on all three platforms so tooling agrees on one identity for the
  format regardless of OS.
- The icon named `org.dot-skill.skill` would be installed into the
  hicolor icon theme at the standard sizes
  (`/usr/share/icons/hicolor/{16x16,32x32,64x64,128x128,256x256,512x512}/apps/org.dot-skill.skill.png`),
  sourced directly from `assets/skillerr-mark-{16,32,64,128,256,512}.png`
  (note: 16px isn't one of `scripts/build-brand.mjs`'s current sizes —
  derive it from `skillerr-mark-32.png` or add 16 to `MARK_SIZES` if a
  Linux packaging effort needs it).
- After installing both files, `update-mime-database` and
  `update-desktop-database` refresh the caches so file managers pick up
  the association without a logout/login.

## What's not here

No `.plist`, registry `.reg`/install script, or `.desktop` file is
committed to this repo — the above is a specification for a future
installer to implement, not a working one. See
[ROADMAP.md](./ROADMAP.md) for where this kind of contribution fits.

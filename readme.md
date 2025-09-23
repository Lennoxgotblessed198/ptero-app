This doesn't contain any license; it's meant to be used for Pterodactyl hosting panel but you can change the code however you like.

## Run

Standard start (will auto-load previously saved domain if present):

```
npm start
```

Ignore saved domain (force show login prompt):

```
npm run start:ignore
```
Or manually:
```
electron . --ignore-saved
```

## Build / Package

Cross-platform helper:
```
npm run compile
```

The script auto-detects OS and builds (Linux AppImage, Windows NSIS, macOS dmg) and on Linux creates a desktop entry.

## Flag Reference

--ignore-saved  Do not auto-open saved domain; always show login window.

## Notes

Config is stored in Electron's userData directory as config.json.
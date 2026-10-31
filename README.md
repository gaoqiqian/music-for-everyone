# MUSIC for Everyone — Air Duet

Camera-based guitar interaction using JavaScript, MediaPipe hand tracking and Web Audio.

## Live Demo — Open in Your Browser

**[https://air-duet-music-1028.cooper1872.chatgpt.site/en/](https://air-duet-music-1028.cooper1872.chatgpt.site/en/)**

Click the full URL above to try the English version. No installation or account is required. Click **Hear a demo** to listen, or use **Space** to play a beat. Camera access is optional.

## Features

- One-hand guitar strumming with automatic calibration and movement filtering.
- Two-hand chord mode: choose a chord with the left hand, then close and open the right hand once per beat.
- Chord cards, number keys and Space provide camera-free alternatives.
- Beat indicators, chord previews, guitar sample playback and adjustable/importable lyric cues.
- Local hand tracking; camera frames and imported text are not uploaded by the application.

The current player focuses on guitar. Earlier experiments included piano; piano is not an active feature of this edition.

## Run locally

No package installation or build step is required. With Python installed:

```sh
python -m http.server 8080 --directory dist
```

Open http://localhost:8080/. Camera access requires localhost or HTTPS. Click **Hear a demo** to unlock audio, or **Play** then press Space. Camera permission is optional. Performance depends on lighting, hand visibility and device speed.

## Repository edition

This repository contains traditional/classical practice arrangements and generic chord-sequence exercises. Unverified third-party commercial recordings and embedded modern song lyrics from the hosted experiment are excluded. The hosted site therefore has a different repertoire. The gesture, sample-playback, chord-selection and cue-import engines are retained.

## Source map

- `dist/simple-app.mjs`: interface and performance orchestration.
- `dist/fist-open.mjs`, `dist/deliberate-sweep.mjs`, `dist/hanger-core.mjs`: gesture state and filtering.
- `dist/chord-controls.mjs`, `dist/practice-song.mjs`: chord selection and exercises.
- `dist/guitar-audio.mjs`, `dist/chord-rhythm.mjs`: Web Audio sample playback.
- `dist/song-session.mjs`, `dist/lyric-cues.mjs`: beat control and cue handling.
- `dist/assets/`: attributed soundfont samples and MediaPipe runtime/model assets.

## Checks

```sh
node tests/core.mjs
```

## Credits and rights

See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md), the soundfont attribution and `dist/SONGBOOK-CREDITS.txt`. Keep all third-party notices when redistributing those assets. Practice arrangements and estimated timing are not note-perfect reproductions.

No general open-source license is granted for project-authored code in this repository. Third-party components remain under their respective licenses.

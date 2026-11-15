# Tbilisi 19-23.11.2026

The bachelor weekend flyer as a one-page animated site. Plain static files: `index.html`, `styles.css`, `app.js`. No build step, relative paths only, so it works at a sub-path such as `https://user.github.io/repo/`.

## Deploy on GitHub Pages

1. Create a new repository on GitHub and push the contents of this folder to its `main` branch (these files at the repository root).
2. On GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch**.
3. Branch: `main`, folder: `/ (root)`, then **Save**.
4. After a minute the site is live at `https://<user>.github.io/<repo>/`.

`.nojekyll` is included so Pages serves the files as they are.

## Notes

- The page is marked `noindex, nofollow`, but the URL is still public to anyone who has it.
- Sound comes from D.Dan's official SoundCloud player. The URL is the `SOUNDCLOUD_URL` constant at the top of `app.js`. Phone browsers block autoplay with sound, so the page opens behind an entrance popup with the player and an arrow on its play button; pressing play starts the music and opens the page. After that the top bar scrolls the track name and the SOUND button pauses and resumes. Add `?noauto` to the URL to test the blocked-autoplay path on desktop.
- To preview locally: `python -m http.server 8000` in this folder, then open `http://localhost:8000/`.

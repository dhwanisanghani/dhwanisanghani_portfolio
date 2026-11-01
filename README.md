# Dhwani Portfolio — optimized for GitHub and Vercel

## Upload this website

1. Extract the ZIP on your computer.
2. Open your existing GitHub repository and choose **Add file → Upload files**.
3. Drag ALL the extracted contents into the upload window. Preserve the `assets` and `sections` folders. Replace the old `index.html` with the new one. Do not upload the ZIP itself or only `index.html`.
4. Commit the changes to your production branch (normally `main`).
5. Your connected Vercel project will deploy the commit. Wait until the new deployment shows **Ready**, then open your website.

The `vercel.json` file configures a static site: Framework **Other**, no build step, output directory **.** (repository root). No npm installation is needed.

## Updating your résumé

The **Download CV** button uses the root file `Dhwani-Sanghani-Resume.pdf`, which is the exact résumé supplied with this request. To update it later, rename your new résumé to this same filename, replace it in the repository root, and commit the change. Your connected Vercel project deploys the commit; no HTML edits are needed. Keep this filename unchanged.

## Files in order

The homepage `index.html` displays all seven sections in this order. The `sections` folder also contains an optimized standalone preview for each section:

1. `sections/1-Hero.html`
2. `sections/2-Education.html`
3. `sections/3-Experience.html`
4. `sections/4-Expertise.html`
5. `sections/5-Industry.html`
6. `sections/6-Tools.html`
7. `sections/7-Contact.html`

Their matching CSS, scripts, fonts and media are under numbered folders `assets/01-hero` through `assets/07-contact`. Keep the entire `assets` folder when uploading or moving this website.

## Loading improvements

- Main HTML reduced from approximately **27.4 MB** across the original embedded section files to approximately **71 KB**.
- Hero video: original **7.37 MB** → desktop **1.49 MB** and mobile **0.53 MB**. Both retain the full **20-second** duration and original frame rate.
- The hero text and a lightweight poster display first; the decorative video starts loading afterward. Phones automatically use the smaller video.
- Hero video pauses when its section leaves the screen. Reduced-motion and data-saving preferences display the poster, with a button to play the video.
- Large PNG artwork is compressed as WebP. Small tool logos use lossless compression. TrueType contact fonts are converted to WOFF2.
- Images use browser-native lazy loading. Lower sections' scripts and local fonts initialize near the viewport.
- Expertise and Contact include their rendered content in the HTML so their text is present before their interactive scripts load.
- Media files are separate from the HTML and can be cached and revalidated. Some original optional fonts still come from Google Fonts; fallback fonts keep text visible if those services are unavailable.
- Email and WhatsApp links retain the latest update: no preset subject or message.

These changes reduce the initial download and rendering work. Actual loading times still depend on the connection, device and hosting response; instant loading cannot be guaranteed.

## Preview locally

From this folder, run `python -m http.server 8000`, then open `http://localhost:8000` in a browser. You can also preview the numbered section files at `/sections/1-Hero.html`, and so on.

## Editing

Search `index.html` for `SECTION 1:` through `SECTION 7:` to find each section's markup. Shared appearance and behavior live in the matching numbered assets folder. The standalone section pages are separate previews: editing a preview's markup does not automatically update the homepage, so apply markup changes to `index.html` as well.

## Menu and cursor effects

The fullscreen menu and fluid cursor are adapted from the supplied reference website.
The menu includes Home, Education, Experience, Expertise, Industries, Tools and Contact.
It uses eight staggered vertical wipe panels, reversible opening/closing animation,
keyboard navigation, Escape to close, focus trapping, and reduced-motion support.
The animation library is included locally under `assets/vendor/`; the menu also has
a CSS fallback. Existing section content and media are preserved.

`menu.css` and `menu.js` control the menu. `fluid-cursor.js` and `site.js` control
the colourful fluid trail, click splashes and initial hero animation. The cursor
does not block links or touch scrolling, uses lighter rendering on touch devices,
stops rendering when idle, and is disabled when reduced motion is requested.
As in the reference, it pauses around the Contact section to keep interactions smooth.

## Quick resume update — no code editing

1. Name the new PDF **Dhwani-Sanghani-Resume.pdf** (spelling and capitals must match).
2. Replace that file in the repository root, beside **index.html**.
3. Commit it to the branch connected to Vercel.
4. Wait for the automatic deployment to show **Ready**.

The Download CV button then serves the new PDF. No HTML change or rebuild command
is required. This assumes automatic deployments are enabled for the connected branch.
Do not upload only the resume under a different filename, or upload the whole ZIP
as a single file. For the initial website update, upload all extracted files and folders.

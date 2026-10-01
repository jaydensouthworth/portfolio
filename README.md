# Jayden’s Realm

A static portfolio with three connected visual worlds, selected project notes, and professional contact links. The immersive view uses Canvas2D and native scrolling. Reading view presents the same work as a continuous, accessible document.

## Deploy with Dokploy

This repository is ready to serve. There is no install/build step, server application, database, API key, or environment variable to configure.

1. Create an Application and select this Git repository and the `main` branch.
2. Select the **Static** build type.
3. Set the static root / build path to `/dist`.
4. Deploy, then configure your domain with container port **80**.

Dokploy supplies the Nginx container for Static applications. GitHub Actions is not required. See the official [HTML deployment guide](https://docs.dokploy.com/docs/core/html) and [Static build documentation](https://docs.dokploy.com/docs/core/applications/build-type#static).

Deploy at the domain root because the page uses root-relative asset URLs. The old concept URLs, including `/ink/`, redirect to `/` while preserving query strings and section bookmarks.

## Preview locally

```sh
python3 -m http.server 8000 --directory dist
```

Open `http://localhost:8000`. Reading view is available at `/?view=reading#work`.

## Edit

- `dist/shared/`: authored renderer, native-scroll controller, styles, and procedural artwork
- `content/portfolio.json`: project descriptions, background, and public contact-related content
- `tools/ink_identity.py`: page composition and copy
- `tools/build-collection.py`: generate the root page and legacy redirects from the content
- `dist/assets/`: local fonts, font licenses, and favicon artwork

After editing content or the page composition:

```sh
python3 tools/build-collection.py
python3 tools/check-site.py
```

The generated page is committed so Dokploy can serve it directly. CSS and JavaScript are used as authored, without a bundler. Bump the relevant asset query version in the generator when changing cached assets.

## Accessibility and motion

The site supports keyboard navigation, visible focus indicators, dialog Escape/focus return, and a responsive navigation menu. Reduced-motion preferences start in Reading view. Decorative animation pauses while reading, viewing dialogs, or hiding the document. Contact links open the visitor’s email app or the linked profile; no form data is collected.

Desktop wheel and touch travel have separate distance mappings. Mobile behavior should be checked on the actual target device as well as responsive desktop views.

## Assets and licenses

Realm Display is a subset of Open Sans Condensed Bold, under Apache 2.0. Realm Overprint is a renamed subset of Tourney Black Italic, under SIL OFL 1.1. Both licenses are included in `dist/assets/`. The favicon uses the actual R outline from Realm Overprint with the portfolio’s colors.

# Personal introduction

The homepage embeds the 18-second `PersonalIntro` composition with Remotion Player.
It loads on the first click and uses the same source as the Studio preview.
The existing `BlogIntro` composition is preserved.

```sh
npm ci
npm run studio -- --no-open
```

Open the printed Studio URL and select **PersonalIntro**. Each of the three scenes
is also registered separately for previewing. Profile text is based on `content/about.md`.

After editing the composition, rebuild the committed browser bundle before Hugo:

```sh
npm run typecheck
npm run build:player
cd ..
hugo --minify --cleanDestinationDir
python3 scripts/check_seo.py docs
git diff --check
```

`assets/js/personal-intro.js` is the production browser bundle. The homepage does
not depend on a running Studio server or an exported MP4.

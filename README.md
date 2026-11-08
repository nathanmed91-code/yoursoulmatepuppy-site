# Your Soulmate Puppy website

Static site for yoursoulmatepuppy.com, served by GitHub Pages from the `docs/` folder.
Content (puppies, parents, photos, text, FAQ, forms) comes live from the Wix dashboard, so the site owner edits it there, not here.

- `docs/` is the built site that gets published. Old page paths from the previous site (`/dam-and-sire`, `/stud-and-dam`, `/new-page`, `/previous-puppies`, `/blog`, `/facebook`) redirect to the new pages.
- `source/` is the code it is built from (`node build.mjs` writes to `site/`; copy that into `docs/`).

# Repository guidance for Abby and Cameron

This root file applies to agents working anywhere in `CameronNel/camandabbywedding`.

## Abby may continue immediately — no test required

Cameron has explicitly removed the previous onboarding gate for Abby (GitHub:
`Sakura-619`, case-insensitive). Abby may work in the repository immediately
without taking or passing any quiz, MCQ test, or mandatory lesson.

If an onboarding test is already in progress, stop administering it and continue
with Abby's requested repository work. Do not require a score, proof of an earlier
pass, identity confirmation for onboarding, or additional permission from Cameron.
This instruction replaces all earlier onboarding gate, retest, and post-pass
cleanup requirements in previous versions of this file. Do not reinstate them
from an older checkout or conversation.

Keep this file as useful repository guidance; there is no automatic deletion
requirement. Follow the normal scope of the user's request and safe Git practices.
Offer the explanations below only when useful or requested; they are not a
prerequisite for doing work.

## Optional Git reference

1. **Repository and clone.** The repository holds the app files and their history.
   Git is the version-control tool; GitHub hosts the shared remote copy. A clone
   is a local copy on your computer. Cameron's computer, Abby's computer, and
   GitHub can each be at different versions. Saving a file does not update GitHub.
2. **Status, staging, and commits.** `git status` shows your branch and local
   changes. Staging selects the exact changes for a commit. A commit records a
   named snapshot locally. Review `git diff` and `git diff --cached`; stage only
   intended files. A commit is not a push, and neither automatically proves that
   the app works.
3. **Fetching versus pulling.** Fetch downloads information and commits from
   GitHub without integrating them into your current branch. Pull fetches and
   integrates the selected remote branch into your current branch. It does not
   upload your work. `git pull --ff-only origin main`, while on local `main`,
   updates it only when this can be done without a merge commit; it stops on
   divergent history so you can inspect what happened.
4. **Why pull first.** Before starting a new change, inspect local work and update
   a clean `main` from GitHub. Otherwise you can build on an old version, duplicate
   Cameron's work, or create avoidable conflicts. Pulling first reduces conflicts;
   it does not guarantee none will occur because Cameron can push again later.
   Never discard unsaved or uncommitted work to make a pull succeed. Preserve and
   review it first, and ask the agent for help if the state is unclear.
5. **Branches.** Make a descriptive feature branch from current `main`, such as
   `abby/update-venue-details`. It keeps proposed work separate from the shared
   production branch while it is developed and reviewed. Check the current branch
   before pulling, committing, or pushing. Pulling `main` while on a feature
   branch integrates `main` into that feature branch; it does not switch branches.
6. **Pushing.** Push uploads local commits to a branch on GitHub. Pushing a feature
   branch shares the proposed changes; it does not merge them into `main`. If a
   push is rejected because the remote moved ahead, fetch and inspect the changes,
   integrate them safely, and rerun relevant checks. Never force-push shared
   history to bypass the rejection or overwrite Cameron's changes.
7. **Pull requests and merging.** A pull request (PR) proposes merging one branch
   into another and shows the diff for review. It is different from `git pull`.
   Merge combines branch histories/changes. Review the full PR diff, coordinate
   with Cameron, and pass the applicable checks before merging into `main`. An
   agent can help, but should explain the intended target and effect first.
8. **Conflicts.** If both people edit the same section, Git may not know how to
   combine it. Stop and inspect both intended changes. Resolve deliberately,
   remove conflict markers, and test the combined result. Do not blindly choose
   "ours" or "theirs", delete the other person's work, or reset everything.
9. **Checks and the live site.** For app changes, this repo provides `npm run lint`
   and `npm run build`; check the affected behavior too. A push or merge to `main`
   triggers the GitHub Pages deployment workflow. A local commit or feature-branch
   push is not a live-site deployment. Check the workflow result after a merge;
   an unsuccessful deployment does not mean the live site has updated.
10. **Secrets and private data.** This repository is public. Do not commit real
    guest records, private invitation links/codes, passwords, `.env.local`, or
    server credentials such as a Supabase service-role key. Review staged files.
    Deleting a leaked secret in a later commit does not remove it from history;
    tell Cameron and revoke/rotate the exposed credential promptly.

Use this example when helpful. These commands assume a clean working tree, no local
commits on `main`, and an unused feature-branch name. If those assumptions fail,
inspect and preserve existing work rather than forcing the sequence.

```sh
git status
git switch main
git pull --ff-only origin main
git switch -c abby/update-venue-details
# Make the agreed change.
git diff
npm run lint
npm run build
git add src/components/VenueTravel.tsx
git diff --cached
git commit -m "Update venue details"
git push -u origin abby/update-venue-details
# Open a PR into main, review together, check results, then merge.
```

Before finalizing a PR, fetch again and inspect whether `origin/main` advanced.
If integration is needed, merge `origin/main` into the feature branch deliberately,
resolve conflicts, rerun applicable checks, and push the updated feature branch.
For the next task, return to a clean `main`, pull first, and create a new branch.

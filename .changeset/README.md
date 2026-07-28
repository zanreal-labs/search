# Changesets

This folder is the release queue. Every change that should ship to npm gets a changeset file
here; the Release workflow turns accumulated changesets into a version bump, a CHANGELOG entry,
and a publish.

Add one with:

```bash
bun changeset
```

Pick `patch`, `minor`, or `major`, then write a one-line summary - that line lands verbatim in
the CHANGELOG, so write it for someone reading release notes, not for someone reading the diff.

## How a release happens

1. You merge a pull request to `main` that contains one or more changeset files.
2. The Release workflow opens (or updates) a **"Version Packages"** pull request. That pull
   request bumps `package.json`, writes `CHANGELOG.md`, and deletes the consumed changesets.
3. You merge the Version Packages pull request. _That_ merge is what publishes to npm.

So merging a feature does not publish - merging the Version Packages pull request does. A push to
`main` with no pending changesets is a no-op, which is the intended behaviour.

Full docs: https://github.com/changesets/changesets

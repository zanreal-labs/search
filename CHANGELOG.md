# @zanreal/search

## 1.0.1

### Patch Changes

- 331c0d3: Fix the release pipeline. Releases now run through changesets and `npm publish`, so
  `publishConfig.provenance` is actually honoured and every publish carries a signed provenance
  attestation. Previously the workflow ran `bun publish`, which silently ignores provenance and
  re-published the same version on every push to `main`.

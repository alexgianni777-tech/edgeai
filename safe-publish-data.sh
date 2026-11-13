#!/usr/bin/env bash
set -euo pipefail
git config user.name "github-actions"
git config user.email "actions@github.com"
git add -A -- public/
if git diff --cached --quiet; then
  echo "PUBLIC_DATA_UNCHANGED: no new dataset commit necessary"
  exit 0
fi
git commit -m "chore: update verified public dataset"
# A run must never overwrite a newer strategy or data-quality fix that was
# merged while its long Yahoo build was running. A clean rebase is allowed
# only if the remote main changed documentation / metadata, not code or
# data. A genuinely newer run will rebuild with the updated source.
for attempt in 1 2 3; do
  git fetch origin main
  if [[ "$(git rev-parse origin/main)" != "$(git rev-parse "$GITHUB_SHA")" ]]; then
    changes="$(git diff --name-only "$GITHUB_SHA" origin/main -- . ':!*.md')"
    if [[ -n "$changes" ]]; then
      echo "::error::SOURCE_CHANGED_DURING_BUILD: newer code or public market data reached main; refusing to publish levels built from an older version."
      printf 'Changed paths:\n%s\n' "$changes"
      exit 78
    fi
  fi
  if ! git rebase origin/main; then
    git rebase --abort || true
    echo "::error::DATA_PUBLICATION_CONFLICT: concurrent data updates; stopping instead of overwriting verified history."
    exit 78
  fi
  if git push origin HEAD:main; then
    echo "PUBLIC_DATA_PUBLISHED: commit accepted by main"
    exit 0
  fi
  echo "Concurrent push race, checking remote state before retry $attempt/3"
  sleep "$attempt"
done
echo "::error::DATA_PUBLICATION_RETRY_EXHAUSTED"
exit 1

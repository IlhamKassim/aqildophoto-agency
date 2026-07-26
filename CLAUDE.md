## Agent skills

### Issue tracker

Local markdown — issues/specs live under `.scratch/<feature-slug>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Defaults used as-is: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context — one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.

### Git commit authorship

Commits in this repo should be authored as **Ilham Kassim** `<ilhamkassim2003@gmail.com>`, not the machine's default git identity. Since updating global/local git config is off-limits, pass the identity per-commit instead of persisting it:

```
git -c user.name="Ilham Kassim" -c user.email="ilhamkassim2003@gmail.com" commit -m "..."
```

Apply this to every commit made in this repo, not just the first one.

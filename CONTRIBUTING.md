# Contributing

This is a proprietary repository, made public so it can be read. It is a hobby-scale project run by one founder and a team of agents.

**Outside pull requests are not accepted.** Please do not spend time on one. I will close it. The terms are in [LICENSE](LICENSE).

## Report a bug or a problem

Open an issue on this repository and use a template if one fits. Say what you did, what you expected and what happened. Do not put a child's name, a recording or any family detail in an issue.

For a security problem, do not open an issue. Follow [SECURITY.md](SECURITY.md).

For help with the app itself, see [SUPPORT.md](SUPPORT.md).

## Working rules (founder and agents)

- One concern per pull request.
- All tests pass before any commit: `npm test`. Also run `npm run typecheck`.
- Database changes ship as a new migration file. Never edit a migration that has been applied.
- If a content rule test fails, fix the copy, not the test.
- Real family details never go in code, tests or fixtures. Tests use the fictional family "Asha".
- Commit and push work in progress at least every 30 minutes.
- Never push to `develop` or `main`. Open a pull request.

Commands:

```bash
npm install
npm test
npm run typecheck
npm run test:db
npm run test:functions
```

Branch names follow [CLAUDE.md](CLAUDE.md) and ruling CR-12 in [docs/agents/cto/RULINGS.md](docs/agents/cto/RULINGS.md). Allowed prefixes: `feat/`, `fix/`, `chore/`, `docs/`, `test/`, `qa/`, `exp/`, `ci/`. Example: `docs/github-community`.

The rule behind all of it: the machine may remove and repair, it may never add meaning.

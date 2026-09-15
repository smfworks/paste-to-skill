# Production deploy (web)

Goal: ship main to production without a surprise outage.

Checklist
[ ] CI green on the commit you are shipping
[ ] changelog / SKILL or README note if the user-visible behavior changed
[ ] announce in #ship: what, why, rollback
[ ] tag the release
[ ] deploy
[ ] smoke: homepage, auth, one write path
[ ] watch logs 10 minutes

Rollback: redeploy previous tag. If migrations ran, stop and page a human.

never deploy on Friday after 4pm without oncall awake
do not skip tests
do not apply irreversible migrations without a backup note
secrets stay in the host env — never paste .env into chat or a gist
tools: git, github, docker, vercel
input: release SHA, environment (staging|prod)
success: smoke checks pass and error rate is flat

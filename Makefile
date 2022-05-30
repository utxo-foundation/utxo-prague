.PHONY: all build

all: test build

test:
	deno test --unstable --allow-read utils/test.js

link-check:
	lychee spec/**/*.yaml

format:
	deno fmt utils/*.js README.md

fmt: format

build:
	deno run --unstable --allow-read --allow-write utils/exec.js build

docs-update:
	deno run --unstable --allow-read --allow-write utils/update-docs.js

speakers-list:
	deno run --unstable --allow-read utils/speakers-list.js

speakers-table:
	deno run --unstable --allow-read utils/update-docs.js speakersTableGen

speakers-leads:
	deno run --unstable --allow-read utils/update-docs.js speakersLeadsGen

partners-community:
	deno run --unstable --allow-read utils/update-docs.js partnersGen community

partners-sponsor:
	deno run --unstable --allow-read utils/update-docs.js partnersGen sponsor

partners-medium:
	deno run --unstable --allow-read utils/update-docs.js partnersGen medium

faqs:
	deno run --unstable --allow-read utils/update-docs.js faqsGen

stats:
	deno run --unstable --allow-read utils/stats.js

twitter:
	deno run --unstable --allow-read --allow-write --allow-env --allow-net utils/twitter.js

twitter-photos:
	deno run --unstable --allow-read --allow-write --allow-env --allow-net utils/twitter.js photos

events:
	deno run --unstable --allow-read utils/events.js

team:
	deno run --unstable --allow-read utils/team.js

schema:
	deno run --unstable --allow-read utils/exec.js schemas

server:
	cd dist && python -m SimpleHTTPServer 8000

media-kit:
	deno run --unstable --allow-read --allow-run utils/media-kit.js

changelog:
	deno run --unstable --allow-read --allow-write --allow-run utils/changelog.js

tags:
	deno run --unstable --allow-read utils/tags.js

schedule: plan

plan:
	deno run --unstable --allow-read --allow-write utils/plan.js $(num) $(append)

plan-candidates:
	js-yaml dist/22/schedule-candidates.json > spec/22/schedule-candidates.yaml

schedule: plan plan-candidates build

schedule-multi:
	tmux new-session -d "make schedule num=$(num) append=true"
	tmux split-window -d "make schedule num=$(num) append=true"
	tmux split-window -d "make schedule num=$(num) append=true"
	tmux split-window -d "make schedule num=$(num) append=true"
	tmux split-window -d "make schedule num=$(num) append=true"
	tmux attach

schedule-pdf:
	mkdir -p dist/22/pdf && cd utils/schedule-pdf && node index.js $(local)

id:
	deno run --unstable --allow-read utils/schedule-id.js

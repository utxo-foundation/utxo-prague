NAME = gweicz/utxo
VERSION = 0.1.0

.PHONY: all build

all: test build

test:
	deno test --unstable --allow-read utils/test.js

format:
	deno fmt utils/*.js README.md

build:
	deno run --unstable --allow-read --allow-write utils/build.js

docs-update:
	deno run --unstable --allow-read --allow-write utils/update-docs.js

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

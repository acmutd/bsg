#!/bin/bash
if git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
	echo "Inside a working git tree" >&2
else
	echo "Failure not inside of git tree" >&2
	exit 1
fi

if ! git diff --quiet || ! git diff --cached --quiet; then
	echo "Error: commit or stash your changes first" >&2
	exit 1
fi

before=$(git rev-parse @{u})
echo "Before the fetch $before"
git fetch --quiet
after=$(git rev-parse @{u})
echo "After the fetch $after"

if [ $? -eq 0 ]; then
	echo "Git fetch worked" >&2
else 
	echo "Git fetch failed" >&2
	exit 1
fi











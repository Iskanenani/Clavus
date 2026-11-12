# Clavus

**Is the work following the strategy?**

Clavus reads the work a company is actually doing, from trackers such as Jira, and shows its leaders how much of it serves the strategy they set, how much serves nothing they stated, and what runs against it.

> *Clavus* is Latin for the tiller, the handle used to steer a ship.

## The problem

Leaders set a strategy, but the people making daily choices often can't name it. In a London Business School study of 11,000 managers, only about a third could name their company's top three priorities ([source](https://www.london.edu/news/two-thirds-of-senior-managers-cant-name-their-firms-top-priorities)).

So projects drift away from the strategy, and leaders find out late, when results disappoint. KPI dashboards show outcomes after the fact. Clavus looks earlier, at where the effort is going.

## How it works

1. **Set the reference.** The strategy becomes a short list of priorities and explicit "we will not do" items, validated by the leader.
2. **Load the work.** Clavus takes a list of work items from whatever tool the teams already use, e.g. Jira projects, epics and stories.
3. **Judge each project.** An AI model marks it as *serves a priority*, *serves none* or *contradicts one*, and quotes the strategy line behind the call.
4. **Show the map.** One dashboard compares where effort goes with where the strategy says it should go.

## Features

- Strategy reference with priorities and non-goals
- Tool-agnostic import (see below), judged at project or epic level
- A quoted reason for every judgement, and an "unclear" flag when the strategy is too vague to decide
- Effort view: share of work items per priority, plus story points or time where the source records them
- Human review: a person can confirm or override each call, and overrides are logged
- A short list of contradictions for the leader to rule on

## Works with any work tracker

Clavus is not tied to one tool. It reads a simple common format, so a company can combine engineering, marketing and sales work in one view, whatever each team uses.

Each work item needs:

| Field | Required | Example |
|---|---|---|
| Title | Yes | "German checkout flow" |
| Description | Yes | What the work is for |
| Parent | Yes | The project or epic it belongs to |
| Team | No | "Payments" |
| Effort | No | Story points, hours or days |
| Status | No | "In progress" |

Any tracker that can export its items (Jira, Asana, Linear and similar) can be mapped to this format, and so can a plain spreadsheet.

## What it is not

- Not a KPI dashboard: it measures direction of effort, not results.
- Not a goal tracker: it doesn't rely on people tagging their own work to a goal. It reads the work itself.
- Not a decision-maker: it flags, and people decide.

## Data

The prototype runs on synthetic data: a fictional company with one strategy and a set of work items containing planted mismatches. No real company data is used.

## Status

Early prototype, built for a student consulting project.

- [ ] Synthetic strategy and work-item dataset
- [ ] Import in the common format
- [ ] Classification of projects against the strategy
- [ ] Dashboard
- [ ] Accuracy test against the planted mismatches
- [ ] Ready-made mappings for common trackers (later)
- [ ] Live connections to trackers (later)

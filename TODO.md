# TODO

## Milestone 0: bootstrap

- [x] Choose the working directory `E:\programs\dsh-think-twice`.
- [x] Create the GitHub repository early so the future listing has a repository age of at least one day: <https://github.com/SSHOOTING/dsh-think-twice>.
- [x] Initialise the local repository and push the bootstrap documents.
- [x] At 12:00 on 2026-11-19, start the first implementable MVP slice.
- [x] Publish `dsh-think-twice@0.1.2` to npm.
- [x] Create GitHub Release `v0.1.2`.
- [ ] Submit the prepared market entry after the repository reaches one full day of age.

## Milestone 1: first usable loop

- [x] Define the review contract: input text, message type, questions, evidence spans, confidence, and user actions.
- [x] Implement the three review passes:
  - [x] language: repetition, filler, self-correction, and meaning-changing sentence problems;
  - [x] logic: direct contradiction, time/scope/quantity conflict, and unsupported causal jumps;
  - [x] information: missing actor, action, object, deadline, condition, or success criteria.
- [x] Generate at most two high-impact questions per review.
- [x] Require every question to quote the relevant source text.
- [x] Add `helpful / inaccurate / edited` feedback for every question.
- [x] Save history locally, including the original text, questions, and feedback.
- [x] Keep a fast-writing mode that never blocks insertion.
- [x] Recheck the live composer draft after the user edits, rather than a stale panel snapshot.
- [ ] Add a settings entry for inspecting and deleting local history.
- [ ] Add integration tests with a mocked DSH model stream.
- [x] Prefer the current session's recorded model route over the process-wide default route.

## Milestone 2: scoring and statistics

- [ ] Freeze a versioned rubric before showing scores.
- [ ] Score five dimensions: purpose/action, completeness, logic, specificity, and concision/naturalness.
- [ ] Cap the score when a high-impact defect exists instead of hiding it inside a weighted average.
- [ ] Store rubric, prompt, and model versions with every score.
- [ ] Group trends by message type so daily averages are not distorted by different tasks.
- [ ] Show a seven-day moving average, sample count, and confidence instead of pretending every daily point is meaningful.
- [ ] Add a statistics page with recurring reader questions and improved habits.

## Milestone 3: newcomer tutorial

Status: design only; deliberately excluded from the first MVP.

- [ ] Build the standard task `Blind Redraw` / “你画我猜”:
  - [ ] show the user a deterministic target scene;
  - [ ] let the user describe it aloud;
  - [ ] reconstruct the scene from the description;
  - [ ] compare the reconstruction with the target and show the visual diff;
  - [ ] ask only the questions that explain the difference;
  - [ ] let the user retry immediately.
- [ ] Use a structured grid scene rather than freehand image generation so the comparison is deterministic.
- [ ] Add three rounds with a deliberate difficulty ladder:
  - [ ] 3 objects: shape, colour, position;
  - [ ] 5–6 objects: relative position and one relation;
  - [ ] 7 objects: one condition, exception, or dependency.
- [ ] Add the end-of-tutorial summary:
  - [ ] what the user described accurately;
  - [ ] which missing detail caused each mismatch;
  - [ ] one small habit to practise next;
  - [ ] second-attempt improvement.

Detailed task design and scoring examples: [docs/tutorial-standard-tasks.md](docs/tutorial-standard-tasks.md).

## Later candidates

- [ ] Add a workplace variant: `Task Handoff`, where the user explains one executable task and the system checks owner, action, object, deadline, output format, and exception.
- [ ] Add a logic variant: `Contradiction Minefield`, where the user must detect and repair a short plan containing one or two conflicts.
- [ ] Add a process variant: `Explain the Procedure`, where the listener must reproduce the correct order and preconditions.

## Open questions

- [ ] Which message types count toward the historical score?
- [ ] Should casual chat be excluded from the trend?
- [ ] What is the minimum sample size before showing a daily score?
- [ ] Which rubric changes require re-scoring old messages?
- [ ] How should ASR confidence suppress a language finding?


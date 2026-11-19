# Newcomer tutorial: standard tasks with known answers

Status: design note for a post-MVP feature. The first MVP may ship without it, but its data contracts should not make it harder to add later.

## Goal

The tutorial should let a first-time user experience the product's full value in two or three minutes:

1. the user explains something in their own words;
2. the system produces a visible result;
3. a good explanation produces a noticeably better result than a vague one;
4. the system asks only the small questions that explain the gap;
5. the user retries and sees the improvement immediately.

The point is not to test whether the user is “good at language”. The point is to make the causal link between precise expression and a useful outcome visible.

## Recommended primary task: Blind Redraw / “你画我猜”

The user sees a simple target scene, describes it aloud, and a listener reconstructs the scene from the description alone. The user then sees the target and reconstruction side by side.

### Why this is a good first tutorial

- The target is visible, so the user immediately understands the goal.
- The standard answer is deterministic.
- Missing or ambiguous information produces a visible mismatch.
- It naturally exercises all three review passes:
  - language: repetition, filler, and unclear sentence structure;
  - logic: contradictory positions, directions, or conditions;
  - information: missing objects, attributes, positions, relations, and labels.
- The user can experience the value without first importing personal messages.
- A second attempt gives a strong “I can see my improvement” moment.

### Do not use freehand image generation for v1

Freehand image generation is visually attractive but too noisy for a tutorial: the listener may draw something different for reasons unrelated to the user's description. Use a structured scene instead:

- a 3×3 grid;
- a fixed vocabulary of shapes;
- fixed colours;
- positions expressed as row and column;
- optional arrows, labels, grouping, and conditions.

The reconstruction is a JSON scene, and the comparison is rule-based. A rendered image is only the presentation layer.

## Suggested three-round difficulty ladder

The difficulty should be “one small step beyond comfortable”: hard enough that a normal first attempt leaves one or two fixable gaps, but not so hard that the user has to learn a new notation.

### Round 1: concrete objects

Target:

- blue circle in row 1, column 1;
- yellow star in row 1, column 3;
- red triangle in row 3, column 2.

What it tests:

- shape;
- colour;
- row and column.

Likely first-attempt gap:

> “左边一个圆，右边一个星，下面一个三角” leaves the exact columns ambiguous.

One good question:

> “蓝色圆在左上角，是指第一行第一列，还是只要在左半边就可以？”

### Round 2: relations

Target:

- the same three objects;
- a green square in row 2, column 2;
- an arrow from the green square to the red triangle;
- the label `A` above the yellow star.

What it tests:

- relative position;
- direction;
- labels;
- relations between objects.

Likely first-attempt gap:

> The user says “中间放一个方块，连到三角形”，but does not say whether the arrow starts or ends at the square.

One good question:

> “箭头是从绿色方块指向红色三角形，还是反过来？”

### Round 3: one small rule

Target:

- seven objects;
- one conditional or exception;
- one grouping relation.

Example rule:

> If the red triangle is above the blue circle, put a dashed border around both.

What it tests:

- condition;
- dependency;
- exception;
- ability to explain what changes the outcome.

The third round should still be solvable in one short retry. It should not turn into a puzzle game.

## What the user sees after the attempt

```text
目标场景        你的描述还原
[target]   vs   [reconstruction]

匹配：4 / 6 个对象
位置正确：2 / 4
关系正确：1 / 2

对方可能还会追问 2 件事：
1. 绿色方块是箭头起点还是终点？
2. “右上角”是第一行第三列，还是只要在右上区域？

[再试一次] [只改这两处]
```

After the retry:

```text
位置正确率：50% → 100%
你补上了“第一行第三列”和“箭头起点”，
这是这次提升最大的两处。
```

## How this exercises the full product

| Product capability | Tutorial manifestation |
|---|---|
| language review | Detect repeated phrases, false starts, and sentences that cannot be parsed cleanly. |
| logic review | Detect contradictory positions, reversed arrows, and impossible conditions. |
| information review | Detect missing objects, attributes, positions, relations, and labels. |
| evidence-backed questions | Every question points to the phrase that created the ambiguity. |
| no automatic rewriting | The user revises their own description; the system never supplies a finished paragraph. |
| score and history | The user sees first-attempt and second-attempt scores under the same rubric. |
| “one small step” difficulty | The tutorial targets one or two missing details per round, not a complete rewrite. |

## Scoring model for the tutorial

Do not reuse the general message score blindly. Use a task-specific checklist:

| Dimension | Weight | What is compared |
|---|---:|---|
| Object presence | 30% | Every target object appears exactly once. |
| Attributes | 20% | Shape and colour match. |
| Position | 25% | Row and column match. |
| Relations | 15% | Arrows, grouping, and ordering match. |
| Labels and rules | 10% | Labels and conditional instructions match. |

The final tutorial result should show both:

1. **task accuracy**: how much of the scene was reconstructed correctly;
2. **communication quality**: which expression habits helped or blocked the reconstruction.

## Interaction rules

- Maximum two questions after the first attempt.
- Every question must point to the exact phrase that caused the ambiguity.
- If the reconstruction matches the target, show success and do not invent a problem.
- If the user's wording is colloquial but unambiguous, do not penalise it.
- The retry should preserve the original text and show a before/after comparison.
- The user can skip the tutorial and return later.

## Alternative tutorial tasks

### Task Handoff

The user explains a concrete workplace task. The listener reconstructs an action card:

- who does what;
- by when;
- for which audience;
- in what format;
- under which constraints;
- what counts as done.

This is more directly relevant to work messages, but less visually satisfying than Blind Redraw.

### Contradiction Minefield

The user sees a short plan containing one or two conflicts and must explain a consistent revision. This is the strongest logic demo but a weaker first-run tutorial because it feels like a test.

### Explain the Procedure

The user describes a short process, and the listener reproduces the sequence. This tests ordering and preconditions, but is less visual and less immediate.

## Data model sketch

```text
tutorial_task
  id
  title
  difficulty
  target_scene_json
  task_rubric_json
  allowed_vocabulary

tutorial_attempt
  id
  task_id
  attempt_no
  raw_text
  reconstruction_json
  visual_diff_json
  questions_json
  task_score
  communication_findings_json
  user_feedback_json
```

## What not to build in the MVP

- freehand image generation;
- voice acting or animated characters;
- a large level library;
- public leaderboards;
- streak penalties;
- a universal “communication score” that mixes tutorial performance with real message history.


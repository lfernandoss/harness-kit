# Harness History — Configuration

## Score Weights
These weights are used by harness-evaluator to compute the composite score.
Adjust based on what matters most for your project.

| Metric | Weight | Direction | Description |
|--------|--------|-----------|-------------|
| tdd_cycles | 0.25 | lower is better | Fewer cycles = harness guides more precisely |
| iterations_to_pass | 0.20 | lower is better | Fewer runs = faster convergence |
| reworksCount | 0.25 | lower is better | Fewer reworks = validation passed faster |
| grumpy_open_points | 0.20 | higher is better | More points = deeper architectural review |
| context_docs_read | 0.05 | moderate is better | Too low = missing context; too high = noise |
| deviations | 0.05 | lower is better | Fewer deviations = harness is clearer |

## Composite Score Formula
score = (1 / max(tdd_cycles, 1)) × 0.25
      + (1 / max(iterations_to_pass, 1)) × 0.20
      + (1 / max(reworksCount + 1, 1)) × 0.25
      + (grumpy_open_points / 10) × 0.20
      + (1 / (deviations + 1)) × 0.05
      + context_score × 0.05

context_score = 1.0 if 3 ≤ context_docs_read ≤ 8
              = 0.5 if context_docs_read < 3 or 9 ≤ context_docs_read ≤ 12
              = 0.0 if context_docs_read > 12

## Benchmark Task Set
Skill chains will be compared across sessions with the same task_type.
Minimum sessions before reliable comparison: 3 per skill_chain.

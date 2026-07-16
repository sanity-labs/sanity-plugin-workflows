---
'@sanity-labs/sanity-plugin-workflows': patch
---

Document that the comments/tasks addon dataset must be initialised from Studio (add a comment or create a task once) before stage tasks / completion gating can work, and add troubleshooting for the missing-dataset console warning.

Depends on `@sanity-labs/workflow-kit@^0.5.1` for the one-time console warning when that addon dataset is missing.

name: Pull request
description: Defaults for contributors
body:
  - type: checkboxes
    id: checks
    attributes:
      label: Checklist
      options:
        - label: Commits include DCO `Signed-off-by` (`git commit -s`)
        - label: `npm test` passes locally
        - label: Docs updated if needed
        - label: Spec/behavior changes include fixtures
        - label: No secrets in the diff
        - label: AI-assisted work is disclosed (if applicable)
  - type: textarea
    id: summary
    attributes:
      label: Summary
      description: What and why (1–5 sentences).
    validations:
      required: true

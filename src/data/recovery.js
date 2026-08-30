// Central Recovery Agent Data Layer - RazorRecover AI
// Set to zero count values representing an inactive recovery pipeline

export const recoveryData = {
  activeRecoveries: 0,
  pendingActions: 0,
  completed: 0,
  escalated: 0,
  stages: [
    { stage: 'Detect', count: 0, cases: [] },
    { stage: 'Analyze', count: 0, cases: [] },
    { stage: 'Decide', count: 0, cases: [] },
    { stage: 'Guardrail', count: 0, cases: [] },
    { stage: 'Recover', count: 0, cases: [] },
    { stage: 'Verify', count: 0, cases: [] }
  ]
};

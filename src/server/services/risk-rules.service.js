export const riskRulesService = {
  evaluateTransaction: (transaction) => {
    let riskType = null;
    let riskLevel = 'Low';
    let recommendedAction = null;
    let createCase = false;
    let priority = 'Low';
    let reason = '';

    if (transaction.status === 'CAPTURED') {
      if (transaction.settlementStatus === 'PENDING') {
        riskType = 'SETTLEMENT_PENDING';
        riskLevel = 'Medium';
        recommendedAction = 'VERIFY_SETTLEMENT';
        priority = 'Medium';
        createCase = true;
        reason = 'Payment captured but merchant settlement remains unconfirmed by gateway.';
      }
    } else if (transaction.status === 'FAILED') {
      riskType = 'PAYMENT_FAILED';
      riskLevel = 'High';
      recommendedAction = 'RETRY_PAYMENT';
      priority = 'High';
      createCase = true;
      reason = `Customer transaction failed. Gateway reported failure reason: ${transaction.failureReason || 'unknown gateway error'}.`;
    }

    return {
      riskType,
      riskLevel,
      recommendedAction,
      createCase,
      priority,
      reason
    };
  }
};

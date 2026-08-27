export function calculateFinalRefund(refundableAmount, maintenanceDeduction) {
  return Math.max(0, Number(refundableAmount) - Number(maintenanceDeduction));
}

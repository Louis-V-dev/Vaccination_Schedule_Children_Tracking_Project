export const PaymentStatus = {
    PENDING: 'PENDING',
    PROCESSING: 'PROCESSING',
    COMPLETED: 'COMPLETED',
    DECLINED: 'DECLINED',
    CANCELLED: 'CANCELLED',
    REFUNDED: 'REFUNDED',
    PARTIALLY_REFUNDED: 'PARTIALLY_REFUNDED',
    FAILED: 'FAILED',
    EXPIRED: 'EXPIRED',
    ON_HOLD: 'ON_HOLD',
    DISPUTED: 'DISPUTED'
};

export const PaymentStatusLabels = {
    [PaymentStatus.PENDING]: 'Pending',
    [PaymentStatus.PROCESSING]: 'Processing',
    [PaymentStatus.COMPLETED]: 'Completed',
    [PaymentStatus.DECLINED]: 'Declined',
    [PaymentStatus.CANCELLED]: 'Cancelled',
    [PaymentStatus.REFUNDED]: 'Refunded',
    [PaymentStatus.PARTIALLY_REFUNDED]: 'Partially Refunded',
    [PaymentStatus.FAILED]: 'Failed',
    [PaymentStatus.EXPIRED]: 'Expired',
    [PaymentStatus.ON_HOLD]: 'On Hold',
    [PaymentStatus.DISPUTED]: 'Disputed'
};

export const PaymentStatusColors = {
    [PaymentStatus.PENDING]: 'warning',
    [PaymentStatus.PROCESSING]: 'info',
    [PaymentStatus.COMPLETED]: 'success',
    [PaymentStatus.DECLINED]: 'error',
    [PaymentStatus.CANCELLED]: 'default',
    [PaymentStatus.REFUNDED]: 'secondary',
    [PaymentStatus.PARTIALLY_REFUNDED]: 'secondary',
    [PaymentStatus.FAILED]: 'error',
    [PaymentStatus.EXPIRED]: 'default',
    [PaymentStatus.ON_HOLD]: 'warning',
    [PaymentStatus.DISPUTED]: 'error'
}; 
/**
 * Central Notifications Dataset - RazorRecover AI
 */

export const notificationsData = [
  {
    id: 'NOTIF_01',
    type: 'critical',
    title: 'High-Value Recovery Approval Required',
    message: 'Transaction TXN_10004 (₹98,000) exceeds auto recovery threshold. Merchant sign-off needed.',
    time: '12 mins ago',
    read: false
  },
  {
    id: 'NOTIF_02',
    type: 'warning',
    title: 'Bank Settlement Pending',
    message: 'Transaction TXN_10006 (₹45,000) captured but awaiting bank batch reconciliation.',
    time: '1 hour ago',
    read: false
  },
  {
    id: 'NOTIF_03',
    type: 'success',
    title: 'Recovery Verified',
    message: 'Transaction TXN_10011 (₹5,000) verified as recovered in Test Mode.',
    time: '2 hours ago',
    read: true
  },
  {
    id: 'NOTIF_04',
    type: 'warning',
    title: 'Customer Card 3DS Timeout',
    message: 'Customer Deepa Nair (₹3,198) dropped during 3DS auth. Recovery retry link dispatched.',
    time: '3 hours ago',
    read: true
  }
];

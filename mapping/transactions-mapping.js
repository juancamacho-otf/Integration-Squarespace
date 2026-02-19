const maptransactions = (transactionDoc) => {
  if (!transactionDoc) return null;

  const paymentsList = transactionDoc.payments || [];
  const firstPayment = paymentsList[0] || {}; 
  const provider = firstPayment.provider || ''; 

  const orderSquare = {
    payment: {
        related_order_id: transactionDoc.salesOrderId,
        temporary_id: transactionDoc.id ?? '',
        customerEmail: transactionDoc.customerEmail ?? '',
        
        payment_reference: firstPayment.externalTransactionId ?? '',
        hs_payment_processing_method: provider, 
    }
  };

  return orderSquare;
};

module.exports = { maptransactions };
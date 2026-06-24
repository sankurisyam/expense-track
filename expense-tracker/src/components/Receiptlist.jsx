function Receiptlist({ receipts, onEdit, onDelete }) {
  if (receipts.length === 0) {
    return <p className="muted-text">No receipts found for this month.</p>;
  }

  return (
    <div className="receipt-table">
      <div className="receipt-table-head">
        <span>Description</span>
        <span>Category</span>
        <span>Amount</span>
        <span>Actions</span>
      </div>
      {receipts.map((receipt) => (
        <div key={receipt.id} className="receipt-row">
          <div className="receipt-description">
            <h4>{receipt.description}</h4>
            <p>Receipt #{receipt.id}</p>
          </div>
          <span className="category-pill">{receipt.category || "Uncategorized"}</span>
          <strong className="receipt-amount">${Number(receipt.amount).toFixed(2)}</strong>
          <div className="receipt-actions">
            <button className="btn btn-secondary small" onClick={() => onEdit(receipt)}>
              Edit
            </button>
            <button className="danger-button small" onClick={() => onDelete(receipt.id)}>
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default Receiptlist;

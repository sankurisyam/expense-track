import { useState } from "react";

function Receiptform({ receipt, onSave, onCancel }) {
  const [description, setDescription] = useState(receipt?.description || "");
  const [amount, setAmount] = useState(receipt?.amount ? String(receipt.amount) : "");
  const [category, setCategory] = useState(receipt?.category || "");

  function handleSubmit(event) {
    event.preventDefault();
    onSave({ description, amount: Number(amount), category });
    if (!receipt) {
      setDescription("");
      setAmount("");
      setCategory("");
    }
  }

  return (
    <form className="receipt-form" onSubmit={handleSubmit}>
      <div className="form-heading">
        <span className="eyebrow">{receipt ? "Editing" : "New entry"}</span>
        <h3>{receipt ? "Update receipt" : "Add receipt"}</h3>
      </div>
      <div className="receipt-form-grid">
        <label>
          Description
          <input
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Coffee, taxi, groceries"
            required
          />
        </label>
        <label>
          Amount
          <input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="250.00"
            required
          />
        </label>
        <label>
          Category
          <input
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            placeholder="Food, Transport"
          />
        </label>
      </div>
      <div className="receipt-form-actions">
        <button type="submit" className="btn btn-primary">
          {receipt ? "Update receipt" : "Save receipt"}
        </button>
        {receipt && (
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

export default Receiptform;

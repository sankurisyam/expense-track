import { Link } from "react-router-dom";

function Dashboardcard({ month, monthId, total, receiptCount, onDelete }) {
  return (
    <article className="month-card">
      <div className="month-card-header">
        <div>
          <h3>{month}</h3>
          <p>{receiptCount} {receiptCount === 1 ? "receipt" : "receipts"}</p>
        </div>
        <button className="danger-button small" onClick={onDelete} aria-label={`Delete ${month}`}>
          Delete
        </button>
      </div>
      <div className="month-card-body">
        <span className="eyebrow">Monthly total</span>
        <p>{Number(total).toFixed(2)}</p>
      </div>
      <Link to={`/expenses/${monthId}`} className="button-link">
        View receipts
      </Link>
    </article>
  );
}

export default Dashboardcard;

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchMonths, fetchReceipts, createReceipt, updateReceipt, deleteReceipt } from "../services/api";
import Receiptform from "../components/Receiptform";
import Receiptlist from "../components/Receiptlist";

const MONTH_LABELS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function formatMonthLabel(monthValue) {
  const [year, month] = monthValue.split("-");
  const index = Number(month) - 1;
  return MONTH_LABELS[index] ? `${MONTH_LABELS[index]} ${year}` : monthValue;
}

function ExpenseDetails() {
  const { monthId } = useParams();
  const navigate = useNavigate();
  const [month, setMonth] = useState(null);
  const [receipts, setReceipts] = useState([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingReceipt, setEditingReceipt] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadExpenseDetails = async () => {
      if (!isMounted) return;
      setLoading(true);
      try {
        const [months, monthReceipts] = await Promise.all([
          fetchMonths(),
          fetchReceipts(monthId),
        ]);
        if (isMounted) {
          const foundMonth = months.find((m) => String(m.id) === String(monthId));
          setMonth(foundMonth || null);
          setReceipts(monthReceipts);
          setStatus("");
        }
      } catch (error) {
        if (isMounted) {
          setStatus(error.message || "Unable to load receipt details");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadExpenseDetails();

    return () => {
      isMounted = false;
    };
  }, [monthId]);

  async function handleSaveReceipt(receiptData) {
    try {
      if (editingReceipt) {
        const updated = await updateReceipt(editingReceipt.id, receiptData);
        setReceipts((current) =>
          current.map((receipt) => (receipt.id === editingReceipt.id ? updated : receipt))
        );
        setEditingReceipt(null);
      } else {
        const created = await createReceipt({
          ...receiptData,
          monthId: Number(monthId),
        });
        setReceipts((current) => [...current, created]);
      }
      setStatus("");
    } catch (error) {
      setStatus(error.message || "Could not save receipt");
    }
  }

  function handleEditReceipt(receipt) {
    setEditingReceipt(receipt);
    setStatus("");
  }

  function handleCancelEdit() {
    setEditingReceipt(null);
    setStatus("");
  }

  async function handleDeleteReceipt(receiptId) {
    if (!window.confirm("Delete this receipt?")) {
      return;
    }

    try {
      await deleteReceipt(receiptId);
      setReceipts((current) => current.filter((r) => r.id !== receiptId));
      setStatus("");
    } catch (error) {
      setStatus(error.message || "Could not delete receipt");
    }
  }

  const totalAmount = receipts
    .reduce((sum, receipt) => sum + Number(receipt.amount || 0), 0)
    .toFixed(2);
  const averageAmount = receipts.length > 0 ? (Number(totalAmount) / receipts.length).toFixed(2) : 0;

  if (loading) {
    return (
      <div className="page expense-details-page">
        <div className="loading-state">
          <p>Loading receipt details...</p>
        </div>
      </div>
    );
  }

  if (!month) {
    return (
      <div className="page expense-details-page">
        <div className="error-state">
          <h3>Month not found</h3>
          <p>The requested month could not be loaded.</p>
          <button className="btn btn-secondary" onClick={() => navigate("/")}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page expense-details-page">
      <div className="details-header">
        <button className="btn-back" onClick={() => navigate("/")}>Back</button>
        <div>
          <span className="eyebrow">Monthly receipt ledger</span>
          <h1>{formatMonthLabel(month.month)}</h1>
          <p>Manage receipts, review spending totals, and keep this month organized.</p>
        </div>
      </div>

      <section className="stats-section">
        <div className="stat-card">
          <span className="stat-label">Total receipts</span>
          <strong className="stat-value">{receipts.length}</strong>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total amount</span>
          <strong className="stat-value">${totalAmount}</strong>
        </div>
        <div className="stat-card">
          <span className="stat-label">Average receipt</span>
          <strong className="stat-value">${Number(averageAmount).toFixed(2)}</strong>
        </div>
      </section>

      {status && (
        <div className={`status-banner ${status.includes("Unable") ? "error" : "success"}`}>
          {status}
        </div>
      )}

      <div className="details-layout">
        <section className="receipt-form-section">
          <Receiptform
            key={editingReceipt ? editingReceipt.id : "new"}
            receipt={editingReceipt}
            onSave={handleSaveReceipt}
            onCancel={handleCancelEdit}
          />
        </section>

        <section className="receipts-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Receipt records</span>
              <h2 className="section-title">Receipts</h2>
            </div>
          </div>
          {receipts.length === 0 ? (
            <div className="empty-state">
              <h3>No receipts yet</h3>
              <p>Add the first expense for this month to start building your ledger.</p>
            </div>
          ) : (
            <Receiptlist
              receipts={receipts}
              onEdit={handleEditReceipt}
              onDelete={handleDeleteReceipt}
            />
          )}
        </section>
      </div>
    </div>
  );
}

export default ExpenseDetails;

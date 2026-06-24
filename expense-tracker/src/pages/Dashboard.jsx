import { useEffect, useMemo, useState } from "react";
import { fetchMonths, fetchReceipts, createMonth, deleteMonth } from "../services/api";
import Dashboardcard from "../components/Dashboardcard";

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

function Dashboard() {
  const [months, setMonths] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [newMonth, setNewMonth] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      if (!isMounted) return;
      setLoading(true);
      try {
        const [monthData, receiptData] = await Promise.all([
          fetchMonths(),
          fetchReceipts(),
        ]);
        if (isMounted) {
          setMonths(monthData);
          setReceipts(receiptData);
          setStatus("");
        }
      } catch (error) {
        if (isMounted) {
          setStatus(error.message || "Unable to load dashboard");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const monthSummaries = useMemo(
    () =>
      months.map((month) => {
        const monthReceipts = receipts.filter((receipt) => receipt.monthId === month.id);
        const total = monthReceipts.reduce(
          (sum, item) => sum + Number(item.amount || 0),
          0
        );
        return {
          ...month,
          displayMonth: formatMonthLabel(month.month),
          total: total.toFixed(2),
          receiptCount: monthReceipts.length,
        };
      }),
    [months, receipts]
  );

  const dashboardTotal = monthSummaries
    .reduce((sum, month) => sum + Number(month.total || 0), 0)
    .toFixed(2);
  const receiptTotal = receipts.length;
  const bestMonth = monthSummaries.reduce(
    (highest, month) => (Number(month.total) > Number(highest.total || 0) ? month : highest),
    { displayMonth: "No data", total: 0 }
  );

  async function handleCreateMonth(event) {
    event.preventDefault();
    setStatus("");

    if (!newMonth.trim()) {
      setStatus("Please enter a month in format YYYY-MM");
      return;
    }

    try {
      const created = await createMonth({ month: newMonth.trim() });
      setMonths((current) => [...current, created]);
      setNewMonth("");
      setStatus("");
    } catch (error) {
      setStatus(error.message || "Could not create month");
    }
  }

  async function handleDeleteMonth(monthId) {
    if (!window.confirm("Are you sure you want to delete this month and all its receipts?")) {
      return;
    }

    try {
      await deleteMonth(monthId);
      setMonths((current) => current.filter((month) => month.id !== monthId));
      setReceipts((current) => current.filter((receipt) => receipt.monthId !== monthId));
      setStatus("");
    } catch (error) {
      setStatus(error.message || "Could not delete month");
    }
  }

  return (
    <div className="page dashboard-page">
      <header className="dashboard-header">
        <div>
          <span className="eyebrow">Personal finance workspace</span>
          <h1>Expense Dashboard</h1>
          <p>Track monthly spending, organize receipts, and keep your records presentation-ready.</p>
        </div>
        <div className="header-card">
          <span>Total tracked</span>
          <strong>${dashboardTotal}</strong>
          <small>{receiptTotal} saved {receiptTotal === 1 ? "receipt" : "receipts"}</small>
        </div>
      </header>

      <section className="overview-grid" aria-label="Expense overview">
        <div className="stat-card">
          <span className="stat-label">Months</span>
          <strong className="stat-value">{monthSummaries.length}</strong>
          <small>Active tracking periods</small>
        </div>
        <div className="stat-card">
          <span className="stat-label">Receipts</span>
          <strong className="stat-value">{receiptTotal}</strong>
          <small>Stored expense records</small>
        </div>
        <div className="stat-card">
          <span className="stat-label">Top month</span>
          <strong className="stat-value compact">{bestMonth.displayMonth}</strong>
          <small>${Number(bestMonth.total || 0).toFixed(2)}</small>
        </div>
      </section>

      <section className="create-month-section">
        <form className="create-month-form" onSubmit={handleCreateMonth}>
          <div className="form-group">
            <label htmlFor="month-input">Add new month</label>
            <div className="form-row">
              <input
                id="month-input"
                type="month"
                value={newMonth}
                onChange={(event) => setNewMonth(event.target.value)}
                placeholder="2026-06"
                className="form-input"
              />
              <button type="submit" className="btn btn-primary">
                Create Month
              </button>
            </div>
          </div>
        </form>
        {status && (
          <div className={`status-banner ${status.includes("Unable") ? "error" : "success"}`}>
            {status}
          </div>
        )}
      </section>

      <section className="months-section">
        {loading ? (
          <div className="loading-state">
            <p>Loading months...</p>
          </div>
        ) : monthSummaries.length === 0 ? (
          <div className="empty-state">
            <h3>No months yet</h3>
            <p>Create your first month to start tracking expenses</p>
          </div>
        ) : (
          <>
            <h2 className="section-title">Your Months ({monthSummaries.length})</h2>
            <div className="months-grid">
              {monthSummaries.map((month) => (
                <Dashboardcard
                  key={month.id}
                  month={month.displayMonth}
                  monthId={month.id}
                  total={month.total}
                  receiptCount={month.receiptCount}
                  onDelete={() => handleDeleteMonth(month.id)}
                />
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

export default Dashboard;

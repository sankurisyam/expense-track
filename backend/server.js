const express = require("express");
const jsonServer = require("json-server");
const cors = require("cors");

const app = express();
const router = jsonServer.router("db.json");
const db = router.db;

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function ensureExpenseIds() {
  const expenses = db.get("expenses").value();
  let updated = false;

  const normalized = expenses.map((expense, expenseIndex) => {
    if (expense.id == null) {
      expense.id = expenseIndex + 1;
      updated = true;
    }

    expense.receipts = Array.isArray(expense.receipts) ? expense.receipts : [];
    expense.receipts = expense.receipts.map((receipt, receiptIndex) => {
      if (receipt.id == null) {
        receipt.id = Date.now() + expense.id * 1000 + receiptIndex;
        updated = true;
      }
      return {
        ...receipt,
        amount: Number(receipt.amount) || 0,
      };
    });

    return expense;
  });

  if (updated) {
    db.set("expenses", normalized).write();
  }
}

ensureExpenseIds();

app.use(cors());
app.use(express.json());

app.get("/expenses", (req, res) => {
  const expenses = db.get("expenses").value();
  res.json(expenses);
});

app.get("/months", (req, res) => {
  const months = db
    .get("expenses")
    .value()
    .map((expense) => ({ id: expense.id, month: expense.month }));
  res.json(months);
});

app.get("/months/:id", (req, res) => {
  const monthId = parseId(req.params.id);
  if (!monthId) {
    return res.status(400).json({ message: "Invalid month ID" });
  }

  const month = db.get("expenses").find({ id: monthId }).value();
  if (!month) {
    return res.status(404).json({ message: "Month not found" });
  }

  res.json({ id: month.id, month: month.month });
});

app.post("/months", (req, res) => {
  const month = req.body.month;

  if (!month) {
    return res.status(400).json({ message: "month is required" });
  }

  const existing = db.get("expenses").find({ month }).value();
  if (existing) {
    return res.status(409).json({ message: "Month already exists" });
  }

  const newExpense = {
    id: Date.now(),
    month,
    receipts: req.body.receipts || [],
  };

  db.get("expenses").push(newExpense).write();
  res.status(201).json(newExpense);
});

app.patch("/months/:id", (req, res) => {
  const monthId = Number(req.params.id);
  const existing = db.get("expenses").find({ id: monthId }).value();

  if (!existing) {
    return res.status(404).json({ message: "Month not found" });
  }

  const updated = db
    .get("expenses")
    .find({ id: monthId })
    .assign({ month: req.body.month || existing.month })
    .write();

  res.json(updated);
});

app.delete("/months/:id", (req, res) => {
  const monthId = Number(req.params.id);
  const removed = db.get("expenses").remove({ id: monthId }).write();

  if (!removed || removed.length === 0) {
    return res.status(404).json({ message: "Month not found" });
  }

  res.json({ message: "Month deleted" });
});

app.get("/receipts/:id", (req, res) => {
  const receiptId = parseId(req.params.id);
  if (!receiptId) {
    return res.status(400).json({ message: "Invalid receipt ID" });
  }

  let foundReceipt = null;

  db.get("expenses")
    .value()
    .forEach((expense) => {
      const receipt = (expense.receipts || []).find((r) => r.id === receiptId);
      if (receipt) {
        foundReceipt = { ...receipt, month: expense.month, monthId: expense.id };
      }
    });

  if (!foundReceipt) {
    return res.status(404).json({ message: "Receipt not found" });
  }

  res.json(foundReceipt);
});

app.get("/receipts", (req, res) => {
  const monthId = req.query.monthId ? Number(req.query.monthId) : null;
  const expenses = db.get("expenses").value();

  const receipts = expenses.flatMap((expense) =>
    (expense.receipts || []).map((receipt) => ({
      ...receipt,
      month: expense.month,
      monthId: expense.id,
    }))
  );

  if (monthId) {
    return res.json(receipts.filter((receipt) => receipt.monthId === monthId));
  }

  res.json(receipts);
});

app.post("/receipts", (req, res) => {
  const monthId = parseId(req.body.monthId);

  if (!monthId) {
    return res
      .status(400)
      .json({ message: "monthId is required for a receipt" });
  }

  const expense = db.get("expenses").find({ id: monthId }).value();
  if (!expense) {
    return res.status(404).json({ message: "Month not found" });
  }

  const newReceipt = {
    id: Date.now(),
    description: req.body.description || "",
    amount: req.body.amount || 0,
    category: req.body.category || "General",
    timestamp: new Date().toISOString(),
  };

  db.get("expenses")
    .find({ id: monthId })
    .get("receipts")
    .push(newReceipt)
    .write();

  res.status(201).json({ ...newReceipt, month: expense.month, monthId });
});

app.patch("/receipts/:id", (req, res) => {
  const receiptId = parseId(req.params.id);
  if (!receiptId) {
    return res.status(400).json({ message: "Invalid receipt ID" });
  }

  let updated = null;
  let parentExpense = null;

  db.get("expenses")
    .value()
    .forEach((expense) => {
      const receipt = (expense.receipts || []).find((r) => r.id === receiptId);
      if (receipt) {
        updated = db
          .get("expenses")
          .find({ id: expense.id })
          .get("receipts")
          .find({ id: receiptId })
          .assign({
            description: req.body.description ?? receipt.description,
            amount: req.body.amount != null ? Number(req.body.amount) : receipt.amount,
            category: req.body.category ?? receipt.category,
            timestamp: receipt.timestamp,
          })
          .write();
        parentExpense = expense;
      }
    });

  if (!updated) {
    return res.status(404).json({ message: "Receipt not found" });
  }

  res.json({ ...updated, month: parentExpense.month, monthId: parentExpense.id });
});

app.delete("/receipts/:id", (req, res) => {
  const receiptId = parseId(req.params.id);
  if (!receiptId) {
    return res.status(400).json({ message: "Invalid receipt ID" });
  }

  let removed = false;

  db.get("expenses")
    .value()
    .forEach((expense) => {
      const result = db
        .get("expenses")
        .find({ id: expense.id })
        .get("receipts")
        .remove({ id: receiptId })
        .write();

      if (result.length > 0) {
        removed = true;
      }
    });

  if (!removed) {
    return res.status(404).json({ message: "Receipt not found" });
  }

  res.json({ message: "Receipt deleted" });
});

app.get("/preferences", (req, res) => {
  const preferences = db.get("preferences").value();
  res.json(preferences);
});

app.patch("/preferences", (req, res) => {
  const updated = db.get("preferences").assign(req.body).write();
  res.json(updated);
});

const PORT = 3001;

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
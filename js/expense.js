// Default date = today
document.addEventListener("DOMContentLoaded", () => {
  const dateInput = document.getElementById("date");
  if (dateInput) {
    dateInput.valueAsDate = new Date();
  }

  // Load accounts (Cash + Banks + Cards)
  apiGet("getAccounts").then(accounts => {
    const sel = document.getElementById("account");
    sel.innerHTML = "";
    accounts.forEach(a => {
      const opt = document.createElement("option");
      opt.value = a.name;
      opt.textContent = a.name;
      sel.appendChild(opt);
    });
  });
});

// Save expense
function saveExpense() {
  const data = {
    date: document.getElementById("date").value,
    category: document.getElementById("category").value,
    amount: document.getElementById("amount").value,
    account: document.getElementById("account").value
  };

  if (!data.amount || data.amount <= 0) {
    alert("Please enter amount");
    return;
  }

  apiPost("addExpense", data).then(res => {
    if (res.status === "OK") {
      alert("Expense Saved");
      document.getElementById("amount").value = "";
      document.getElementById("category").value = "";
    } else {
      alert("Error saving expense");
    }
  });
}

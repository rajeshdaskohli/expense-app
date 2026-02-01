document.addEventListener("DOMContentLoaded", () => {
  apiGet("getDashboard").then(d => {
    if (d.error) {
      document.getElementById("summary").innerText = d.error;
      return;
    }

    document.getElementById("summary").innerHTML = `
      <p><b>Cash Used:</b> ₹${d.cashUsed}</p>
      <p><b>Bank Used:</b> ₹${d.bankUsed}</p>
      <p><b>Credit Used:</b> ₹${d.creditUsed}</p>
    `;
  });
});

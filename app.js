(function() {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
})();
    
    const API_URL = "https://script.google.com/macros/s/AKfycbxGwFBHXOgUTwgconAWDF0qZXPJwxtHc-TFwv-2Q_wHcZcGJtNg_i5JdNydifhP3BFBBA/exec";
    let db = null;
    let curPage = 0;
    const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(n) || 0);

    setInterval(() => { if (curPage === 0) refreshData(); }, 30000);
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === 'visible') refreshData(); });

    // Initialize Theme & Persistence
    window.onload = () => {
      const savedTheme = localStorage.getItem('theme') || 'dark';
      document.documentElement.setAttribute('data-theme', savedTheme);
      updateThemeUI(savedTheme);
      showPage(0);
      registerSW();
    };

    function registerSW() {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./service-worker.js')
          .then(() => console.log("Service Worker Registered"))
          .catch(err => console.log("Service Worker Error:", err));
      }
    }
    
    function toggleMenu() { document.getElementById('settingsMenu').classList.toggle('show'); }
    window.onclick = (e) => { if (!e.target.matches('.material-icons-round')) document.getElementById('settingsMenu').classList.remove('show'); };

    function toggleTheme() {
      let h = document.documentElement;
      let newTheme = h.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      h.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      updateThemeUI(newTheme);
    }

    function updateThemeUI(theme) {
      const icon = document.getElementById('themeIcon');
      const text = document.getElementById('themeText');
      icon.innerText = theme === 'dark' ? 'light_mode' : 'dark_mode';
      text.innerText = theme === 'dark' ? 'Light Mode' : 'Dark Mode';
    }

    async function showPage(idx) {
      curPage = idx;
      const titles = ["EXPENSE PRO", "TRANSFER", "NEW ENTRY", "BILLS", "HISTORY"];
      document.getElementById('headerTitle').innerText = titles[idx];
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      const pages = ['pageDashboard', 'pageFund', 'pageEntry', 'pageBills', 'pageHistory'];
      const targetPage = document.getElementById(pages[idx]);
      if(targetPage) targetPage.classList.add('active');
      document.querySelectorAll('.nav-item')[idx].classList.add('active');
      if(idx === 0 || idx === 4) {
        await refreshData();
      } else if(db) {
        fillDropdowns(); 
        if(idx === 1) updateFundSources();
        if(idx === 3) updateBillTarget();
      }
    }

    async function refreshData() {
  const sBtn = document.getElementById('sBtn');
  if(sBtn) sBtn.classList.add('spinning');

  // 1. मेमोरी से पुराना डेटा तुरंत उठाएं ताकि 0 न दिखे
  const cached = localStorage.getItem('app_db_cache');
  if(cached && !db) {
    db = JSON.parse(cached);
    updateUI(); 
  }

  // 2. अब सर्वर से नया डेटा मंगाएं
  try {
    const res = await fetch(API_URL, { method: "POST", body: JSON.stringify({action: "getDashboard"}) }).then(r => r.json());
    if(res.ok) { 
      db = res; 
      localStorage.setItem('app_db_cache', JSON.stringify(res)); // भविष्य के लिए सेव करें
      updateUI(); 
    }
  } catch(e) { console.error("Sync Failed"); }
  if(sBtn) sBtn.classList.remove('spinning');
}

    function updateUI() {
      const s = db.summary;
      document.getElementById("sumToday").innerText = fmt(s.todayExp);
      document.getElementById("sumMonth").innerText = fmt(s.monthExp);
      document.getElementById("sumFund").innerText = fmt(s.monthFund);
      document.getElementById("sumWallet").innerText = fmt(db.walletBal);

      document.getElementById("catGrid").innerHTML = db.categories.map(c => `
        <div class="cat-item"><div>${c.icon}</div><b>${c.name}</b><small style="color:var(--primary); font-size:10px;">${fmt(s.catTotals[c.name.toLowerCase().trim()] || 0)}</small></div>
      `).join("");

      const getSum = (arr) => arr.reduce((acc, i) => acc + (Number(i.val) || Number(i.emi) || 0), 0);

      // Banks
      document.getElementById("bankSub").innerText = fmt(getSum(db.banks));
      document.getElementById("bankList").innerHTML = db.banks.map(b => `
        <div class="row">
          <div class="meta"><b>${b.name}</b><small>Balance</small></div>
          <b class="${b.val < 0 ? 'val-neg' : 'val-pos'}">${fmt(b.val)}</b>
        </div>`).join("");

      // Fix 3: Credit Card Color Coding (Red if > 0, Green if 0)
      document.getElementById("cardSub").innerText = fmt(getSum(db.cards));
      document.getElementById("cardList").innerHTML = db.cards.map(c => `
        <div class="row">
          <div class="meta"><b>${c.name}</b><small>Outstanding</small></div>
          <b class="${Number(c.val) > 0 ? 'val-neg' : 'val-pos'}">${fmt(c.val)}</b>
        </div>`).join("");

      // Fix 5: Loans & EMI with Status
      document.getElementById("loanSub").innerText = fmt(getSum(db.loans));
      document.getElementById("loanList").innerHTML = db.loans.map(l => {
        const isPaid = l.status === 'Paid';
        return `
        <div class="row">
          <div class="meta">
            <b>${l.name}</b>
            <small>Monthly EMI</small>
            <span class="status-badge ${isPaid?'bg-green':'bg-red'}">${isPaid?'PAID':'UNPAID'}</span></b>
          </div>
          <b class="val-neg">${fmt(l.val)}</b>
        </div>`;
      }).join("");

    const historyContainer = document.getElementById("fullHistory");
      if(historyContainer && db.summary.recentTrans) {
        db.summary.recentTrans.sort((a,b)=>{
  if(new Date(b.date)-new Date(a.date)!==0){
    return new Date(b.date)-new Date(a.date);
  }
  return a.type==="Add Fund"?1:-1;
});
        historyContainer.innerHTML = db.summary.recentTrans.map(t => `<div class="row"><div class="meta"><b>${t.name} <small style="opacity:0.5;">(${t.category})</small></b><small>${t.date}</small></div><b class="${t.type==='Income' || t.type==='Add Fund' ? 'val-pos' : 'val-neg'}">${t.type==='Income' || t.type==='Add Fund' ? '+' : '-'}${fmt(t.amount)}</b></div>`).join("");
      }
      if(curPage === 0) fillDropdowns();
    }

    function fillDropdowns() {
      const opt = (list, key) => list.map(i => `<option value="${i[key]}">${i[key]}</option>`).join("");
      document.getElementById("expBank").innerHTML = opt(db.banks, "name");
      document.getElementById("expCard").innerHTML = opt(db.cards, "name");
      document.getElementById("payFrom").innerHTML = `<option value="Wallet">Digital Wallet</option>` + opt(db.banks, "name");
      document.getElementById("expCat").innerHTML = db.categories.map(c => `<option value="${c.name}">${c.icon} ${c.name}</option>`).join("");
      updateBillTarget();
    }
    // Fix 5: Auto-fill EMI Amount
    function autoFillEmi() {
        const type = document.getElementById("billType").value;
        const selectedName = document.getElementById("payTo").value;
        if(type === 'loan') {
            const loan = db.loans.find(l => l.name === selectedName);
            if(loan) document.getElementById("payAmt").value = loan.val;
        } else {
            document.getElementById("payAmt").value = "";
        }
    }

    function updateBillTarget() {
      const type = document.getElementById("billType").value;
      const list = (type === 'card') ? db.cards : db.loans;
      document.getElementById("payTo").innerHTML = list.map(i => `<option value="${i.name}">${i.name}</option>`).join("");
      autoFillEmi();
    }

    function updateFundSources() {
      const dest = document.getElementById("targetType").value;
      const targetBankDiv = document.getElementById("divTargetBank");
      let options = '<option value="Others">💳 Other/Salary Source</option>';
      
      if(dest === 'Wallet') {
        targetBankDiv.style.display = "none";
        options += db.banks.filter(b=>b.name!=='Wallet' && b.name!=='Cash').map(b=>`<option value="${b.name}">🏦 From ${b.name}</option>`).join("");
      } else {
        targetBankDiv.style.display = "block";
        document.getElementById("targetBankName").innerHTML = db.banks.filter(b=>b.name!=='Wallet' && b.name!=='Cash').map(b=>`<option value="${b.name}">${b.name}</option>`).join("");
        options += '<option value="Wallet">👛 From Digital Wallet</option>';
        options += '<option value="Cash">💵 From Cash Hand</option>';
      }
      document.getElementById("fundSource").innerHTML = options;
    }

    async function saveTrans(type) {
      const btn = event.target;
      const originalText = btn.innerText;
      let p = { action: "save" };

      if (type === 'entry') {
        let m = document.getElementById("payMode").value;
        p.type = m; 
        p.name = (m === 'Digital Wallet') ? 'Wallet' : (m === 'bank' ? document.getElementById("expBank").value : document.getElementById("expCard").value);
        p.amount = document.getElementById("expAmt").value; 
        p.category = document.getElementById("expCat").value; 
        p.remark = document.getElementById("expRem").value;
      } 
      else if (type === 'fund') {
        p.type = "Add Fund"; 
        p.amount = document.getElementById("fundAmt").value; 
        p.source = document.getElementById("fundSource").value;
        p.name = (document.getElementById("targetType").value === 'Wallet') ? 'Wallet' : document.getElementById("targetBankName").value;
        p.remark = "Transfer from " + p.source;

        // Fix 4: Bypass balance check for Income
        if(p.source === 'Others') p.type = 'Income'; 
      } 
      // saveTrans फंक्शन के अंदर 'pay' (Bills) वाले हिस्से को ऐसे बदलें:
      else if (type === 'pay') {
        p.type = "Bill Pay"; 
        p.name = document.getElementById("payTo").value; 
        p.amount = document.getElementById("payAmt").value;
        let fromAcc = document.getElementById("payFrom").value;
        p.remark = "Paid from " + fromAcc;
        p.billType = document.getElementById("billType").value;

        // 2. बैलेंस चेक करें
        let currentBalance = 0;
        if (fromAcc === 'Wallet') {
          currentBalance = Number(db.walletBal);
        } else {
          let bank = db.banks.find(b => b.name === fromAcc);
          currentBalance = bank ? Number(bank.val) : 0;
        }

        // 3. अगर बैलेंस कम है, तो थोड़ा रुक कर (ताकि प्रोसेसिंग दिखे) एरर दिखाएं
        if (Number(p.amount) > currentBalance) {
          setTimeout(() => {
            btn.innerText = originalText; // बटन वापस ठीक करें
            notify('Failed', `Insufficient Balance in ${fromAcc}!`, 'error_outline', '#ef4444');
          }, 2000); // आधा सेकंड की प्रोसेसिंग दिखाएगा
          return;
        }

        // 4. Already Paid Check
        if(p.billType === 'loan') {
            const loan = db.loans.find(l => l.name === p.name);
            if(loan && loan.status === 'Paid') {
                btn.innerText = originalText;
                return notify('Already Paid', 'इस महीने की EMI पहले ही भरी जा चुकी है!', 'info', '#38bdf8');
            }
        }
      }
      if (!p.amount || p.amount <= 0) {
        return notify('Alert', 'Please enter a valid amount', 'warning', '#f59e0b');
      }

      btn.classList.add('loading-btn'); 
      btn.innerText = "PROCESSING...";

      try {
        const response = await fetch(API_URL, { method: "POST", body: JSON.stringify(p) });
        const res = await response.json();
        if (res.ok) {
          notify('Success', 'Transaction recorded successfully!', 'check_circle', '#10b981');
          document.querySelectorAll('.inp').forEach(i => { if(i.type === 'number' || i.type === 'text') i.value = ""; });
          setTimeout(() => { showPage(0); }, 500);
        } else {
          notify('Failed', res.error, 'error_outline', '#ef4444');
        }
      } catch (e) {
        notify('Error', 'Network connection failed!', 'error', '#ef4444');
      } finally {
        btn.classList.remove('loading-btn'); 
        btn.innerText = originalText;
      }
    }

    function notify(title, text, icon, color) {
      document.getElementById('mTitle').innerText = title; document.getElementById('mText').innerText = text;
      const ic = document.getElementById('mIcon'); ic.innerText = icon; ic.style.color = color;
      document.getElementById('modal').style.display = 'flex';
    }
    function closeModal() { document.getElementById('modal').style.display = 'none'; }
    function toggleFields() {
      let m = document.getElementById("payMode").value;
      document.getElementById("divBank").style.display = (m==='bank') ? 'block' : 'none';
      document.getElementById("divCard").style.display = (m==='card') ? 'block' : 'none';
    }
window.addEventListener("load", () => {
  showPage(0);

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js')
      .then(() => console.log("Service Worker Registered"))
      .catch(err => console.log("SW Error:", err));
  }
});

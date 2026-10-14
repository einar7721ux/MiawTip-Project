const donationStorageKey = "miawtipDonations";
const pendingDonationKey = "miawtipPendingDonation";
const profileStorageKey = "miawtipCreatorProfile";
const settingsStorageKey = "miawtipCreatorSettings";

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    console.error(`Tidak dapat membaca data ${key} dari penyimpanan browser.`, error);
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Tidak dapat menyimpan data ${key} di penyimpanan browser.`, error);
    return false;
  }
}

function formatRupiah(amount) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(amount);
}

function formatDate(value) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function getDonations() {
  const donations = readStorage(donationStorageKey, []);
  return Array.isArray(donations) ? donations : [];
}

function addTextCell(row, text) {
  const cell = document.createElement("td");
  cell.textContent = text || "-";
  row.appendChild(cell);
}

function setupDonationForm() {
  const form = document.getElementById("donation-form");
  if (!form) return;

  const pendingDonation = readStorage(pendingDonationKey, null);
  if (pendingDonation) {
    form.elements.supporter.value = pendingDonation.supporter;
    form.elements.amount.value = pendingDonation.amount;
    form.elements.message.value = pendingDonation.message;
    const paymentOption = form.querySelector(`input[name="payment"][value="${pendingDonation.payment}"]`);
    if (paymentOption) paymentOption.checked = true;
  }

  document.querySelectorAll("[data-amount]").forEach((button) => {
    button.addEventListener("click", () => {
      form.elements.amount.value = button.dataset.amount;
    });
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const amount = Number(form.elements.amount.value);
    if (!Number.isFinite(amount) || amount < 1000) {
      form.elements.amount.setCustomValidity("Nominal minimal donasi adalah Rp1.000.");
      form.reportValidity();
      form.elements.amount.setCustomValidity("");
      return;
    }

    const donation = {
      creator: "Einar",
      supporter: form.elements.supporter.value.trim(),
      amount,
      message: form.elements.message.value.trim(),
      payment: form.elements.payment.value,
      date: new Date().toISOString()
    };

    if (!writeStorage(pendingDonationKey, donation)) {
      window.alert("Data donasi tidak dapat disimpan. Periksa pengaturan penyimpanan browser.");
      return;
    }
    window.location.href = "KonfirmasiDonasi.html";
  });
}

function setupConfirmation() {
  if (document.body.dataset.page !== "donation-confirmation") return;

  const pending = readStorage(pendingDonationKey, null);
  const error = document.getElementById("confirmation-error");
  const confirmButton = document.getElementById("confirm-donation");
  if (!pending) {
    error.textContent = "Detail donasi belum tersedia. Silakan isi form donasi terlebih dahulu.";
    confirmButton.disabled = true;
    return;
  }

  document.querySelector('[data-confirm="creator"]').textContent = pending.creator;
  document.querySelector('[data-confirm="supporter"]').textContent = pending.supporter;
  document.querySelector('[data-confirm="amount"]').textContent = formatRupiah(pending.amount);
  document.querySelector('[data-confirm="payment"]').textContent = pending.payment;
  document.querySelector('[data-confirm="message"]').textContent = pending.message || "Tidak ada pesan";

  confirmButton.addEventListener("click", () => {
    const donations = getDonations();
    donations.unshift({ ...pending, id: Date.now() });
    if (!writeStorage("miawtipLastDonation", pending)) {
      error.textContent = "Donasi belum dapat dikonfirmasi. Periksa pengaturan penyimpanan browser lalu coba lagi.";
      return;
    }
    if (!writeStorage(donationStorageKey, donations)) {
      localStorage.removeItem("miawtipLastDonation");
      error.textContent = "Donasi belum dapat dicatat. Periksa pengaturan penyimpanan browser lalu coba lagi.";
      return;
    }
    localStorage.removeItem(pendingDonationKey);
    window.location.href = "ProsesBerhasil.html";
  });
}

function setupSuccessPage() {
  if (document.body.dataset.page !== "donation-success") return;
  const donation = readStorage("miawtipLastDonation", null);
  if (!donation) return;
  document.querySelector('[data-success="amount"]').textContent = formatRupiah(donation.amount);
  document.querySelector('[data-success="creator"]').textContent = donation.creator;
}

function renderDonationRows(rows, donations, columns) {
  rows.replaceChildren();
  if (donations.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = columns;
    cell.className = "empty-state";
    cell.textContent = "Belum ada riwayat donasi.";
    row.appendChild(cell);
    rows.appendChild(row);
    return;
  }

  donations.forEach((donation) => {
    const row = document.createElement("tr");
    addTextCell(row, donation.supporter);
    addTextCell(row, donation.message || "—");
    if (columns === 5) addTextCell(row, donation.payment);
    addTextCell(row, formatDate(donation.date));
    addTextCell(row, formatRupiah(donation.amount));
    rows.appendChild(row);
  });
}

function setupDashboard() {
  if (document.body.dataset.page !== "creator-dashboard") return;
  const donations = getDonations();
  const total = donations.reduce((sum, donation) => sum + Number(donation.amount || 0), 0);
  const supporters = new Map();
  donations.forEach((donation) => {
    supporters.set(donation.supporter, (supporters.get(donation.supporter) || 0) + Number(donation.amount || 0));
  });
  const topSupporters = [...supporters.entries()].sort((a, b) => b[1] - a[1]);

  document.querySelector('[data-dashboard="total"]').textContent = formatRupiah(total);
  document.querySelector('[data-dashboard="count"]').textContent = `${donations.length} dukungan`;
  document.querySelector('[data-dashboard="average"]').textContent = formatRupiah(donations.length ? total / donations.length : 0);
  document.querySelector('[data-dashboard="top"]').textContent = topSupporters[0]?.[0] || "Belum ada";
  document.querySelector('[data-dashboard="top-total"]').textContent = topSupporters[0] ? formatRupiah(topSupporters[0][1]) : "Belum ada dukungan";

  const recent = document.getElementById("dashboard-history");
  if (donations.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 4;
    cell.className = "empty-state";
    cell.textContent = "Belum ada dukungan. Riwayat demo akan muncul setelah donasi dicatat.";
    row.appendChild(cell);
    recent.appendChild(row);
  } else {
    renderDonationRows(recent, donations.slice(0, 5), 4);
  }

  const list = document.getElementById("top-supporters");
  list.replaceChildren();
  if (topSupporters.length === 0) {
    const item = document.createElement("li");
    item.className = "empty-state";
    item.textContent = "Belum ada supporter.";
    list.appendChild(item);
    return;
  }
  topSupporters.slice(0, 5).forEach(([name, amount]) => {
    const item = document.createElement("li");
    const supporter = document.createElement("strong");
    supporter.textContent = name;
    const totalAmount = document.createElement("span");
    totalAmount.textContent = formatRupiah(amount);
    item.append(supporter, totalAmount);
    list.appendChild(item);
  });
}

function setupHistory() {
  if (document.body.dataset.page !== "donation-history") return;
  const donations = getDonations();
  document.getElementById("history-count").textContent = `${donations.length} donasi`;
  renderDonationRows(document.getElementById("full-history"), donations, 5);
}

function setupProfile() {
  if (document.body.dataset.page !== "creator-profile") return;
  const form = document.getElementById("profile-form");
  const savedProfile = readStorage(profileStorageKey, null);
  if (savedProfile) {
    form.elements.name.value = savedProfile.name;
    form.elements.username.value = savedProfile.username;
    form.elements.bio.value = savedProfile.bio || "";
  }
  document.querySelector('[data-profile="username"]').textContent = form.elements.username.value;
  form.elements.username.addEventListener("input", () => {
    document.querySelector('[data-profile="username"]').textContent = form.elements.username.value || "username";
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const profile = {
      name: form.elements.name.value.trim(),
      username: form.elements.username.value.trim(),
      bio: form.elements.bio.value.trim()
    };
    const status = document.getElementById("profile-success");
    status.textContent = writeStorage(profileStorageKey, profile) ? "Profil berhasil disimpan di browser ini." : "Profil gagal disimpan. Periksa penyimpanan browser.";
  });
}

function setupSettings() {
  if (document.body.dataset.page !== "creator-settings") return;
  const form = document.getElementById("settings-form");
  const settings = readStorage(settingsStorageKey, null);
  if (settings) {
    form.elements.notifications.checked = settings.notifications;
    form.elements.bank.value = settings.bank || "";
    form.elements.accountName.value = settings.accountName || "";
    form.elements.accountNumber.value = settings.accountNumber || "";
  }
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const value = {
      notifications: form.elements.notifications.checked,
      bank: form.elements.bank.value.trim(),
      accountName: form.elements.accountName.value.trim(),
      accountNumber: form.elements.accountNumber.value.trim()
    };
    const status = document.getElementById("settings-success");
    status.textContent = writeStorage(settingsStorageKey, value) ? "Pengaturan berhasil disimpan di browser ini." : "Pengaturan gagal disimpan. Periksa penyimpanan browser.";
  });
}

setupDonationForm();
setupConfirmation();
setupSuccessPage();
setupDashboard();
setupHistory();
setupProfile();
setupSettings();

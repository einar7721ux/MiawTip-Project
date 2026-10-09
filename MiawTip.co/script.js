// Data kreator (ganti dengan data dari API / database jika sudah ada)
const creators = [
  { id: 1, name: "candra yahudi", avatar: "🐱" }
];

const list = document.getElementById("creatorList");

function renderCreators() {
  list.innerHTML = "";
  creators.forEach((c) => {
    const li = document.createElement("li");
    li.className = "creator";
    li.innerHTML = `
      <span class="avatar" aria-hidden="true">${c.avatar}</span>
      <button type="button">${c.name}</button>
    `;
    li.querySelector("button").addEventListener("click", () => selectCreator(li, c));
    list.appendChild(li);
  });
}

function selectCreator(el, creator) {
  document.querySelectorAll(".creator").forEach((n) => n.classList.remove("active"));
  el.classList.add("active");
  // TODO: arahkan ke halaman tip kreator
  console.log("Kreator dipilih:", creator.name);
}

// Tombol navbar (ganti href dengan halaman login/daftar asli)
document.getElementById("btnLogin").addEventListener("click", (e) => {
  e.preventDefault();
  alert("Halaman login belum dibuat.");
});
document.getElementById("btnDaftar").addEventListener("click", (e) => {
  e.preventDefault();
  alert("Halaman daftar belum dibuat.");
});

renderCreators();
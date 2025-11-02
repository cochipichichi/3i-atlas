// app.js principal del portal 3I/ATLAS
const views = document.querySelectorAll(".view");
const navBtns = document.querySelectorAll(".nav-btn");
const tblEphemeris = document.getElementById("tblEphemeris");
const frmCalc = document.getElementById("frmCalc");
const inpDistSun = document.getElementById("inpDistSun");
const inpDistEarth = document.getElementById("inpDistEarth");
const calcResult = document.getElementById("calcResult");
const frmLog = document.getElementById("frmLog");
const tblLogs = document.querySelector("#tblLogs tbody");
const btnExportCSV = document.getElementById("btnExportCSV");
const quizBox = document.getElementById("quizBox");
const frmTicket = document.getElementById("frmTicket");
const ticketMsg = document.getElementById("ticketMsg");
const btnTheme = document.getElementById("btnTheme");
const btnInstall = document.getElementById("btnInstall");
let logs = [];
let deferredPrompt = null;

navBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    const view = btn.dataset.view;
    navBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    views.forEach(v => v.classList.remove("visible"));
    document.getElementById(`view-${view}`).classList.add("visible");
  });
});

fetch("./data/ephemeris.json")
  .then(r => r.json())
  .then(data => renderEphemeris(data))
  .catch(() => renderEphemeris([
    { fecha: "2025-10-30", dist_sun: 1.4, dist_earth: 1.9, mag: 13.1 },
    { fecha: "2025-11-15", dist_sun: 1.45, dist_earth: 1.86, mag: 13.3 },
    { fecha: "2025-12-19", dist_sun: 1.6, dist_earth: 1.79, mag: 13.7 }
  ]));

function renderEphemeris(rows) {
  if (!tblEphemeris) return;
  const thead = `<thead>
    <tr>
      <th>Fecha</th>
      <th>Dist. Sol (UA)</th>
      <th>Dist. Tierra (UA)</th>
      <th>Mag</th>
    </tr>
  </thead>`;
  const body = rows.map(r => `<tr>
    <td>${r.fecha}</td>
    <td>${r.dist_sun}</td>
    <td>${r.dist_earth}</td>
    <td>${r.mag}</td>
  </tr>`).join("");
  tblEphemeris.innerHTML = thead + `<tbody>${body}</tbody>`;
}

frmCalc?.addEventListener("submit", e => {
  e.preventDefault();
  const uaSun = parseFloat(inpDistSun.value);
  const uaEarth = parseFloat(inpDistEarth.value);
  const KM_PER_UA = 149597870;
  const kmSun = (uaSun * KM_PER_UA).toLocaleString("es-CL");
  const kmEarth = (uaEarth * KM_PER_UA).toLocaleString("es-CL");
  calcResult.textContent = `🌞 Sol: ${kmSun} km | 🌍 Tierra: ${kmEarth} km`;
});

frmLog?.addEventListener("submit", e => {
  e.preventDefault();
  const date = document.getElementById("logDate").value || new Date().toISOString().slice(0,10);
  const mag = document.getElementById("logMag").value || "-";
  const comment = document.getElementById("logComment").value || "";
  const item = { id: logs.length + 1, date, mag, comment };
  logs.push(item);
  renderLogs();
  frmLog.reset();
});

function renderLogs() {
  if (!tblLogs) return;
  tblLogs.innerHTML = logs.map(item => `
    <tr>
      <td>${item.id}</td>
      <td>${item.date}</td>
      <td>${item.mag}</td>
      <td>${item.comment}</td>
    </tr>
  `).join("");
}

btnExportCSV?.addEventListener("click", () => {
  if (!logs.length) return;
  const header = "id,fecha,mag,comentario\n";
  const rows = logs.map(l => `${l.id},${l.date},${l.mag},"${l.comment.replace(/"/g, '""')}"`).join("\n");
  const blob = new Blob([header + rows], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "observaciones-3i-atlas.csv";
  a.click();
  URL.revokeObjectURL(url);
});

// Quiz
if (quizBox) {
  const questions = [
    { q: "¿Qué tipo de objeto es 3I/ATLAS?", a: ["Cometa interestelar", "Asteroide del cinturón principal", "Satélite de Júpiter"], correct: 0 },
    { q: "¿En qué año se descubrió?", a: ["2019", "2025", "2030"], correct: 1 },
    { q: "¿Qué significa la 'I' en 3I?", a: ["Inner (interior)", "Interstellar (interestelar)", "Ice (hielo)"], correct: 1 }
  ];
  quizBox.innerHTML = questions.map((qu, idx) => `
    <div class="q">
      <p><strong>${idx+1}.</strong> ${qu.q}</p>
      ${qu.a.map((opt, oidx) => `
        <label>
          <input type="radio" name="q${idx}" value="${oidx}" />
          ${opt}
        </label>
      `).join("")}
    </div>
  `).join("") + `<button id="btnQuizCheck" class="btn-primary">Revisar respuestas</button><p id="quizMsg"></p>`;
  quizBox.querySelector("#btnQuizCheck").addEventListener("click", () => {
    let score = 0;
    questions.forEach((qu, idx) => {
      const checked = quizBox.querySelector(`input[name="q${idx}"]:checked`);
      if (checked && Number(checked.value) === qu.correct) score++;
    });
    quizBox.querySelector("#quizMsg").textContent = `💡 Tu puntaje: ${score} / ${questions.length}`;
  });
}

// Ticket
frmTicket?.addEventListener("submit", e => {
  e.preventDefault();
  ticketMsg.textContent = "✅ Ticket recibido. Puedes enviarlo por correo o guardarlo en tu Sheets.";
  frmTicket.reset();
});

// Tema
btnTheme?.addEventListener("click", () => {
  document.body.classList.toggle("dark");
});

// PWA
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  btnInstall.style.display = "inline-flex";
});

btnInstall?.addEventListener("click", async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
});

// 3I/ATLAS PRO
const GSCRIPT_URL = "https://script.google.com/macros/s/TU_ID_AQUI/exec"; // 👈 pon tu URL
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
const topbar = document.querySelector(".topbar");
const chartCanvas = document.getElementById("chartMag");
const badgeText = document.getElementById("badgeText");
const admTotal = document.getElementById("admTotal");
const admTickets = document.getElementById("admTickets");
const admBadges = document.getElementById("admBadges");

let logs = [];
let tickets = 0;
let badges = 0;
let deferredPrompt = null;
let clickSound = null;
let map = null;
let orbitScene = null;

function getUA(){ return navigator.userAgent || "desconocido"; }
async function getGeo(){
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve({ geo_ok: false });
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ geo_ok: true, lat: pos.coords.latitude, lon: pos.coords.longitude, acc: pos.coords.accuracy }),
      () => resolve({ geo_ok: false }),
      { enableHighAccuracy: true, timeout: 4000 }
    );
  });
}

// navegación
navBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    const view = btn.dataset.view;
    navBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    views.forEach(v => v.classList.remove("visible"));
    document.getElementById(`view-${view}`).classList.add("visible");
    playClick();

    if (view === "mapa") initMap();
    if (view === "orbita") initOrbit();
  });
});

// scroll header
window.addEventListener("scroll", () => {
  if (window.scrollY > 20) topbar.classList.add("scrolled");
  else topbar.classList.remove("scrolled");
});

// cargar ephemeris
fetch("./data/ephemeris.json")
  .then(r => r.json())
  .then(data => renderEphemeris(data))
  .catch(() => renderEphemeris([
    { fecha: "2025-10-30", dist_sun: 1.4, dist_earth: 1.9, mag: 13.1 },
    { fecha: "2025-11-15", dist_sun: 1.45, dist_earth: 1.86, mag: 13.3 },
    { fecha: "2025-12-19", dist_sun: 1.6, dist_earth: 1.79, mag: 13.7 }
  ]));

function renderEphemeris(rows){
  if(!tblEphemeris) return;
  const head = `<thead><tr><th>Fecha</th><th>Sol (UA)</th><th>Tierra (UA)</th><th>Mag</th></tr></thead>`;
  const body = rows.map(r => `<tr><td>${r.fecha}</td><td>${r.dist_sun}</td><td>${r.dist_earth}</td><td>${r.mag}</td></tr>`).join("");
  tblEphemeris.innerHTML = head + `<tbody>${body}</tbody>`;
}

// calculadora
frmCalc?.addEventListener("submit", e => {
  e.preventDefault();
  const uaSun = parseFloat(inpDistSun.value);
  const uaEarth = parseFloat(inpDistEarth.value);
  const KM = 149597870;
  calcResult.textContent = `🌞 Sol: ${(uaSun*KM).toLocaleString("es-CL")} km | 🌍 Tierra: ${(uaEarth*KM).toLocaleString("es-CL")} km`;
  playClick();
});

// registro
frmLog?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const date = document.getElementById("logDate").value || new Date().toISOString().slice(0,10);
  const mag = document.getElementById("logMag").value || "-";
  const comment = document.getElementById("logComment").value || "";
  const item = { id: logs.length + 1, date, mag, comment };
  logs.push(item);
  renderLogs();
  frmLog.reset();
  playClick();
  award("observacion");

  const geo = await getGeo();
  const ua = getUA();
  const payload = {
    tipo: "observacion",
    fecha: date,
    mag,
    comentario: comment,
    user: "Alumno/Docente",
    origen: "3i-atlas-web",
    ua,
    geo_ok: geo.geo_ok,
    lat: geo.lat || null,
    lon: geo.lon || null,
    acc: geo.acc || null
  };
  try{
    await fetch(GSCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  }catch(err){
    console.warn("No se pudo enviar a Sheets", err);
  }
  // si hay mapa, añade marker local
  if (map && geo.geo_ok) {
    L.marker([geo.lat, geo.lon]).addTo(map).bindPopup(`Obs ${date} mag ${mag}`);
  }
  refreshAdmin();
});

function renderLogs(){
  if(!tblLogs) return;
  tblLogs.innerHTML = logs.map(it => `
    <tr>
      <td>${it.id}</td>
      <td>${it.date}</td>
      <td>${it.mag}</td>
      <td>${it.comment}</td>
    </tr>
  `).join("");
}

btnExportCSV?.addEventListener("click", () => {
  if(!logs.length) return;
  const header = "id,fecha,mag,comentario\n";
  const rows = logs.map(l => `${l.id},${l.date},${l.mag},"${l.comment.replace(/"/g,'""')}"`).join("\n");
  const blob = new Blob([header+rows], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "observaciones-3i-atlas.csv";
  a.click();
  URL.revokeObjectURL(url);
  playClick();
});

// quiz
if (quizBox) {
  const questions = [
    { q: "¿Qué significa la 'I' en 3I/ATLAS?", a: ["Interestelar", "Interior", "Inercial"], correct: 0 },
    { q: "¿Quién lo detectó?", a: ["ATLAS", "Gaia", "JWST"], correct: 0 },
    { q: "¿Qué trayectoria tiene?", a: ["Hiperbólica", "Circular", "Elíptica"], correct: 0 }
  ];
  quizBox.innerHTML = questions.map((qu, idx) => `
    <div class="q">
      <p><strong>${idx+1}.</strong> ${qu.q}</p>
      ${qu.a.map((opt, oidx) => `
        <label><input type="radio" name="q${idx}" value="${oidx}" /> ${opt}</label>
      `).join("")}
    </div>
  `).join("") + `<button id="btnQuizCheck" class="btn-primary micro">Revisar</button><p id="quizMsg"></p>`;

  quizBox.querySelector("#btnQuizCheck").addEventListener("click", () => {
    let score = 0;
    questions.forEach((qu, idx) => {
      const checked = quizBox.querySelector(`input[name="q${idx}"]:checked`);
      if (checked && Number(checked.value) === qu.correct) score++;
    });
    quizBox.querySelector("#quizMsg").textContent = `💡 Tu puntaje: ${score} / ${questions.length}`;
    if (score === questions.length) award("quiz");
    playClick();
    refreshAdmin();
  });
}

// tickets
frmTicket?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const q1 = document.getElementById("t1").value.trim();
  const q2 = document.getElementById("t2").value.trim();
  const q3 = document.getElementById("t3").value.trim();
  ticketMsg.textContent = "✅ Ticket recibido. Guardando en Sheets...";
  frmTicket.reset();
  playClick();
  tickets++;

  const geo = await getGeo();
  const ua = getUA();

  const payload = {
    tipo: "ticket",
    q1, q2, q3,
    user: "Alumno/PIE/Liceo San Nicolás",
    origen: "3i-atlas-web",
    ua,
    geo_ok: geo.geo_ok,
    lat: geo.lat || null,
    lon: geo.lon || null,
    acc: geo.acc || null
  };
  try {
    await fetch(GSCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    ticketMsg.textContent = "✅ Ticket guardado y enviado al docente.";
  } catch (err) {
    ticketMsg.textContent = "⚠️ Ticket recibido pero no se pudo enviar al Sheets.";
  }

  // mapa
  if (map && geo.geo_ok) {
    L.circleMarker([geo.lat, geo.lon], {radius:6,color:"#facc15"}).addTo(map).bindPopup("🎟️ Ticket enviado");
  }
  award("ticket");
  refreshAdmin();
});

// premios simples
function award(kind){
  let current = JSON.parse(localStorage.getItem("atlasAwards") || "[]");
  if (!current.includes(kind)) current.push(kind);
  localStorage.setItem("atlasAwards", JSON.stringify(current));
  updateBadgesUI(current);
}
function updateBadgesUI(list){
  if (!badgeText) return;
  const names = {
    "observacion": "👁️ Observador solar",
    "quiz": "🧪 Astro-quiz",
    "ticket": "🎟️ Reportero espacial"
  };
  const txt = list.map(k => names[k] || k).join(" · ");
  badgeText.textContent = txt || "Sin medallas aún";
  badges = list.length;
}
function refreshAdmin(){
  if (admTotal) admTotal.textContent = logs.length.toString();
  if (admTickets) admTickets.textContent = tickets.toString();
  if (admBadges) admBadges.textContent = badges.toString();
}

// tema
btnTheme?.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  playClick();
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
  playClick();
});

// sonido
try {
  clickSound = new Audio("./assets/sounds/click.mp3");
  clickSound.volume = 0.2;
} catch (err) {
  clickSound = null;
}
function playClick(){
  if (clickSound) {
    clickSound.currentTime = 0;
    clickSound.play().catch(()=>{});
  }
  if (navigator.vibrate) navigator.vibrate(18);
}

// mapa
function initMap(){
  if (map) return;
  map = L.map("map").setView([-36.617, -72.095], 5); // Ñuble aprox
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap"
  }).addTo(map);
}

// órbita 3D simple con Three.js
function initOrbit(){
  if (orbitScene) return;
  const container = document.getElementById("orbitContainer");
  const width = container.clientWidth;
  const height = container.clientHeight;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, width/height, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);
  container.appendChild(renderer.domElement);

  // sol
  const sunGeom = new THREE.SphereGeometry(1.1, 32, 32);
  const sunMat = new THREE.MeshBasicMaterial({ color: 0xffd166 });
  const sun = new THREE.Mesh(sunGeom, sunMat);
  scene.add(sun);

  // órbita (trayectoria)
  const points = [];
  for (let i=-40;i<40;i++){
    points.push(new THREE.Vector3(i*0.08, Math.tanh(i*0.07)*1.4, 0));
  }
  const orbitGeom = new THREE.BufferGeometry().setFromPoints(points);
  const orbitMat = new THREE.LineBasicMaterial({ color: 0x38bdf8 });
  const orbitLine = new THREE.Line(orbitGeom, orbitMat);
  scene.add(orbitLine);

  // cometa
  const cometGeom = new THREE.SphereGeometry(0.12, 16, 16);
  const cometMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const comet = new THREE.Mesh(cometGeom, cometMat);
  scene.add(comet);

  camera.position.z = 6;

  function animate(){
    requestAnimationFrame(animate);
    const t = Date.now() * 0.0005;
    const idx = Math.floor((t*40)%points.length);
    const p = points[idx];
    comet.position.set(p.x, p.y, p.z);
    orbitLine.rotation.y += 0.0004;
    renderer.render(scene, camera);
  }
  animate();
  orbitScene = scene;
}

// gráfico
if (chartCanvas) {
  const ctx = chartCanvas.getContext("2d");
  const data = [13.1, 13.3, 13.5, 13.7];
  function draw(){
    ctx.clearRect(0,0,chartCanvas.width,chartCanvas.height);
    ctx.beginPath();
    ctx.moveTo(20, chartCanvas.height - data[0]*5);
    for(let i=1;i<data.length;i++){
      ctx.lineTo(20 + i*90, chartCanvas.height - data[i]*5);
    }
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#38bdf8";
    for(let i=0;i<data.length;i++){
      ctx.beginPath();
      ctx.arc(20 + i*90, chartCanvas.height - data[i]*5, 4, 0, Math.PI*2);
      ctx.fill();
    }
    requestAnimationFrame(draw);
  }
  draw();
}

// cargar medallas previas
updateBadgesUI(JSON.parse(localStorage.getItem("atlasAwards") || "[]"));
refreshAdmin();


async function fetchObservaciones() {
  // intenta desde Sheets (producción)
  if (typeof ATLAS_CONFIG !== "undefined" && ATLAS_CONFIG.MODE === "production" && ATLAS_CONFIG.GSCRIPT_URL) {
    try {
      const res = await fetch(ATLAS_CONFIG.GSCRIPT_URL + "?mode=observaciones");
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn("No se pudo obtener desde Sheets, usando fallback...", err);
    }
  }
  // fallback a JSON local
  if (typeof ATLAS_CONFIG !== "undefined" && ATLAS_CONFIG.FALLBACK_JSON) {
    const res = await fetch(ATLAS_CONFIG.FALLBACK_JSON);
    return await res.json();
  }
  return [];
}

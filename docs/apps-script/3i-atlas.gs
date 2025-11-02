// docs/apps-script/3i-atlas.gs
// Guarda observaciones, tickets y ubicación + user agent

const SHEET_OBS = "observaciones";
const SHEET_TICKETS = "tickets";
const DEST_EMAIL = "tucorreo@tu-liceo.cl";  // 👈 cámbialo

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    if (data.tipo === "observacion") {
      return saveObservacion(data);
    } else if (data.tipo === "ticket") {
      return saveTicket(data);
    } else {
      return out({ ok: false, msg: "tipo no reconocido" });
    }
  } catch (err) {
    return out({ ok: false, error: err.message });
  }
}

function saveObservacion(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SHEET_OBS);
  sh.appendRow([
    new Date(),
    data.fecha || "",
    data.mag || "",
    data.comentario || "",
    data.user || "",
    data.origen || "3i-atlas",
    data.ua || "",
    data.geo_ok || false,
    data.lat || "",
    data.lon || "",
    data.acc || ""
  ]);
  if (DEST_EMAIL) {
    GmailApp.sendEmail(
      DEST_EMAIL,
      "🛰️ Nueva observación 3I/ATLAS",
      JSON.stringify(data, null, 2)
    );
  }
  return out({ ok: true });
}

function saveTicket(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SHEET_TICKETS);
  sh.appendRow([
    new Date(),
    data.q1 || "",
    data.q2 || "",
    data.q3 || "",
    data.user || "",
    data.origen || "3i-atlas",
    data.ua || "",
    data.geo_ok || false,
    data.lat || "",
    data.lon || "",
    data.acc || ""
  ]);
  if (DEST_EMAIL) {
    GmailApp.sendEmail(
      DEST_EMAIL,
      "🎟️ Ticket 3I/ATLAS",
      JSON.stringify(data, null, 2)
    );
  }
  return out({ ok: true });
}

function out(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader("Access-Control-Allow-Origin", "*");
}

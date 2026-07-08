import { database } from "./firebase-config.js";

import {
  ref,
  set,
  get,
  child,
  remove
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";

function clean(value) {
  return value ? value.trim() : "";
}

function cleanTrackingNumber(value) {
  return clean(value).toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function generateTrackingNumber() {
  return "CFS" + Date.now().toString().slice(-8);
}

function getValue(id) {
  const element = document.getElementById(id);
  return element ? clean(element.value) : "";
}

function setValue(id, value) {
  const element = document.getElementById(id);
  if (element) element.value = value || "";
}

function createHistoryEntry(status, location, note) {
  return {
    status: status || "Shipment Created",
    location: location || "",
    note: note || "Shipment update saved.",
    date: new Date().toISOString()
  };
}

window.saveShipment = async function () {
  let trackingNumber = cleanTrackingNumber(getValue("trackingNumber"));

  if (!trackingNumber) {
    trackingNumber = generateTrackingNumber();
    setValue("trackingNumber", trackingNumber);
  }

  const status = getValue("status") || "Shipment Created";
  const currentLocation = getValue("currentLocation");
  const updateNote = getValue("updateNote");

  const shipment = {
    trackingNumber,
    senderName: getValue("senderName"),
    senderPhone: getValue("senderPhone"),
    senderEmail: getValue("senderEmail"),
    senderAddress: getValue("senderAddress"),

    receiverName: getValue("receiverName"),
    receiverPhone: getValue("receiverPhone"),
    receiverEmail: getValue("receiverEmail"),
    receiverAddress: getValue("receiverAddress"),

    origin: getValue("origin"),
    destination: getValue("destination"),
    currentLocation,
    updateNote,

    weight: getValue("weight"),
    description: getValue("description"),
    deliveryDate: getValue("deliveryDate"),
    status,
    updatedAt: new Date().toISOString()
  };

  if (!shipment.senderName || !shipment.receiverName || !shipment.origin || !shipment.destination) {
    alert("Sender name, receiver name, origin, and destination are required.");
    return;
  }

  const shipmentRef = ref(database, "shipments/" + trackingNumber);
  const snapshot = await get(child(ref(database), "shipments/" + trackingNumber));

  let history = [];

  if (snapshot.exists()) {
    const oldShipment = snapshot.val();
    history = Array.isArray(oldShipment.history) ? oldShipment.history : [];
  } else {
    shipment.createdAt = new Date().toISOString();
  }

  history.push(createHistoryEntry(status, currentLocation, updateNote));

  shipment.history = history;

  await set(shipmentRef, {
    ...(snapshot.exists() ? snapshot.val() : {}),
    ...shipment
  });

  alert("Shipment saved successfully.");
  loadShipments();
};

window.loadShipments = async function () {
  const shipmentList = document.getElementById("shipmentList");
  if (!shipmentList) return;

  const snapshot = await get(child(ref(database), "shipments"));

  if (!snapshot.exists()) {
    shipmentList.innerHTML = "No shipment available.";
    return;
  }

  const shipments = snapshot.val();
  let html = "";

  Object.keys(shipments).reverse().forEach((key) => {
    const s = shipments[key];

    html += `
      <div class="shipment-box">
        <h3>${s.trackingNumber}</h3>

        <p><strong>Sender:</strong> ${s.senderName || "N/A"}</p>
        <p><strong>Sender Phone:</strong> ${s.senderPhone || "Optional / Not added"}</p>
        <p><strong>Sender Email:</strong> ${s.senderEmail || "Optional / Not added"}</p>

        <p><strong>Receiver:</strong> ${s.receiverName || "N/A"}</p>
        <p><strong>Receiver Phone:</strong> ${s.receiverPhone || "Optional / Not added"}</p>
        <p><strong>Receiver Email:</strong> ${s.receiverEmail || "Optional / Not added"}</p>

        <p><strong>From:</strong> ${s.origin || "N/A"}</p>
        <p><strong>To:</strong> ${s.destination || "N/A"}</p>
        <p><strong>Current Location:</strong> ${s.currentLocation || "N/A"}</p>
        <p><strong>Status:</strong> ${s.status || "N/A"}</p>

        <div class="shipment-history">
          <strong>History:</strong>
          ${(s.history || []).map((h) => `
            <div class="history-item">
              <span>${h.status || ""}</span><br>
              <small>${h.location || ""}</small><br>
              <small>${h.note || ""}</small><br>
              <small>${new Date(h.date).toLocaleString()}</small>
            </div>
          `).join("")}
        </div>

        <button onclick="editShipment('${s.trackingNumber}')">Edit</button>
        <button onclick="deleteShipment('${s.trackingNumber}')">Delete</button>
      </div>
    `;
  });

  shipmentList.innerHTML = html;
};

window.editShipment = async function (trackingNumber) {
  const snapshot = await get(child(ref(database), "shipments/" + trackingNumber));

  if (!snapshot.exists()) {
    alert("Shipment not found.");
    return;
  }

  const s = snapshot.val();

  setValue("trackingNumber", s.trackingNumber);
  setValue("senderName", s.senderName);
  setValue("senderPhone", s.senderPhone);
  setValue("senderEmail", s.senderEmail);
  setValue("senderAddress", s.senderAddress);

  setValue("receiverName", s.receiverName);
  setValue("receiverPhone", s.receiverPhone);
  setValue("receiverEmail", s.receiverEmail);
  setValue("receiverAddress", s.receiverAddress);

  setValue("origin", s.origin);
  setValue("destination", s.destination);
  setValue("currentLocation", s.currentLocation);
  setValue("updateNote", "");
  setValue("weight", s.weight);
  setValue("description", s.description);
  setValue("deliveryDate", s.deliveryDate);
  setValue("status", s.status);

  alert("Shipment loaded for editing.");
};

window.deleteShipment = async function (trackingNumber) {
  if (!confirm("Delete this shipment?")) return;

  await remove(ref(database, "shipments/" + trackingNumber));

  alert("Shipment deleted successfully.");
  loadShipments();
};

document.addEventListener("DOMContentLoaded", () => {
  loadShipments();

  const saveButton = document.getElementById("saveShipment");
  if (saveButton) {
    saveButton.addEventListener("click", window.saveShipment);
  }
});

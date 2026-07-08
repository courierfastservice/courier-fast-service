import { database } from "./firebase-config.js";

import {
  ref,
  set,
  get,
  child,
  update,
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

window.saveShipment = async function () {
  let trackingNumber = cleanTrackingNumber(document.getElementById("trackingNumber").value);

  if (!trackingNumber) {
    trackingNumber = generateTrackingNumber();
    document.getElementById("trackingNumber").value = trackingNumber;
  }

  const shipment = {
    trackingNumber,
    senderName: clean(document.getElementById("senderName").value),
    senderPhone: clean(document.getElementById("senderPhone")?.value),
    senderEmail: clean(document.getElementById("senderEmail")?.value),
    senderAddress: clean(document.getElementById("senderAddress")?.value),

    receiverName: clean(document.getElementById("receiverName").value),
    receiverPhone: clean(document.getElementById("receiverPhone")?.value),
    receiverEmail: clean(document.getElementById("receiverEmail")?.value),
    receiverAddress: clean(document.getElementById("receiverAddress")?.value),

    origin: clean(document.getElementById("origin").value),
    destination: clean(document.getElementById("destination").value),
    weight: clean(document.getElementById("weight")?.value),
    description: clean(document.getElementById("description")?.value),
    deliveryDate: clean(document.getElementById("deliveryDate")?.value),
    status: clean(document.getElementById("status").value),

    updatedAt: new Date().toISOString()
  };

  if (!shipment.senderName || !shipment.receiverName || !shipment.origin || !shipment.destination) {
    alert("Sender name, receiver name, origin, and destination are required.");
    return;
  }

  const oldData = await get(child(ref(database), "shipments/" + trackingNumber));

  if (!oldData.exists()) {
    shipment.createdAt = new Date().toISOString();
    shipment.history = [
      {
        status: shipment.status,
        message: "Shipment registered.",
        date: new Date().toISOString()
      }
    ];
  }

  await set(ref(database, "shipments/" + trackingNumber), {
    ...(oldData.exists() ? oldData.val() : {}),
    ...shipment
  });

  alert("Shipment saved successfully.");
  loadShipments();
};

async function loadShipments() {
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
        <p><strong>Status:</strong> ${s.status || "N/A"}</p>

        <button onclick="editShipment('${s.trackingNumber}')">Edit</button>
        <button onclick="deleteShipment('${s.trackingNumber}')">Delete</button>
      </div>
    `;
  });

  shipmentList.innerHTML = html;
}

window.editShipment = async function (trackingNumber) {
  const snapshot = await get(child(ref(database), "shipments/" + trackingNumber));
  if (!snapshot.exists()) {
    alert("Shipment not found.");
    return;
  }

  const s = snapshot.val();

  document.getElementById("trackingNumber").value = s.trackingNumber || "";
  document.getElementById("senderName").value = s.senderName || "";
  document.getElementById("senderPhone").value = s.senderPhone || "";
  document.getElementById("senderEmail").value = s.senderEmail || "";
  document.getElementById("senderAddress").value = s.senderAddress || "";

  document.getElementById("receiverName").value = s.receiverName || "";
  document.getElementById("receiverPhone").value = s.receiverPhone || "";
  document.getElementById("receiverEmail").value = s.receiverEmail || "";
  document.getElementById("receiverAddress").value = s.receiverAddress || "";

  document.getElementById("origin").value = s.origin || "";
  document.getElementById("destination").value = s.destination || "";
  document.getElementById("weight").value = s.weight || "";
  document.getElementById("description").value = s.description || "";
  document.getElementById("deliveryDate").value = s.deliveryDate || "";
  document.getElementById("status").value = s.status || "";

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

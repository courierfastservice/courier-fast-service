import { database } from "./firebase-config.js";

import {
  ref,
  set,
  get,
  child,
  update,
  remove,
  onValue
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";

function cleanTrackingNumber(value) {
  return value.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

window.saveShipment = async function () {

  const trackingNumber = cleanTrackingNumber(
    document.getElementById("trackingNumber").value
  );

  const senderName = document.getElementById("senderName").value;

  const receiverName = document.getElementById("receiverName").value;

  const origin = document.getElementById("origin").value;

  const destination = document.getElementById("destination").value;

  const status = document.getElementById("status").value;

  if (!trackingNumber) {
    alert("Tracking Number is required.");
    return;
  }

  const shipment = {

    trackingNumber,

    senderName,

    receiverName,

    origin,

    destination,

    status,

    createdAt: new Date().toISOString(),

    updatedAt: new Date().toISOString()

  };

  await set(

    ref(database, "shipments/" + trackingNumber),

    shipment

  );

  alert("Shipment saved successfully.");

  loadShipments();

};
async function loadShipments() {

  const shipmentList = document.getElementById("shipmentList");

  if (!shipmentList) {
    return;
  }

  const snapshot = await get(child(ref(database), "shipments"));

  if (!snapshot.exists()) {
    shipmentList.innerHTML = "No shipment available.";
    return;
  }

  const shipments = snapshot.val();

  let html = "";

  Object.keys(shipments).forEach(function (key) {

    const shipment = shipments[key];

    html += `
      <div class="shipment-box">
        <h4>${shipment.trackingNumber}</h4>
        <p><strong>Sender:</strong> ${shipment.senderName || "N/A"}</p>
        <p><strong>Receiver:</strong> ${shipment.receiverName || "N/A"}</p>
        <p><strong>From:</strong> ${shipment.origin || "N/A"}</p>
        <p><strong>To:</strong> ${shipment.destination || "N/A"}</p>
        <p><strong>Status:</strong> ${shipment.status || "N/A"}</p>
        <button onclick="deleteShipment('${shipment.trackingNumber}')">Delete</button>
      </div>
    `;

  });

  shipmentList.innerHTML = html;

}

window.deleteShipment = async function (trackingNumber) {

  const cleanNumber = cleanTrackingNumber(trackingNumber);

  if (!confirm("Are you sure you want to delete this shipment?")) {
    return;
  }

  await remove(ref(database, "shipments/" + cleanNumber));

  alert("Shipment deleted successfully.");

  loadShipments();

};window.getShipment = async function (trackingNumber) {

  const cleanNumber = cleanTrackingNumber(trackingNumber);

  const snapshot = await get(
    child(ref(database), "shipments/" + cleanNumber)
  );

  if (snapshot.exists()) {
    return snapshot.val();
  }

  return null;
};

window.updateShipment = async function (trackingNumber, updatedData) {

  const cleanNumber = cleanTrackingNumber(trackingNumber);

  await update(
    ref(database, "shipments/" + cleanNumber),
    {
      ...updatedData,
      updatedAt: new Date().toISOString()
    }
  );

  alert("Shipment updated successfully.");

  loadShipments();
};

// Automatically load shipments when dashboard opens
document.addEventListener("DOMContentLoaded", () => {

  if (document.getElementById("shipmentList")) {
    loadShipments();
  }

  const saveButton = document.getElementById("saveShipment");

  if (saveButton) {
    saveButton.addEventListener("click", window.saveShipment);
  }

});

console.log("Courier Fast Service V2 connected successfully.");

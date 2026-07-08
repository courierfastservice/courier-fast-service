import { database } from "./firebase-config.js";

import {
  ref,
  get,
  child
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";

function cleanTrackingNumber(value) {
  return value.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function formatDate(dateValue) {
  if (!dateValue) return "N/A";
  return new Date(dateValue).toLocaleString();
}

function showResult(message) {
  document.getElementById("trackingResult").innerHTML = message;
}

window.trackShipment = async function () {
  const input = document.getElementById("trackingInput");
  const trackingNumber = cleanTrackingNumber(input.value);

  if (!trackingNumber) {
    showResult("<p>Please enter a tracking number.</p>");
    return;
  }

  showResult("<p>Searching shipment...</p>");

  const snapshot = await get(child(ref(database), "shipments/" + trackingNumber));

  if (!snapshot.exists()) {
    showResult(`
      <h3>Tracking Not Found</h3>
      <p>No shipment found with tracking number:</p>
      <h2>${trackingNumber}</h2>
      <p>Please check the number and try again.</p>
    `);
    return;
  }

  const shipment = snapshot.val();
  const history = shipment.history || [];

  let historyHtml = "";

  history.forEach((item) => {
    historyHtml += `
      <div class="history-item">
        <h4>${item.status || "Update"}</h4>
        <p><strong>Location:</strong> ${item.location || "N/A"}</p>
        <p>${item.note || ""}</p>
        <small>${formatDate(item.date)}</small>
      </div>
    `;
  });

  showResult(`
    <h3>Shipment Found</h3>

    <h2>${shipment.trackingNumber}</h2>

    <p><strong>Status:</strong> ${shipment.status || "N/A"}</p>
    <p><strong>Current Location:</strong> ${shipment.currentLocation || "N/A"}</p>
    <p><strong>From:</strong> ${shipment.origin || "N/A"}</p>
    <p><strong>To:</strong> ${shipment.destination || "N/A"}</p>
    <p><strong>Expected Delivery:</strong> ${shipment.deliveryDate || "N/A"}</p>

    <hr>

    <h3>Tracking History</h3>
    ${historyHtml || "<p>No tracking history yet.</p>"}
  `);
};

document.addEventListener("DOMContentLoaded", () => {
  const trackButton = document.getElementById("trackShipment");

  if (trackButton) {
    trackButton.addEventListener("click", window.trackShipment);
  }
});

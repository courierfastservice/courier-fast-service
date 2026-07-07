// Courier Fast Service V2

import { database } from "./firebase-config.js";

import {
  ref,
  set,
  get,
  update,
  remove,
  child
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";

function cleanTrackingNumber(value) {
  return value.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

window.saveShipment = async function (shipmentData) {
  const trackingNumber = cleanTrackingNumber(shipmentData.trackingNumber);

  if (!trackingNumber) {
    alert("Tracking number is required.");
    return;
  }

  await set(ref(database, "shipments/" + trackingNumber), {
    ...shipmentData,
    trackingNumber: trackingNumber,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  alert("Shipment saved successfully.");
};

window.getShipment = async function (trackingNumber) {
  const cleanNumber = cleanTrackingNumber(trackingNumber);
  const snapshot = await get(child(ref(database), "shipments/" + cleanNumber));

  if (snapshot.exists()) {
    return snapshot.val();
  } else {
    return null;
  }
};

window.updateShipment = async function (trackingNumber, updatedData) {
  const cleanNumber = cleanTrackingNumber(trackingNumber);

  await update(ref(database, "shipments/" + cleanNumber), {
    ...updatedData,
    updatedAt: new Date().toISOString()
  });

  alert("Shipment updated successfully.");
};

window.deleteShipment = async function (trackingNumber) {
  const cleanNumber = cleanTrackingNumber(trackingNumber);

  if (!confirm("Are you sure you want to delete this shipment?")) {
    return;
  }

  await remove(ref(database, "shipments/" + cleanNumber));

  alert("Shipment deleted successfully.");
};

console.log("Courier Fast Service V2 connected to Firebase.");

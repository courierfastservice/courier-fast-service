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
  return clean(value)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
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

  if (element) {
    element.value = value || "";
  }
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
  let trackingNumber = cleanTrackingNumber(
    getValue("trackingNumber")
  );

  if (!trackingNumber) {
    trackingNumber = generateTrackingNumber();
    setValue("trackingNumber", trackingNumber);
  }

  const senderName = getValue("senderName");
  const receiverName = getValue("receiverName");
  const origin = getValue("origin");
  const destination = getValue("destination");

  if (
    !senderName ||
    !receiverName ||
    !origin ||
    !destination
  ) {
    alert(
      "Sender name, receiver name, origin, and destination are required."
    );
    return;
  }

  const status =
    getValue("status") || "Shipment Created";

  const currentLocation =
    getValue("currentLocation");

  const updateNote =
    getValue("updateNote");

  const shipmentPath =
    "shipments/" + trackingNumber;

  let snapshot;

  try {
    snapshot = await get(
      child(ref(database), shipmentPath)
    );
  } catch (error) {
    console.error(error);

    alert(
      "Unable to connect to the database. Please check your internet connection."
    );
    return;
  }

  const oldShipment = snapshot.exists()
    ? snapshot.val()
    : {};

  const oldHistory = Array.isArray(oldShipment.history)
    ? oldShipment.history
    : [];

  const history = [
    ...oldHistory,
    createHistoryEntry(
      status,
      currentLocation,
      updateNote
    )
  ];

  const fileInput =
    document.getElementById("packagePhoto");

  const selectedFileName =
    fileInput &&
    fileInput.files &&
    fileInput.files.length > 0
      ? fileInput.files[0].name
      : oldShipment.packageFileName || "";

  const shipment = {
    ...oldShipment,

    trackingNumber,

    senderName,
    senderPhone: getValue("senderPhone"),
    senderEmail: getValue("senderEmail"),
    senderAddress: getValue("senderAddress"),

    receiverName,
    receiverPhone: getValue("receiverPhone"),
    receiverEmail: getValue("receiverEmail"),
    receiverAddress: getValue("receiverAddress"),

    origin,
    destination,

    currentLocation,
    updateNote,

    weight: getValue("weight"),
    description: getValue("description"),
    deliveryDate: getValue("deliveryDate"),

    packageFileName: selectedFileName,

    status,
    history,

    updatedAt: new Date().toISOString()
  };

  if (!snapshot.exists()) {
    shipment.createdAt =
      new Date().toISOString();
  }

  try {
    await set(
      ref(database, shipmentPath),
      shipment
    );
  } catch (error) {
    console.error(error);

    alert(
      "Shipment could not be saved. Please try again."
    );
    return;
  }

  alert("Shipment saved successfully.");

  if (fileInput) {
    fileInput.value = "";
  }

  loadShipments();
};

window.loadShipments = async function () {
  const shipmentList =
    document.getElementById("shipmentList");

  if (!shipmentList) return;

  shipmentList.innerHTML =
    "Loading shipments...";

  let snapshot;

  try {
    snapshot = await get(
      child(ref(database), "shipments")
    );
  } catch (error) {
    console.error(error);

    shipmentList.innerHTML =
      "Unable to load shipments.";
    return;
  }

  if (!snapshot.exists()) {
    shipmentList.innerHTML =
      "No shipment available.";
    return;
  }

  const shipments = snapshot.val();
  let html = "";

  Object.keys(shipments)
    .reverse()
    .forEach((key) => {
      const shipment = shipments[key];

      const history = Array.isArray(
        shipment.history
      )
        ? shipment.history
        : [];

      const historyHtml = history
        .map((item) => {
          const dateText = item.date
            ? new Date(
                item.date
              ).toLocaleString()
            : "";

          return `
            <div class="history-item">
              <strong>${item.status || "Update"}</strong><br>
              <span>${item.location || "Location not added"}</span><br>
              <span>${item.note || ""}</span><br>
              <small>${dateText}</small>
            </div>
          `;
        })
        .join("");

      const selectedFileHtml =
        shipment.packageFileName
          ? `
            <p>
              <strong>Selected file:</strong>
              ${shipment.packageFileName}
            </p>
            <small>
              File upload is not active yet.
            </small>
          `
          : "";

      html += `
        <div class="shipment-box">
          <h3>${shipment.trackingNumber || key}</h3>

          <p>
            <strong>Sender:</strong>
            ${shipment.senderName || "N/A"}
          </p>

          <p>
            <strong>Sender Phone:</strong>
            ${shipment.senderPhone || "Optional / Not added"}
          </p>

          <p>
            <strong>Sender Email:</strong>
            ${shipment.senderEmail || "Optional / Not added"}
          </p>

          <p>
            <strong>Receiver:</strong>
            ${shipment.receiverName || "N/A"}
          </p>

          <p>
            <strong>Receiver Phone:</strong>
            ${shipment.receiverPhone || "Optional / Not added"}
          </p>

          <p>
            <strong>Receiver Email:</strong>
            ${shipment.receiverEmail || "Optional / Not added"}
          </p>

          <p>
            <strong>From:</strong>
            ${shipment.origin || "N/A"}
          </p>

          <p>
            <strong>To:</strong>
            ${shipment.destination || "N/A"}
          </p>

          <p>
            <strong>Current Location:</strong>
            ${shipment.currentLocation || "N/A"}
          </p>

          <p>
            <strong>Status:</strong>
            ${shipment.status || "N/A"}
          </p>

          <p>
            <strong>Weight:</strong>
            ${shipment.weight || "Not added"}
          </p>

          <p>
            <strong>Description:</strong>
            ${shipment.description || "Not added"}
          </p>

          <p>
            <strong>Expected Delivery:</strong>
            ${shipment.deliveryDate || "Not added"}
          </p>

          ${selectedFileHtml}

          <div class="shipment-history">
            <strong>History:</strong>
            ${
              historyHtml ||
              "<p>No tracking history available.</p>"
            }
          </div>

          <button
            type="button"
            onclick="editShipment('${shipment.trackingNumber || key}')"
          >
            Edit
          </button>

          <button
            type="button"
            onclick="deleteShipment('${shipment.trackingNumber || key}')"
          >
            Delete
          </button>
        </div>
      `;
    });

  shipmentList.innerHTML = html;
};

window.editShipment = async function (
  trackingNumber
) {
  let snapshot;

  try {
    snapshot = await get(
      child(
        ref(database),
        "shipments/" + trackingNumber
      )
    );
  } catch (error) {
    console.error(error);

    alert("Unable to load this shipment.");
    return;
  }

  if (!snapshot.exists()) {
    alert("Shipment not found.");
    return;
  }

  const shipment = snapshot.val();

  setValue("trackingNumber", shipment.trackingNumber);

  setValue("senderName", shipment.senderName);
  setValue("senderPhone", shipment.senderPhone);
  setValue("senderEmail", shipment.senderEmail);
  setValue("senderAddress", shipment.senderAddress);

  setValue("receiverName", shipment.receiverName);
  setValue("receiverPhone", shipment.receiverPhone);
  setValue("receiverEmail", shipment.receiverEmail);
  setValue("receiverAddress", shipment.receiverAddress);

  setValue("origin", shipment.origin);
  setValue("destination", shipment.destination);
  setValue("currentLocation", shipment.currentLocation);
  setValue("updateNote", "");

  setValue("weight", shipment.weight);
  setValue("description", shipment.description);
  setValue("deliveryDate", shipment.deliveryDate);
  setValue("status", shipment.status);

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

  alert("Shipment loaded for editing.");
};

window.deleteShipment = async function (
  trackingNumber
) {
  const confirmed = confirm(
    "Are you sure you want to delete this shipment?"
  );

  if (!confirmed) return;

  try {
    await remove(
      ref(
        database,
        "shipments/" + trackingNumber
      )
    );
  } catch (error) {
    console.error(error);

    alert("Shipment could not be deleted.");
    return;
  }

  alert("Shipment deleted successfully.");
  loadShipments();
};

document.addEventListener(
  "DOMContentLoaded",
  () => {
    loadShipments();

    const saveButton =
      document.getElementById("saveShipment");

    if (saveButton) {
      saveButton.addEventListener(
        "click",
        window.saveShipment
      );
    }
  }
);

import { database } from "./firebase-config.js";

import {
  ref,
  set,
  get,
  child,
  remove
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";

let allShipments = {};

function clean(value) {
  return value ? String(value).trim() : "";
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

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function createHistoryEntry(status, location, note) {
  return {
    status: status || "Shipment Created",
    location: location || "",
    note: note || "Shipment update saved.",
    date: new Date().toISOString()
  };
}

function clearForm() {
  const fieldIds = [
    "trackingNumber",
    "senderName",
    "senderPhone",
    "senderEmail",
    "senderAddress",
    "receiverName",
    "receiverPhone",
    "receiverEmail",
    "receiverAddress",
    "origin",
    "destination",
    "currentLocation",
    "updateNote",
    "weight",
    "description",
    "deliveryDate"
  ];

  fieldIds.forEach((id) => {
    setValue(id, "");
  });

  setValue("status", "Shipment Created");

  const fileInput = document.getElementById("packagePhoto");

  if (fileInput) {
    fileInput.value = "";
  }
}

function buildHistoryHtml(history) {
  if (!Array.isArray(history) || history.length === 0) {
    return "<p>No tracking history available.</p>";
  }

  return history
    .slice()
    .reverse()
    .map((item) => {
      const dateText = item.date
        ? new Date(item.date).toLocaleString()
        : "";

      return `
        <div class="history-item">
          <strong>${escapeHtml(item.status || "Update")}</strong><br>
          <span>${escapeHtml(item.location || "Location not added")}</span><br>
          <span>${escapeHtml(item.note || "")}</span><br>
          <small>${escapeHtml(dateText)}</small>
        </div>
      `;
    })
    .join("");
}

function buildShipmentCard(shipment, key) {
  const trackingNumber =
    shipment.trackingNumber || key;

  const selectedFileHtml = shipment.packageFileName
    ? `
      <p>
        <strong>Selected File:</strong>
        ${escapeHtml(shipment.packageFileName)}
      </p>
      <small>File upload is not active yet.</small>
    `
    : "";

  return `
    <div class="shipment-box">
      <h3>${escapeHtml(trackingNumber)}</h3>

      <p>
        <strong>Sender:</strong>
        ${escapeHtml(shipment.senderName || "N/A")}
      </p>

      <p>
        <strong>Sender Phone:</strong>
        ${escapeHtml(shipment.senderPhone || "Optional / Not added")}
      </p>

      <p>
        <strong>Sender Email:</strong>
        ${escapeHtml(shipment.senderEmail || "Optional / Not added")}
      </p>

      <p>
        <strong>Receiver:</strong>
        ${escapeHtml(shipment.receiverName || "N/A")}
      </p>

      <p>
        <strong>Receiver Phone:</strong>
        ${escapeHtml(shipment.receiverPhone || "Optional / Not added")}
      </p>

      <p>
        <strong>Receiver Email:</strong>
        ${escapeHtml(shipment.receiverEmail || "Optional / Not added")}
      </p>

      <p>
        <strong>From:</strong>
        ${escapeHtml(shipment.origin || "N/A")}
      </p>

      <p>
        <strong>To:</strong>
        ${escapeHtml(shipment.destination || "N/A")}
      </p>

      <p>
        <strong>Current Location:</strong>
        ${escapeHtml(shipment.currentLocation || "N/A")}
      </p>

      <p>
        <strong>Status:</strong>
        ${escapeHtml(shipment.status || "N/A")}
      </p>

      <p>
        <strong>Weight:</strong>
        ${escapeHtml(shipment.weight || "Not added")}
      </p>

      <p>
        <strong>Description:</strong>
        ${escapeHtml(shipment.description || "Not added")}
      </p>

      <p>
        <strong>Expected Delivery:</strong>
        ${escapeHtml(shipment.deliveryDate || "Not added")}
      </p>

      ${selectedFileHtml}

      <div class="shipment-history">
        <strong>History:</strong>
        ${buildHistoryHtml(shipment.history)}
      </div>

      <button
        type="button"
        onclick="editShipment('${escapeHtml(trackingNumber)}')"
      >
        Edit
      </button>

      <button
  type="button"
  onclick="window.open('receipt.html?tracking=${encodeURIComponent(trackingNumber)}', '_blank')"
>
  🖨 Print Receipt
</button>

<button
  type="button"
  onclick="deleteShipment('${escapeHtml(trackingNumber)}')"
>
  Delete
</button>
    </div>
  `;function displayShipments(shipments) {
  const shipmentList =
    document.getElementById("shipmentList");

  if (!shipmentList) {
    return;
  }

  const safeShipments = shipments || {};
  const keys = Object.keys(safeShipments);
  const shipmentValues = Object.values(safeShipments);

  const totalShipments = shipmentValues.length;

  const inTransitCount = shipmentValues.filter(
    (shipment) =>
      shipment.status === "In Transit" ||
      shipment.status === "Flight Dispatched"
  ).length;

  const outForDeliveryCount = shipmentValues.filter(
    (shipment) =>
      shipment.status === "Out For Delivery"
  ).length;

  const deliveredCount = shipmentValues.filter(
    (shipment) =>
      shipment.status === "Delivered"
  ).length;

  const pendingCount = shipmentValues.filter(
    (shipment) =>
      shipment.status !== "Delivered" &&
      shipment.status !== "Out For Delivery" &&
      shipment.status !== "In Transit" &&
      shipment.status !== "Flight Dispatched"
  ).length;

  const totalElement =
    document.getElementById("totalShipments");

  const transitElement =
    document.getElementById("inTransitCount");

  const deliveryElement =
    document.getElementById("outForDeliveryCount");

  const deliveredElement =
    document.getElementById("deliveredCount");

  const pendingElement =
    document.getElementById("pendingCount");

  if (totalElement) {
    totalElement.textContent = totalShipments;
  }

  if (transitElement) {
    transitElement.textContent = inTransitCount;
  }

  if (deliveryElement) {
    deliveryElement.textContent =
      outForDeliveryCount;
  }

  if (deliveredElement) {
    deliveredElement.textContent =
      deliveredCount;
  }

  if (pendingElement) {
    pendingElement.textContent = pendingCount;
  }

  if (keys.length === 0) {
    shipmentList.innerHTML =
      "<p>No shipments available.</p>";
    return;
  }

  shipmentList.innerHTML = keys
    .slice()
    .reverse()
    .map((key) =>
      buildShipmentCard(safeShipments[key], key)
    )
    .join("");
  }
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

  const oldHistory = Array.isArray(
    oldShipment.history
  )
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

  clearForm();
  await loadShipments();
};

window.loadShipments = async function () {
  const shipmentList =
    document.getElementById("shipmentList");

  if (!shipmentList) {
    return;
  }

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

  allShipments = snapshot.exists()
    ? snapshot.val()
    : {};

  displayShipments(allShipments);
};

window.searchShipment = function () {
  const searchInput =
    document.getElementById(
      "searchTrackingNumber"
    );

  const searchMessage =
    document.getElementById("searchMessage");

  const trackingNumber =
    cleanTrackingNumber(searchInput?.value);

  if (!trackingNumber) {
    if (searchMessage) {
      searchMessage.innerHTML =
        "<p>Please enter a tracking number.</p>";
    }

    return;
  }

  const shipment =
    allShipments[trackingNumber];

  if (!shipment) {
    displayShipments({});

    if (searchMessage) {
      searchMessage.innerHTML = `
        <p style="color:#c00000;">
          <strong>No shipment found for ${escapeHtml(trackingNumber)}.</strong>
        </p>
      `;
    }

    return;
  }

  displayShipments({
    [trackingNumber]: shipment
  });

  if (searchMessage) {
    searchMessage.innerHTML = `
      <p style="color:green;">
        <strong>Shipment found.</strong>
      </p>
    `;
  }
};

window.clearShipmentSearch = function () {
  const searchInput =
    document.getElementById(
      "searchTrackingNumber"
    );

  const searchMessage =
    document.getElementById("searchMessage");

  if (searchInput) {
    searchInput.value = "";
  }

  if (searchMessage) {
    searchMessage.innerHTML = "";
  }

  displayShipments(allShipments);
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

  setValue(
    "trackingNumber",
    shipment.trackingNumber
  );

  setValue(
    "senderName",
    shipment.senderName
  );

  setValue(
    "senderPhone",
    shipment.senderPhone
  );

  setValue(
    "senderEmail",
    shipment.senderEmail
  );

  setValue(
    "senderAddress",
    shipment.senderAddress
  );

  setValue(
    "receiverName",
    shipment.receiverName
  );

  setValue(
    "receiverPhone",
    shipment.receiverPhone
  );

  setValue(
    "receiverEmail",
    shipment.receiverEmail
  );

  setValue(
    "receiverAddress",
    shipment.receiverAddress
  );

  setValue("origin", shipment.origin);
  setValue(
    "destination",
    shipment.destination
  );

  setValue(
    "currentLocation",
    shipment.currentLocation
  );

  setValue("updateNote", "");

  setValue("weight", shipment.weight);

  setValue(
    "description",
    shipment.description
  );

  setValue(
    "deliveryDate",
    shipment.deliveryDate
  );

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

  if (!confirmed) {
    return;
  }

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

  clearForm();
  await loadShipments();
};

document.addEventListener(
  "DOMContentLoaded",
  () => {
    loadShipments();

    const saveButton =
      document.getElementById(
        "saveShipment"
      );

    const searchButton =
      document.getElementById(
        "searchShipmentButton"
      );

    const clearSearchButton =
      document.getElementById(
        "clearSearchButton"
      );

    const searchInput =
      document.getElementById(
        "searchTrackingNumber"
      );

    if (saveButton) {
      saveButton.addEventListener(
        "click",
        window.saveShipment
      );
    }

    if (searchButton) {
      searchButton.addEventListener(
        "click",
        window.searchShipment
      );
    }

    if (clearSearchButton) {
      clearSearchButton.addEventListener(
        "click",
        window.clearShipmentSearch
      );
    }

    if (searchInput) {
      searchInput.addEventListener(
        "keydown",
        (event) => {
          if (event.key === "Enter") {
            window.searchShipment();
          }
        }
      );
    }
  }
);

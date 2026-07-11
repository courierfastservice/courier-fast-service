import { database, storage } from "./firebase-config.js";

import {
  ref,
  set,
  get,
  child,
  remove
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";

import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-storage.js";

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

async function uploadPackageFile(trackingNumber) {
  const fileInput = document.getElementById("packagePhoto");

  if (
    !fileInput ||
    !fileInput.files ||
    fileInput.files.length === 0
  ) {
    return "";
  }

  const file = fileInput.files[0];

  const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");

  const filePath =
    "shipments/" +
    trackingNumber +
    "/" +
    Date.now() +
    "-" +
    safeFileName;

  const fileReference = storageRef(storage, filePath);

  await uploadBytes(fileReference, file);

  return await getDownloadURL(fileReference);
}

window.saveShipment = async function () {
  let trackingNumber = cleanTrackingNumber(
    getValue("trackingNumber")
  );

  if (!trackingNumber) {
    trackingNumber = generateTrackingNumber();
    setValue("trackingNumber", trackingNumber);
  }

  const status =
    getValue("status") || "Shipment Created";

  const currentLocation =
    getValue("currentLocation");

  const updateNote =
    getValue("updateNote");

  const senderName =
    getValue("senderName");

  const receiverName =
    getValue("receiverName");

  const origin =
    getValue("origin");

  const destination =
    getValue("destination");

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

  const shipmentPath =
    "shipments/" + trackingNumber;

  const shipmentReference =
    ref(database, shipmentPath);

  let snapshot;

  try {
    snapshot = await get(
      child(ref(database), shipmentPath)
    );
  } catch (error) {
    console.error(error);

    alert(
      "Unable to connect to the shipment database. Please try again."
    );

    return;
  }

  let oldShipment = {};
  let history = [];

  if (snapshot.exists()) {
    oldShipment = snapshot.val();

    history = Array.isArray(oldShipment.history)
      ? oldShipment.history
      : [];
  }

  let packageFileUrl =
    oldShipment.packageFileUrl || "";

  let fileUploadFailed = false;

  try {
    const uploadedUrl =
      await uploadPackageFile(trackingNumber);

    if (uploadedUrl) {
      packageFileUrl = uploadedUrl;
    }
  } catch (error) {
    console.error(
      "Package file upload failed:",
      error
    );

    fileUploadFailed = true;
  }

  history.push(
    createHistoryEntry(
      status,
      currentLocation,
      updateNote
    )
  );

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

    packageFileUrl,

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
      shipmentReference,
      shipment
    );
  } catch (error) {
    console.error(error);

    alert(
      "Shipment could not be saved. Please try again."
    );

    return;
  }

  if (fileUploadFailed) {
    alert(
      "Shipment saved successfully, but the package photo or document could not be uploaded."
    );
  } else {
    alert(
      "Shipment saved successfully."
    );
  }

  const fileInput =
    document.getElementById("packagePhoto");

  if (fileInput) {
    fileInput.value = "";
  }

  loadShipments();
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

  if (!snapshot.exists()) {
    shipmentList.innerHTML =
      "No shipment available.";

    return;
  }

  const shipments =
    snapshot.val();

  let html = "";

  Object.keys(shipments)
    .reverse()
    .forEach((key) => {
      const shipment = shipments[key];

      const history =
        Array.isArray(shipment.history)
          ? shipment.history
          : [];

      const historyHtml = history
        .map((item) => {
          const dateText =
            item.date
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

      const fileHtml =
        shipment.packageFileUrl
          ? `
            <p>
              <strong>Package File:</strong>
              <a
                href="${shipment.packageFileUrl}"
                target="_blank"
                rel="noopener noreferrer"
              >
                View File
              </a>
            </p>
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

          ${fileHtml}

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

    alert(
      "Unable to load this shipment."
    );

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

  setValue(
    "origin",
    shipment.origin
  );

  setValue(
    "destination",
    shipment.destination
  );

  setValue(
    "currentLocation",
    shipment.currentLocation
  );

  setValue(
    "updateNote",
    ""
  );

  setValue(
    "weight",
    shipment.weight
  );

  setValue(
    "description",
    shipment.description
  );

  setValue(
    "deliveryDate",
    shipment.deliveryDate
  );

  setValue(
    "status",
    shipment.status
  );

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

  alert(
    "Shipment loaded for editing."
  );
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

    alert(
      "Shipment could not be deleted."
    );

    return;
  }

  alert(
    "Shipment deleted successfully."
  );

  loadShipments();
};

document.addEventListener(
  "DOMContentLoaded",
  () => {
    loadShipments();

    const saveButton =
      document.getElementById(
        "saveShipment"
      );

    if (saveButton) {
      saveButton.addEventListener(
        "click",
        window.saveShipment
      );
    }
  }
);import { database, storage } from "./firebase-config.js";

import {
  ref,
  set,
  get,
  child,
  remove
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";

import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-storage.js";

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

async function uploadPackageFile(trackingNumber) {
  const fileInput = document.getElementById("packagePhoto");

  if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
    return "";
  }

  const file = fileInput.files[0];
  const filePath = `shipments/${trackingNumber}/${Date.now()}-${file.name}`;
  const fileReference = storageRef(storage, filePath);

  await uploadBytes(fileReference, file);
  return await getDownloadURL(fileReference);
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

  const shipmentRef = ref(database, "shipments/" + trackingNumber);
  const snapshot = await get(child(ref(database), "shipments/" + trackingNumber));

  let oldShipment = {};
  let history = [];

  if (snapshot.exists()) {
    oldShipment = snapshot.val();
    history = Array.isArray(oldShipment.history) ? oldShipment.history : [];
  }

  let packageFileUrl = oldShipment.packageFileUrl || "";

  try {
    const uploadedUrl = await uploadPackageFile(trackingNumber);
    if (uploadedUrl) {
      packageFileUrl = uploadedUrl;
    }
  } catch (error) {
    alert("File upload failed. Please check Firebase Storage settings.");
    console.error(error);
    return;
  }

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
    packageFileUrl,

    status,
    updatedAt: new Date().toISOString()
  };

  if (!shipment.senderName || !shipment.receiverName || !shipment.origin || !shipment.destination) {
    alert("Sender name, receiver name, origin, and destination are required.");
    return;
  }

  if (!snapshot.exists()) {
    shipment.createdAt = new Date().toISOString();
  }

  history.push(createHistoryEntry(status, currentLocation, updateNote));
  shipment.history = history;

  await set(shipmentRef, {
    ...oldShipment,
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

        ${
          s.packageFileUrl
            ? `<p><strong>Package File:</strong> <a href="${s.packageFileUrl}" target="_blank">View File</a></p>`
            : ""
        }

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

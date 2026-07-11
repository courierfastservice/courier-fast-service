import { database } from "./firebase-config.js";

import {
  ref,
  get,
  child
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";

const progressSteps = [
  "Shipment Created",
  "Picked Up",
  "Arrived At Sorting Center",
  "Departed Sorting Center",
  "In Transit",
  "Customs Clearance",
  "Released By Customs",
  "Arrived Destination Country",
  "Out For Delivery",
  "Delivered"
];

const statusAliases = {
  "Flight Dispatched": "In Transit"
};

const exceptionStatuses = [
  "Delivery Attempt Failed",
  "On Hold",
  "Returned To Sender"
];

function cleanTrackingNumber(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(value) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return escapeHtml(value);
  }

  return date.toLocaleString();
}

function displayResult(html) {
  const result = document.getElementById("trackingResult");

  if (result) {
    result.innerHTML = html;
  }
}

function getProgressIndex(status) {
  const normalizedStatus = statusAliases[status] || status;
  return progressSteps.indexOf(normalizedStatus);
}

function getStatusStyle(status) {
  const styles = {
    "Shipment Created": {
      background: "#e8f1ff",
      color: "#0b63ce"
    },
    "Picked Up": {
      background: "#e8f1ff",
      color: "#0b63ce"
    },
    "Arrived At Sorting Center": {
      background: "#f3e8ff",
      color: "#7e22ce"
    },
    "Departed Sorting Center": {
      background: "#fff7df",
      color: "#b45309"
    },
    "In Transit": {
      background: "#fff1dd",
      color: "#c2410c"
    },
    "Flight Dispatched": {
      background: "#fff1dd",
      color: "#c2410c"
    },
    "Customs Clearance": {
      background: "#f3e8ff",
      color: "#7e22ce"
    },
    "Released By Customs": {
      background: "#e8fff1",
      color: "#047857"
    },
    "Arrived Destination Country": {
      background: "#e8fff1",
      color: "#047857"
    },
    "Out For Delivery": {
      background: "#e8fff1",
      color: "#047857"
    },
    "Delivered": {
      background: "#dcfce7",
      color: "#166534"
    },
    "Delivery Attempt Failed": {
      background: "#fff1f2",
      color: "#be123c"
    },
    "On Hold": {
      background: "#fff7df",
      color: "#b45309"
    },
    "Returned To Sender": {
      background: "#fff1f2",
      color: "#be123c"
    }
  };

  return styles[status] || {
    background: "#eef2f7",
    color: "#374151"
  };
}

function buildStatusBadge(status) {
  const style = getStatusStyle(status);

  return `
    <span
      style="
        display:inline-block;
        background:${style.background};
        color:${style.color};
        font-weight:700;
        padding:8px 12px;
        border-radius:999px;
        margin-top:6px;
      "
    >
      ${escapeHtml(status)}
    </span>
  `;
}

function buildProgressTimeline(status) {
  const currentIndex = getProgressIndex(status);
  const isException = exceptionStatuses.includes(status);

  return progressSteps
    .map((step, index) => {
      let className = "progress-step";
      let description = "Pending";

      if (!isException && currentIndex >= 0) {
        if (index < currentIndex) {
          className += " completed";
          description = "Completed";
        } else if (index === currentIndex) {
          className += " current";
          description = "Current status";
        }
      }

      if (status === "Delivered") {
        className = "progress-step completed";
        description = "Completed";
      }

      return `
        <div class="${className}">
          <div class="progress-dot"></div>

          <div class="progress-content">
            <h4>${escapeHtml(step)}</h4>
            <p>${description}</p>
          </div>
        </div>
      `;
    })
    .join("");
}

function buildHistory(history) {
  if (
    !Array.isArray(history) ||
    history.length === 0
  ) {
    return `
      <div class="history-empty">
        No tracking history is available yet.
      </div>
    `;
  }

  return history
    .slice()
    .reverse()
    .map((item, index) => {
      const isLatest = index === 0;

      return `
        <div class="timeline-item ${
          isLatest ? "timeline-current" : ""
        }">
          <div class="timeline-marker">
            <span class="timeline-dot"></span>
            <span class="timeline-line"></span>
          </div>

          <div class="timeline-content">
            <div class="timeline-top">
              <h4>
                ${escapeHtml(
                  item.status ||
                  "Shipment Update"
                )}
              </h4>

              ${
                isLatest
                  ? `
                    <span class="current-badge">
                      Current
                    </span>
                  `
                  : ""
              }
            </div>

            <p class="timeline-location">
              <strong>Location:</strong>
              ${escapeHtml(
                item.location ||
                "Location not added"
              )}
            </p>

            ${
              item.note
                ? `
                  <p class="timeline-note">
                    ${escapeHtml(item.note)}
                  </p>
                `
                : ""
            }

            <small class="timeline-date">
              ${formatDate(item.date)}
            </small>
          </div>
        </div>
      `;
    })
    .join("");
}
function buildExceptionNotice(status) {
  if (!exceptionStatuses.includes(status)) {
    return "";
  }

  const messages = {
    "Delivery Attempt Failed":
      "A delivery attempt was unsuccessful. Please contact customer support for assistance.",

    "On Hold":
      "This shipment is temporarily on hold. Please review the latest tracking update.",

    "Returned To Sender":
      "This shipment is being returned to the sender."
  };

  return `
    <div
      class="tracking-summary"
      style="
        background:#fff4e5;
        border:1px solid #f59e0b;
      "
    >
      <h3>${escapeHtml(status)}</h3>
      <p>${escapeHtml(messages[status])}</p>
    </div>
  `;
}

async function copyTrackingNumber(trackingNumber) {
  try {
    await navigator.clipboard.writeText(trackingNumber);
    alert("Tracking number copied.");
  } catch (error) {
    console.error(error);
    alert("Unable to copy the tracking number.");
  }
}

function printTrackingDetails() {
  window.print();
}

async function trackShipment() {
  const input = document.getElementById("trackingInput");
  const trackingNumber = cleanTrackingNumber(input?.value);

  if (!trackingNumber) {
    displayResult(`
      <div class="tracking-summary">
        <h3>Enter a Tracking Number</h3>
        <p>Please enter your tracking number and try again.</p>
      </div>
    `);

    return;
  }

  displayResult(`
    <div class="tracking-summary">
      <h3>Searching Shipment</h3>
      <p>Please wait while we check your tracking number.</p>
    </div>
  `);

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

    displayResult(`
      <div class="tracking-summary">
        <h3>Connection Error</h3>
        <p>We could not connect to the tracking database. Please try again.</p>
      </div>
    `);

    return;
  }

  if (!snapshot.exists()) {
    displayResult(`
      <div class="tracking-summary">
        <h3>Tracking Number Not Found</h3>
        <p>No shipment was found for:</p>
        <h2>${escapeHtml(trackingNumber)}</h2>
        <p>Please check the number and try again.</p>
      </div>
    `);

    return;
  }

  const shipment = snapshot.val();
  const status = shipment.status || "Shipment Created";
  const displayedTrackingNumber =
    shipment.trackingNumber || trackingNumber;

  displayResult(`
    <div class="tracking-summary">
      <h3>Shipment Found</h3>

      <h2>${escapeHtml(displayedTrackingNumber)}</h2>

      <div
        style="
          display:flex;
          gap:10px;
          flex-wrap:wrap;
          margin-bottom:18px;
        "
      >
        <button
          type="button"
          id="copyTrackingButton"
          style="width:auto;padding:10px 14px;"
        >
          Copy Tracking Number
        </button>

        <button
          type="button"
          id="printTrackingButton"
          style="width:auto;padding:10px 14px;"
        >
          Print Details
        </button>
      </div>

      <p>
        <strong>Current Status:</strong><br>
        ${buildStatusBadge(status)}
      </p>

      <p>
        <strong>Current Location:</strong><br>
        ${escapeHtml(shipment.currentLocation || "Not added")}
      </p>

      <p>
        <strong>Origin:</strong><br>
        ${escapeHtml(shipment.origin || "Not added")}
      </p>

      <p>
        <strong>Destination:</strong><br>
        ${escapeHtml(shipment.destination || "Not added")}
      </p>

      <p>
        <strong>Expected Delivery:</strong><br>
        ${escapeHtml(shipment.deliveryDate || "Not added")}
      </p>

      ${
        shipment.weight
          ? `
            <p>
              <strong>Package Weight:</strong><br>
              ${escapeHtml(shipment.weight)}
            </p>
          `
          : ""
      }

      ${
        shipment.description
          ? `
            <p>
              <strong>Package Description:</strong><br>
              ${escapeHtml(shipment.description)}
            </p>
          `
          : ""
      }
    </div>

    ${buildExceptionNotice(status)}

    <h3>Shipment Progress</h3>

    <div class="progress-tracker">
      ${buildProgressTimeline(status)}
    </div>

    <hr>

    <h3>Tracking History</h3>

    <div class="shipment-history">
      ${buildHistory(shipment.history)}
    </div>
  `);

  const copyButton =
    document.getElementById("copyTrackingButton");

  const printButton =
    document.getElementById("printTrackingButton");

  if (copyButton) {
    copyButton.addEventListener("click", () => {
      copyTrackingNumber(displayedTrackingNumber);
    });
  }

  if (printButton) {
    printButton.addEventListener(
      "click",
      printTrackingDetails
    );
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const button =
    document.getElementById("trackShipment");

  const input =
    document.getElementById("trackingInput");

  if (button) {
    button.addEventListener(
      "click",
      trackShipment
    );
  }

  if (input) {
    input.addEventListener(
      "keydown",
      (event) => {
        if (event.key === "Enter") {
          trackShipment();
        }
      }
    );
  }
});

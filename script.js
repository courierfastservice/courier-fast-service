 const trackingData = {
  "CFS123456": {
    status: "In Transit",
    location: "Bangkok, Thailand",
    updated: "9 July 2026",
    message: "Your package has departed the sorting center and is on its way."
  },

  "CFS654321": {
    status: "Delivered",
    location: "New Taipei City, Taiwan",
    updated: "8 July 2026",
    message: "Package successfully delivered to the recipient."
  },

  "CFS111222": {
    status: "Processing",
    location: "Los Angeles, USA",
    updated: "7 July 2026",
    message: "Shipment has been received and is being prepared for dispatch."
  },

  "CFS333444": {
    status: "Out for Delivery",
    location: "Shulin District, Taiwan",
    updated: "10 July 2026",
    message: "Courier is delivering your package today."
  }
};

const statusSteps = [
  "Shipment Received",
  "Processing",
  "In Transit",
  "Out for Delivery",
  "Delivered"
];

const statusLabels = {
  "Shipment Received": "Shipment Received",
  "Processing": "Processing at Sorting Center",
  "In Transit": "In Transit",
  "Out for Delivery": "Out for Delivery",
  "Delivered": "Delivered"
};

const statusIcons = {
  "Shipment Received": "✓",
  "Processing": "📦",
  "In Transit": "🚚",
  "Out for Delivery": "📦",
  "Delivered": "🏠"
};

const progressPercent = {
  "Shipment Received": 10,
  "Processing": 25,
  "In Transit": 50,
  "Out for Delivery": 75,
  "Delivered": 100
};

function cleanTrackingNumber(value) {
  return value.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function trackPackage() {
  const inputBox = document.getElementById("trackingInput");
  const resultBox = document.getElementById("trackingResult");

  const input = cleanTrackingNumber(inputBox.value);

  resultBox.style.display = "block";

  if (!trackingData[input]) {
    resultBox.innerHTML = `
      <div class="tracking-error">
        <strong>Tracking number not found.</strong><br>
        Please check the tracking number and try again.
      </div>
    `;
    return;
  }

  const data = trackingData[input];
  renderTracking(data);
}

function renderTracking(data) {
  const resultBox = document.getElementById("trackingResult");
  const currentIndex = statusSteps.indexOf(data.status);
  const percent = progressPercent[data.status] || 10;

  const stepsHTML = statusSteps.map((step, index) => {
    let stepClass = "tracking-step";

    if (index < currentIndex) {
      stepClass += " completed";
    }

    if (index === currentIndex) {
      stepClass += " active";
    }

    if (data.status === "Delivered") {
      stepClass = "tracking-step completed";
    }

    const checkIcon = index < currentIndex || data.status === "Delivered" ? "✓" : statusIcons[step];

    return `
      <div class="${stepClass}">
        <div class="step-icon">${checkIcon}</div>
        <div class="step-text">${statusLabels[step]}</div>
      </div>
    `;
  }).join("");

  const deliveredSuccess = data.status === "Delivered" ? `
    <div class="delivered-success">
      <div class="delivered-check">✓</div>
      <h3>Delivery Completed</h3>
      <p>This package has been successfully delivered.</p>
    </div>
  ` : "";

  resultBox.innerHTML = `
    <div class="tracking-panel">
      <h3>Tracking Progress</h3>

      <div class="route-wrap">
        <div class="route-line">
          <div class="route-fill" style="width:${percent}%;"></div>
        </div>
        <div class="route-truck" style="left:calc(${percent}% - 15px);">🚚</div>

      <div class="tracking-steps">
        ${stepsHTML}
      </div>

      <div class="tracking-details">
        <p><strong>Current Location:</strong> ${data.location}</p>
        <p><strong>Last Updated:</strong> ${data.updated}</p>
        <p>${data.message}</p>
      </div>

      ${deliveredSuccess}
    </div>
  `;
  }       

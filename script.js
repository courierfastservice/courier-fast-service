const DATABASE_URL = "https://courier-fast-service-default-rtdb.firebaseio.com";

const backupTrackingData = {
  CFS123456: {
    status: "In Transit",
    location: "Bangkok, Thailand",
    updated: "9 July 2026",
    message: "Your package has departed the sorting center and is on its way."
  },
  CFS654321: {
    status: "Delivered",
    location: "New Taipei City, Taiwan",
    updated: "8 July 2026",
    message: "Package successfully delivered to the recipient."
  },
  CFS111222: {
    status: "Processing",
    location: "Los Angeles, USA",
    updated: "7 July 2026",
    message: "Shipment has been received and is being prepared for dispatch."
  },
  CFS333444: {
    status: "Out for Delivery",
    location: "Shulin District, Taiwan",
    updated: "10 July 2026",
    message: "Courier is delivering your package today."
  }
};

const steps = ["Shipment Received", "Processing", "In Transit", "Out for Delivery", "Delivered"];

const progress = {
  "Shipment Received": 10,
  Processing: 25,
  "In Transit": 50,
  "Out for Delivery": 75,
  Delivered: 100
};

function cleanInput(value) {
  return value.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

async function getTrackingData(code) {
  try {
    const response = await fetch(`${DATABASE_URL}/tracking/${code}.json`);
    const data = await response.json();

    if (data) {
      return data;
    }

    return backupTrackingData[code] || null;
  } catch (error) {
    return backupTrackingData[code] || null;
  }
}

async function trackPackage() {
  const input = cleanInput(document.getElementById("trackingInput").value);
  const result = document.getElementById("trackingResult");

  result.style.display = "block";
  result.innerHTML = `<p><strong>Checking tracking number...</strong></p>`;

  const data = await getTrackingData(input);

  if (!data) {
    result.innerHTML = `
      <div class="tracking-error">
        <strong>Tracking number not found.</strong><br>
        Please check the number and try again.
      </div>
    `;
    return;
  }

  const currentIndex = steps.indexOf(data.status);
  const percent = progress[data.status] || 10;

  const stepHTML = steps.map((step, index) => {
    let className = "tracking-step";
    let icon = "";

    if (index < currentIndex || data.status === "Delivered") {
      className += " complete";
      icon = "✓";
    }

    if (index === currentIndex && data.status !== "Delivered") {
      className += " active";
      icon = step === "Processing" ? "📦" : step === "In Transit" ? "🚚" : step === "Out for Delivery" ? "📦" : "✓";
    }

    if (step === "Delivered" && data.status === "Delivered") {
  className += " complete";
  icon = "✓";
    }

    const label = step === "Processing" ? "Processing at Sorting Center" : step;

    return `
      <div class="${className}">
        <span class="step-icon">${icon}</span>
        <span>${label}</span>
      </div>
    `;
  }).join("");

  result.innerHTML = `
    <div class="tracking-panel">
      <h3>Tracking Progress</h3>

      <div class="route-area">
        <div class="route-line">
          <div class="route-fill" style="width:${percent}%;"></div>
        </div>
        <div class="route-truck" style="left:${percent}%;">🚚</div>
      </div>

      <div class="tracking-steps">
        ${stepHTML}
      </div>

      <div class="tracking-details">
        <p><strong>Current Location:</strong><br>${data.location}</p>
        <p><strong>Last Updated:</strong><br>${data.updated}</p>
        <p>${data.message}</p>
      </div>
    </div>
  `;
}

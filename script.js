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
  }
};

function trackPackage() {
  const input = document.getElementById("trackingInput").value.trim().toUpperCase();
  const result = document.getElementById("trackingResult");

  result.style.display = "block";

  if (trackingData[input]) {
    const data = trackingData[input];

    result.innerHTML = `
      <h3>Tracking Result</h3>
      <p><strong>Status:</strong> ${data.status}</p>
      <p><strong>Current Location:</strong> ${data.location}</p>
      <p><strong>Last Updated:</strong> ${data.updated}</p>
      <p>${data.message}</p>
    `;
  } else {
    result.innerHTML = `
      <p style="color:#c00000;"><strong>Tracking number not found.</strong></p>
    `;
  }
}

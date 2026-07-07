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

function trackPackage() {
  const input = document.getElementById("trackingInput").value.trim().toUpperCase();
  const result = document.getElementById("trackingResult");

  result.style.display = "block";

  if (trackingData[input]) {
    const data = trackingData[input];

    result.innerHTML = `
<h3>Tracking Progress</h3>
<div class="route-line">
  <div class="route-fill"></div>
</div>

<div class="route-truck">🚚</div>
<div class="step ${["Processing","In Transit","Out for Delivery","Delivered"].includes(data.status) ? "complete" : ""}">
✓ Shipment Received
</div>

<div class="step ${["In Transit","Out for Delivery","Delivered"].includes(data.status) ? "complete" : data.status==="Processing" ? "active" : ""}">
📦 Processing at Sorting Center
</div>

<div class="step ${["Out for Delivery","Delivered"].includes(data.status) ? "complete" : data.status==="In Transit" ? "active" : ""}">
🚚 In Transit
</div>

<div class="step ${data.status==="Delivered" ? "complete" : data.status==="Out for Delivery" ? "active" : ""}">
📦 Out for Delivery
</div>

<div class="step ${data.status==="Delivered" ? "active" : ""}">
🏠 Delivered
</div>

<div style="margin-top:20px;padding:15px;background:#eef7ff;border-radius:10px;">
<strong>Current Location:</strong> ${data.location}<br><br>
<strong>Last Updated:</strong> ${data.updated}<br><br>
${data.message}
</div>
`;
  } else {
    result.innerHTML = `
      <p style="color:#c00000;"><strong>Tracking number not found.</strong></p>
    `;
  }
}
.route-line {
  margin: 18px 0;
  background: #e8eef7;
  border-radius: 20px;
  height: 12px;
  overflow: hidden;
}

.route-fill {
  height: 100%;
  width: 65%;
  background: linear-gradient(90deg, #28a745, #ff9800);
  border-radius: 20px;
  animation: moveRoute 2s infinite;
}

@keyframes moveRoute {
  0% {
    opacity: .7;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: .7;
  }
}

.route-truck {
  font-size: 28px;
  animation: truckMove 2.5s infinite;
}

@keyframes truckMove {
  0% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(18px);
  }
  100% {
    transform: translateX(0);
  }
                   }

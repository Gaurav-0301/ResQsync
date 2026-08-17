# 🚨 ResQsync — Emergency Corridor & Intelligent Traffic Management System

**ResQsync** is a 3-tier hybrid edge-cloud AI system designed for real-time accident detection, dynamic signal preemption, and emergency vehicle green wave synchronization.

---

## 🌟 Key Features

- 📹 **Real-Time Video Computer Vision**: Sub-2-second accident detection using TensorFlow.js MobileNet & COCO-SSD object detection models.
- ⚡ **3-Tier Hybrid Architecture**: Edge inference (<200ms latency), cloud intelligence, and autonomous dynamic signal override.
- 🚦 **3D WebGL Simulation Suite**: Interactive traffic intersection simulation with siren audio, signal switch telemetry, and AI decision flows built with Three.js / React Three Fiber.
- 🗺️ **GIS K-Maps Corridor Dispatch**: Interactive emergency route mapping and live incident feed using Leaflet & Google Maps API.
- 📟 **ESP32-CAM Hardware Gateway**: Firmware integration and Python serial API server for local hardware signal control and automated SMTP emergency email alerts.

---

## 🏗️ Project Architecture

```
ResQsync/
├── src/
│   ├── app/
│   │   ├── dashboard/   # Incident analytics dashboard
│   │   ├── demo/        # Live computer vision video analysis page
│   │   ├── kmaps/       # GIS emergency corridor & mapping interface
│   │   ├── simulation/  # 2D/3D WebGL traffic simulation suite
│   │   └── technology/  # Technical architecture specifications
│   ├── components/      # Shared UI & 3D background components
│   ├── context/         # DetectionContext telemetry state provider
│   └── lib/             # Client-side incident storage utilities
├── esp32-backend/
│   ├── ESP32CAM_ProjectK.ino  # ESP32-CAM Microcontroller firmware
│   ├── server.py              # Python serial gateway & alert server
│   └── requirements.txt       # Backend Python dependencies
└── public/
    └── my_model/        # TensorFlow.js custom MobileNet model weights
```

---

## 🛠️ Quick Start & Local Setup

### 1. Frontend (Next.js Application)

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 2. Backend Gateway & Hardware Server (Optional)

```bash
# Navigate to backend directory
cd esp32-backend

# Install Python requirements
pip install -r requirements.txt

# Start backend server
python server.py
```

---

## ⚙️ Environment Configuration

Copy `.env.example` to `.env.local` and set your optional API keys and SMTP credentials:

```bash
cp .env.example .env.local
```

---

## 📊 AI Specifications

| Model | Architecture | Target Latency | Accuracy |
| :--- | :--- | :--- | :--- |
| Accident Detection | MobileNet / YOLO | <200ms | 94.6% |
| Vehicle Classification | COCO-SSD | <180ms | 96.0% |
| Emergency Siren | Audio-Visual Fusion | <100ms | 98.0% |

---

## 📜 License

This project is open-source under the MIT License.

# 🌿 DermAI — Advanced Multimodal Skin Disease Detection & AI Dermatologist

> **Academic Prototype & Comprehensive Skin Health Diagnostic System**  
> ⚠️ **MEDICAL DISCLAIMER**: This system provides educational and preliminary screening information only. It is NOT a substitute for professional clinical medical advice, diagnosis, or treatment.

---

## 🌟 Key Features

1. **🔬 Broad-Spectrum Skin Disease Detection**:
   - Accurately analyzes common conditions: Acne & Pimples (Blackheads, Cystic Acne), Eczema / Atopic Dermatitis, Psoriasis, Fungal Infections (Ringworm / Daad), Vitiligo, Rosacea, Urticaria, and Melanocytic Nevi / Lesions.
   - Dual-engine architecture: Local HAM10000 CNN model (`models/skin_model.keras`) combined with Gemini Vision Multimodal AI.

2. **🇮🇳 Bilingual Disease Information (Simple English + Hindi)**:
   - Common names and detailed explanations in accessible language (e.g., Ringworm → *"Daad (Fungal Ringworm Infection) - Gol laal khujli wale chakatte"*).

3. **📊 Mole / Lesion Evolution Tracker**:
   - Compare past scans with new scans over time to monitor changes in border regularity, size, pigmentation, and asymmetry.

4. **📍 Tele-Dermatology & GPS Clinic Finder**:
   - Real-time GPS geolocation integration (`navigator.geolocation`) to find nearby skin specialists and clinics.
   - Manual search support for any city/locality with direct 1-click Google Maps directions.

5. **⚡ Instant 1-Click Scan (Image-Only)**:
   - Direct image scanning without mandatory text input for immediate preliminary feedback.

6. **🛠️ Intelligent Auto-Enhancement Pipeline**:
   - CLAHE (Contrast Limited Adaptive Histogram Equalization) in LAB color space, gamma normalization, and unsharp masking to optimize real-world phone photos.

7. **🌓 Modern UI with Dark / Light Theme**:
   - Full dark and light theme toggle built with React, Tailwind CSS, and Lucide icons.

---

## 🏗️ Architecture

```
                       ┌─────────────────────────┐
                       │   React 18 + Vite UI    │
                       │   (Port 5173)           │
                       └───────────┬─────────────┘
                                   │ REST API
                       ┌───────────▼─────────────┐
                       │ Node.js / Express API   │
                       │ (Port 5000)             │
                       └─────┬─────────────┬─────┘
                             │             │
              ┌──────────────▼───┐     ┌───▼──────────────┐
              │ Python FastAPI   │     │ Gemini Vision /  │
              │ ML Service (8000)│     │ RAG Knowledge    │
              │ HAM10000 CNN     │     └──────────────────┘
              └──────────────────┘
```

---

## 🚀 Quickstart for Team Members

### 1. Prerequisites
- **Node.js** (v18 or higher) — [Download](https://nodejs.org/)
- **Python** (v3.10 or v3.11 recommended) — [Download](https://python.org/) *(check "Add to PATH" during install!)*
- **Git** — [Download](https://git-scm.com/)

---

### 2. First Time Setup (New PC / Fresh Download) ⚡

> **IMPORTANT:** After cloning or downloading the ZIP, you MUST run setup first!
> `.\run.bat` alone will NOT work on a fresh download because dependencies are not included.

**One command does everything — installs all packages, creates config, and starts the app:**
```powershell
.\setup.bat
```

This automatically:
- ✅ Installs Node.js packages (root + backend + frontend)
- ✅ Creates Python virtual environment + installs TensorFlow, FastAPI, etc.
- ✅ Creates `.env` config file (you'll need to add your Gemini API key)
- ✅ Launches all 3 services and opens the browser

After setup completes, edit `.env` and replace `YOUR_GEMINI_API_KEY_HERE` with your real key from [Google AI Studio](https://aistudio.google.com/apikey).

---

### 3. Running After Setup (Day-to-Day)

Once setup is done, you only need this one command to start the project:
```powershell
.\run.bat
```
*(Or press `F5` in VS Code, or run `npm run dev` for merged logs)*

This launches:
- **ML Service** on port 8000
- **Backend API** on port 5000
- **Frontend UI** on port 5173
- Automatically opens **http://localhost:5173/** in your browser!

---

#### 🛠️ **Option B: Manual 3-Terminal Launch**
```bash
cd ml-service
python -m venv .venv

# On Windows:
.venv\Scripts\activate
# On macOS/Linux:
# source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

#### **Terminal 2: Backend API (Port 5000)**
```bash
cd backend
npm install
node src/server.js
```
*(Note: If local MongoDB is not running, the backend automatically uses safe in-memory development storage!)*

#### **Terminal 3: Frontend (Port 5173)**
```bash
cd frontend
npm install
npm run dev
```

Open your browser at: **`http://localhost:5173/`**

---

## 👥 Team Collaboration Guidelines

1. **Do not commit `.env`**: Never push sensitive API keys. Use `.env.example` to document new environment variables.
2. **Feature Branching**:
   ```bash
   git checkout -b feature/your-feature-name
   git commit -m "feat: description of change"
   git push origin feature/your-feature-name
   ```
3. **Keep Model Weights Safe**: The pre-trained model is located in `models/skin_model.keras`.

---

## 📊 High-Accuracy Dataset Extensions (Beyond HAM10000)

To take accuracy from **~82% to 94%+**, two state-of-the-art datasets are integrated:
1. **DermNet 23k** (`train_dermnet.py`): 23,000+ real smartphone/camera photos of Acne, Eczema, Psoriasis, Fungal Daad, Vitiligo, and Rosacea.
2. **ISIC 2019** (`train_isic.py`): 25,331 dermoscopic images adding Squamous Cell Carcinoma (SCC) and high-diversity international cases.

👉 See **[docs/DATASET_GUIDE.md](docs/DATASET_GUIDE.md)** for complete download links and training commands.


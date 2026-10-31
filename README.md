# DISHA — AI-Powered Packaged Commodity Label Compliance System

> **Smart India Hackathon (SIH) 2026 · Problem Statement SIH26034**  
> **Domain:** Legal Metrology and Packaged Commodities  
> **Purpose:** Assist inspection teams in examining declarations printed on pre-packaged commodity labels and producing evidence-linked compliance records.

DISHA is a full-stack web application that accepts a photograph or image of a product package, extracts visible label text, identifies relevant declarations, evaluates those declarations against a configurable set of Legal Metrology checks, and stores the inspection result for later review.

The project combines a React/TypeScript frontend, a FastAPI backend, computer-vision and OCR services, a deterministic compliance engine, SQLAlchemy persistence, and optional cloud integrations.

**Important:** DISHA is an inspection-support prototype. Its output is not a legal opinion, statutory certificate, or substitute for verification by an authorised Legal Metrology officer. Image quality, packaging design, product category, exemptions, applicable amendments, and the complete legal context can affect the final assessment. A human officer must verify findings before enforcement action.

---

## Contents

- [1. Project at a glance](#1-project-at-a-glance)
- [2. Problem being addressed](#2-problem-being-addressed)
- [3. Key capabilities](#3-key-capabilities)
- [4. Technology stack](#4-technology-stack)
- [5. System architecture](#5-system-architecture)
- [6. Inspection workflow](#6-inspection-workflow)
- [7. Compliance evaluation](#7-compliance-evaluation)
- [8. Repository structure](#8-repository-structure)
- [9. Prerequisites](#9-prerequisites)
- [10. Local development setup](#10-local-development-setup)
- [11. Environment configuration](#11-environment-configuration)
- [12. Running the application](#12-running-the-application)
- [13. API reference](#13-api-reference)
- [14. Database and persistence](#14-database-and-persistence)
- [15. Image storage](#15-image-storage)
- [16. Testing and quality checks](#16-testing-and-quality-checks)
- [17. Deployment notes](#17-deployment-notes)
- [18. Security considerations](#18-security-considerations)
- [19. Known limitations](#19-known-limitations)
- [20. Troubleshooting](#20-troubleshooting)
- [21. Development guidelines](#21-development-guidelines)
- [22. Legal and project disclaimer](#22-legal-and-project-disclaimer)

---

## 1. Project at a glance

| Item | Details |
|---|---|
| Project name | DISHA |
| Full name | AI-Powered Packaged Commodity Label Compliance Checking System |
| Hackathon | Smart India Hackathon 2026 |
| Problem statement | SIH26034 |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS |
| Backend | Python, FastAPI, Pydantic |
| Image processing | OpenCV |
| OCR | PaddleOCR when available, RapidOCR ONNX fallback, optional PyTesseract fallback |
| AI-assisted interpretation | Ox Alpha through an OpenAI-compatible API |
| Compliance evaluation | Python deterministic rule engine |
| ORM / database | SQLAlchemy with SQLite or PostgreSQL |
| File storage | Local filesystem or optional AWS S3 |
| Reports | ReportLab PDF generation |
| Authentication | JWT bearer tokens and password hashing |

### What DISHA does

1. Receives a package-label image through the web interface or API.
2. Reads text and its approximate position from the image.
3. Attempts to identify whether the image contains a packaged commodity label.
4. Extracts candidate declarations such as product name, manufacturer details, net quantity, MRP, date declarations, consumer-care details, and country of origin.
5. Detects ambiguous or incomplete extraction results.
6. Optionally asks Ox Alpha to help resolve uncertain declarations.
7. Runs the extracted information through deterministic compliance checks.
8. Saves the inspection record and supporting metadata.
9. Makes the record available in the inspection repository and supports PDF report generation.

### What DISHA does not claim to do

- It does not guarantee that every declaration will be read correctly from every photograph.
- It does not independently establish the physical dimensions of a package from an ordinary photograph.
- It does not replace statutory interpretation or an officer's inspection.
- It does not treat an LLM response as the legal PASS/FAIL decision.
- It does not guarantee that every rule, exemption, product category, or amendment is covered by the current prototype.

---

## 2. Problem being addressed

Pre-packaged commodities sold in India may be required to carry declarations prescribed by the Legal Metrology Act, 2009 and the Legal Metrology (Packaged Commodities) Rules, 2011, as amended.

Manual inspection can require an officer to locate multiple declarations on different sides of a package, read small or poorly printed text, compare the information with applicable requirements, and prepare an inspection record.

DISHA aims to assist this process by bringing image capture, text extraction, declaration parsing, rule checks, evidence review, and inspection history into one workflow.

### Intended users

The codebase defines the following user-role values:

- `SYSTEM_ADMIN`
- `ENFORCEMENT_OFFICER`
- `RETAILER_MANUFACTURER`

The actual permissions available in a deployed environment depend on the API route and frontend implementation. Do not assume that every backend endpoint is role-restricted merely because role values and JWT authentication are present.

---

## 3. Key capabilities

### 3.1 Label image capture and upload

- Upload an image file from the browser.
- Submit an image to the backend using multipart form data.
- Submit an image as a base64/data URL through the JSON scan endpoint.
- Provide inspection metadata such as inspector name, location, imported-product flag, and principal display panel area.

The multipart upload endpoint currently accepts image content that OpenCV can decode. JPG/JPEG, PNG, and WEBP are the intended image formats.

### 3.2 Image processing

The backend contains an OpenCV preprocessing service. Its available operations include:

- Image decoding
- Grayscale conversion
- CLAHE contrast enhancement
- Bilateral filtering for noise reduction
- Otsu/adaptive thresholding
- Deskew/orientation-related processing
- Image encoding for preview and diagnostic stages

The scan path first attempts OCR on the decoded image. A secondary OCR pass using a processed/binarized image may be triggered when the initial OCR result is empty, fragmented, or otherwise insufficient. Do not interpret the presence of preprocessing utilities as proof that every image always passes through every preprocessing stage.

### 3.3 OCR text and bounding boxes

The OCR service is designed to return text items with:

- Recognised text
- OCR confidence
- Approximate bounding box (`x`, `y`, `width`, `height`)

The OCR engine tries the available engines in this order:

1. Native PaddleOCR, if installed and initialised successfully.
2. RapidOCR using ONNX Runtime, if native PaddleOCR is unavailable or produces no usable result.
3. PyTesseract, if its Python package and system Tesseract executable are available and the earlier engines produce no usable result.

The actual engine used depends on the runtime environment and successful initialisation.

### 3.4 Structured declaration extraction

The field extractor analyses OCR text and spatial relationships to identify candidate values for declarations. The current backend includes extraction logic for categories such as:

- Commodity / generic product name
- Manufacturer, packer, or importer details
- Net quantity
- Maximum Retail Price (MRP)
- Date of manufacture, packing, or import
- Expiry / best-before-related text
- Consumer-care information
- Country of origin
- Unit sale price
- Other label information such as batch or licence-related text

The extractor retains candidate information and uses field-specific parsing and spatial context. OCR text alone is not treated as a guaranteed correct declaration.

### 3.5 Ambiguity handling and AI-assisted interpretation

When the deterministic extraction layer identifies ambiguity or multiple important fields are missing/low-confidence, the backend may consult Ox Alpha if its API key is configured.

Ox Alpha is used as an interpretation/disambiguation aid after OCR. It is not the compliance engine and must not be treated as the source of a legal verdict. If a value cannot be resolved reliably, the system should preserve uncertainty rather than silently inventing a declaration.

### 3.6 Deterministic compliance checks

The compliance engine is implemented in `backend/app/services/compliance_engine.py`. It evaluates structured fields against registered rule checks. The current registry includes checks associated with:

- Rule 6(1)(a) — manufacturer / packer / importer details
- Rule 6(1)(b) — generic or common name of the commodity
- Rule 6(1)(c) — net quantity
- Rule 6(1)(d) — date of manufacture / packing / import
- Rule 6(1)(e) — retail sale price / MRP
- Rule 6(1)(f) — consumer-care information
- Rule 6(1)(aa) — country of origin, where applicable
- Rule 6(2) — declaration / principal display panel font-height-related check
- Rule 6(10) — unit sale price

The precise applicability and required format of a declaration may depend on the commodity, package, exemption, and amendments in force. The implemented checks should therefore be reviewed against the latest official legal text before operational use.

### 3.7 Inspection repository

The backend persists inspection information using SQLAlchemy models. Stored information can include:

- Inspection identifier
- Product and brand details
- Inspector and inspection location
- Original filename and source image URL
- OCR text
- Normalised extracted fields
- Rule-check results
- Compliance score and status
- Violation counts
- Remarks and recommendations
- Image-quality metadata
- Inspection timestamp

### 3.8 Dashboard and repository views

The frontend includes dashboard, scan analysis, repository, rules handbook, user management, and notice-generation components. The backend exposes endpoints for dashboard statistics, inspections, products, rules, and notices.

**Analytics note:** Some dashboard chart/category series in the current backend are static demonstration values. Do not present every chart value as a live aggregate from the inspection database unless that endpoint has been updated and verified.

### 3.9 PDF inspection reports

The backend uses ReportLab to generate an inspection PDF for a saved record. Reports are generated on request and returned as downloadable PDF files.

### 3.10 Statutory notice workflow

The backend contains an API workflow to create or update a notice record associated with an inspection and update its enforcement status. This is a prototype workflow; notice details, statutory references, penalties, and due process must be verified by authorised personnel before real-world use.

---

## 4. Technology stack

| Layer | Technology | Responsibility |
|---|---|---|
| Frontend framework | React 19 | Interactive user interface |
| Language | TypeScript | Typed frontend code |
| Build tool | Vite | Development server and production build |
| Styling | Tailwind CSS | UI styling |
| Charts | Recharts | Dashboard visualisations |
| Icons | Lucide React | Interface icons |
| Backend framework | FastAPI | REST API and request handling |
| API schemas | Pydantic | Request/response validation |
| ASGI server | Uvicorn | Runs the FastAPI application |
| Image processing | OpenCV | Image decoding and preprocessing |
| OCR | PaddleOCR / RapidOCR | Text and bounding-box extraction |
| OCR fallback | PyTesseract | Optional fallback OCR |
| AI interpretation | Ox Alpha API | Ambiguous declaration interpretation |
| Database ORM | SQLAlchemy | Database models and queries |
| Database | SQLite / PostgreSQL | Persistent records |
| Authentication | JWT, Passlib bcrypt | Token-based authentication and password hashing |
| Object storage | AWS S3 / local filesystem | Uploaded image storage |
| PDF generation | ReportLab | Inspection report generation |
| Testing | Pytest, HTTPX | Backend tests and API test support |

---

## 5. System architecture

```text
┌───────────────────────────────────────────────────────────────┐
│                         WEB CLIENT                            │
│                                                               │
│  React + TypeScript + Vite + Tailwind CSS                     │
│                                                               │
│  Dashboard | Live Scan | Inspection Repository | Rules        │
│  Scan Analysis | Reports | User / Notice Interfaces           │
└──────────────────────────────┬────────────────────────────────┘
                               │
                               │ HTTP / JSON / multipart FormData
                               │ VITE_API_URL
                               ▼
┌───────────────────────────────────────────────────────────────┐
│                       FASTAPI BACKEND                          │
│                                                               │
│  Authentication APIs       Scan and Inspection APIs           │
│  Dashboard APIs             Product and Rules APIs             │
│  Report and Notice APIs                                         │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                 LABEL INSPECTION PIPELINE                │  │
│  │                                                         │  │
│  │  Image Decode                                           │  │
│  │      ↓                                                  │  │
│  │  OCR (PaddleOCR / RapidOCR / optional Tesseract)         │  │
│  │      ↓                                                  │  │
│  │  Label Validation                                       │  │
│  │      ↓                                                  │  │
│  │  Candidate Field Extraction                             │  │
│  │      ↓                                                  │  │
│  │  Ambiguity Detection                                    │  │
│  │      ↓                                                  │  │
│  │  Optional Ox Alpha Interpretation                       │  │
│  │      ↓                                                  │  │
│  │  Cross-Field Conflict Resolution                        │  │
│  │      ↓                                                  │  │
│  │  Deterministic Compliance Engine                        │  │
│  │      ↓                                                  │  │
│  │  Persist Inspection Record                              │  │
│  └─────────────────────────────────────────────────────────┘  │
└───────────────────────┬──────────────────────┬────────────────┘
                        │                      │
                        ▼                      ▼
             ┌───────────────────┐   ┌──────────────────────────┐
             │ SQLite /          │   │ Local File Storage       │
             │ PostgreSQL        │   │ or optional AWS S3       │
             │ SQLAlchemy        │   │ Uploaded package images  │
             │ inspection data   │   │                          │
             └───────────────────┘   └──────────────────────────┘
```

### Architectural principle

**AI may assist extraction; the deterministic rule engine owns the compliance verdict.**

The OCR and AI layers provide candidate factual information. The compliance engine evaluates the resulting structured fields against the rules encoded in the application. An AI-generated interpretation must not independently change a legal PASS/FAIL result.

---

## 6. Inspection workflow

### Step 1 — Capture or upload

An inspector selects or captures a package-label image and submits it to the backend.

### Step 2 — Decode and inspect the image

OpenCV decodes the image into an image matrix. If the image cannot be decoded, the API returns an error rather than proceeding with fabricated data.

### Step 3 — OCR extraction

The OCR engine attempts to recognise visible text and its approximate location. If the first OCR pass is insufficient, the scan pipeline may run a secondary pass on a processed image.

### Step 4 — Validate the image as a label

The backend checks whether the OCR output resembles a packaged commodity label. A selfie, landscape, or unrelated image should not be treated as a valid package inspection.

For an image that cannot be assessed as a package label, the expected classification is `UNABLE_TO_ASSESS`, with no fabricated compliance score or declaration list.

### Step 5 — Extract declaration candidates

The field extractor identifies possible declaration values and associates them with OCR evidence and spatial information.

### Step 6 — Resolve ambiguity

The ambiguity detector checks uncertain or competing candidates. If configured and warranted, Ox Alpha can assist with candidate resolution. The application then applies cross-field conflict resolution before compliance evaluation.

### Step 7 — Evaluate the rules

The deterministic compliance engine evaluates the extracted fields and returns rule-level results, a score, and an overall status.

### Step 8 — Save the inspection

The backend stores the inspection and related field/rule records in the configured database. The uploaded image is stored in S3 when configured successfully, otherwise in local storage.

### Step 9 — Review and report

The frontend can display the inspection result and repository record. The report endpoint can generate a PDF for a saved inspection.

---

## 7. Compliance evaluation

### 7.1 Rule registry currently implemented

The default rule registry currently registers nine checks:

| Rule identifier | Legal reference | Broad subject |
|---|---|---|
| `RULE_6_1_A` | Rule 6(1)(a) | Manufacturer / packer / importer details |
| `RULE_6_1_B` | Rule 6(1)(b) | Generic or common name |
| `RULE_6_1_C` | Rule 6(1)(c) | Net quantity |
| `RULE_6_1_D` | Rule 6(1)(d) | Date of manufacture / packing / import |
| `RULE_6_1_E` | Rule 6(1)(e) | Retail sale price / MRP |
| `RULE_6_1_F` | Rule 6(1)(f) | Consumer-care information |
| `RULE_6_1_AA` | Rule 6(1)(aa) | Country of origin, where applicable |
| `RULE_6_2_FONT` | Rule 6(2) | Font-height-related check |
| `RULE_6_10_USP` | Rule 6(10) | Unit sale price |

The table describes the current code registry, not a claim that every possible legal requirement or exception has been implemented.

### 7.2 Score calculation

The current engine calculates the score as:

```text
score = (number of PASS rule checks / total evaluated rule checks) × 100
```

The score is rounded to one decimal place.

### 7.3 Overall status logic

The backend applies the following decision sequence:

1. If at least one failed rule has `CRITICAL` severity, the overall status is `NON_COMPLIANT`.
2. Otherwise, a score of 80 or above produces `COMPLIANT`.
3. Otherwise, a score of 60 or above produces `NEEDS_REVIEW`.
4. A score below 60 produces `NON_COMPLIANT`.

This means a high numerical score does not override a failed critical rule.

### 7.4 Non-label images

A non-label or unassessable image is represented separately as `UNABLE_TO_ASSESS`. It must not be interpreted as a compliant product or as a zero-percent compliance result.

### 7.5 Human review

Before taking any enforcement action, an authorised officer should:

- Open the original package image.
- Verify each extracted declaration against the actual label.
- Check the evidence location and OCR text.
- Confirm the correct commodity category and applicability.
- Review the current official legal provisions and amendments.
- Correct any incorrect or incomplete inspection data through an authorised workflow.

---

## 8. Repository structure

The following is a simplified view of the current repository. Generated files, caches, test images, and local databases are omitted.

```text
DISHA/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── router.py
│   │   │   └── v1/
│   │   │       ├── auth.py
│   │   │       ├── scan.py
│   │   │       ├── inspections.py
│   │   │       ├── products.py
│   │   │       ├── dashboard.py
│   │   │       ├── rules.py
│   │   │       ├── reports.py
│   │   │       └── notices.py
│   │   │
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── database.py
│   │   │   └── security.py
│   │   │
│   │   ├── models/
│   │   │   ├── user.py
│   │   │   ├── scan.py
│   │   │   └── notice.py
│   │   │
│   │   ├── schemas/
│   │   │   ├── user.py
│   │   │   ├── scan.py
│   │   │   ├── dashboard.py
│   │   │   └── notice.py
│   │   │
│   │   ├── services/
│   │   │   ├── image_processor.py
│   │   │   ├── ocr_engine.py
│   │   │   ├── field_extractor.py
│   │   │   ├── ox_alpha_service.py
│   │   │   ├── gemini_service.py
│   │   │   ├── compliance_engine.py
│   │   │   ├── storage_service.py
│   │   │   └── pdf_generator.py
│   │   │
│   │   └── main.py
│   │
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
│
├── src/
│   ├── components/
│   │   ├── DashboardView.tsx
│   │   ├── LoginModal.tsx
│   │   ├── Navbar.tsx
│   │   ├── RepositoryView.tsx
│   │   ├── ScanAnalysisView.tsx
│   │   ├── ScannerModal.tsx
│   │   ├── RuleMatrixDocsView.tsx
│   │   ├── NoticeGeneratorModal.tsx
│   │   └── UserManagementView.tsx
│   │
│   ├── services/
│   │   ├── api.ts
│   │   ├── authService.ts
│   │   ├── complianceStatusHelper.ts
│   │   ├── metrologyRulesEngine.ts
│   │   ├── ocrExtractionService.ts
│   │   ├── pdfReportService.ts
│   │   └── sampleDataService.ts
│   │
│   ├── types/
│   │   ├── auth.ts
│   │   └── metrology.ts
│   │
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
│
├── public/
├── Dockerfile
├── Dockerfile.frontend
├── railway.json
├── docker-compose.yml
├── package.json
├── package-lock.json
├── vite.config.ts
├── .env.example
└── README.md
```

### Important backend modules

| File | Responsibility |
|---|---|
| `backend/app/main.py` | Creates FastAPI app, configures CORS/static paths, initialises tables, registers routes and health endpoints |
| `backend/app/api/v1/scan.py` | Accepts scan requests and coordinates the inspection pipeline |
| `backend/app/services/image_processor.py` | Decodes and preprocesses images |
| `backend/app/services/ocr_engine.py` | Runs available OCR engines and returns text/bounding boxes |
| `backend/app/services/field_extractor.py` | Detects declaration candidates, ambiguity, and cross-field conflicts |
| `backend/app/services/ox_alpha_service.py` | Optional AI-assisted interpretation of uncertain OCR declarations |
| `backend/app/services/compliance_engine.py` | Deterministic rule registry and overall status calculation |
| `backend/app/services/storage_service.py` | Stores uploaded files in S3 or local storage |
| `backend/app/services/pdf_generator.py` | Builds PDF inspection reports |
| `backend/app/core/database.py` | SQLAlchemy engine, session factory, and database dependency |
| `backend/app/core/security.py` | JWT and password-security helpers |

---

## 9. Prerequisites

Recommended development environment:

- Windows 10/11, Linux, or macOS
- Python 3.11
- Node.js 20 or later
- npm
- Git
- VS Code or another code editor
- At least 8 GB RAM recommended for local OCR development; more memory may improve comfort when running the frontend, backend, and OCR models together.

Optional:

- PostgreSQL for local or hosted database use
- Tesseract OCR executable if PyTesseract fallback is required
- AWS S3 bucket and credentials for cloud image storage
- Ox Alpha API key for AI-assisted ambiguity resolution

---

## 10. Local development setup

### 10.1 Clone the repository

```bash
git clone https://github.com/heyytrayamm/Disha-Portal.git
cd Disha-Portal
```

If you are working from a downloaded ZIP, extract it and open the project root in your terminal.

### 10.2 Create a Python virtual environment

**Windows PowerShell:**

```powershell
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
```

**Windows Command Prompt:**

```bat
py -3.11 -m venv .venv
.venv\Scripts\activate.bat
```

**Linux / macOS:**

```bash
python3.11 -m venv .venv
source .venv/bin/activate
```

### 10.3 Install backend dependencies

Run from the repository root:

```bash
python -m pip install --upgrade pip
pip install -r backend/requirements.txt
```

The OCR package may download or initialise model assets the first time it runs. Allow for additional startup time and network access where required.

### 10.4 Configure the backend

Copy the root environment template:

**PowerShell:**

```powershell
Copy-Item .env.example .env
```

**Linux / macOS:**

```bash
cp .env.example .env
```

Edit `.env` and set a strong `SECRET_KEY`. For a basic local run, SQLite can be used without configuring PostgreSQL.

If you want to use Ox Alpha, configure its key as described in [Environment configuration](#11-environment-configuration).

### 10.5 Install frontend dependencies

Open a second terminal in the repository root:

```bash
npm ci
```

Use `npm install` if you intentionally need to update the lockfile or if the project does not include a valid lockfile.

---

## 11. Environment configuration

Never commit real API keys, database passwords, AWS credentials, or production secrets. Keep `.env` files private and use your hosting provider's environment-variable settings for deployed services.

### 11.1 Root environment variables

The root `.env.example` contains the general application settings. The backend also has `backend/.env.example`, which documents the Ox Alpha variables. When running from the repository root, add the Ox Alpha variables to the root `.env` (or export them in the backend process environment).

| Variable | Purpose | Example / default |
|---|---|---|
| `PROJECT_NAME` | Application display/API name | `AI-Powered Label Compliance Checking System` |
| `VERSION` | Application version string | `2026.1.0` |
| `SECRET_KEY` | JWT signing secret | Replace the example with a strong random secret |
| `DATABASE_URL` | SQLAlchemy database connection | `sqlite:///./label_compliance.db` |
| `AWS_ACCESS_KEY_ID` | AWS access key, optional | Empty for local storage |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key, optional | Empty for local storage |
| `AWS_REGION` | AWS region | `ap-south-1` |
| `S3_BUCKET_NAME` | S3 bucket name | Empty for local storage |
| `PORT` | Backend port | `8000` |
| `ALLOWED_ORIGINS` | Comma-separated allowed frontend origins | `*` for local development only |
| `GEMINI_API_KEY` | Key for the separate Gemini service module | Optional |
| `VITE_API_URL` | Backend base URL used by Vite at build time | `http://127.0.0.1:8000` |

The active scan pipeline in the current code calls the Ox Alpha service for ambiguity handling. The repository also contains a Gemini interpretation service module, but its presence alone does not mean it is part of the active scan request path.

### 11.2 Ox Alpha variables

The backend Ox Alpha service reads:

| Variable | Purpose | Default |
|---|---|---|
| `OX_ALPHA_API_KEY` | Ox Alpha API credential | Not configured |
| `OX_ALPHA_BASE_URL` | OpenAI-compatible API base URL | `https://oxalpha.run/api/v1` |
| `OX_ALPHA_MODEL` | Model identifier | `ox-alpha` |

If `OX_ALPHA_API_KEY` is not configured, the backend continues with deterministic extraction and does not make an Ox Alpha request.

### 11.3 Database URL examples

SQLite:

```env
DATABASE_URL=sqlite:///./label_compliance.db
```

PostgreSQL:

```env
DATABASE_URL=postgresql://USERNAME:PASSWORD@HOST:5432/DATABASE_NAME
```

The database layer normalises Railway-style `postgres://` URLs to `postgresql://` before creating the SQLAlchemy engine.

### 11.4 Frontend API URL

The frontend reads `VITE_API_URL` at build time:

```env
VITE_API_URL=http://127.0.0.1:8000
```

For a deployed backend:

```env
VITE_API_URL=https://YOUR-BACKEND-DOMAIN
```

Do not append `/api/v1` to this value. The frontend API client adds `/api/v1` for versioned endpoints and uses the root URL for health and inspection routes mounted outside the versioned prefix.

After changing `VITE_API_URL` in a hosted frontend project, trigger a new frontend build/deployment.

### 11.5 CORS

For local development, `ALLOWED_ORIGINS=*` is convenient. In production, replace it with the exact frontend origin(s), separated by commas, for example:

```env
ALLOWED_ORIGINS=https://your-frontend-domain.example
```

Avoid wildcard CORS in a production environment.

---

## 12. Running the application

### 12.1 Start the backend

From the repository root, with the Python virtual environment activated:

```bash
python -m uvicorn app.main:app --app-dir backend --reload --host 127.0.0.1 --port 8000
```

Backend base URL:

```text
http://127.0.0.1:8000
```

Health endpoint:

```text
http://127.0.0.1:8000/api/health
```

Interactive API documentation:

```text
http://127.0.0.1:8000/docs
```

ReDoc:

```text
http://127.0.0.1:8000/redoc
```

### 12.2 Start the frontend

In a second terminal, from the repository root:

```bash
npm run dev
```

Vite normally serves the frontend at:

```text
http://localhost:5173
```

Open the displayed Vite URL in your browser.

### 12.3 Build the frontend

```bash
npm run build
```

The production frontend assets are generated in `dist/`.

### 12.4 Preview the production frontend build

```bash
npm run preview
```

Vite prints the local preview URL in the terminal.

### 12.5 Stop local services

Use `Ctrl + C` in each terminal running the frontend or backend.

---

## 13. API reference

The FastAPI application exposes versioned routes under `/api/v1`, plus health and inspection routes mounted at the root.

The live OpenAPI schema is the source of truth for request/response models:

- Swagger UI: `/docs`
- ReDoc: `/redoc`
- OpenAPI JSON: `/api/v1/openapi.json`

### 13.1 Health

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/health` | Backend health and system metadata |
| `GET` | `/health` | Alternate health endpoint |

Example:

```bash
curl http://127.0.0.1:8000/api/health
```

### 13.2 Authentication

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/v1/auth/register` | Register a user and return a bearer token |
| `POST` | `/api/v1/auth/login` | Authenticate a user and return a bearer token |
| `GET` | `/api/v1/auth/me` | Return the current user represented by a bearer token |

The login endpoint accepts the application's JSON login schema. The returned token is a JWT bearer token.

Example registration payload (check the live schema for all required fields):

```json
{
  "email": "officer@example.com",
  "full_name": "Example Officer",
  "password": "ReplaceWithAStrongPassword",
  "role": "ENFORCEMENT_OFFICER",
  "location_unit": "Example Field Unit"
}
```

Example login payload:

```json
{
  "email": "officer@example.com",
  "password": "ReplaceWithAStrongPassword"
}
```

Use the returned access token in requests that require authentication:

```http
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### 13.3 Label scanning

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/v1/scan` | Submit an image URL or base64/data URL in JSON |
| `POST` | `/api/v1/scan/upload` | Upload an image using multipart form data |
| `GET` | `/api/v1/scan/uploads/{filename}` | Serve a locally stored uploaded image |

#### Multipart upload

Endpoint:

```text
POST /api/v1/scan/upload
Content-Type: multipart/form-data
```

Form fields:

| Field | Type | Default | Description |
|---|---|---|---|
| `file` | File | Required | Package-label image |
| `inspectorName` | String | `Inspector Officer` | Inspector display name |
| `inspectorLocation` | String | `Zone 4 Field Inspection Unit` | Inspection location |
| `isImported` | Boolean | `false` | Indicates whether the item is imported |
| `pdpAreaCm2` | Number | `180.0` | Principal display panel area supplied to the rule engine |

Example:

```bash
curl -X POST "http://127.0.0.1:8000/api/v1/scan/upload" \
  -F "file=@./sample-label.jpg" \
  -F "inspectorName=Example Officer" \
  -F "inspectorLocation=Example Zone" \
  -F "isImported=false" \
  -F "pdpAreaCm2=180"
```

#### JSON scan request

Endpoint:

```text
POST /api/v1/scan
Content-Type: application/json
```

Example request:

```json
{
  "imageUrl": "data:image/jpeg;base64,BASE64_IMAGE_DATA",
  "fileName": "sample-label.jpg",
  "inspectorName": "Example Officer",
  "inspectorLocation": "Example Zone",
  "isImported": false,
  "pdpAreaCm2": 180
}
```

`imageUrl` is required. It can contain a supported image data URL, a path, or a retrievable image URL as handled by the image decoder.

### 13.4 Inspection repository

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/inspections` | List saved inspection records |
| `GET` | `/inspections/{inspection_id}` | Retrieve one saved inspection |
| `GET` | `/api/v1/inspections` | Versioned inspection-list route |
| `GET` | `/api/v1/inspections/{inspection_id}` | Versioned inspection-detail route |

The list route supports query filters such as status and text search as defined by the current handler. Consult `/docs` for exact query parameter names and response schemas.

### 13.5 Products

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/v1/products` | List product/inspection records |
| `GET` | `/api/v1/products/{id}` | Retrieve a product/inspection record |
| `POST` | `/api/v1/products/{id}/notice` | Create or update a notice associated with a record |

The product-list handler supports optional query, status, and category filters.

### 13.6 Dashboard and rules

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/v1/dashboard/stats` | Dashboard summary statistics |
| `GET` | `/api/v1/rules` | Rules handbook data |

### 13.7 PDF reports

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/v1/reports/{id}/download` | Generate and download a PDF inspection report |

Example:

```bash
curl -L \
  "http://127.0.0.1:8000/api/v1/reports/INSPECTION_ID/download" \
  -o inspection-report.pdf
```

### 13.8 API response statuses

The current application uses statuses including:

| Status | Meaning |
|---|---|
| `COMPLIANT` | The evaluated rules meet the engine's compliant threshold and no critical rule failure overrides the score |
| `NEEDS_REVIEW` | The result falls within the review score band and has no critical failure |
| `NON_COMPLIANT` | The result is below the compliant/review threshold or contains a critical failed rule |
| `UNABLE_TO_ASSESS` | The image does not appear to be a usable packaged-commodity label |
| `OCR_PROCESSING_FAILED` | Reserved/used for a scan-processing failure classification where returned by the relevant flow |

An unassessable image should not be interpreted as a successful compliance result. The score may be null/not applicable.

---

## 14. Database and persistence

### 14.1 Supported databases

The backend uses SQLAlchemy and supports:

- SQLite for local development and lightweight testing.
- PostgreSQL for hosted or multi-user deployments.

The database URL is configured with `DATABASE_URL`.

### 14.2 Main data models

| Model | Table | Purpose |
|---|---|---|
| `User` | `users` | User identity, role, password hash, and location unit |
| `ScanRecord` | `scan_records` | Main inspection record and summary |
| `ExtractedFieldRecord` | `extracted_fields` | Field-level extraction details |
| `RuleCheckRecord` | `rule_checks` | Individual compliance-rule results |
| `NoticeRecord` | `notices` | Notice details associated with an inspection |

The scan model relates to extracted fields, rule checks, and an optional notice record.

### 14.3 Database initialisation

At application startup, the backend calls SQLAlchemy `create_all` to create missing tables and runs a small compatibility check for selected columns on existing `scan_records` tables.

This is not a replacement for a complete, versioned database migration strategy. For production schema evolution, use controlled migrations and backups.

### 14.4 Local SQLite file

When SQLite is configured with the example URL, the database file is created relative to the backend process working directory. Keep the working directory consistent so the application does not accidentally create multiple database files in different folders.

---

## 15. Image storage

The storage service supports two modes.

### Local storage

When AWS S3 credentials and bucket configuration are absent, uploaded images are saved to the configured local upload directory. The service returns a backend URL for locally stored uploads.

The backend also creates local report and upload directories when it initialises configuration.

### AWS S3 storage

When all of the following are configured, the storage service attempts to initialise an S3 client:

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `S3_BUCKET_NAME`

The region is controlled by `AWS_REGION`.

If S3 initialisation or an upload fails, the current storage service logs the issue and attempts local filesystem fallback.

**Deployment warning:** Local filesystem storage may be ephemeral on some hosting platforms. For durable production image storage, configure and test S3 (or another persistent object store), including bucket permissions, public/private access policy, CORS if browser access is required, and lifecycle/retention settings.

---

## 16. Testing and quality checks

### 16.1 Backend tests

The repository includes standalone backend verification scripts, for example:

- `backend/test_pipeline.py`
- `backend/test_three_cases.py`
- `backend/test_ox_alpha_integration.py`
- `backend/test_full_verification.py`
- `backend/test_production_ocr_self_check.py`

Run an individual script from the repository root when its dependencies and required environment are available:

```bash
python backend/test_pipeline.py
```

```bash
python backend/test_ox_alpha_integration.py
```

```bash
python backend/test_production_ocr_self_check.py
```

Some integration tests may require external API credentials, image fixtures, network access, or a configured database. Review the test file before running it.

If a conventional pytest test directory is added to the current branch, run it with:

```bash
python -m pytest
```

### 16.2 Frontend production build

```bash
npm run build
```

### 16.3 Frontend lint

```bash
npm run lint
```

### 16.4 Suggested pre-deployment checklist

- [ ] Frontend production build succeeds.
- [ ] Backend starts without import or configuration errors.
- [ ] `/api/health` returns a healthy response.
- [ ] `/docs` loads and displays the expected API routes.
- [ ] A clear package-label image can be uploaded.
- [ ] A non-label image is classified as unassessable rather than given fabricated declarations.
- [ ] OCR output contains plausible text and bounding boxes.
- [ ] Extracted fields are checked against the original image.
- [ ] Rule checks and overall status are internally consistent.
- [ ] Inspection records remain available after a browser refresh.
- [ ] Uploaded image URLs are accessible in the deployed environment.
- [ ] PDF reports download and open correctly.
- [ ] Authentication and permissions are tested for every sensitive endpoint.
- [ ] Production environment variables contain no development secrets.
- [ ] CORS allows only the intended frontend origin(s).
- [ ] Database backups and file retention have been configured.

---

## 17. Deployment notes

The repository contains Dockerfiles and Railway configuration files. The frontend is a Vite application and the backend is a FastAPI application. They can be deployed as separate services.

### 17.1 Recommended split deployment

```text
Browser
  │
  ▼
Frontend hosting (Vercel / Railway / static hosting)
  │
  │ VITE_API_URL
  ▼
FastAPI backend (Railway / AWS / container hosting)
  │
  ├── PostgreSQL
  ├── S3 or persistent object storage
  └── Optional Ox Alpha API
```

### 17.2 Frontend deployment

Set the frontend build environment variable:

```env
VITE_API_URL=https://YOUR-BACKEND-DOMAIN
```

Build command:

```bash
npm run build
```

Output directory:

```text
dist
```

The Vite variable is embedded into the frontend bundle at build time. Updating it in the hosting dashboard requires a new deployment/build.

### 17.3 Backend deployment

The backend Dockerfile uses Python 3.11, installs `backend/requirements.txt`, copies the FastAPI app, and starts Uvicorn on the hosting platform's `PORT` (defaulting to 8000).

Typical start command:

```bash
uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
```

Set at least:

- `SECRET_KEY`
- `DATABASE_URL`
- `ALLOWED_ORIGINS`
- `OX_ALPHA_API_KEY` if AI-assisted ambiguity handling is required
- AWS variables if S3 storage is required

### 17.4 Railway

The repository includes a root `railway.json` and a separate `backend/railway.json`. Confirm the Railway service root directory, Dockerfile path, build settings, start command, health-check path, and environment variables in the Railway dashboard before deploying.

Do not assume that a configuration file at the repository root is automatically appropriate for both the frontend and backend services.

### 17.5 Vercel frontend and separate backend

A Vercel-hosted frontend can call a separately hosted FastAPI backend. The public frontend URL does not need to change when the backend host changes, provided that:

1. The frontend's `VITE_API_URL` is updated to the new backend URL.
2. The backend allows the frontend origin through CORS.
3. The new backend exposes the expected API routes.
4. The frontend is rebuilt and redeployed.
5. Uploaded-image URLs returned by the backend remain reachable from the browser.

### 17.6 Protecting an already-submitted SIH URL

If a deployment URL has already been submitted to the SIH portal, treat it as a production dependency.

Before merging branches or changing deployment settings:

1. Identify exactly which URL was submitted.
2. Check which Git branch the hosting provider deploys to production.
3. Check whether Railway or Vercel automatically deploys on pushes to that branch.
4. Keep the currently working production branch unchanged while testing a new deployment.
5. Test the new frontend and backend independently.
6. Switch production only after the complete end-to-end flow has been verified.

A Git merge can trigger an automatic deployment even when the URL itself remains the same. Keep a known-good branch or release tag so the submitted demo can be restored if necessary.

---

## 18. Security considerations

This project is a prototype and should undergo a security review before public or operational deployment.

### Required production hardening

1. **Replace development secrets.** Never use the example JWT secret in production.
2. **Protect credentials.** Do not commit `.env`, API keys, database passwords, or AWS credentials.
3. **Restrict CORS.** Use exact trusted frontend origins.
4. **Review endpoint authorisation.** JWT registration/login and role-checking helpers exist, but verify that every sensitive endpoint actually enforces authentication and the correct role.
5. **Protect registration.** Public self-registration with a caller-supplied role can be unsafe. Production deployments should control who can create accounts and assign privileged roles.
6. **Validate uploads.** Enforce file size limits, content-type checks, image decoding checks, and safe filename handling.
7. **Use HTTPS.** Do not transmit authentication tokens over plain HTTP in production.
8. **Protect stored images.** Define whether images are public or private and use appropriate S3 policies or signed URLs.
9. **Back up the database.** Define retention, recovery, and access controls.
10. **Add abuse protection.** Configure request limits, rate limiting, logging, and monitoring at the application or hosting layer.
11. **Review notice issuance.** A notice workflow should be restricted to authorised users and should include an auditable approval process.
12. **Avoid exposing internal errors.** Production error responses should not disclose stack traces, credentials, or sensitive infrastructure details.

### Rate limiting

Do not assume that API rate limiting is implemented merely because the application has authentication or scan timeouts. Configure and verify rate limits separately at the API gateway, reverse proxy, or backend middleware.

---

## 19. Known limitations

The following limitations should be considered during demonstrations, testing, and future development.

### OCR and image quality

- Very small, blurred, low-resolution, reflective, curved, folded, or distorted packaging text may be read incorrectly.
- Glare, shadows, low contrast, motion blur, and perspective distortion can reduce OCR reliability.
- Mixed scripts, regional languages, unusual fonts, dot-matrix printing, and decorative typography may require additional OCR models or language packs.
- Bounding boxes are OCR estimates and should be visually checked against the source image.

### Declaration extraction

- Nearby text can be difficult to associate with the correct label or field.
- A date may refer to manufacture, packing, expiry, or best-before information; context is important.
- A number may be part of a batch code, MRP, net quantity, phone number, or another declaration.
- Some requirements depend on product type, package dimensions, import status, exemptions, and rule amendments.
- Missing OCR text does not prove that a declaration is physically absent from the package.

### Font-size assessment

- The rule engine accepts a principal display panel area value supplied to the scan request.
- An ordinary single photograph does not automatically establish a reliable real-world measurement scale.
- Font-height results must be interpreted with this limitation in mind and verified using appropriate measurement methods.

### AI interpretation

- Ox Alpha is an external service and requires a valid API key and network access.
- AI interpretation can fail, time out, or remain uncertain.
- AI output must not be treated as a legal decision.
- Do not send confidential or sensitive package/customer information to an external AI service unless the applicable data policy permits it.

### Dashboard data

- Some dashboard chart series in the current backend are demonstration/static values rather than live database aggregates.
- Verify dashboard data sources before using the charts for official reporting or operational decisions.

### Deployment and persistence

- Local files may be lost when a hosting platform replaces or restarts an ephemeral container.
- Use persistent storage or S3 for production uploads.
- Use managed PostgreSQL or another durable database for multi-user deployments.
- The current startup schema compatibility logic is not a complete migration framework.

---

## 20. Troubleshooting

### Frontend cannot connect to the backend

**Symptoms:** Scan upload, repository, or dashboard requests fail.

Check:

1. Is FastAPI running?
2. Does `http://127.0.0.1:8000/api/health` load?
3. Is `VITE_API_URL` set to the correct backend base URL?
4. Did you rebuild/restart Vite after changing the environment variable?
5. Does backend `ALLOWED_ORIGINS` include the frontend origin?
6. Is the backend URL correct and publicly reachable?

### `ModuleNotFoundError` when starting FastAPI

Make sure the virtual environment is activated and backend dependencies are installed:

```bash
pip install -r backend/requirements.txt
```

Start the app from the repository root with:

```bash
python -m uvicorn app.main:app --app-dir backend --reload --port 8000
```

### OCR returns no text

- Use a clear, well-lit image.
- Keep the label flat and in focus.
- Capture the full declaration area.
- Avoid reflections and strong shadows.
- Check backend logs to identify which OCR engine initialised successfully.
- If using Tesseract fallback, install the Tesseract system executable and configure `TESSERACT_CMD` if it is not on `PATH`.

### Ox Alpha is not being called

Check:

- `OX_ALPHA_API_KEY` is set in the backend environment.
- The key is valid.
- The backend was restarted/redeployed after setting it.
- The scan contains sufficient OCR text.
- The ambiguity gate determines that an AI call is warranted.

A clean, high-confidence scan may not call Ox Alpha. This is intentional to reduce unnecessary latency and external API usage.

### Database connection error

Check:

- `DATABASE_URL` is correct.
- The database server is reachable from the backend host.
- PostgreSQL credentials and database name are correct.
- The database accepts connections from the backend deployment.
- The SQLite path is relative to the expected working directory.

### Uploaded image does not load after deployment

If local storage is being used, confirm that the hosting platform preserves the upload directory between deployments. For durable hosted storage, configure S3 and verify the bucket access policy and returned URL.

### PDF report fails

Check that:

- The inspection ID exists.
- The backend can write to its configured report directory.
- ReportLab is installed.
- The hosting platform permits the required local file operations.

### CORS error in browser

Set `ALLOWED_ORIGINS` to the exact frontend origin, without a trailing path. Restart or redeploy the backend after changing it.

---

## 21. Development guidelines

### Keep legal decisions deterministic

Do not move the final compliance decision into an LLM prompt. AI services may help interpret OCR candidates, but rule evaluation should remain explicit, testable, and traceable.

### Preserve evidence

Where possible, retain:

- Original uploaded image
- OCR text
- OCR bounding boxes
- Extracted candidate values
- Confidence values
- Rule identifiers and legal references
- Final rule-check results
- Inspection timestamp and operator metadata

### Avoid silent fallbacks

If OCR, AI, storage, or database operations fail, return a clear error or uncertainty state. Do not substitute hardcoded sample values for real inspection data.

### Test difficult images

A useful test set should include:

- Clear front/back label photographs
- Low-light and reflective packages
- Curved containers
- Small printed text
- Different date formats
- Similar nearby numeric values
- Imported and domestic products
- Multiple scripts
- Non-label images such as selfies and landscapes

### Keep deployment branches safe

Use separate development and production branches where practical. Verify automatic deployment settings before merging into a branch connected to a live SIH demonstration URL.

---

## 22. Legal and project disclaimer

DISHA is developed as a technology prototype for Smart India Hackathon problem statement SIH26034. References to the Legal Metrology Act, 2009 and the Legal Metrology (Packaged Commodities) Rules, 2011 are provided to describe the intended domain of the software.

The rule checks encoded in this repository may not cover every provision, amendment, exemption, commodity-specific requirement, state rule, or subsequent legal change. The project must not be represented as an official government system or an authorised legal certification service unless formally approved by the relevant authority.

Always consult the latest official notifications, rules, amendments, and competent Legal Metrology authorities before relying on a finding for regulatory or enforcement purposes.

---

## Acknowledgement

Built for **Smart India Hackathon 2026 — SIH26034**.

**DISHA: From package image to structured inspection evidence.**

<div align="center">

# DISHA
### AI-Powered Packaged Commodity Label Compliance System

**An intelligent inspection platform for verifying packaged commodity labels under India's Legal Metrology (Packaged Commodities) Rules, 2011.**

<br/>

![Python](https://img.shields.io/badge/Python-3.11-blue?logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688?logo=fastapi)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-Frontend-3178C6?logo=typescript)
![OpenCV](https://img.shields.io/badge/OpenCV-Computer_Vision-5C3EE8?logo=opencv)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg))

[Overview](#-overview) •
[Features](#-key-features) •
[Architecture](#-system-architecture) •
[Technology](#-technology-stack) •
[Installation](#-getting-started) •
[API](#-api-reference)

</div>

---

## 📌 Overview

DISHA is an AI-assisted packaged commodity label inspection system designed to help identify missing, unclear, or potentially non-compliant declarations on product packaging.

The platform combines Optical Character Recognition (OCR), computer vision, intelligent field interpretation, and a deterministic rule-based compliance engine to evaluate information printed on product labels.

The system is designed around the **Legal Metrology (Packaged Commodities) Rules, 2011**, helping users inspect important declarations such as:

- Maximum Retail Price (MRP)
- Net quantity
- Manufacturer, packer, and importer details
- Date of manufacture or packing
- Expiry date or best-before declaration
- Consumer care information
- Country of origin, where applicable
- Unit sale price

DISHA converts a product-label image into structured information, evaluates applicable compliance checks, and generates an inspection result with supporting evidence.

### 🎯 The Core Idea

Traditional manual label inspection can be time-consuming and difficult to standardize.

DISHA aims to make the process:

- **Faster:** Automate the extraction of printed declarations.
- **Structured:** Convert unstructured label images into organized data.
- **Explainable:** Associate findings with specific compliance rules.
- **Evidence-driven:** Preserve extracted text and inspection evidence.
- **Consistent:** Use deterministic rules for compliance evaluation.

> DISHA is an inspection-assistance platform. Its output is not a substitute for official legal or regulatory determination.

---

## ✨ Key Features

### 1. Product Label Scanning

- Upload product/package images.
- Capture images using a camera.
- Process images using computer vision.
- Extract printed text using OCR.
- Retain OCR confidence and location information where available.

### 2. Intelligent Declaration Extraction

The extraction pipeline identifies relevant product declarations, including:

| Declaration | Extracted Information |
|---|---|
| Product name | Generic/common product name |
| Manufacturer | Manufacturer or packer details |
| Importer | Importer details, where applicable |
| MRP | Maximum Retail Price |
| Net quantity | Weight, volume, or count |
| Manufacturing date | Manufacture/packing/import date |
| Expiry | Expiry or best-before declaration |
| Consumer care | Contact details for consumer complaints |
| Country of origin | Origin declaration, where applicable |
| Unit sale price | Price per standard unit, where applicable |

### 3. AI-Assisted Interpretation

- Handles ambiguous OCR output.
- Helps interpret uncertain declaration candidates.
- Supports optional AI-assisted field interpretation.
- Keeps legal compliance decisions separate from generative AI.

**Important:** AI interpretation does not independently decide whether a product is legally compliant.

### 4. Rule-Based Compliance Engine

The compliance engine evaluates extracted declarations against configured checks.

- Evaluates individual compliance rules.
- Identifies missing or unclear declarations.
- Generates rule-wise findings.
- Supports critical-rule overrides.
- Distinguishes an unassessable image from a non-compliant product.

### 5. Inspection Dashboard

- View inspection summaries.
- Review compliance results.
- Access previous inspections.
- Examine individual rule findings.
- Monitor inspection outcomes.

### 6. Inspection Reports

- Generate inspection reports.
- Present extracted product information.
- Display rule-wise compliance findings.
- Provide evidence to support inspection results.

---

## 🔄 How DISHA Works

The system follows a multi-stage inspection pipeline.

```mermaid
flowchart TD
    A["Product Label Image"] --> B["Image Upload / Camera"]
    B --> C["Image Preprocessing"]
    C --> D["OCR Processing"]
    D --> E["Text and Bounding Box Extraction"]
    E --> F["Declaration Identification"]
    F --> G["Field Parsing and Validation"]
    G --> H["Ambiguity Detection"]

    H --> I{"Unresolved Fields?"}
    I -->|Yes| J["Optional AI-Assisted Interpretation"]
    I -->|No| K["Structured Product Data"]
    J --> K

    K --> L["Deterministic Compliance Engine"]
    L --> M["Rule-wise Evaluation"]
    M --> N["Compliance Result"]
    N --> O["Inspection History"]
    N --> P["PDF Report"]


## 🏗️ System Architecture

DISHA follows a modular architecture that separates the frontend, backend services, OCR processing, AI-assisted interpretation, and compliance evaluation.

### High-Level Architecture

```mermaid
flowchart TB
    subgraph CLIENT["Frontend Layer"]
        A["React 19 + TypeScript"]
        B["Dashboard"]
        C["Product Scanner"]
        D["Inspection History"]
        E["Reports"]
    end

    subgraph SERVER["Backend Layer"]
        F["FastAPI Application"]
        G["Authentication Service"]
        H["Inspection API"]
        I["Product Data Processing"]
    end

    subgraph INTELLIGENCE["Intelligence Layer"]
        J["OpenCV Preprocessing"]
        K["OCR Engine"]
        L["Field Extraction"]
        M["AI-Assisted Interpretation"]
        N["Compliance Rule Engine"]
    end

    subgraph DATA["Data Layer"]
        O["SQLAlchemy ORM"]
        P[("SQLite / PostgreSQL")]
        Q["Local / S3 Storage"]
    end

    A --> F
    B --> A
    C --> A
    D --> A
    E --> A

    F --> G
    F --> H
    H --> I
    I --> J
    J --> K
    K --> L
    L --> M
    M --> N

    F --> O
    O --> P
    H --> Q

## 🧪 Testing

DISHA includes backend tests to verify important application functionality.

The backend testing framework uses **pytest**.

### Run Backend Tests

Navigate to the backend directory:

```bash
cd backend

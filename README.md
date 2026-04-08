# SkinSense: AI-Assisted Skin Health Support

SkinSense is a sophisticated web application designed to empower users with accessible, AI-driven skin health guidance. By combining computer vision, clinical surveys, and personalized demographic data, SkinSense provides preliminary assessments of common skin conditions and analyzes skincare product ingredients.

## ðŸŒŸ Key Features

- **AI Skin Diagnosis**: Multi-layered analysis using Gemini 1.5 Flash to identify potential skin conditions from photos.
- **Personalized Accuracy**: Integrates user age and gender into AI prompts to weight condition likelihoods (e.g., hormonal acne vs. age-related dermatoses).
- **Product Ingredient Analyzer**: OCR-based analysis of skincare products to flag irritants, allergens, and comedogenic ingredients.
- **SkinGuide AI Assistant**: An empathetic chat interface for follow-up questions regarding scan results.
- **Secure Scan History**: Persistent storage of past assessments via Firebase Firestore.
- **Dermatologist Locator**: Quick access to professional medical help nearby.

## ðŸ› ï¸ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Lucide Icons
- **Animations**: Framer Motion
- **Backend/Database**: Firebase (Auth & Firestore)
- **AI Engine**: Google Gemini 1.5 Flash (via `@google/genai`)

---

## ðŸ“Š System Workflows

### 1. Diagnostic Analysis Flow
This flowchart describes the process from image upload to final diagnostic support.

```mermaid
graph TD
    A[Start Diagnosis] --> B[Upload/Take Photo]
    B --> C{Image Quality Gate}
    C -- Poor --> D[Feedback: Retake Photo]
    D --> B
    C -- Good --> E[Clinical Survey]
    E --> F[AI Analysis Engine]
    F --> G[Gemini 1.5 Flash Vision]
    F --> H[Symptom-Weighted Scoring]
    G & H --> I[Bayesian Fusion]
    I --> J{Ambiguity Check}
    J -- Ambiguous --> K[Follow-up Question]
    K --> I
    J -- Clear --> L[Final Report & Urgency Level]
    L --> M[Save to History]
```

### 2. Product Ingredient Analysis
How the application analyzes skincare products for safety.

```mermaid
graph LR
    A[Upload Ingredient List Photo] --> B[Gemini OCR Extraction]
    B --> C[Ingredient Categorization]
    C --> D[Personalized Risk Match]
    D --> E[Chemist's Verdict & Red Flags]
```

### 3. User Onboarding & Personalization
Ensuring every analysis is tailored to the individual.

```mermaid
graph TD
    A[User Login] --> B{Profile Exists?}
    B -- No --> C[Complete Profile Modal]
    C --> D[Save Age/Gender to Firestore]
    D --> E[Dashboard]
    B -- Yes --> E
    E --> F[AI Analysis Request]
    F --> G[Inject Demographic Context into Prompt]
    G --> H[Personalized Result]
```

---

## ðŸš€ Getting Started

### Prerequisites
- Node.js (v18+)
- Firebase Project
- Google Gemini API Key

### Installation

1. **Clone the repository**
2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Configure Environment Variables**
   Create a `.env` file in the root directory:
   ```env
   GEMINI_API_KEY=your_gemini_api_key
   ```
4. **Firebase Configuration**
   Ensure `firebase-applet-config.json` is present in the root with your Firebase project credentials.

5. **Run Development Server**
   ```bash
   npm run dev
   ```

## âš ï¸ Medical Disclaimer
SkinSense is an educational support tool and **not** a medical diagnostic device. The information provided should not be used as a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of a physician or other qualified health provider with any questions you may have regarding a medical condition.

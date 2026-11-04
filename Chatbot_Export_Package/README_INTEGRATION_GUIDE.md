# Divine AI Assistant, Gemini Pro & Voice Integration Package
### Complete Modular Export for Divine Classes Institute Portal

This package contains the complete, standalone AI Chatbot system extracted from Divine Classes, including:
1. **Google Gemini Pro Integration** (Gemini 2.5 Pro, 2.0 Flash, 1.5 Pro) with auto-connection.
2. **OpenAI / ChatGPT Integration** (GPT-4o, GPT-4o Mini, GPT-3.5 Turbo).
3. **Voice Oral Assistant & Admissions** using Web Speech API (Microphone speech-to-text + spoken text-to-speech audio feedback).
4. **Live Institute Context Engine** (answers questions about student fee balances, enrolled batch schedules, faculty qualifications, test marks, and institute timings).
5. **Floating Bot & Inline Drawer** (UI with model selector, API key management with show/hide password toggle, and quick suggestion pills).
6. **Dedicated Full-Page Chatbot Route** (accessible under Learning Resources in the navigation menu).

---

## 📁 Package Structure

```
Chatbot_Export_Package/
├── chatbot-component.html     # Floating button & Chatbot Window HTML markup
├── chatbot-engine.js          # Complete standalone JavaScript logic (for standard Web / GitHub Pages)
├── chatbot-engine.html        # Apps Script compatible version (<script>...</script>)
├── Pages/Chatbot/             # Dedicated modular page view (Admin/Faculty/Student portal)
│   ├── code.js
│   ├── page.html
│   ├── page-css.html
│   └── page-js.html
├── Routes/Chatbot/            # Dedicated standalone route view
│   ├── code.js
│   ├── page.html
│   ├── page-css.html
│   └── page-js.html
└── README_INTEGRATION_GUIDE.md
```

---

## 🚀 Easy 2-Step Integration Into Your Working Project

### Step 1: Add the HTML Component
Open your working `Routes/Home/page.html` (or `index.html`) and paste the contents of **`chatbot-component.html`** right before the closing `</body>` tag:

```html
    <!-- Paste contents of chatbot-component.html here -->
</body>
```

### Step 2: Include the JavaScript Engine
- **If using Google Apps Script**:
  1. Add `chatbot-engine.html` into your Apps Script project files.
  2. In your `Routes/Home/page.html` (alongside the other `include` calls), add:
     ```html
     <?!= include('chatbot-engine'); ?>
     ```
- **If using Standalone Web App / GitHub Pages (`index.html`)**:
  Include `chatbot-engine.js` before `</body>`:
  ```html
  <script src="chatbot-engine.js"></script>
  ```
  *(Or paste the code from `chatbot-engine.js` into your `<script>` tag inside `index.html` or `javascript.html`)*.

---

## 🎙️ Features Included in this Export

| Feature | Description |
|---|---|
| **Voice Microphone** | Tap the microphone icon inside the chat bar. You can orally ask questions or say: *"Add student Rahul, phone 9876543210, batch Class 10"* to enroll students orally. |
| **Spoken Speech Output** | Chatbot can read answers aloud with voice synthesis. |
| **Free Auto-Connect** | Auto-connects Lead Developer Anil and users to Gemini Pro without having to enter API keys manually every time. |
| **Custom Key Drawer** | Tap the ✨ icon in the chatbot header to toggle the drawer where any user or admin can plug in their own Gemini or ChatGPT key and test the connection live. |
| **Institute Data Context** | Chatbot automatically scans `state.students`, `state.batches`, `state.teachers`, and `state.offlineTests` so answers reflect your real institute numbers! |
| **Role-Based Visibility** | Configurable via `isChatbotEnabled(role)` — Lead Dev always has full access; Admin, Teacher, and Student can be toggled on/off in Settings. |

---

## 🔑 AI Key Storage Keys
The chatbot uses these localStorage keys:
- `DIVINE_AI_PROVIDER`: `'gemini'` or `'openai'`
- `DIVINE_GEMINI_API_KEY`: Custom Google Gemini API key
- `DIVINE_GEMINI_MODEL`: `'gemini-2.5-pro'` (default)
- `DIVINE_OPENAI_API_KEY`: Custom OpenAI API key
- `DIVINE_OPENAI_MODEL`: `'gpt-4o-mini'` or `'gpt-4o'`
- `DIVINE_CHATBOT_ENABLED`: `'true'` / `'false'` (Master toggle)


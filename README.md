# PEHRA — Autonomous Zero-Touch Transit Distress Sentinel

**Live on:** https://pehra-sentinel.netlify.app/

**GitHub:** https://github.com/chatterjeeayush0007/Pehra

A hackathon-ready, **browser-native transit safety sentinel** designed for situations where manually operating an SOS application may not be possible.

Pehra can be armed before a journey and continuously analyze microphone input **locally in the browser**. Its prototype acoustic pipeline combines **RMS analysis, FFT-based frequency filtering, and temporal persistence** to identify potential vocal distress events.

> **DEMO / PROTOTYPE:** Acoustic detection is currently heuristic-based. The 112 interface is a **simulated deterrence UI** and does not establish a real emergency-service connection.

---

## Table of Contents

- [Overview](#overview)
- [The Problem](#the-problem)
- [The Solution](#the-solution)
- [Key Features](#key-features)
- [How It Works](#how-it-works)
- [Acoustic Detection](#acoustic-detection)
- [Stealth Mode](#stealth-mode)
- [112 Decoy Interface](#112-decoy-interface)
- [Location & Alert Workflow](#location--alert-workflow)
- [60-Second Demo](#60-second-demo)
- [Tech Stack](#tech-stack)
- [Run Locally](#run-locally)
- [Browser Support](#browser-support)
- [Privacy](#privacy)
- [Limitations](#limitations)
- [Future Roadmap](#future-roadmap)
- [Author](#author)
- [License](#license)

---

## Overview

**Pehra** explores a different approach to personal safety.

Traditional SOS applications generally require the user to:

1. Reach for their phone.
2. Unlock the device.
3. Open an application.
4. Press an SOS button.
5. Confirm or complete an alert workflow.

In a high-stress situation, that interaction may not always be practical.

Pehra instead follows an **arm-before-journey, passive-monitoring model**.

The intended workflow is:

**Arm → Stealth Mode → Local Acoustic Analysis → Distress Verification → Response → Location & Alert Preparation**

---

## The Problem

### The "Active SOS" Paradox

A safety application can fail if the person in danger cannot safely operate it.

Common problems include:

- **Physical interaction:** Reaching for a phone may attract attention.
- **Cognitive load:** Stress can make multi-step interactions difficult.
- **Device visibility:** An illuminated phone can reveal that an emergency workflow has started.
- **Environmental noise:** Traffic, horns, impacts, and engine noise can produce loud acoustic spikes.
- **Manual location sharing:** The user may not be able to open a map or messaging application.

Pehra is designed around one question:

> **What if the phone could become a passive safety sentinel instead of requiring the user to operate it during the emergency?**

---

## The Solution

Pehra combines several browser capabilities into one autonomous workflow.

### 1. Local Acoustic Monitoring

The browser receives microphone input through the **Web Audio API**.

### 2. Frequency Analysis

A **2048-point FFT** is used to inspect where acoustic energy is concentrated.

### 3. Noise Rejection

Lower-frequency transit and mechanical energy is treated differently from higher-frequency vocal-band energy.

### 4. Temporal Verification

Potential distress activity must persist for approximately **700ms** before the trigger workflow activates.

### 5. Stealth Response

The interface can transition to a **black-screen stealth mode**.

### 6. Location & Alert Preparation

The browser can request GPS coordinates and prepare **Google Maps, WhatsApp, and SMS** destinations.

---

## Key Features

###  Real-Time Acoustic DSP

Pehra uses the browser's **Web Audio API** for continuous acoustic analysis.

###  FFT-Based Frequency Filtering

Instead of relying only on loudness, Pehra examines the **frequency distribution** of the incoming signal.

###  Temporal Persistence Gate

A short acoustic spike does not immediately trigger the response workflow.

###  Stealth Mode

The interface can switch to a **black screen** to minimize visible phone activity.

###  Rapid Disarm

A rapid double-tap gesture allows the user to leave stealth mode.

###  112-Style Decoy Interface

The prototype displays a simulated emergency-call interface intended as a **deterrence mechanism**.

###  Automatic Location Capture

The **Geolocation API** can retrieve the device's current coordinates during the alert workflow.

###  Guardian Alert Preparation

The prototype can prepare:

- **WhatsApp** messaging links
- **SMS** links
- **Google Maps** location links

###  Client-Side DSP

The core acoustic analysis happens **inside the browser**, without requiring continuous raw-audio cloud processing.

---

## How It Works

Pehra's core workflow is intentionally simple:

**Microphone → DSP → Frequency Analysis → Persistence Gate → Trigger → Location / Response**

The application operates through three main states.

### IDLE

Normal dashboard state.

The user configures:

- Guardian contacts
- Sensitivity
- Sentinel settings

### STEALTH

Activated when the user arms Pehra.

The application:

- switches to a black interface
- keeps the monitoring pipeline active
- analyzes microphone input
- waits for a potential distress event

### TRIGGERED

Activated when the acoustic conditions satisfy the prototype's trigger logic.

The application can then:

- show the simulated 112-style interface
- activate haptic/audio feedback
- request location
- prepare guardian alert links

---

## Acoustic Detection

Pehra's prototype uses multiple signal-processing stages rather than a simple volume threshold.

### RMS Amplitude

The Root Mean Square value estimates the overall energy of an audio frame.

$$
RMS = \sqrt{\frac{1}{N}\sum_{i=0}^{N-1}x_i^2}
$$

The prototype also derives an amplitude-oriented decibel value:

$$
dB = 20\log_{10}(RMS)
$$

This provides the live sound-level signal used by the interface.

### FFT Analysis

The prototype uses:

**FFT Size:** 2048

At a 44.1kHz sample rate, the approximate frequency resolution is:

$$
\frac{44100}{2048} \approx 21.53Hz
$$

This allows the application to inspect the frequency composition of the sound.

### Dual-Band Filtering

The prototype examines two broad frequency regions.

**Transit / Mechanical Noise Region**

Approximately:

**300Hz – 1,000Hz**

This region is used to identify and reject common lower-frequency environmental energy.

**Vocal Candidate Region**

Approximately:

**1,800Hz – 4,400Hz**

Higher energy in this region can become a **candidate vocal-distress event** when combined with the configured threshold and persistence conditions.

> This is a **prototype heuristic**, not a scientifically validated scream classifier. Real-world acoustic environments can produce both false positives and false negatives.

### 700ms Persistence Gate

Pehra does not trigger from a single loud audio spike.

The candidate signal must persist for approximately **700ms** before progressing through the emergency state transition.

This is intended to reduce triggers caused by:

- Short horn bursts
- Door impacts
- Road bumps
- Mechanical transients
- Brief environmental noise

---

## Stealth Mode

When the user selects **ARM & ACTIVATE SENTINEL**, Pehra enters stealth mode.

The interface becomes a **black screen**, minimizing visible activity.

The prototype also uses the **Screen Wake Lock API** where supported.

This helps prevent the screen from automatically sleeping while the sentinel is active.

### Rapid Disarm

The user can rapidly double-tap the screen to return to the normal interface.

Current prototype configuration:

**Double-tap window: ≤ 350ms**

---

## 112 Decoy Interface

When the distress state is triggered, Pehra presents a **simulated incoming emergency-call interface inspired by India's 112 emergency response ecosystem**.

The interface can provide:

- Incoming-call presentation
- Haptic feedback
- Telephone-style ringtone
- Accept-call interaction
- Active-call timer
- End-call/reset controls

The purpose is to create a **deterrence-oriented pretext**.

### Important

The interface is **not an actual 112 connection**.

A genuine emergency-service integration would require authorized infrastructure, appropriate APIs, security controls, and formal approval.

---

## Location & Alert Workflow

After the trigger workflow begins, Pehra can request the device's location using the **Geolocation API**.

The coordinates can be converted into a Google Maps link:

```text
https://maps.google.com/?q=<latitude>,<longitude>
```

The prototype can then prepare alert destinations through:

**WhatsApp → SMS → Google Maps**

Actual message delivery depends on:

- Device capabilities
- Browser behavior
- Messaging applications
- User permissions
- Network connectivity

---

## 60-Second Demo

The complete prototype can be demonstrated without generating a real scream.

### Step 1 — Open Pehra

Open:

https://pehra-sentinel.netlify.app/

### Step 2 — Configure a Guardian

Enter a test 10-digit mobile number.

### Step 3 — Test the Microphone

Click:

**TEST LIVE MIC**

Grant microphone permission.

Observe the live:

- **RMS / dB level**
- **Audio activity**
- **FFT visualization**

### Step 4 — Test Noise Rejection

Click:

**SIMULATE 94dB CAR HORN**

Expected result:

**High volume → Lower-frequency energy → Horn filter → Trigger blocked**

### Step 5 — Test Distress Detection

Click:

**SIMULATE 94dB SCREAM**

Expected result:

**Vocal-band energy → ~700ms persistence → TRIGGERED**

The application then demonstrates:

- **112-style decoy interface**
- **Haptic/audio response**
- **Location workflow**
- **Guardian alert preparation**

### Step 6 — Test Stealth Mode

Click:

**ARM & ACTIVATE SENTINEL**

The interface switches to the black stealth screen.

Double-tap rapidly to disarm.

### Demo Story

**User arms Pehra → phone enters stealth mode → browser analyzes audio locally → potential distress is detected → response workflow activates → location is collected → guardian alert links are prepared.**

---

## Tech Stack

### Frontend

- **React 18**
- **Vite**
- **Tailwind CSS**
- **Lucide Icons**

### Acoustic Processing

- **Web Audio API**
- `AudioContext`
- `AnalyserNode`
- `OscillatorNode`
- **2048-point FFT**
- **RMS calculation**

### Browser APIs

- **MediaDevices / getUserMedia**
- **Geolocation API**
- **Screen Wake Lock API**
- **Vibration API**
- **LocalStorage API**

### Deployment

- **Netlify**

---

## Run Locally

### Requirements

- **Node.js 18+**
- npm or Yarn
- Modern Chrome, Chromium, Edge, Safari, or Firefox
- HTTPS or `localhost` for protected browser APIs

### Installation

```bash
git clone https://github.com/chatterjeeayush0007/Pehra.git
cd Pehra
npm install
```

### Development

```bash
npm run dev
```

Then open:

```text
http://localhost:5173
```

Browser permissions may be required for:

- Microphone
- Location
- Screen Wake Lock
- Vibration

---

## Browser Support

Pehra relies on modern browser APIs, so behavior can vary between browsers and operating systems.

**Web Audio / FFT:** Chrome, Edge, Firefox, Safari

**Geolocation:** Chrome, Edge, Firefox, Safari

**Screen Wake Lock:** Supported in modern Chromium browsers; support varies elsewhere.

**Vibration:** Supported on many Android browsers; unavailable on iOS Safari.

> Hardware APIs and background execution are ultimately controlled by the browser and operating system.

---

## Privacy

Pehra follows an **edge-first acoustic-processing approach**.

The core acoustic pipeline runs inside the browser:

**Microphone → Browser → RMS / FFT → Frequency Analysis → Local Trigger Decision**

The prototype does **not require continuous raw microphone audio to be uploaded to a cloud server** for the core DSP pipeline.

Location and messaging information are handled separately when the alert workflow is activated.

---

## Limitations

Pehra is currently a **hackathon prototype** and should not be treated as a certified emergency-safety system.

Known limitations include:

- **Heuristic acoustic detection** can produce false positives and false negatives.
- Different phone microphones can produce different frequency responses.
- Traffic, music, speech, and vehicle acoustics can affect detection.
- Browser background execution is controlled by the operating system.
- Wake Lock does not guarantee unrestricted background execution.
- GPS accuracy varies by environment.
- WhatsApp/SMS links do not guarantee message delivery.
- The 112 interface is **simulated**.
- Large-scale real-world validation has not yet been performed.

---

## Future Roadmap

### Acoustic Intelligence

- [ ] **TinyML / ONNX / WebAssembly** distress classifier
- [ ] Real-world acoustic dataset
- [ ] Speaker-independent testing
- [ ] False-positive / false-negative benchmarking
- [ ] Adaptive noise filtering

### Sensor Fusion

- [ ] Motion/activity detection
- [ ] Wearable integration
- [ ] Heart-rate correlation
- [ ] Vehicle-motion context

### Offline Resilience

- [ ] Offline-first PWA improvements
- [ ] Local event queue
- [ ] Store-and-forward telemetry
- [ ] Better low-connectivity behavior

### Emergency Integration

- [ ] Research authorized **112/CAD integration**
- [ ] Secure emergency-service relay
- [ ] Authentication and abuse prevention
- [ ] Formal privacy and regulatory review

---

## Author

**Ayush Chatterjee**

Solo Architecture · DSP Pipeline · Frontend Engineering

- **GitHub:** https://github.com/chatterjeeayush0007
- **Live Project:** https://pehra-sentinel.netlify.app/

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

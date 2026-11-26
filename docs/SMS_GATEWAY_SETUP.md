# LIFORA — Personal SIM-Based SMS Gateway Setup & Demonstration Guide

> **Architecture:** LIFORA Backend → SMS Gate Local HTTP API → Android Smartphone → Physical SIM → Recipient Mobile Phone

This guide provides instructions on connecting your Android phone as an SMS Gateway for real cellular OTP dispatch during college project testing and live demonstrations.

---

## 📱 1. Requirements

- **Android Smartphone** with an active physical SIM card capable of sending outgoing SMS.
- **SMS Gateway for Android (SMS Gate)** installed on the phone (available via [SMS Gate on GitHub / F-Droid / Play Store](https://github.com/capcom6/android-sms-gateway)).
- **Laptop / Development Machine** connected to the **same Wi-Fi or local mobile hotspot network** as the phone.

---

## ⚙️ 2. Android Phone Configuration (SMS Gate App)

1. **Install SMS Gate:** Open the SMS Gateway application on your Android device.
2. **Grant Permissions:** Grant all required permissions:
   - *Send SMS*
   - *Read Phone State*
   - *Battery Optimization Exemption* (keeps the background service alive during demonstrations).
3. **Enable Local Server Mode:**
   - Navigate to the app settings or dashboard.
   - Switch server mode to **Local Server** (HTTP).
4. **Set Credentials:**
   - Define a strong **Username** (e.g. `lifora_gateway`).
   - Define a strong **Password** (e.g. `SecureGatePass2026`).
   - Note the **Port** (default is usually `8080`).
5. **Start the Gateway Server:**
   - Tap **Start / Listen**.
   - The app will display your local IP and port, for example: `http://192.168.1.45:8080` or `http://10.90.12.85:8080`.

---

## 🌐 3. Networking: Connecting Laptop and Phone

1. Ensure your laptop and Android phone are on the **exact same Wi-Fi network**, or turn on your **Android Mobile Hotspot** and connect your laptop to it.
2. Verify connectivity from your laptop terminal using PowerShell or bash:
   ```powershell
   # Test TCP socket connection to your phone
   Test-NetConnection -ComputerName 192.168.1.45 -Port 8080
   ```
   *Expected result: `TcpTestSucceeded : True`*

---

## 🔐 4. Backend Environment Configuration (`.env`)

Never commit real credentials to Git. The `.gitignore` is configured to ignore `.env`.

In `backend/.env`, configure the following keys:

```env
# ==============================================================================
# LIFORA SMS GATEWAY CONFIGURATION (Android Phone SIM Gateway)
# ==============================================================================

# Dynamic local IP and port displayed inside your SMS Gate app
SMS_GATEWAY_URL="http://192.168.1.45:8080"

# Basic Authentication credentials configured inside your SMS Gate app
SMS_GATEWAY_USERNAME="YOUR_GATEWAY_USERNAME"
SMS_GATEWAY_PASSWORD="YOUR_GATEWAY_PASSWORD"

# Optional Device ID (leave blank to let the gateway use default SIM/device)
SMS_GATEWAY_DEVICE_ID=""

# OTP Security Parameters
OTP_EXPIRY_MINUTES=5
OTP_LENGTH=6
OTP_MAX_ATTEMPTS=5
OTP_RESEND_COOLDOWN_SECONDS=60
OTP_MAX_REQUESTS_PER_HOUR=5

# Toggle demo simulation vs real cellular dispatch:
# Set to false to dispatch real SMS through your Android SIM
# Set to true to simulate SMS dispatch locally (for testing without cellular charges)
OTP_DEMO_MODE=false
```

---

## 🧪 5. Testing the Gateway API Directly

You can verify that your phone sends an SMS directly using PowerShell before starting the full application:

```powershell
$pair = "YOUR_GATEWAY_USERNAME:YOUR_GATEWAY_PASSWORD"
$bytes = [System.Text.Encoding]::ASCII.GetBytes($pair)
$base64 = [Convert]::ToBase64String($bytes)

$body = @{
  textMessage = @{
    text = "LIFORA Test: Gateway connected successfully to your physical SIM!"
  }
  phoneNumbers = @("+91XXXXXXXXXX") # Replace with your test recipient number
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://192.168.1.45:8080/message" `
  -Method POST `
  -Headers @{
    Authorization = "Basic $base64"
    "Content-Type" = "application/json"
  } `
  -Body $body
```

---

## 🚀 6. Starting the Full-Stack Application

### Start the Backend Server:
```bash
cd backend
npm start
```
*The Express server boots on port 5000 with real-time Socket.IO and SMS Gate integration.*

### Start the React Frontend:
```bash
# In the project root
npm run dev
```
*Open `http://localhost:5173` in your browser.*

---

## 🎯 7. Demonstrating Real SIM OTP Registration

1. Navigate to **`http://localhost:5173/register`**.
2. Select your role (**Voluntary Blood Donor**, **Patient/Recipient**, or **Hospital Admin**).
3. Fill in your details (Full Name, Email, Password, Blood Group, City).
4. Enter your real mobile number (e.g. `9876543210` or `+91 98765 43210`).
5. Click **"Verify Phone & Register"** (or click **"Verify via OTP"** beside the phone field).
6. **Watch the live flow:**
   - Backend normalizes the number to international E.164 (`+919876543210`).
   - Cryptographically secure 6-digit numeric OTP is generated and hashed (SHA-256).
   - An HTTP POST request is sent from your laptop to your Android phone (`POST http://YOUR_PHONE_IP:8080/message`).
   - The phone's SMS Gate application wakes up and sends the SMS through your physical SIM card.
   - The recipient phone receives the cellular SMS notification.
   - The interactive **LIFORA OTP Modal** appears with a 6-box input, 60-second resend cooldown timer, and 5-minute expiry countdown.
7. Enter the 6-digit code received on the mobile phone (or paste the code).
8. The backend verifies the cryptographic hash in constant time, marks the phone verified, and consumes the OTP.
9. Registration completes, logging the user in as a verified account!

---

## 🛠️ 8. Troubleshooting Guide

| Issue | Root Cause | Solution |
|---|---|---|
| **HTTP 401 Unauthorized** | Gateway username or password mismatch | Check that `SMS_GATEWAY_USERNAME` and `SMS_GATEWAY_PASSWORD` in `backend/.env` match the credentials configured in the SMS Gate app. |
| **Connection Refused / ETIMEDOUT** | Laptop cannot reach the phone's IP | 1. Ensure phone and laptop are on the same Wi-Fi network.<br>2. Check if the phone's IP address changed (Android assigns dynamic IPs via DHCP).<br>3. Verify the SMS Gate server is turned ON in the app. |
| **SMS status stays "Pending"** | Android OS queued the SMS | 1. Ensure Android battery saver is turned OFF for SMS Gate.<br>2. Ensure the SIM card has sufficient balance/SMS pack.<br>3. Check if Android default SMS app is prompting for carrier permissions. |
| **SMS Sending Failed** | Carrier or SIM restriction | 1. Verify you can send standard SMS from your phone's Messages app.<br>2. Check SIM slot selection in SMS Gate if your phone is Dual-SIM. |
| **Phone IP changed after reconnecting** | Wi-Fi router reassigned dynamic IP | Check the IP address displayed on the SMS Gate home screen and update `SMS_GATEWAY_URL` in `backend/.env`. |
| **Rate Limit / Cooldown Error** | Security protection active | LIFORA enforces a 60-second resend cooldown and 5 requests/hour per number to prevent spam. Wait for the cooldown countdown to finish. |

---

## 🛑 9. Stopping the Gateway

When testing or demonstration is concluded:
1. Open the SMS Gate app on your phone.
2. Tap **Stop Server**.
3. (Optional) In `backend/.env`, set `OTP_DEMO_MODE=true` if you wish to run automated tests or test without using cellular SMS credits.

---

## 🛡️ 10. Security Notes & Project Scope

- **Student/Demo Scope:** Using an Android phone as an HTTP SMS gateway is suitable for academic demonstrations, laboratory testing, and prototyping. It uses your personal SIM's cellular quota.
- **Enterprise Note:** In clinical production environments, commercial networks utilize certified telecom aggregators (e.g. DLT-registered enterprise routes in India) with high-throughput shortcodes and carrier SLAs.
- **Credential Protection:** Never push your local IP, gateway password, or mobile numbers to public version control. Keep them isolated in `backend/.env`.

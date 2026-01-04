# 💲CASH-PILOT BACKEND

**CashPilot Backend is a TypeScript-based Node.js backend for the CashPilot personal finance and salary management web application. It uses Express, MongoDB (Mongoose), and includes features for authentication, transactions, monthly allocations, file uploads, and AI integration.**


## 📂 Project Structure

Cash_Pilot_BackEnd/  
├─ src/  
│ ├─ config/   
│ ├─ controller/   
│ ├─ middleware/ 
│ ├─ models/   
│ ├─ routes/   
│ ├─ utils/   
│ └─ index.ts  
├─ .env 
├─ package-lock.json 
├─ package.json    
├─ README.md   
└─ tsconfig.json 


## 🚀 Technologies & Tools Used

* **Runtime:** ->  Node.js
* **Language:** -> TypeScript
* **Framework:** -> Express.js
* **Database:** -> MongoDB with Mongoose (ODM)
* **Authentication:** -> JSON Web Tokens (JWT) & Google OAuth 2.0
* **AI Integration:** -> Google Generative AI (Gemini)
* **File Handling:** -> Multer / Cloudinary 
* **Email:** -> Resend
* **Dev Tools:** -> Nodemon , ts-node



## ⚡ Setup Instructions

### 1. Clone the repository
```
git clone https://github.com/dilinichamikasilva/Cash_Pilot_Backend.git
```

### 2. Install dependencies
```
npm install
```

### 3. Configure environment variables

Create a `.env` file in the root directory and add the following keys. Replace the placeholders with your actual credentials:

```bash
# Server & Client Configuration
SERVER_PORT=5000
CLIENT_URL=your_frontend_url

# Database (MongoDB)
MONGO_URI=your_mongodb_connection_string

# Authentication (JWT)
JWT_SECRET=your_jwt_secret_key
JWT_REFRESH_SECRET=your_jwt_refresh_key

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id

# Cloudinary (Image Uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# AI Integration (Google Gemini)
GEMINI_API_KEY=your_gemini_api_key

# Email Service (Resend)
RESEND_API_KEY=your_resend_api_key
```

### 4.Run backend in development
```
npm run dev
```
Server runs at http://localhost:5000

### 5.Build for production
```
npm run build
```

### 6. Start production server
```
npm run start
```


## ✨ Main Features

### 🔐 Secure Authentication & User Management
* **Dual Auth Strategy:** Support for traditional email/password login and **Google OAuth 2.0** for seamless access.
* **JWT Session Handling:** Implements Access and Refresh tokens to ensure secure and persistent user sessions.
* **Profile Customization:** Integrated with **Cloudinary** for high-performance profile image uploads and management.

### 💰 Smart Budgeting & Monthly Allocations
* **Dynamic Budgeting:** Set and manage monthly limits for specific categories like Food, Transport, and Rent.
* **Real-time Tracking:** Live calculation of total spending versus remaining budget based on transaction history.
* **Threshold Alerts:** Built-in logic that monitors spending and triggers warnings once **80%** of a budget is consumed.

### 🤖 AI-Powered Financial Insights (Gemini)
* **Automated Analysis:** Powered by **Google Gemini AI** to provide personalized financial advice and savings tips.

### 💸 Transaction & Salary Management
* **Categorized Logging:** Effortlessly track both income and expenses with precise dates and descriptions.
* **Instant Search:** High-performance filtering for finding specific transactions in seconds.
* **Financial Reporting:** Aggregated data visualizations for monthly and yearly financial health views.

### 📧 Automated Notifications & Emails
* **Email Integration:** Uses **Resend** to deliver automated transactional emails and budget alerts.
* **In-App Alerts:** Real-time notifications for critical budget milestones and account activities.

### 📊 Financial Reporting & PDF Export
* **One-Click Reports:** Generate comprehensive PDF financial statements directly from the browser.
* **Data Portability:** Professionally formatted tables allowing users to download their transaction history for offline use or tax purposes.
* **Client-Side Generation:** High-performance PDF creation using `jsPDF`, ensuring data remains private and generation is instant.

### 📱 Fully Responsive Design
* **Mobile-First Approach:** Optimized UI/UX for all screen sizes, ensuring financial management on the go.


## 🖼️ Website Previews

Below are the initial UI designs for **CashPilot**, showcasing the clean, modern interface designed for effortless financial management.




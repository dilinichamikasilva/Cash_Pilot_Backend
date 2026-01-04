<img width="1919" height="969" alt="2" src="https://github.com/user-attachments/assets/edecd226-ed18-4ee5-9a79-b5f16ffc80de" /># 💲CASH-PILOT BACKEND

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

### Website
<img width="1916" height="970" alt="1" src="https://github.com/user-attachments/assets/cbaa6a97-bef6-432d-a369-734143054876" />
<img width="1919" height="969" alt="2" src="https://github.com/user-attachments/assets/c3f5d128-72b7-40ef-b2bb-db1feaf74bd9" />
<img width="1919" height="974" alt="3" src="https://github.com/user-attachments/assets/7d4836e0-07c8-41a9-b037-706bbe0242e8" />
<img width="1919" height="910" alt="4" src="https://github.com/user-attachments/assets/de1a8803-cade-4476-a333-baa05adf40ef" />
<img width="1919" height="960" alt="5" src="https://github.com/user-attachments/assets/57f9e822-b7f1-4dd2-95d3-786f38c39b41" />
<img width="1919" height="974" alt="6" src="https://github.com/user-attachments/assets/9248003a-64c1-49bd-afee-01866ea0b462" />
<img width="1919" height="970" alt="7" src="https://github.com/user-attachments/assets/6f501bf8-f96d-448c-bb20-d6db5f7a2696" />

### User Register
<img width="1919" height="973" alt="Register" src="https://github.com/user-attachments/assets/f928d046-c91a-499f-9302-ba0fe26a488b" />

### User Login
<img width="1919" height="971" alt="Login" src="https://github.com/user-attachments/assets/f78ed248-55ed-4d6c-8ac9-dabb79117434" />

### Dashboard

-- Dashboard --
<img width="1919" height="967" alt="Dashboard" src="https://github.com/user-attachments/assets/db65047d-6686-4540-b830-c24d1490f508" />
<img width="1919" height="969" alt="Search bar" src="https://github.com/user-attachments/assets/ee16cae7-3458-4e58-9e66-f6462f2d2244" />


--  Budget Page --
<img width="1919" height="968" alt="Budget" src="https://github.com/user-attachments/assets/479d7706-5772-4f19-be0b-19ebe5e6c0c8" />
<img width="1919" height="972" alt="Add budget" src="https://github.com/user-attachments/assets/9074ba0a-b798-45fb-b3c5-950d4205125c" />


-- View Summary --
<img width="1916" height="969" alt="View summary" src="https://github.com/user-attachments/assets/32eb6962-43df-422b-8a93-76258eaee35e" />

-- Track Actuals --
<img width="1919" height="968" alt="Track actuals" src="https://github.com/user-attachments/assets/79bbe5cc-f4dd-489f-8333-a3bd1f181c19" />
<img width="1908" height="967" alt="Add Proof" src="https://github.com/user-attachments/assets/db71b5c8-11d5-425e-960d-ee67ec185237" />
<img width="1919" height="971" alt="History" src="https://github.com/user-attachments/assets/767bb1c2-6bf5-4d83-906b-422a276aebf3" />

-- Report --
<img width="1919" height="965" alt="PDF" src="https://github.com/user-attachments/assets/efe00dd5-dbbd-4127-a300-5ca9312508fa" />

-- Notifications --
<img width="1919" height="967" alt="Notification" src="https://github.com/user-attachments/assets/f7c191d4-0ab8-45c5-bc26-a66a468f2eb5" />

-- Settings --
<img width="1919" height="971" alt="Settings" src="https://github.com/user-attachments/assets/79a020e1-521c-49ff-bc77-082f42dd8cd6" />

-- Analatyics --
<img width="1915" height="968" alt="Analytics" src="https://github.com/user-attachments/assets/0f4ef695-2691-4141-931c-0782473aae9d" />



























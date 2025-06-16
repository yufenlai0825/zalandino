# 🦕🛍️ Zalandino – Full-Stack E-Commerce Website

**Zalandino** is a full-stack e-commerce web application inspired by Zalando. It supports secure user authentication, real-time product updates, payment processing with Stripe, and more. 

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![Mongoose](https://img.shields.io/badge/Mongoose-880000?style=for-the-badge&logo=mongoose&logoColor=white)
![EJS](https://img.shields.io/badge/EJS-3178C6?style=for-the-badge)
![Stripe](https://img.shields.io/badge/Stripe-635BFF?style=for-the-badge&logo=stripe&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)

---
## 🚀 Live Demo on Render
https://zalandino.onrender.com

---
## 📌 Features

- **User Authentication**
  - Secure local signup & login using bcrypt
  - Session management via express-session + MongoDB store
  - Flash messages for user feedback

- **Security & Performance**
  - Helmet for HTTP header protection
  - Compression middleware to optimize response size

- **Product & Cart Management**
  - Add, edit, and delete products (with image uploads using Multer)
  - Real-time quantity and price updates (Socket.IO)

- **Checkout & Payments**
  - Stripe integration for secure payments
  - Auto-generated PDF invoice using PDFKit
  - Order history and cart clearance upon checkout

- **Email Notifications**
  - Sigmup + password reset email confirmations 
  - Using time-limited secure tokens for password reset
  - (Currently in testing via single sender verification – no custom domain yet)

- **Testing**
  - Unit tests for authentication using Mocha, Chai, and Sinon
  - Testable middleware for route protection


---

## 🛠️ Tech Stack

| Category       | Tech Used                              |
|----------------|----------------------------------------|
| **Backend**     | Node.js, Express.js                   |
| **Frontend**    | EJS |
| **Database**    | MongoDB with Mongoose ORM             |
| **Auth & Security** | bcrypt, express-session, Helmet   |
| **File Uploads** | Multer                               |
| **Email Service** | Nodemailer + SendGrid Transport     |
| **Payments**     | Stripe API                           |
| **Real-time**    | Socket.IO                            |
| **PDF Generation** | PDFKit                             |
| **Testing**      | Mocha, Chai, Sinon                   |
| **Dev Tools**    | Nodemon, Prettier                    |

---

## 💻 Installation & Setup

### Installation

```bash
git clone https://github.com/yourusername/zalandino.git
cd zalandino
npm install
```

### Environment Variables

Create a .env file in the root directory with the following keys:
```bash
MONGODB_URI=               # Your MongoDB connection string
TESTMONGODB_URI=           # Used during test runs

SESSION_SECRET=            # Session encryption secret

STRIPE_PK=                 # Stripe public key
STRIPE_SK=                 # Stripe secret key
STRIPE_WEBHOOK_SECRET=     # Stripe webhook signing secret

NODEMAILER_API_KEY=        # SendGrid API key for email delivery
```
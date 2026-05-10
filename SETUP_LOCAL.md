# LumiKids Academy — Run on Your Laptop

Complete setup guide for Windows / macOS / Linux.

---

## ✅ What You'll Install

| Tool | Why | Download |
|---|---|---|
| **Python 3.10+** | Backend runtime | https://www.python.org/downloads/ |
| **Node.js 18+** | Frontend runtime | https://nodejs.org/ |
| **Yarn** | Package manager | After Node: `npm install -g yarn` |
| **MySQL 8.0+** | Database | https://dev.mysql.com/downloads/mysql/ |

---

## 📥 Step 1 — Get the code

Copy these folders/files from this Emergent project to your laptop:
```
lumikids/
├── backend/             (entire folder)
├── frontend/            (entire folder, but DELETE node_modules if present)
└── lumikids_database.sql  (provided in /app/lumikids_database.sql)
```

> Tip: Open the **VS Code view** in Emergent (left sidebar icon) and download each folder.

---

## 🗄️ Step 2 — Set up the database

After installing MySQL, set a root password during install (e.g. `MyPass123`).

### Create the database & import sample data

Open a terminal:

```bash
# Linux / macOS
mysql -u root -p -e "CREATE DATABASE lumikids CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p lumikids < lumikids_database.sql
```

```cmd
:: Windows (Command Prompt) — adjust path if needed
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p -e "CREATE DATABASE lumikids CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p lumikids < lumikids_database.sql
```

> Skipping the SQL import is fine too — the backend auto-creates all tables and seed data on first run.

---

## ⚙️ Step 3 — Configure the backend

Open `backend/.env` and **update only these lines** with your local MySQL password:

```env
DB_HOST="127.0.0.1"
DB_USER="root"
DB_PASSWORD="MyPass123"        # ← your local MySQL password
DB_NAME_MYSQL="lumikids"
DB_PORT="3306"
JWT_SECRET="change-this-to-any-random-string"
ADMIN_EMAIL="admin@lumikids.com"
ADMIN_PASSWORD="admin123"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"   # ← your Gmail
SMTP_PASS="your-app-password"       # ← your Gmail App Password
APP_NAME="LumiKids Academy"
```

> `MONGO_URL`, `DB_NAME`, `CORS_ORIGINS` lines can stay — they're unused now.

---

## 🐍 Step 4 — Run the backend

```bash
cd backend

# Create a virtual environment (recommended)
python -m venv venv

# Activate it
# Linux/macOS:
source venv/bin/activate
# Windows:
venv\Scripts\activate

# Install Python packages
pip install fastapi uvicorn[standard] aiomysql PyMySQL bcrypt PyJWT aiosmtplib python-dotenv pydantic[email]

# Start the server
uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

You should see `Application startup complete.` and `LumiKids backend ready.`

Test it: open http://localhost:8001/api/ in your browser → should show `{"message":"LumiKids Academy API","status":"ok"}`

---

## ⚛️ Step 5 — Configure & run the frontend

Open `frontend/.env` and **change** the backend URL to your local one:

```env
REACT_APP_BACKEND_URL=http://localhost:8001
WDS_SOCKET_PORT=0
```

Then in a **second terminal**:

```bash
cd frontend
yarn install        # installs dependencies (takes a minute)
yarn start          # opens http://localhost:3000 automatically
```

---

## 🎉 Step 6 — Log in

Open **http://localhost:3000** and use any of these:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@lumikids.com` | `admin123` |
| Teacher | `sarah@lumikids.com` | `teacher123` |
| Parent | `emma@example.com` | `parent123` |

---

## 🧯 Troubleshooting

| Problem | Fix |
|---|---|
| `Can't connect to MySQL server` | Make sure MySQL service is running. Windows: `net start mysql80`. Mac: `brew services start mysql`. Linux: `sudo systemctl start mysql`. |
| `Access denied for user 'root'` | Wrong password in `backend/.env` → fix `DB_PASSWORD`. |
| `Module not found: bcrypt/aiomysql/...` | Re-run `pip install ...` while the venv is activated. |
| Frontend shows blank or 404 | Make sure `REACT_APP_BACKEND_URL=http://localhost:8001` and **restart `yarn start`** after editing `.env`. |
| Email not sending | Gmail requires an **App Password** (not your normal password). Get one at https://myaccount.google.com/apppasswords |
| Port 8001 or 3000 already in use | Change to another port: `uvicorn server:app --port 8002` (and update REACT_APP_BACKEND_URL). |

---

## 🚀 Optional — Production Build

To run the frontend as a static build (faster, no dev server):

```bash
cd frontend
yarn build           # creates a /build folder
```

Then serve it with any static server (e.g. `npx serve -s build`).

---

That's it! You now have a fully self-hosted kindergarten management system on your laptop. 🌟

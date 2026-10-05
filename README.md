# SkillQuest

SkillQuest is a gamified employee training platform that makes workplace learning interactive through modules, quizzes, coding challenges, quests, and games. Employees earn XP, achievements, certificates, and leaderboard rankings, while trainers and administrators create content, assign training, monitor progress, and analyze performance.

## Features

- Employee, trainer, and administrator roles
- Interactive learning modules and topic-based roadmaps
- Quizzes, coding challenges, quests, and game-based learning
- XP, achievements, leaderboards, and certificates
- Trainer content management and challenge authoring
- Admin assignment, user management, analytics, and employee monitoring
- JWT access and refresh token authentication
- MongoDB-backed progress and activity tracking

## Technology stack

### Frontend

- React
- React Router
- Tailwind CSS
- Recharts
- Framer Motion
- Monaco Editor
- Three.js / React Three Fiber

### Backend

- Node.js
- Express
- MongoDB with Mongoose
- JWT authentication
- bcryptjs
- PDFKit and QRCode

## Project structure

```text
.
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── server.js
│   └── package.json
└── frontend/
    ├── public/
    ├── src/
    ├── vercel.json
    └── package.json
```

## Requirements

- Node.js 18 or newer
- npm
- MongoDB Atlas or a local MongoDB instance

## Run locally

### 1. Clone the repository

```bash
git clone https://github.com/Akshayharyan/GamifiedEmployeeTrainingPlatform.git
cd GamifiedEmployeeTrainingPlatform
```

### 2. Configure the backend

Create `backend/.env`:

```env
MONGO_URI=mongodb://localhost:27017/gamified_training
JWT_SECRET=replace-with-a-long-random-secret
JWT_REFRESH_SECRET=replace-with-a-different-long-random-secret
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

For MongoDB Atlas, replace `MONGO_URI` with your private `mongodb+srv://` connection string.

Install dependencies and start the API:

```bash
cd backend
npm install
npm start
```

The API runs at `http://localhost:5000`.

### 3. Configure the frontend

Create or update `frontend/.env`:

```env
REACT_APP_API_URL=http://localhost:5000
```

Install dependencies and start React:

```bash
cd frontend
npm install
npm start
```

The frontend runs at `http://localhost:3000`.

## Production deployment

SkillQuest is deployed as two services:

- **Frontend:** Vercel
- **Backend:** Render
- **Database:** MongoDB Atlas free tier

### Backend on Render

Create a Render Web Service with:

```text
Root Directory: backend
Build Command: npm install
Start Command: npm start
```

Configure these private environment variables in Render:

```env
MONGO_URI=<private MongoDB Atlas connection string>
JWT_SECRET=<long-random-secret>
JWT_REFRESH_SECRET=<different-long-random-secret>
NODE_ENV=production
CLIENT_URL=https://your-frontend-domain.vercel.app
```

### Frontend on Vercel

Import the `frontend` directory as a separate Vercel project:

```text
Root Directory: frontend
Build Command: npm run build
Output Directory: build
```

Add this environment variable:

```env
REACT_APP_API_URL=https://your-backend-service.onrender.com
```

The frontend includes a Vercel rewrite in `frontend/vercel.json` so client-side routes continue to work after a page refresh.

## Database seeding

Seed scripts are located in the backend directory. Run them only against the intended database:

```bash
cd backend
node seedModules.js
node seedHTMLModule.js
node scripts/seedBosses.js
```

Review each script before running it in production and avoid running non-idempotent scripts more than once.

## Security notes

- Never commit `.env` files or database credentials.
- Store production secrets only in the hosting provider's environment settings.
- Use different, strong values for `JWT_SECRET` and `JWT_REFRESH_SECRET`.
- Rotate credentials immediately if they are exposed.
- Restrict MongoDB Atlas network access when the deployment setup allows it.

## Build the frontend

```bash
cd frontend
npm run build
```

The production files are generated in `frontend/build`.

# Startup Guide

Step-by-step instructions to get the database and web app running locally.

---

## Prerequisites

- [Node.js 20+](https://nodejs.org/) (check: `node -v`)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) running in the background

---

## 1. Install Dependencies

```bash
npm install
```

---

## 2. Set Up Environment Variables

Create a `.env` file in the project root (copy this exactly for local dev):

```bash
DATABASE_URL="postgresql://teacher:teacher_pass@localhost:5432/teachers_assistant"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="super-secret-key-change-in-production"
```

> If a `.env` file already exists, skip this step.

---

## 3. Start the Database (Docker)

Start the PostgreSQL container with Docker Compose:

```bash
docker compose up -d
```

This spins up a PostgreSQL 16 container named `teachers_help_db` on port `5432`.

**Verify it's running:**

```bash
docker ps
```

You should see `teachers_help_db` with status `Up`.

**To stop the database later:**

```bash
docker compose down
```

> Your data persists in the `postgres_data` Docker volume between restarts. To wipe all data: `docker compose down -v`

---

## 4. Run Database Migrations

Apply the Prisma schema to the database:

```bash
npx prisma migrate dev
```

This creates all tables. Only needs to be run once (or after schema changes).

---

## 5. Seed the Database (Optional)

Load sample data for development:

```bash
npm run seed
```

This creates:
- 1 teacher account: `teacher@school.com` / `password123`
- 3 classes: Algebra I, English Literature, Physics
- 10 students per class with sample grades, schedules, and task templates

---

## 6. Start the Web App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

Log in with:
- **Email:** `teacher@school.com`
- **Password:** `password123`

---

## Full Start Sequence (After Initial Setup)

Once everything is set up, this is all you need each session:

```bash
docker compose up -d   # Start the database
npm run dev            # Start the web app
```

---

## Troubleshooting

**`connection refused` on port 5432**
The database container isn't running. Run `docker compose up -d` and wait 5 seconds.

**`relation "User" does not exist`**
Migrations haven't been applied. Run `npx prisma migrate dev`.

**`Invalid credentials` on login**
The database was wiped or seed wasn't run. Run `npm run seed`.

**Port 5432 already in use**
Another PostgreSQL instance is running locally. Either stop it (`brew services stop postgresql`) or change the host port in `docker-compose.yml` (e.g., `"5433:5432"`) and update `DATABASE_URL` accordingly.

**`NEXTAUTH_SECRET` warning in console**
Your `.env` is missing `NEXTAUTH_SECRET`. The default dev value works locally but must be changed for production.

# Code Suspect

A real-time multiplayer social deduction game where players collaboratively 
debug code while secretly identifying the Saboteur planting bugs among them.

**[Live Demo](<!-- your Vercel URL -->)** · [Report a Bug](<!-- issues URL -->)

---

## How it works

Players join a shared room using a Room ID. One player is secretly assigned 
the role of **Saboteur** — their goal is to introduce bugs into a shared code 
snippet without being caught. The rest are **Debuggers** who analyze changes, 
discuss suspicions in a live chat, and vote to eliminate the Saboteur before 
too many bugs accumulate.

Think Among Us, but for programmers.

## Features

- Real-time multiplayer rooms via WebSockets
- Collaborative Monaco code editor (same engine as VS Code)
- Role-based editing permissions — only the Saboteur can modify code
- Live change history timeline showing who edited what and when
- Discussion chat + voting system with simultaneous reveal
- Countdown timers driving each game phase

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS |
| Realtime | Socket.io |
| Backend | Node.js + Express |
| Code editor | Monaco Editor |
| Deployment | Vercel (client) + Railway (server) |

## Getting started locally

**Prerequisites:** Node.js 18+

Clone the repo:
\```bash
git clone https://github.com/<!-- your-username -->/code-suspect.git
cd code-suspect
\```

Start the server:
\```bash
cd server
npm install
npm run dev
\```

Start the client (new terminal):
\```bash
cd client
npm install
npm run dev
\```

Open [http://localhost:5173](http://localhost:5173). Open a second tab 
and join the same Room ID to test multiplayer locally.

## Project structure

\```
code-suspect/
├── client/               # React + Vite frontend
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Route-level page components
│   │   ├── socket/       # Socket.io client setup
│   │   └── store/        # Global state (Zustand)
│   └── vite.config.js
├── server/               # Node.js + Express backend
│   └── src/
│       ├── index.js      # Entry point + Socket.io
│       ├── app.js        # Express app + middleware
│       └── routes/       # REST endpoints
└── README.md
\```


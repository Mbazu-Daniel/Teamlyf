# Teamlyf

Teamlyf is a comprehensive workspace management platform that unites project tracking, human resources, real-time communication, and AI agents into a single environment. 

## Overview

Teamlyf helps teams manage their entire daily workflow in one place. It brings together project management, human resources, internal chat, and document collaboration so organizations can operate without juggling multiple separate tools. Teams can create tasks, request time off, jump into video calls, and leverage AI agents from a unified interface.

## System Architecture

```mermaid
flowchart LR
  Client["Web Client"]
  Server["API Services"]
  Database[("PostgreSQL Database")]
  Billing["Billing Provider"]
  RTC["LiveKit Server"]

  Client -- "HTTP / WebSocket" --> Server
  Server -- "Read / Write" --> Database
  Server -- "Checkout / Webhooks" --> Billing
  Server -- "Issue Call Tokens" --> RTC

  style Client fill:#1e1b4b,stroke:#6366f1,stroke-width:2px,color:#fff
  style Server fill:#2e1065,stroke:#8b5cf6,stroke-width:2px,color:#fff
  style Database fill:#0f172a,stroke:#3b82f6,stroke-width:2px,color:#fff
  style Billing fill:#451a03,stroke:#f59e0b,stroke-width:2px,color:#fff
  style RTC fill:#022c22,stroke:#10b981,stroke-width:2px,color:#fff
```

## Installation

Follow these steps to set up the project locally.

Clone the Repository:
```bash
git clone https://github.com/Mbazu-Daniel/Teamlyf.git
cd Teamlyf
```

Install dependencies:
```bash
pnpm install
```

Set up your environment variables:
```bash
cp .env.example .env
```

Start the database using Docker:
```bash
pnpm db:up
```

Run database migrations:
```bash
pnpm db:generate
pnpm db:migrate
```

Start the development server:
```bash
pnpm dev
```

## Usage

Once the development server is running, the API will be available on port 3101 by default. You can navigate to the API documentation route at `/api/v1/docs` in your browser to explore the available endpoints. 

To create your first workspace, you will need to sign up a new user, create an organization, and then begin inviting team members. Use the CLI tool to audit your codebase health periodically.

Run a strict audit on your code changes:
```bash
pnpm fallow:audit
```

## Features

### Human Resources Management
Teamlyf includes a dedicated HR module that tracks employee profiles, leave policies, and time-off balances. Team members can request time off, and managers can review, approve, or reject these requests seamlessly. Balances are calculated dynamically based on policy allowances and approved time off.

```mermaid
sequenceDiagram
  actor Member
  participant Server
  participant Database as "PostgreSQL Database"

  Member->>Server: Request time off
  Server->>Server: Validate leave policy bounds
  Server->>Database: Save pending request
  Database->>Server: Confirm creation
  Server->>Member: Return success status
```

### Project and Task Tracking
Teams can organize their work using projects, milestones, tasks, and labels. The system supports detailed task assignments, priority levels, custom statuses, and threaded comments for focused discussions on individual deliverables.

### Real-time Communication
The platform provides instant messaging through channels and direct messages, featuring threaded replies and emoji reactions. It also integrates video and audio calls by issuing secure tokens for a dedicated real-time communication server.

### AI Agent Integration
Organizations can deploy managed or bring-your-own-key AI agents directly into their workspace. The platform tracks agent usage, token consumption, and estimated costs to ensure billing limits are respected.

### Automated Billing and Subscriptions
The system integrates with external billing providers to handle workspace upgrades. It processes secure webhooks to automatically adjust seat limits, agent allowances, and call durations based on the active tier.

```mermaid
sequenceDiagram
  actor Provider as "Billing Provider"
  participant Server
  participant Database as "PostgreSQL Database"

  Provider->>Server: Send subscription update
  Server->>Server: Verify secure signature
  Server->>Database: Update workspace plan limits
  Database->>Server: Acknowledge update
  Server->>Provider: Return 200 OK
```

## Technologies Used

| Category | Technology |
|---|---|
| Backend Framework | [NestJS](https://nestjs.com/) |
| Runtime | [Node.js](https://nodejs.org/) |
| Language | [TypeScript](https://www.typescriptlang.org/) |
| Database | [PostgreSQL](https://www.postgresql.org/) |
| ORM | [Drizzle](https://orm.drizzle.team/) |
| Authentication | [Better Auth](https://better-auth.com/) |
| Package Manager | [pnpm](https://pnpm.io/) |

## Author Info

* Daniel Mbazu: https://github.com/Mbazu-Daniel
* Joy Ibini: https://github.com/Nastechy
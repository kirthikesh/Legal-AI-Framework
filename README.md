# AI-Framework

Internal AI platform for office workflows — one shared app, six departments, hard isolation between all of them.

![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=next.js&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-000000?style=flat-square&logo=docker&logoColor=white)
![AWS](https://img.shields.io/badge/AWS-000000?style=flat-square&logo=amazonaws&logoColor=white)
![Bedrock](https://img.shields.io/badge/AI-AWS%20Bedrock-000000?style=flat-square)
![Status](https://img.shields.io/badge/status-in%20development-333333?style=flat-square)
![Private](https://img.shields.io/badge/visibility-private-333333?style=flat-square)

---

## What this project is

A Company wants its staff to use AI day to day — drafting, research, reviewing documents — without exposing one department's work to another, and without every department improvising its own AI tool with no oversight or auditability.

This project is that platform: one internal web application, shared across six departments (Development, Testing, Finance, HR, Legal Ops, Admin), where every employee signs in, gets AI-assisted tools scoped to their own department's data, and is architecturally incapable of reaching another department's information — not by policy, but by how the system is built.

Concretely, that means:

- A **Next.js dashboard** employees log into, running in Docker containers on AWS.
- **Department-scoped AI**, backed by AWS Bedrock — each department's AI answers are grounded only in that department's own documents (via a per-department Bedrock Knowledge Base), and filtered through Guardrails before anything reaches the user.
- **Isolation enforced three times over**: once at the IAM role a department's login maps to, once at the database (row-level security), and once at storage (a department-only S3 prefix) — so no single missed check anywhere exposes another department's data.
- **A fully AWS-native deployment**: no GitHub Actions, no third-party identity provider. CodePipeline builds and ships the app; Cognito and IAM handle who can do what.

The end goal is a working pilot the office can actually run on — not a proof of concept that gets rebuilt later. The business scenario and the reasoning behind every decision here (why AWS Bedrock over Azure AI Foundry, why multi-tenant, why this stack) is written up in full in [`docs/scenario.md`](docs/scenario.md).

## Architecture

<img width="1993" height="1022" alt="image" src="https://github.com/user-attachments/assets/341f69ed-9e13-4901-ac45-90d0f0c7cd58" />


Request flow, numbered:

1. **Front End (Next.js)** → **Route 53** → **Load Balancer**, protected by **WAF** and TLS-terminated via **Certificate Manager**. **Cognito** handles employee sign-in.
2. The load balancer forwards into an **ECS Fargate** cluster (the Dockerized app), auto-scaled across **two Availability Zones** inside a **Security Group**, in a private **VPC**.
3. The app reads and writes **RDS** (Master, with a **Replica** for failover), **S3**, and **Bedrock** — Bedrock is reached without the traffic ever leaving the VPC.
4. **KMS** encrypts data at rest; **CloudWatch** watches compute, database, and AI together.
5. Separately, the **CI/CD Pipeline** — a developer's Git push runs through **CodePipeline → CodeBuild → ECR**, which then deploys the built image straight into the same ECS cluster.

A second diagram — focused specifically on how department isolation is enforced end to end — lives in [`docs/architecture/`](docs/architecture/) alongside this one.

## Tech stack

| Layer | Choice |
|---|---|
| Frontend / backend | Next.js |
| Containerization | Docker |
| Compute | AWS ECS on Fargate |
| Container registry | Amazon ECR |
| CI/CD | AWS CodePipeline + CodeBuild |
| Database | Amazon RDS (Aurora PostgreSQL) — Master + Replica |
| Storage | Amazon S3 |
| AI platform | AWS Bedrock (Claude + others, Guardrails, Knowledge Bases) |
| Identity | Amazon Cognito, IAM |
| Networking | Route 53, ALB, VPC, WAF, ACM |
| Encryption | AWS KMS |
| Monitoring | Amazon CloudWatch |

All-AWS by design — no third-party CI/CD or external identity provider in the deploy path.

## Backend

There's no separate backend framework — Next.js Route Handlers *are* the backend, running server-side inside the same container deployed to ECS Fargate. Nothing AWS-related ever runs in the browser.

- **API routes** — `/api/chat`, `/api/documents`, `/api/departments/:id`, etc. — all server-side.
- **Auth verification** — validates the Cognito session/JWT on every request before anything else runs.
- **RBAC middleware** — resolves which department the caller belongs to and rejects anything outside that scope, before a query reaches the database.
- **Database access layer** — an ORM (Prisma or Drizzle) over Aurora PostgreSQL, every query scoped by department.
- **AWS SDK integrations** — Bedrock (invoke model, Guardrails, Knowledge Base retrieval), S3 (per-department document upload/download), Cognito (token verification).
- **Input validation** — request bodies validated (e.g. with Zod) before they hit business logic.
- **Error handling & logging** — consistent error responses, with logs and errors flowing to CloudWatch.

As it grows: document uploads get processed into a department's Bedrock Knowledge Base (can run inline in the API route at first, move to a queue/Lambda if it gets slow), and per-department rate limiting keeps one team from exhausting the shared Bedrock quota for everyone else.

## Repository structure

legal-ai-framework/
├── frontend/                      Next.js app — dashboard + backend
│   ├── app/
│   │   └── api/                    Route Handlers (the backend)
│   ├── lib/
│   │   ├── auth.ts                  Cognito session/JWT verification
│   │   ├── rbac.ts                  Department-scoping middleware
│   │   ├── db.ts                    ORM client (RDS / Aurora Postgres)
│   │   └── aws.ts                   Bedrock, S3, Cognito SDK clients
│   └── middleware.ts               Runs auth + RBAC before every request
├── docker/            Dockerfile
├── infra/
│   ├── pipeline/       AWS CodeBuild buildspec
│   └── iam/            Per-department IAM role definitions
├── docs/
│   ├── scenario.md                        Business scenario + full architecture writeup
│   └── architecture/
│       └── aws-architecture-diagram.png    Full infrastructure diagram
└── README.md


## Department isolation

Six departments share this platform. Each one maps to:

- an **IAM role**, scoped to that department only
- an **RDS schema / row-level security policy**, so queries can only see that department's rows
- an **S3 prefix**, so documents are only reachable within that department's path
- a **Bedrock Knowledge Base + Guardrail**, so AI answers are grounded in — and limited to — that department's own material

Nothing upstream is trusted to enforce this alone. Every layer checks it independently.

## Getting started

```bash
# frontend
cd frontend
npm install
npm run dev

# build the container
docker build -f docker/Dockerfile -t ai-framework .
```

AWS-side setup (IAM roles, RDS, S3, Bedrock access, CodePipeline) is tracked in [`infra/`](infra/) as it's built out.

## Status

Business scenario and architecture — done. Currently in Week 2: infrastructure and IAM design.

## Contributors

- **Kirthikesh Parthasarathy**
- **Anand Babu Kuselan**

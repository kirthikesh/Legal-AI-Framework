# Legal AI Framework — Complete Plan (Start to End)

## 1. Business Scenario

The office wants to adopt AI as part of its daily operations, and the ask is to design and build a framework that makes that possible — not just plugging in a chatbot, but a proper internal platform that different departments can use safely, each within their own boundary.

Concretely: a web application that employees log into, which gives them AI-assisted tools relevant to their department, while guaranteeing that one department's data and AI interactions stay invisible to every other department. The organization has multiple departments (for example: Development, QA/Testing, Finance, HR, and others), and access must be controlled so that, say, someone on the Testing team cannot see Finance's data or AI activity, and vice versa.

Because this is being scoped as a framework rather than a single app, it's also being built multi-tenant — the same platform could eventually serve more than one organization, each isolated from the others, not just department-to-department within one office.

## 2. Full Tool Stack

| Layer | Tool | Purpose |
|---|---|---|
| Frontend + Backend | Next.js | Employee dashboard UI + server-side API routes that proxy every AI call |
| Containerization | Docker | Consistent build across dev, staging, production |
| Container registry | Amazon ECR | Stores built Docker images |
| Compute hosting | AWS ECS on Fargate | Runs the containers — serverless, no servers to patch, scales automatically |
| Networking | Amazon VPC + Application Load Balancer | Private network boundary; ALB handles TLS and routes traffic in |
| AI-to-app connectivity | VPC Endpoint / AWS PrivateLink | Bedrock traffic never leaves the private network |
| AI platform | AWS Bedrock | Hosts the foundation models (Claude Sonnet and others) behind one governed API |
| AI grounding (RAG) | Bedrock Knowledge Bases | Grounds each department's AI answers in that department's own documents |
| AI safety | Bedrock Guardrails | Content filtering, PII redaction, per-department sensitivity rules |
| Database | Amazon RDS (Aurora PostgreSQL) | Stores app + tenant/department data, with row-level isolation |
| Document storage | Amazon S3 | Source documents feeding the Knowledge Bases, scoped per department |
| Identity | IdP (e.g. Microsoft Entra ID) + AWS IAM Identity Center | Employee login / SSO, federated into AWS |
| Access control | AWS IAM (RBAC) | Enforces department-level permissions on every AWS resource, including Bedrock |
| CI/CD | GitHub Actions (or AWS CodePipeline) | Builds, tests, and deploys automatically on every change |
| DNS | Amazon Route 53 | Routes the app's domain to the load balancer |
| Monitoring | Amazon CloudWatch | Logs and metrics across the stack |

## 3. Where It's Hosted

Everything runs inside AWS, in a single VPC, so there's one identity boundary and one network boundary end to end — no traffic crosses into a second cloud.

- **Compute**: The Dockerized Next.js app runs on **ECS with Fargate** — AWS manages the underlying servers, so it just scales containers up and down with load. No EC2 instances to patch or maintain.
- **Entry point**: An **Application Load Balancer** sits in a public subnet, terminates TLS, and routes requests into the app running in private subnets.
- **AI calls**: The app's backend calls **Bedrock over a VPC endpoint (PrivateLink)** — prompts and responses never touch the public internet.
- **Data**: **Aurora PostgreSQL (RDS)** holds structured data, isolated per department/tenant. **S3** holds the source documents that get indexed into each department's Knowledge Base.
- **Deploy path**: CI/CD builds the Docker image, pushes it to **ECR**, and ECS pulls the new image on deploy — fully automated, no manual server access.
- **Identity**: Employees log in via the office's IdP; that identity is federated into AWS through **IAM Identity Center**, which maps each employee to an IAM role scoped to their department.

This is a standard, well-documented AWS reference pattern — not a custom or experimental setup, which matters for a first enterprise build.

## 4. Step-by-Step Build Plan

1. **Define requirements and scope** — departments involved, what each needs AI for, and what "isolation" means in practice (data, chat history, documents, model access).
2. **Design the architecture** — multi-tenant data model, RBAC scheme, and how identity, permissions, and AI requests flow through the system end to end.
3. **Set up authentication via the IdP** — centralized login (SSO), federated into AWS via IAM Identity Center.
4. **Build the frontend and backend in Next.js** — one codebase for the dashboard and the server-side logic that talks to AWS.
5. **Implement RBAC on top of IdP groups** — map each employee's IdP group/role to a department, enforced on every request via IAM.
6. **Set up the AWS environment** — VPC, ECS cluster, RDS, S3 buckets, and IAM roles scoped per department.
7. **Integrate AWS Bedrock server-side** — all AI calls go through the Next.js backend, never directly from the browser.
8. **Add per-department grounding with Bedrock Knowledge Bases** — each department's AI answers grounded in that department's own documents in S3.
9. **Apply Bedrock Guardrails** — content filtering and PII redaction, tuned per department.
10. **Containerize with Docker and push to ECR.**
11. **Set up CI/CD** — automated build, test, and deploy to ECS on every change.
12. **Deploy and test isolation** — verify, department by department, that no one can reach another department's data before rolling out further.
13. **Pilot with one department, then expand** to the rest, then to additional tenants if the platform grows beyond this office.

## 5. Why AWS Bedrock Is Important

- **IAM integration**: Bedrock runs on the same IAM system as the rest of AWS, so department-level access control is enforced at the AI layer itself — not bolted on in application code.
- **VPC isolation**: Reached privately via PrivateLink, so prompts and documents never cross the public internet — important for legal-industry data handling.
- **Model flexibility, no lock-in**: Bedrock hosts Claude alongside other models (Titan, Llama, Cohere, etc.) behind one API. It's not a choice against Claude — it's AWS's governance layer for calling Claude and others.
- **Guardrails**: Built-in content filtering and PII redaction, configurable per department's sensitivity needs.
- **Knowledge Bases (managed RAG)**: Each department's AI answers are grounded in that department's own documents, not general model knowledge — which is what "framework" means for this project.
- **One cloud, one boundary**: Since the app is already hosted on AWS (ECS, RDS, S3), keeping the AI layer there too means one IAM model, one network boundary, one compliance surface — no second cloud to trust with the most sensitive workload.
- **Track record**: Bedrock's enterprise IAM/RBAC patterns have been in production since 2023 — a much deeper base of reference architectures than newer alternatives, which matters when the team is also learning the architecture while building it.

## 6. Why a Multi-Tenant Framework Is Used Here

Multi-tenancy means one shared application and one shared set of infrastructure serves multiple isolated groups — instead of deploying a separate copy of the app for each group.

This project needs that pattern for two reasons, one immediate and one forward-looking:

- **Immediate need — departments.** Six departments sharing one platform, each unable to see another's data, is itself a multi-tenancy problem. Each department is treated as a "tenant": its own scoped IAM role, its own Knowledge Base, its own Guardrail configuration, its own slice of the database (enforced via a tenant/department ID plus row-level security as a second layer behind RBAC).
- **Forward-looking — reuse.** Building it multi-tenant from day one, instead of hardcoding "6 departments" into the app, means adding a 7th department later is a configuration change, not a rebuild. And if the platform is ever offered beyond this one office — to another organization entirely — it onboards as a new tenant on the same infrastructure, using the exact same isolation model that already separates departments today.

In short: the isolation problem the office actually has (departments) and the isolation problem a real product would have (organizations) are the same problem at different scales. Solving it once, properly, at the architecture level avoids solving it twice.

## 7. Summary for Your Uncle

This is an internal AI platform, not a single AI feature. It needs strict, verifiable isolation between six departments, so identity and access control (IdP → IAM → RBAC) come first, enforced all the way down to the AI layer. It's built multi-tenant so that isolation model scales cleanly — to more departments, or to other organizations, without a redesign. Next.js gives one codebase for a secure frontend and a backend that safely proxies every AI call. Everything hosts on AWS — ECS for the app, RDS and S3 for data, Bedrock for AI — so there's exactly one identity boundary and one network boundary end to end. AWS Bedrock was chosen over Azure AI Foundry because the entire access-control design (IAM-scoped roles, Guardrails, Knowledge Bases) is built around it, Bedrock's enterprise patterns have three years of production track record versus a few months for the Azure alternative, and model choice is no longer a differentiator since Claude is now available on both platforms. Docker and CI/CD exist to make sure this ships reliably and repeatably as it grows.

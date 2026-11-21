// Static reference data. In production this lives in a database (e.g. DynamoDB) per tenant.

export type Role = "platform_admin" | "dept_admin" | "member";

export const ROLE_LABEL: Record<Role, string> = {
  platform_admin: "Platform admin",
  dept_admin: "Department admin",
  member: "Member",
};

export type DepartmentId = "developer" | "testing" | "finance" | "hr" | "legal" | "operations";

export interface Department {
  id: DepartmentId;
  name: string;
}

// Legal and Operations are placeholders until the real six are confirmed.
export const DEPARTMENTS: Department[] = [
  { id: "developer", name: "Developer" },
  { id: "testing", name: "Testing" },
  { id: "finance", name: "Finance" },
  { id: "hr", name: "HR" },
  { id: "legal", name: "Legal" },
  { id: "operations", name: "Operations" },
];

export function isDepartmentId(value: string): value is DepartmentId {
  return DEPARTMENTS.some((d) => d.id === value);
}

export function departmentName(id: string): string {
  return DEPARTMENTS.find((d) => d.id === id)?.name ?? id;
}

export type ModelId = "claude" | "nova" | "gptoss" | "llama";

export interface AiModel {
  id: ModelId;
  label: string;
  vendor: string;
  envVar: string; // env var holding the Bedrock model ID
}

export const MODELS: AiModel[] = [
  { id: "claude", label: "Claude Sonnet", vendor: "Anthropic", envVar: "BEDROCK_MODEL_CLAUDE" },
  { id: "nova", label: "Amazon Nova Pro", vendor: "Amazon", envVar: "BEDROCK_MODEL_NOVA" },
  { id: "gptoss", label: "GPT-OSS 120B", vendor: "OpenAI (open-weight)", envVar: "BEDROCK_MODEL_GPTOSS" },
  { id: "llama", label: "Llama", vendor: "Meta", envVar: "BEDROCK_MODEL_LLAMA" },
];

export function isModelId(value: string): value is ModelId {
  return MODELS.some((m) => m.id === value);
}

export function modelLabel(id: string): string {
  return MODELS.find((m) => m.id === id)?.label ?? id;
}

export const DEFAULT_APPROVALS: Record<DepartmentId, ModelId[]> = {
  developer: ["claude", "gptoss"],
  testing: ["claude", "nova"],
  finance: ["claude", "nova"],
  hr: ["claude"],
  legal: ["claude", "nova"],
  operations: ["nova"],
};

export interface DemoUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  dept: DepartmentId | null; // platform admins belong to no department
}

// Sample people for demo sign-in. Replaced by the company IdP in production.
export const DEMO_USERS: DemoUser[] = [
  { id: "u-admin", name: "Platform admin", email: "platform.admin@company.com", role: "platform_admin", dept: null },
  { id: "u-fin-admin", name: "Finance manager", email: "finance.admin@company.com", role: "dept_admin", dept: "finance" },
  { id: "u-aisha", name: "Aisha Murphy", email: "aisha.murphy@company.com", role: "member", dept: "finance" },
  { id: "u-rahul", name: "Rahul Kumar", email: "rahul.kumar@company.com", role: "member", dept: "developer" },
  { id: "u-sean", name: "Sean O'Brien", email: "sean.obrien@company.com", role: "member", dept: "hr" },
];

export interface DocumentMeta {
  id: string;
  dept: DepartmentId;
  title: string;
  updated: string;
}

// Sample documents. Each one belongs to exactly one tenant.
export const DOCUMENTS: DocumentMeta[] = [
  { id: "fin-q3-vendor", dept: "finance", title: "Q3 vendor contracts review.pdf", updated: "2h ago" },
  { id: "fin-expense", dept: "finance", title: "Expense policy 2026.docx", updated: "Yesterday" },
  { id: "fin-invoice", dept: "finance", title: "Invoice audit checklist.xlsx", updated: "Mon" },
  { id: "dev-arch", dept: "developer", title: "Platform architecture notes.md", updated: "3h ago" },
  { id: "dev-runbook", dept: "developer", title: "Release runbook.md", updated: "Tue" },
  { id: "hr-handbook", dept: "hr", title: "Employee handbook 2026.pdf", updated: "Last week" },
  { id: "test-plan", dept: "testing", title: "Regression test plan.xlsx", updated: "Today" },
  { id: "legal-nda", dept: "legal", title: "Standard NDA template.docx", updated: "Fri" },
  { id: "ops-oncall", dept: "operations", title: "On-call rota.xlsx", updated: "Today" },
];

export function documentsFor(dept: DepartmentId): DocumentMeta[] {
  return DOCUMENTS.filter((d) => d.dept === dept);
}

export function findDocument(id: string): DocumentMeta | undefined {
  return DOCUMENTS.find((d) => d.id === id);
}

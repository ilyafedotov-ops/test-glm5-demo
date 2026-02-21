import { PrismaClient, Role, Permission } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

const permissions = [
  { name: "incidents:read", resource: "incidents", action: "read" },
  { name: "incidents:write", resource: "incidents", action: "create" },
  { name: "incidents:update", resource: "incidents", action: "update" },
  { name: "incidents:delete", resource: "incidents", action: "delete" },
  { name: "problems:read", resource: "problems", action: "read" },
  { name: "problems:write", resource: "problems", action: "create" },
  { name: "problems:update", resource: "problems", action: "update" },
  { name: "problems:delete", resource: "problems", action: "delete" },
  { name: "changes:read", resource: "changes", action: "read" },
  { name: "changes:write", resource: "changes", action: "create" },
  { name: "changes:update", resource: "changes", action: "update" },
  { name: "changes:delete", resource: "changes", action: "delete" },
  { name: "tasks:read", resource: "tasks", action: "read" },
  { name: "tasks:write", resource: "tasks", action: "create" },
  { name: "tasks:update", resource: "tasks", action: "update" },
  { name: "tasks:delete", resource: "tasks", action: "delete" },
  { name: "workflows:read", resource: "workflows", action: "read" },
  { name: "workflows:write", resource: "workflows", action: "create" },
  { name: "workflows:update", resource: "workflows", action: "update" },
  { name: "workflows:delete", resource: "workflows", action: "delete" },
  { name: "service_catalog:read", resource: "service_catalog", action: "read" },
  { name: "service_catalog:write", resource: "service_catalog", action: "create" },
  { name: "service_catalog:update", resource: "service_catalog", action: "update" },
  { name: "service_catalog:delete", resource: "service_catalog", action: "delete" },
  { name: "knowledge:read", resource: "knowledge", action: "read" },
  { name: "knowledge:write", resource: "knowledge", action: "create" },
  { name: "knowledge:update", resource: "knowledge", action: "update" },
  { name: "knowledge:delete", resource: "knowledge", action: "delete" },
  { name: "violations:read", resource: "violations", action: "read" },
  { name: "violations:write", resource: "violations", action: "create" },
  { name: "violations:update", resource: "violations", action: "update" },
  { name: "violations:delete", resource: "violations", action: "delete" },
  { name: "users:read", resource: "users", action: "read" },
  { name: "users:write", resource: "users", action: "create" },
  { name: "users:update", resource: "users", action: "update" },
  { name: "users:delete", resource: "users", action: "delete" },
  { name: "roles:read", resource: "roles", action: "read" },
  { name: "roles:write", resource: "roles", action: "create" },
  { name: "roles:update", resource: "roles", action: "update" },
  { name: "roles:delete", resource: "roles", action: "delete" },
  { name: "teams:read", resource: "teams", action: "read" },
  { name: "teams:write", resource: "teams", action: "create" },
  { name: "teams:update", resource: "teams", action: "update" },
  { name: "teams:delete", resource: "teams", action: "delete" },
  { name: "organizations:read", resource: "organizations", action: "read" },
  { name: "organizations:update", resource: "organizations", action: "update" },
  { name: "configuration_items:read", resource: "configuration_items", action: "read" },
  { name: "configuration_items:write", resource: "configuration_items", action: "create" },
  { name: "configuration_items:update", resource: "configuration_items", action: "update" },
  { name: "configuration_items:delete", resource: "configuration_items", action: "delete" },
  { name: "settings:read", resource: "settings", action: "read" },
  { name: "settings:write", resource: "settings", action: "create" },
  { name: "settings:update", resource: "settings", action: "update" },
  { name: "settings:delete", resource: "settings", action: "delete" },
  { name: "policies:read", resource: "policies", action: "read" },
  { name: "policies:write", resource: "policies", action: "create" },
  { name: "policies:update", resource: "policies", action: "update" },
  { name: "policies:delete", resource: "policies", action: "delete" },
  { name: "reports:read", resource: "reports", action: "read" },
  { name: "reports:write", resource: "reports", action: "create" },
  { name: "notifications:read", resource: "notifications", action: "read" },
  { name: "notifications:update", resource: "notifications", action: "update" },
  { name: "notifications:delete", resource: "notifications", action: "delete" },
  { name: "activities:read", resource: "activities", action: "read" },
  { name: "dashboard:read", resource: "dashboard", action: "read" },
  { name: "sla:read", resource: "sla", action: "read" },
  { name: "audit:read", resource: "audit", action: "read" },
  { name: "admin:all", resource: "admin", action: "manage" },
];

const roles = [
  { name: "admin", description: "Full system access", isSystem: true },
  { name: "operator", description: "Incident management", isSystem: true },
  { name: "compliance_manager", description: "Policy and compliance management", isSystem: true },
  { name: "analyst", description: "Read-only access", isSystem: true },
];

const rolePermissionMap: Record<string, string[]> = {
  admin: ["*"],
  operator: [
    "incidents:read",
    "incidents:write",
    "incidents:update",
    "incidents:delete",
    "problems:read",
    "problems:write",
    "problems:update",
    "changes:read",
    "changes:write",
    "changes:update",
    "tasks:read",
    "tasks:write",
    "tasks:update",
    "tasks:delete",
    "workflows:read",
    "workflows:write",
    "workflows:update",
    "service_catalog:read",
    "service_catalog:write",
    "service_catalog:update",
    "knowledge:read",
    "knowledge:write",
    "knowledge:update",
    "notifications:read",
    "notifications:update",
    "notifications:delete",
    "activities:read",
    "dashboard:read",
    "sla:read",
    "reports:read",
  ],
  compliance_manager: [
    "violations:read",
    "violations:write",
    "violations:update",
    "violations:delete",
    "policies:read",
    "policies:write",
    "policies:update",
    "reports:read",
    "reports:write",
    "audit:read",
    "activities:read",
    "dashboard:read",
    "sla:read",
    "knowledge:read",
    "notifications:read",
    "notifications:update",
    "notifications:delete",
  ],
  analyst: [
    "incidents:read",
    "problems:read",
    "changes:read",
    "tasks:read",
    "workflows:read",
    "service_catalog:read",
    "knowledge:read",
    "violations:read",
    "policies:read",
    "reports:read",
    "activities:read",
    "dashboard:read",
    "sla:read",
    "notifications:read",
    "notifications:update",
    "notifications:delete",
  ],
};

async function main() {
  console.log("Seeding database...");

  // Create permissions
  console.log("Creating permissions...");
  const createdPermissions: Permission[] = [];
  for (const perm of permissions) {
    const created = await prisma.permission.upsert({
      where: { name: perm.name },
      update: {},
      create: perm,
    });
    createdPermissions.push(created);
  }

  // Create roles
  console.log("Creating roles...");
  const createdRoles: Role[] = [];
  for (const role of roles) {
    const created = await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    });
    createdRoles.push(created);
  }
  const adminRole = createdRoles.find((r) => r.name === "admin");
  if (!adminRole) {
    throw new Error("System role 'admin' was not created");
  }

  // Assign permission sets to system roles
  for (const role of createdRoles) {
    const permissionNames = rolePermissionMap[role.name] || [];
    const selectedPermissions = permissionNames.includes("*")
      ? createdPermissions
      : createdPermissions.filter((p) => permissionNames.includes(p.name));

    for (const perm of selectedPermissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId: role.id, permissionId: perm.id },
        },
        update: {},
        create: { roleId: role.id, permissionId: perm.id },
      });
    }
  }

  // Create organization
  console.log("Creating organization...");
  const org = await prisma.organization.upsert({
    where: { slug: "acme-corp" },
    update: {},
    create: {
      name: "Acme Corporation",
      slug: "acme-corp",
      settings: {
        slaEnabled: true,
        defaultSlaHours: 24,
        auditRetentionDays: 365,
        maxTeamMembers: 100,
      },
    },
  });

  // Create admin user
  console.log("Creating admin user...");
  const passwordHash = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@nexusops.com" },
    update: {},
    create: {
      email: "admin@nexusops.com",
      passwordHash,
      firstName: "Admin",
      lastName: "User",
      organizationId: org.id,
      isActive: true,
    },
  });

  // Assign admin role to admin user
  await prisma.userRole.upsert({
    where: {
      userId_roleId: { userId: admin.id, roleId: adminRole.id },
    },
    update: {},
    create: { userId: admin.id, roleId: adminRole.id },
  });

  // Create sample team
  console.log("Creating team...");
  const team = await prisma.team.create({
    data: {
      name: "Engineering",
      description: "Engineering team",
      organizationId: org.id,
    },
  });

  // Create sample incidents
  console.log("Creating sample incidents...");
  const incidentData = [
    {
      title: "Production API latency spike",
      description:
        "Users reporting 5+ second response times on all API endpoints. Started around 2pm EST.",
      priority: "critical",
      status: "in_progress",
    },
    {
      title: "Database backup failing",
      description:
        "Nightly backup job has been failing for the past 3 days with timeout errors.",
      priority: "high",
      status: "open",
    },
    {
      title: "SSO integration issue",
      description:
        "Some users unable to log in via SSO. Error: Invalid redirect URI.",
      priority: "medium",
      status: "pending",
    },
    {
      title: "Dashboard charts not loading",
      description:
        "Dashboard trend charts show loading spinner indefinitely after deployment.",
      priority: "low",
      status: "resolved",
    },
  ];

  for (const data of incidentData) {
    await prisma.incident.create({
      data: {
        ...data,
        organizationId: org.id,
        reporterId: admin.id,
        teamId: team.id,
        tags: ["infrastructure", "production"],
      },
    });
  }

  // Create sample policy
  console.log("Creating sample policy...");
  await prisma.policy.create({
    data: {
      name: "Security Incident Response",
      description:
        "Policy defining the response procedures for security-related incidents.",
      category: "Security",
      status: "active",
      version: "2.0",
      organizationId: org.id,
      ownerRoleId: adminRole.id,
      reviewFrequencyDays: 90,
      lastReviewedAt: new Date(),
      nextReviewAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    },
  });

  console.log("Database seeded successfully!");
  console.log("\nLogin credentials:");
  console.log("  Email: admin@nexusops.com");
  console.log("  Password: admin123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

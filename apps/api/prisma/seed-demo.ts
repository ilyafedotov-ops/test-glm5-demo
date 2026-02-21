import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const DEMO_MARKER = "glm5-demo-seed-v1";

function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

function hoursFromNow(hours: number): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function daysFromNow(days: number): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

async function ensureTeam(
  organizationId: string,
  name: string,
  description: string,
  leadId?: string
) {
  const existing = await prisma.team.findFirst({
    where: { organizationId, name },
  });

  if (existing) {
    return prisma.team.update({
      where: { id: existing.id },
      data: { description, leadId: leadId || existing.leadId || null },
    });
  }

  return prisma.team.create({
    data: {
      name,
      description,
      organizationId,
      leadId,
    },
  });
}

async function upsertTaskByTitle(
  organizationId: string,
  title: string,
  data: Prisma.TaskUncheckedCreateInput
) {
  const existing = await prisma.task.findFirst({
    where: { organizationId, title },
    select: { id: true },
  });

  if (existing) {
    return prisma.task.update({
      where: { id: existing.id },
      data,
    });
  }

  return prisma.task.create({ data });
}

async function upsertWorkflowByName(
  organizationId: string,
  name: string,
  data: Prisma.WorkflowUncheckedCreateInput
) {
  const existing = await prisma.workflow.findFirst({
    where: { organizationId, name },
    select: { id: true },
  });

  if (existing) {
    return prisma.workflow.update({
      where: { id: existing.id },
      data,
    });
  }

  return prisma.workflow.create({ data });
}

async function upsertKnowledgeByTitle(
  organizationId: string,
  title: string,
  data: Prisma.KnowledgeArticleUncheckedCreateInput
) {
  const existing = await prisma.knowledgeArticle.findFirst({
    where: { organizationId, title },
    select: { id: true },
  });

  if (existing) {
    return prisma.knowledgeArticle.update({
      where: { id: existing.id },
      data,
    });
  }

  return prisma.knowledgeArticle.create({ data });
}

async function main() {
  console.log("Seeding realistic demo data...");

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
        maxTeamMembers: 250,
      },
    },
  });

  const admin = await prisma.user.findUnique({
    where: { email: "admin@nexusops.com" },
  });
  if (!admin) {
    throw new Error(
      "Admin user not found. Run base seed first with `pnpm db:seed` and then rerun `pnpm db:seed:demo`."
    );
  }

  const passwordHash = admin.passwordHash;

  const demoUsers = await Promise.all([
    prisma.user.upsert({
      where: { email: "ops.lead@nexusops.com" },
      update: {
        firstName: "Olivia",
        lastName: "Parker",
        organizationId: org.id,
        isActive: true,
      },
      create: {
        email: "ops.lead@nexusops.com",
        passwordHash,
        firstName: "Olivia",
        lastName: "Parker",
        organizationId: org.id,
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: "sre.oncall@nexusops.com" },
      update: {
        firstName: "Noah",
        lastName: "Lee",
        organizationId: org.id,
        isActive: true,
      },
      create: {
        email: "sre.oncall@nexusops.com",
        passwordHash,
        firstName: "Noah",
        lastName: "Lee",
        organizationId: org.id,
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: "service.desk@nexusops.com" },
      update: {
        firstName: "Mia",
        lastName: "Johnson",
        organizationId: org.id,
        isActive: true,
      },
      create: {
        email: "service.desk@nexusops.com",
        passwordHash,
        firstName: "Mia",
        lastName: "Johnson",
        organizationId: org.id,
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: "change.manager@nexusops.com" },
      update: {
        firstName: "Ethan",
        lastName: "Rodriguez",
        organizationId: org.id,
        isActive: true,
      },
      create: {
        email: "change.manager@nexusops.com",
        passwordHash,
        firstName: "Ethan",
        lastName: "Rodriguez",
        organizationId: org.id,
        isActive: true,
      },
    }),
  ]);

  const [opsLead, sreOnCall, serviceDesk, changeManager] = demoUsers;

  const [adminRole, operatorRole, analystRole] = await Promise.all([
    prisma.role.findFirst({ where: { name: "admin" } }),
    prisma.role.findFirst({ where: { name: "operator" } }),
    prisma.role.findFirst({ where: { name: "analyst" } }),
  ]);

  if (adminRole) {
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: admin.id,
          roleId: adminRole.id,
        },
      },
      update: {},
      create: {
        userId: admin.id,
        roleId: adminRole.id,
      },
    });
  }

  if (operatorRole) {
    for (const user of [opsLead, sreOnCall, serviceDesk, changeManager]) {
      await prisma.userRole.upsert({
        where: {
          userId_roleId: {
            userId: user.id,
            roleId: operatorRole.id,
          },
        },
        update: {},
        create: {
          userId: user.id,
          roleId: operatorRole.id,
        },
      });
    }
  }

  if (analystRole) {
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: serviceDesk.id,
          roleId: analystRole.id,
        },
      },
      update: {},
      create: {
        userId: serviceDesk.id,
        roleId: analystRole.id,
      },
    });
  }

  const engineeringTeam = await ensureTeam(
    org.id,
    "Engineering",
    "Core platform and product engineering team",
    opsLead.id
  );
  const sreTeam = await ensureTeam(
    org.id,
    "Site Reliability Engineering",
    "SRE on-call and platform reliability team",
    opsLead.id
  );
  const serviceDeskTeam = await ensureTeam(
    org.id,
    "Service Desk",
    "Frontline service desk and triage team",
    serviceDesk.id
  );
  const changeTeam = await ensureTeam(
    org.id,
    "Change Enablement",
    "Change review, approvals, and implementation coordination",
    changeManager.id
  );

  const memberships = [
    { userId: opsLead.id, teamId: engineeringTeam.id },
    { userId: sreOnCall.id, teamId: sreTeam.id },
    { userId: serviceDesk.id, teamId: serviceDeskTeam.id },
    { userId: changeManager.id, teamId: changeTeam.id },
    { userId: admin.id, teamId: engineeringTeam.id },
  ];

  for (const membership of memberships) {
    await prisma.teamMembership.upsert({
      where: {
        userId_teamId: {
          userId: membership.userId,
          teamId: membership.teamId,
        },
      },
      update: {},
      create: membership,
    });
  }

  const slaByPriority = new Map<string, string>();
  const slaPolicies = [
    { priority: "critical", responseTimeMins: 15, resolutionTimeMins: 120, name: "Critical SLA" },
    { priority: "high", responseTimeMins: 30, resolutionTimeMins: 240, name: "High SLA" },
    { priority: "medium", responseTimeMins: 60, resolutionTimeMins: 480, name: "Medium SLA" },
    { priority: "low", responseTimeMins: 240, resolutionTimeMins: 1440, name: "Low SLA" },
  ];

  for (const policy of slaPolicies) {
    const existing = await prisma.sLAPolicy.findFirst({
      where: {
        organizationId: org.id,
        priority: policy.priority,
        isActive: true,
      },
      select: { id: true },
    });

    const sla = existing
      ? await prisma.sLAPolicy.update({
          where: { id: existing.id },
          data: {
            name: policy.name,
            description: `${policy.priority} priority target policy`,
            responseTimeMins: policy.responseTimeMins,
            resolutionTimeMins: policy.resolutionTimeMins,
            businessHoursOnly: true,
            isActive: true,
          },
        })
      : await prisma.sLAPolicy.create({
          data: {
            name: policy.name,
            description: `${policy.priority} priority target policy`,
            organizationId: org.id,
            priority: policy.priority,
            responseTimeMins: policy.responseTimeMins,
            resolutionTimeMins: policy.resolutionTimeMins,
            businessHoursOnly: true,
            isActive: true,
          },
        });

    slaByPriority.set(policy.priority, sla.id);
  }

  const configurationItems = await Promise.all([
    prisma.configurationItem.upsert({
      where: {
        organizationId_name: {
          organizationId: org.id,
          name: "Checkout API",
        },
      },
      update: {
        type: "service",
        criticality: "critical",
        environment: "production",
        ownerTeam: "Engineering",
        description: "Customer checkout backend APIs and orchestration layer",
      },
      create: {
        name: "Checkout API",
        type: "service",
        status: "active",
        criticality: "critical",
        environment: "production",
        ownerTeam: "Engineering",
        description: "Customer checkout backend APIs and orchestration layer",
        organizationId: org.id,
      },
    }),
    prisma.configurationItem.upsert({
      where: {
        organizationId_name: {
          organizationId: org.id,
          name: "Payments Gateway",
        },
      },
      update: {
        type: "service",
        criticality: "high",
        environment: "production",
        ownerTeam: "Engineering",
        description: "Payment processing integrations and retry queues",
      },
      create: {
        name: "Payments Gateway",
        type: "service",
        status: "active",
        criticality: "high",
        environment: "production",
        ownerTeam: "Engineering",
        description: "Payment processing integrations and retry queues",
        organizationId: org.id,
      },
    }),
    prisma.configurationItem.upsert({
      where: {
        organizationId_name: {
          organizationId: org.id,
          name: "Primary PostgreSQL Cluster",
        },
      },
      update: {
        type: "database",
        criticality: "critical",
        environment: "production",
        ownerTeam: "Site Reliability Engineering",
        description: "Primary transaction database cluster",
      },
      create: {
        name: "Primary PostgreSQL Cluster",
        type: "database",
        status: "active",
        criticality: "critical",
        environment: "production",
        ownerTeam: "Site Reliability Engineering",
        description: "Primary transaction database cluster",
        organizationId: org.id,
      },
    }),
    prisma.configurationItem.upsert({
      where: {
        organizationId_name: {
          organizationId: org.id,
          name: "Identity Provider",
        },
      },
      update: {
        type: "application",
        criticality: "high",
        environment: "production",
        ownerTeam: "Service Desk",
        description: "Single sign-on provider and authentication policy store",
      },
      create: {
        name: "Identity Provider",
        type: "application",
        status: "active",
        criticality: "high",
        environment: "production",
        ownerTeam: "Service Desk",
        description: "Single sign-on provider and authentication policy store",
        organizationId: org.id,
      },
    }),
  ]);

  const ciByName = new Map(configurationItems.map((ci) => [ci.name, ci.id]));

  const problem9001 = await prisma.problem.upsert({
    where: { ticketNumber: "PRB-9001" },
    update: {
      title: "Intermittent checkout timeout under peak load",
      description:
        "Checkout APIs intermittently exceed timeout thresholds during daily traffic spikes.",
      status: "investigating",
      impact: "high",
      urgency: "high",
      priority: "critical",
      assigneeId: opsLead.id,
      teamId: engineeringTeam.id,
      organizationId: org.id,
      isKnownError: false,
      rootCause: "Connection pool saturation between API and database tier.",
      workaround: "Increase worker pool and reduce checkout batch size.",
      impactAssessment: "Checkout conversion degraded by 8-12% during peak windows.",
      detectedAt: daysAgo(3),
    },
    create: {
      ticketNumber: "PRB-9001",
      title: "Intermittent checkout timeout under peak load",
      description:
        "Checkout APIs intermittently exceed timeout thresholds during daily traffic spikes.",
      status: "investigating",
      impact: "high",
      urgency: "high",
      priority: "critical",
      assigneeId: opsLead.id,
      teamId: engineeringTeam.id,
      organizationId: org.id,
      isKnownError: false,
      rootCause: "Connection pool saturation between API and database tier.",
      workaround: "Increase worker pool and reduce checkout batch size.",
      impactAssessment: "Checkout conversion degraded by 8-12% during peak windows.",
      detectedAt: daysAgo(3),
    },
  });

  const problem9002 = await prisma.problem.upsert({
    where: { ticketNumber: "PRB-9002" },
    update: {
      title: "SSO redirect URI mismatch for partner portal",
      description:
        "Partner users fail SSO authentication due to stale redirect URI metadata.",
      status: "known_error",
      impact: "medium",
      urgency: "medium",
      priority: "medium",
      assigneeId: serviceDesk.id,
      teamId: serviceDeskTeam.id,
      organizationId: org.id,
      isKnownError: true,
      rootCause: "IdP metadata rotation was not propagated to partner relying party.",
      workaround: "Use backup relay URI until metadata sync job completes.",
      impactAssessment: "Affects federated external partner logins only.",
      detectedAt: daysAgo(5),
    },
    create: {
      ticketNumber: "PRB-9002",
      title: "SSO redirect URI mismatch for partner portal",
      description:
        "Partner users fail SSO authentication due to stale redirect URI metadata.",
      status: "known_error",
      impact: "medium",
      urgency: "medium",
      priority: "medium",
      assigneeId: serviceDesk.id,
      teamId: serviceDeskTeam.id,
      organizationId: org.id,
      isKnownError: true,
      rootCause: "IdP metadata rotation was not propagated to partner relying party.",
      workaround: "Use backup relay URI until metadata sync job completes.",
      impactAssessment: "Affects federated external partner logins only.",
      detectedAt: daysAgo(5),
    },
  });

  const problem9003 = await prisma.problem.upsert({
    where: { ticketNumber: "PRB-9003" },
    update: {
      title: "Backup window conflicts with replication and reporting jobs",
      description:
        "Nightly backup overlaps with replication maintenance causing missed backup SLA.",
      status: "resolved",
      impact: "medium",
      urgency: "low",
      priority: "medium",
      assigneeId: sreOnCall.id,
      teamId: sreTeam.id,
      organizationId: org.id,
      isKnownError: true,
      rootCause: "Maintenance window was too narrow for long-running replication checks.",
      workaround: "Stagger backup start and pre-warm replica checks.",
      impactAssessment: "No data loss; delayed backup completion evidence.",
      detectedAt: daysAgo(9),
      resolvedAt: daysAgo(2),
    },
    create: {
      ticketNumber: "PRB-9003",
      title: "Backup window conflicts with replication and reporting jobs",
      description:
        "Nightly backup overlaps with replication maintenance causing missed backup SLA.",
      status: "resolved",
      impact: "medium",
      urgency: "low",
      priority: "medium",
      assigneeId: sreOnCall.id,
      teamId: sreTeam.id,
      organizationId: org.id,
      isKnownError: true,
      rootCause: "Maintenance window was too narrow for long-running replication checks.",
      workaround: "Stagger backup start and pre-warm replica checks.",
      impactAssessment: "No data loss; delayed backup completion evidence.",
      detectedAt: daysAgo(9),
      resolvedAt: daysAgo(2),
    },
  });

  const change8001 = await prisma.changeRequest.upsert({
    where: { ticketNumber: "CHG-8001" },
    update: {
      title: "Scale checkout worker pool and DB connection limits",
      description:
        "Increase checkout service throughput and tune database connection pool for peak traffic.",
      reason: "Mitigate ongoing latency incidents and stabilize checkout conversion.",
      type: "normal",
      riskLevel: "high",
      impactLevel: "high",
      rollbackPlan: "Revert deployment and restore prior autoscaling profile.",
      testPlan: "Load-test in production canary and validate latency under burst load.",
      status: "implementing",
      requesterId: changeManager.id,
      assigneeId: opsLead.id,
      teamId: engineeringTeam.id,
      organizationId: org.id,
      plannedStart: hoursAgo(4),
      plannedEnd: hoursFromNow(2),
      actualStart: hoursAgo(3),
    },
    create: {
      ticketNumber: "CHG-8001",
      title: "Scale checkout worker pool and DB connection limits",
      description:
        "Increase checkout service throughput and tune database connection pool for peak traffic.",
      reason: "Mitigate ongoing latency incidents and stabilize checkout conversion.",
      type: "normal",
      riskLevel: "high",
      impactLevel: "high",
      rollbackPlan: "Revert deployment and restore prior autoscaling profile.",
      testPlan: "Load-test in production canary and validate latency under burst load.",
      status: "implementing",
      requesterId: changeManager.id,
      assigneeId: opsLead.id,
      teamId: engineeringTeam.id,
      organizationId: org.id,
      plannedStart: hoursAgo(4),
      plannedEnd: hoursFromNow(2),
      actualStart: hoursAgo(3),
    },
  });

  const change8002 = await prisma.changeRequest.upsert({
    where: { ticketNumber: "CHG-8002" },
    update: {
      title: "Automate IdP metadata refresh and validation",
      description:
        "Deploy scheduled metadata refresh to prevent redirect URI mismatch across SSO consumers.",
      reason: "Reduce authentication incidents and remove manual metadata sync.",
      type: "standard",
      riskLevel: "medium",
      impactLevel: "medium",
      rollbackPlan: "Disable scheduler and restore previous static metadata file.",
      testPlan: "Validate SSO flows for partner and employee tenants post-deploy.",
      status: "requested",
      requesterId: changeManager.id,
      assigneeId: serviceDesk.id,
      teamId: serviceDeskTeam.id,
      organizationId: org.id,
      plannedStart: daysFromNow(1),
      plannedEnd: daysFromNow(2),
    },
    create: {
      ticketNumber: "CHG-8002",
      title: "Automate IdP metadata refresh and validation",
      description:
        "Deploy scheduled metadata refresh to prevent redirect URI mismatch across SSO consumers.",
      reason: "Reduce authentication incidents and remove manual metadata sync.",
      type: "standard",
      riskLevel: "medium",
      impactLevel: "medium",
      rollbackPlan: "Disable scheduler and restore previous static metadata file.",
      testPlan: "Validate SSO flows for partner and employee tenants post-deploy.",
      status: "requested",
      requesterId: changeManager.id,
      assigneeId: serviceDesk.id,
      teamId: serviceDeskTeam.id,
      organizationId: org.id,
      plannedStart: daysFromNow(1),
      plannedEnd: daysFromNow(2),
    },
  });

  const change8003 = await prisma.changeRequest.upsert({
    where: { ticketNumber: "CHG-8003" },
    update: {
      title: "Backup schedule realignment and alert threshold update",
      description:
        "Align backup windows with replication tasks and tighten alerting thresholds.",
      reason: "Close known error around backup delays and improve audit readiness.",
      type: "normal",
      riskLevel: "low",
      impactLevel: "medium",
      rollbackPlan: "Restore previous cron schedule and monitoring profile.",
      testPlan: "Verify two consecutive successful backup cycles and retention checks.",
      status: "completed",
      requesterId: changeManager.id,
      assigneeId: sreOnCall.id,
      teamId: sreTeam.id,
      organizationId: org.id,
      plannedStart: daysAgo(3),
      plannedEnd: daysAgo(2),
      actualStart: daysAgo(3),
      actualEnd: daysAgo(2),
    },
    create: {
      ticketNumber: "CHG-8003",
      title: "Backup schedule realignment and alert threshold update",
      description:
        "Align backup windows with replication tasks and tighten alerting thresholds.",
      reason: "Close known error around backup delays and improve audit readiness.",
      type: "normal",
      riskLevel: "low",
      impactLevel: "medium",
      rollbackPlan: "Restore previous cron schedule and monitoring profile.",
      testPlan: "Verify two consecutive successful backup cycles and retention checks.",
      status: "completed",
      requesterId: changeManager.id,
      assigneeId: sreOnCall.id,
      teamId: sreTeam.id,
      organizationId: org.id,
      plannedStart: daysAgo(3),
      plannedEnd: daysAgo(2),
      actualStart: daysAgo(3),
      actualEnd: daysAgo(2),
    },
  });

  const incidents = await Promise.all([
    prisma.incident.upsert({
      where: { ticketNumber: "INC-7001" },
      update: {
        title: "Checkout API latency above SLO",
        description:
          "P95 latency crossed 2.8s for checkout endpoints during peak traffic, impacting conversion.",
        status: "in_progress",
        priority: "critical",
        impact: "critical",
        urgency: "high",
        organizationId: org.id,
        teamId: engineeringTeam.id,
        assigneeId: opsLead.id,
        reporterId: serviceDesk.id,
        channel: "portal",
        tags: ["major", "production", "checkout", DEMO_MARKER],
        dueAt: hoursFromNow(1),
        slaPolicyId: slaByPriority.get("critical"),
        slaResponseDue: hoursAgo(6),
        slaResolutionDue: hoursFromNow(1),
        slaResponseAt: hoursAgo(7),
        slaResponseMet: true,
        slaResolutionMet: null,
        problemId: problem9001.id,
        changeRequestId: change8001.id,
      },
      create: {
        ticketNumber: "INC-7001",
        title: "Checkout API latency above SLO",
        description:
          "P95 latency crossed 2.8s for checkout endpoints during peak traffic, impacting conversion.",
        status: "in_progress",
        priority: "critical",
        impact: "critical",
        urgency: "high",
        organizationId: org.id,
        teamId: engineeringTeam.id,
        assigneeId: opsLead.id,
        reporterId: serviceDesk.id,
        channel: "portal",
        tags: ["major", "production", "checkout", DEMO_MARKER],
        dueAt: hoursFromNow(1),
        slaPolicyId: slaByPriority.get("critical"),
        slaResponseDue: hoursAgo(6),
        slaResolutionDue: hoursFromNow(1),
        slaResponseAt: hoursAgo(7),
        slaResponseMet: true,
        slaResolutionMet: null,
        problemId: problem9001.id,
        changeRequestId: change8001.id,
      },
    }),
    prisma.incident.upsert({
      where: { ticketNumber: "INC-7002" },
      update: {
        title: "Payment retries accumulating in queue",
        description:
          "Retry queue growth indicates payment callback latency with intermittent timeout spikes.",
        status: "open",
        priority: "high",
        impact: "high",
        urgency: "high",
        organizationId: org.id,
        teamId: engineeringTeam.id,
        assigneeId: sreOnCall.id,
        reporterId: serviceDesk.id,
        channel: "api",
        tags: ["production", "payments", DEMO_MARKER],
        dueAt: hoursFromNow(5),
        slaPolicyId: slaByPriority.get("high"),
        slaResponseDue: hoursAgo(4),
        slaResolutionDue: hoursFromNow(5),
        slaResponseAt: hoursAgo(4),
        slaResponseMet: true,
        problemId: problem9001.id,
      },
      create: {
        ticketNumber: "INC-7002",
        title: "Payment retries accumulating in queue",
        description:
          "Retry queue growth indicates payment callback latency with intermittent timeout spikes.",
        status: "open",
        priority: "high",
        impact: "high",
        urgency: "high",
        organizationId: org.id,
        teamId: engineeringTeam.id,
        assigneeId: sreOnCall.id,
        reporterId: serviceDesk.id,
        channel: "api",
        tags: ["production", "payments", DEMO_MARKER],
        dueAt: hoursFromNow(5),
        slaPolicyId: slaByPriority.get("high"),
        slaResponseDue: hoursAgo(4),
        slaResolutionDue: hoursFromNow(5),
        slaResponseAt: hoursAgo(4),
        slaResponseMet: true,
        problemId: problem9001.id,
      },
    }),
    prisma.incident.upsert({
      where: { ticketNumber: "INC-7003" },
      update: {
        title: "SSO login failures for partner users",
        description:
          "External partner users are failing OAuth callback validation due to stale redirect URI.",
        status: "pending",
        priority: "medium",
        impact: "medium",
        urgency: "medium",
        organizationId: org.id,
        teamId: serviceDeskTeam.id,
        assigneeId: serviceDesk.id,
        reporterId: serviceDesk.id,
        channel: "email",
        tags: ["identity", "partner", DEMO_MARKER],
        dueAt: hoursFromNow(10),
        slaPolicyId: slaByPriority.get("medium"),
        slaResponseDue: hoursAgo(20),
        slaResolutionDue: hoursFromNow(10),
        slaResponseAt: hoursAgo(19),
        slaResponseMet: true,
        problemId: problem9002.id,
        changeRequestId: change8002.id,
      },
      create: {
        ticketNumber: "INC-7003",
        title: "SSO login failures for partner users",
        description:
          "External partner users are failing OAuth callback validation due to stale redirect URI.",
        status: "pending",
        priority: "medium",
        impact: "medium",
        urgency: "medium",
        organizationId: org.id,
        teamId: serviceDeskTeam.id,
        assigneeId: serviceDesk.id,
        reporterId: serviceDesk.id,
        channel: "email",
        tags: ["identity", "partner", DEMO_MARKER],
        dueAt: hoursFromNow(10),
        slaPolicyId: slaByPriority.get("medium"),
        slaResponseDue: hoursAgo(20),
        slaResolutionDue: hoursFromNow(10),
        slaResponseAt: hoursAgo(19),
        slaResponseMet: true,
        problemId: problem9002.id,
        changeRequestId: change8002.id,
      },
    }),
    prisma.incident.upsert({
      where: { ticketNumber: "INC-7004" },
      update: {
        title: "Backup job exceeded maintenance window",
        description:
          "Nightly backup crossed planned window and triggered audit readiness alert.",
        status: "escalated",
        priority: "high",
        impact: "medium",
        urgency: "high",
        organizationId: org.id,
        teamId: sreTeam.id,
        assigneeId: sreOnCall.id,
        reporterId: admin.id,
        channel: "portal",
        tags: ["backup", "audit", DEMO_MARKER],
        dueAt: hoursAgo(2),
        slaPolicyId: slaByPriority.get("high"),
        slaResponseDue: hoursAgo(30),
        slaResolutionDue: hoursAgo(2),
        slaResponseAt: hoursAgo(27),
        slaResponseMet: true,
        slaResolutionMet: false,
        problemId: problem9003.id,
        changeRequestId: change8003.id,
      },
      create: {
        ticketNumber: "INC-7004",
        title: "Backup job exceeded maintenance window",
        description:
          "Nightly backup crossed planned window and triggered audit readiness alert.",
        status: "escalated",
        priority: "high",
        impact: "medium",
        urgency: "high",
        organizationId: org.id,
        teamId: sreTeam.id,
        assigneeId: sreOnCall.id,
        reporterId: admin.id,
        channel: "portal",
        tags: ["backup", "audit", DEMO_MARKER],
        dueAt: hoursAgo(2),
        slaPolicyId: slaByPriority.get("high"),
        slaResponseDue: hoursAgo(30),
        slaResolutionDue: hoursAgo(2),
        slaResponseAt: hoursAgo(27),
        slaResponseMet: true,
        slaResolutionMet: false,
        problemId: problem9003.id,
        changeRequestId: change8003.id,
      },
    }),
    prisma.incident.upsert({
      where: { ticketNumber: "INC-7005" },
      update: {
        title: "Reporting export worker memory pressure",
        description:
          "Scheduled exports had elevated memory usage and slowdowns before remediation.",
        status: "resolved",
        priority: "medium",
        impact: "medium",
        urgency: "low",
        organizationId: org.id,
        teamId: engineeringTeam.id,
        assigneeId: opsLead.id,
        reporterId: admin.id,
        channel: "chat",
        tags: ["reporting", DEMO_MARKER],
        dueAt: daysAgo(1),
        resolvedAt: hoursAgo(18),
        slaPolicyId: slaByPriority.get("medium"),
        slaResponseDue: daysAgo(2),
        slaResolutionDue: hoursAgo(12),
        slaResponseAt: daysAgo(2),
        slaResponseMet: true,
        slaResolutionMet: true,
      },
      create: {
        ticketNumber: "INC-7005",
        title: "Reporting export worker memory pressure",
        description:
          "Scheduled exports had elevated memory usage and slowdowns before remediation.",
        status: "resolved",
        priority: "medium",
        impact: "medium",
        urgency: "low",
        organizationId: org.id,
        teamId: engineeringTeam.id,
        assigneeId: opsLead.id,
        reporterId: admin.id,
        channel: "chat",
        tags: ["reporting", DEMO_MARKER],
        dueAt: daysAgo(1),
        resolvedAt: hoursAgo(18),
        slaPolicyId: slaByPriority.get("medium"),
        slaResponseDue: daysAgo(2),
        slaResolutionDue: hoursAgo(12),
        slaResponseAt: daysAgo(2),
        slaResponseMet: true,
        slaResolutionMet: true,
      },
    }),
    prisma.incident.upsert({
      where: { ticketNumber: "INC-7006" },
      update: {
        title: "Knowledge search indexing delay",
        description: "Search indexer lagged after content deployment, now fully stabilized.",
        status: "closed",
        priority: "low",
        impact: "low",
        urgency: "low",
        organizationId: org.id,
        teamId: serviceDeskTeam.id,
        assigneeId: serviceDesk.id,
        reporterId: serviceDesk.id,
        channel: "portal",
        tags: ["knowledge", DEMO_MARKER],
        dueAt: daysAgo(6),
        resolvedAt: daysAgo(5),
        closedAt: daysAgo(4),
        slaPolicyId: slaByPriority.get("low"),
        slaResponseDue: daysAgo(7),
        slaResolutionDue: daysAgo(5),
        slaResponseAt: daysAgo(7),
        slaResponseMet: true,
        slaResolutionMet: true,
      },
      create: {
        ticketNumber: "INC-7006",
        title: "Knowledge search indexing delay",
        description: "Search indexer lagged after content deployment, now fully stabilized.",
        status: "closed",
        priority: "low",
        impact: "low",
        urgency: "low",
        organizationId: org.id,
        teamId: serviceDeskTeam.id,
        assigneeId: serviceDesk.id,
        reporterId: serviceDesk.id,
        channel: "portal",
        tags: ["knowledge", DEMO_MARKER],
        dueAt: daysAgo(6),
        resolvedAt: daysAgo(5),
        closedAt: daysAgo(4),
        slaPolicyId: slaByPriority.get("low"),
        slaResponseDue: daysAgo(7),
        slaResolutionDue: daysAgo(5),
        slaResponseAt: daysAgo(7),
        slaResponseMet: true,
        slaResolutionMet: true,
      },
    }),
  ]);

  const incidentByTicket = new Map(incidents.map((incident) => [incident.ticketNumber, incident]));

  const incidentConfigLinks: Array<{ ticketNumber: string; ciNames: string[] }> = [
    { ticketNumber: "INC-7001", ciNames: ["Checkout API", "Primary PostgreSQL Cluster"] },
    { ticketNumber: "INC-7002", ciNames: ["Payments Gateway", "Checkout API"] },
    { ticketNumber: "INC-7003", ciNames: ["Identity Provider"] },
    { ticketNumber: "INC-7004", ciNames: ["Primary PostgreSQL Cluster"] },
  ];

  for (const link of incidentConfigLinks) {
    const incident = incidentByTicket.get(link.ticketNumber);
    if (!incident) continue;

    await prisma.incidentConfigurationItem.deleteMany({
      where: { incidentId: incident.id },
    });

    const data = link.ciNames
      .map((name) => ciByName.get(name))
      .filter((id): id is string => Boolean(id))
      .map((configurationItemId) => ({
        incidentId: incident.id,
        configurationItemId,
      }));

    if (data.length > 0) {
      await prisma.incidentConfigurationItem.createMany({
        data,
        skipDuplicates: true,
      });
    }
  }

  const workflowIncident = incidentByTicket.get("INC-7001");
  const workflowChange = change8001;
  const workflowBackup = incidentByTicket.get("INC-7004");

  const workflowA = await upsertWorkflowByName(org.id, "Checkout Major Incident Coordination", {
    name: "Checkout Major Incident Coordination",
    type: "incident_escalation",
    status: "in_progress",
    organizationId: org.id,
    entityId: workflowIncident?.id || "INC-7001",
    entityType: "incident",
    incidentId: workflowIncident?.id,
    currentStepId: "war-room",
    steps: [
      { id: "detect", name: "Detection", type: "auto", status: "completed" },
      { id: "triage", name: "Rapid Triage", type: "manual", status: "completed" },
      { id: "war-room", name: "War Room Coordination", type: "manual", status: "in_progress" },
      { id: "communications", name: "Stakeholder Communication", type: "manual", status: "pending" },
    ] as Prisma.InputJsonValue,
    context: {
      seedMarker: DEMO_MARKER,
      incidentTicket: "INC-7001",
      commandBridge: "active",
      commander: `${opsLead.firstName} ${opsLead.lastName}`,
    } as Prisma.InputJsonValue,
    completedAt: null,
  });

  const workflowB = await upsertWorkflowByName(org.id, "Checkout Scaling Change Orchestration", {
    name: "Checkout Scaling Change Orchestration",
    type: "change_request",
    status: "in_progress",
    organizationId: org.id,
    entityId: workflowChange.id,
    entityType: "change",
    currentStepId: "implement",
    steps: [
      { id: "cab", name: "CAB Approval", type: "approval", status: "completed" },
      { id: "prep", name: "Implementation Prep", type: "manual", status: "completed" },
      { id: "implement", name: "Execute Change", type: "manual", status: "in_progress" },
      { id: "verify", name: "Post-change Validation", type: "manual", status: "pending" },
    ] as Prisma.InputJsonValue,
    context: {
      seedMarker: DEMO_MARKER,
      changeTicket: "CHG-8001",
      autoCreateTasks: true,
    } as Prisma.InputJsonValue,
    completedAt: null,
  });

  const workflowC = await upsertWorkflowByName(org.id, "Backup Exception Remediation", {
    name: "Backup Exception Remediation",
    type: "review",
    status: "failed",
    organizationId: org.id,
    entityId: workflowBackup?.id || "INC-7004",
    entityType: "incident",
    incidentId: workflowBackup?.id,
    currentStepId: "validate-window",
    steps: [
      { id: "collect", name: "Collect Runtime Logs", type: "manual", status: "completed" },
      { id: "validate-window", name: "Validate Maintenance Window", type: "manual", status: "failed" },
      { id: "retry", name: "Retry Backup", type: "auto", status: "pending" },
    ] as Prisma.InputJsonValue,
    context: {
      seedMarker: DEMO_MARKER,
      retryCount: 1,
      rollbackReason: "Window validation failed for replica warmup overlap.",
    } as Prisma.InputJsonValue,
    completedAt: null,
  });

  const workflowD = await upsertWorkflowByName(org.id, "IdP Metadata Rollout Approval", {
    name: "IdP Metadata Rollout Approval",
    type: "approval",
    status: "completed",
    organizationId: org.id,
    entityId: change8002.id,
    entityType: "change",
    currentStepId: "approve",
    steps: [
      { id: "review", name: "Technical Review", type: "manual", status: "completed" },
      { id: "approve", name: "Approval Decision", type: "approval", status: "completed" },
      { id: "publish", name: "Publish Decision", type: "auto", status: "completed" },
    ] as Prisma.InputJsonValue,
    context: {
      seedMarker: DEMO_MARKER,
      outcome: "approved",
    } as Prisma.InputJsonValue,
    completedAt: hoursAgo(12),
  });

  await upsertTaskByTitle(org.id, "Coordinate war room and stakeholder updates", {
    title: "Coordinate war room and stakeholder updates",
    description: "Maintain 30-minute status updates while INC-7001 remains active.",
    status: "in_progress",
    priority: "critical",
    organizationId: org.id,
    assigneeId: opsLead.id,
    reporterId: admin.id,
    incidentId: workflowIncident?.id,
    workflowId: workflowA.id,
    teamId: engineeringTeam.id,
    dueAt: hoursFromNow(1),
    startedAt: hoursAgo(2),
    estimatedMinutes: 180,
    actualMinutes: 65,
    tags: ["major", "communication", DEMO_MARKER],
    metadata: { seedMarker: DEMO_MARKER } as Prisma.InputJsonValue,
    sourceEntityId: workflowIncident?.id,
    sourceEntityType: "incident",
  });

  await upsertTaskByTitle(org.id, "Validate checkout scaling in production", {
    title: "Validate checkout scaling in production",
    description: "Validate queue drain and API latency after worker pool change.",
    status: "pending",
    priority: "high",
    organizationId: org.id,
    assigneeId: sreOnCall.id,
    reporterId: changeManager.id,
    incidentId: workflowIncident?.id,
    workflowId: workflowB.id,
    changeRequestId: change8001.id,
    teamId: sreTeam.id,
    dueAt: hoursFromNow(3),
    estimatedMinutes: 90,
    tags: ["validation", DEMO_MARKER],
    metadata: { seedMarker: DEMO_MARKER } as Prisma.InputJsonValue,
    sourceEntityId: change8001.id,
    sourceEntityType: "change",
  });

  await upsertTaskByTitle(org.id, "Publish SSO workaround knowledge article", {
    title: "Publish SSO workaround knowledge article",
    description: "Document temporary relay URI workaround for partner support teams.",
    status: "completed",
    priority: "medium",
    organizationId: org.id,
    assigneeId: serviceDesk.id,
    reporterId: admin.id,
    problemId: problem9002.id,
    workflowId: workflowD.id,
    teamId: serviceDeskTeam.id,
    dueAt: daysAgo(1),
    startedAt: daysAgo(2),
    completedAt: daysAgo(1),
    estimatedMinutes: 60,
    actualMinutes: 52,
    tags: ["knowledge", DEMO_MARKER],
    metadata: { seedMarker: DEMO_MARKER } as Prisma.InputJsonValue,
    sourceEntityId: problem9002.id,
    sourceEntityType: "problem",
  });

  await upsertTaskByTitle(org.id, "Review backup workflow exception and retry plan", {
    title: "Review backup workflow exception and retry plan",
    description: "Confirm remediation sequence after workflow failure on maintenance window validation.",
    status: "cancelled",
    priority: "medium",
    organizationId: org.id,
    assigneeId: sreOnCall.id,
    reporterId: admin.id,
    incidentId: workflowBackup?.id,
    workflowId: workflowC.id,
    teamId: sreTeam.id,
    dueAt: hoursAgo(1),
    estimatedMinutes: 45,
    tags: ["backup", DEMO_MARKER],
    metadata: { seedMarker: DEMO_MARKER, cancellationReason: "Superseded by CHG-8003 PIR action items" } as Prisma.InputJsonValue,
    sourceEntityId: workflowBackup?.id,
    sourceEntityType: "incident",
  });

  const knowledgeArticles = await Promise.all([
    upsertKnowledgeByTitle(org.id, "Checkout Latency Triage Playbook", {
      title: "Checkout Latency Triage Playbook",
      content:
        "Use this playbook when checkout latency crosses SLO. Validate queue depth, DB pool saturation, and retry storms before scaling.",
      category: "troubleshooting",
      status: "published",
      version: "1.0",
      tags: ["checkout", "latency", "triage", DEMO_MARKER],
      views: 143,
      helpful: 28,
      notHelpful: 2,
      organizationId: org.id,
      authorId: opsLead.id,
      publishedAt: daysAgo(6),
    }),
    upsertKnowledgeByTitle(org.id, "How-To: Execute Standard Change in NexusOps", {
      title: "How-To: Execute Standard Change in NexusOps",
      content:
        "Step-by-step guidance for drafting, submitting, and completing a standard change with implementation evidence.",
      category: "howto",
      status: "published",
      version: "1.0",
      tags: ["change", "cab", "howto", DEMO_MARKER],
      views: 87,
      helpful: 19,
      notHelpful: 1,
      organizationId: org.id,
      authorId: changeManager.id,
      publishedAt: daysAgo(4),
    }),
    upsertKnowledgeByTitle(org.id, "Reference: Incident Priority Matrix", {
      title: "Reference: Incident Priority Matrix",
      content:
        "Priority is derived from impact and urgency. Critical incidents require 15-minute response and 2-hour resolution targets.",
      category: "reference",
      status: "published",
      version: "1.0",
      tags: ["incident", "priority", "sla", DEMO_MARKER],
      views: 231,
      helpful: 44,
      notHelpful: 3,
      organizationId: org.id,
      authorId: admin.id,
      publishedAt: daysAgo(10),
    }),
    upsertKnowledgeByTitle(org.id, "General Operations Handbook", {
      title: "General Operations Handbook",
      content:
        "Operational guardrails, escalation pathways, and communication templates for daily service management.",
      category: "general",
      status: "published",
      version: "1.0",
      tags: ["operations", "runbook", DEMO_MARKER],
      views: 102,
      helpful: 21,
      notHelpful: 1,
      organizationId: org.id,
      authorId: admin.id,
      publishedAt: daysAgo(8),
    }),
  ]);

  for (const article of knowledgeArticles) {
    await prisma.knowledgeArticleVersion.upsert({
      where: {
        articleId_version: {
          articleId: article.id,
          version: article.version,
        },
      },
      update: {
        title: article.title,
        content: article.content,
        category: article.category,
        tags: article.tags,
        editedById: article.authorId,
        changeSummary: "Synced with demo baseline",
      },
      create: {
        articleId: article.id,
        organizationId: org.id,
        version: article.version,
        title: article.title,
        content: article.content,
        category: article.category,
        tags: article.tags,
        editedById: article.authorId,
        changeSummary: "Initial demo version",
      },
    });
  }

  const reportSeedDefinitions = [
    {
      type: "incident_summary",
      status: "completed",
      format: "json",
      startedAt: hoursAgo(30),
      completedAt: hoursAgo(30),
      downloadUrl: "/api/reports/download/demo-incident-summary.json",
    },
    {
      type: "sla_compliance",
      status: "completed",
      format: "json",
      startedAt: hoursAgo(20),
      completedAt: hoursAgo(20),
      downloadUrl: "/api/reports/download/demo-sla-compliance.json",
    },
    {
      type: "workflow_kpi",
      status: "pending",
      format: "json",
      startedAt: null,
      completedAt: null,
      downloadUrl: null,
    },
    {
      type: "audit_log",
      status: "failed",
      format: "csv",
      startedAt: hoursAgo(4),
      completedAt: hoursAgo(4),
      downloadUrl: null,
    },
  ] as const;

  for (const seedJob of reportSeedDefinitions) {
    const existing = await prisma.reportJob.findFirst({
      where: {
        organizationId: org.id,
        requestedById: admin.id,
        type: seedJob.type,
        status: seedJob.status,
        parameters: {
          path: ["seedMarker"],
          equals: DEMO_MARKER,
        },
      },
      select: { id: true },
    });

    const payload = {
      type: seedJob.type,
      format: seedJob.format,
      parameters: {
        seedMarker: DEMO_MARKER,
        window: "last_7d",
      } as Prisma.InputJsonValue,
      organizationId: org.id,
      requestedById: admin.id,
      status: seedJob.status,
      startedAt: seedJob.startedAt,
      completedAt: seedJob.completedAt,
      downloadUrl: seedJob.downloadUrl,
      error:
        seedJob.status === "failed"
          ? "Demo export failed: simulated object storage timeout"
          : null,
    };

    if (existing) {
      await prisma.reportJob.update({
        where: { id: existing.id },
        data: payload,
      });
    } else {
      await prisma.reportJob.create({ data: payload });
    }
  }

  await prisma.activity.deleteMany({
    where: {
      organizationId: org.id,
      title: { startsWith: "[DEMO]" },
    },
  });

  const activityRows = [
    {
      organizationId: org.id,
      entityType: "incident",
      entityId: workflowIncident?.id || "INC-7001",
      action: "status_changed",
      actorId: opsLead.id,
      title: "[DEMO] INC-7001 moved to in_progress",
      description: "War room activated and command bridge opened.",
      metadata: { seedMarker: DEMO_MARKER } as Prisma.InputJsonValue,
    },
    {
      organizationId: org.id,
      entityType: "change",
      entityId: change8001.id,
      action: "updated",
      actorId: changeManager.id,
      title: "[DEMO] CHG-8001 implementation started",
      description: "Implementation tasks are now active and being tracked.",
      metadata: { seedMarker: DEMO_MARKER } as Prisma.InputJsonValue,
    },
    {
      organizationId: org.id,
      entityType: "workflow",
      entityId: workflowA.id,
      action: "status_changed",
      actorId: opsLead.id,
      title: "[DEMO] Workflow entered coordination step",
      description: "Stakeholder comms and task orchestration in progress.",
      metadata: { seedMarker: DEMO_MARKER } as Prisma.InputJsonValue,
    },
    {
      organizationId: org.id,
      entityType: "task",
      entityId: workflowA.id,
      action: "created",
      actorId: admin.id,
      title: "[DEMO] Task created for major incident comms",
      description: "Communications cadence task linked to incident and workflow.",
      metadata: { seedMarker: DEMO_MARKER } as Prisma.InputJsonValue,
    },
  ];

  await prisma.activity.createMany({
    data: activityRows,
  });

  const [incidentCount, problemCount, changeCount, taskCount, workflowCount, knowledgeCount] =
    await Promise.all([
      prisma.incident.count({ where: { organizationId: org.id } }),
      prisma.problem.count({ where: { organizationId: org.id } }),
      prisma.changeRequest.count({ where: { organizationId: org.id } }),
      prisma.task.count({ where: { organizationId: org.id } }),
      prisma.workflow.count({ where: { organizationId: org.id } }),
      prisma.knowledgeArticle.count({ where: { organizationId: org.id, status: "published" } }),
    ]);

  console.log("Demo data seeded successfully.");
  console.log(
    `Incidents: ${incidentCount}, Problems: ${problemCount}, Changes: ${changeCount}, Tasks: ${taskCount}, Workflows: ${workflowCount}, Knowledge(published): ${knowledgeCount}`
  );
  console.log("Login credentials:");
  console.log("  Email: admin@nexusops.com");
  console.log("  Password: admin123");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

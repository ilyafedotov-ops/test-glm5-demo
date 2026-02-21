"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listWorkflowTemplates = listWorkflowTemplates;
exports.getWorkflowTemplateById = getWorkflowTemplateById;
exports.selectIncidentWorkflowTemplate = selectIncidentWorkflowTemplate;
const create_workflow_dto_1 = require("./dto/create-workflow.dto");
const WORKFLOW_TEMPLATES = [
    {
        id: "incident_critical_response_v1",
        name: "Incident Critical Response",
        description: "Major incident handling with explicit triage and approval.",
        type: create_workflow_dto_1.WorkflowType.INCIDENT_ESCALATION,
        caseType: "incident",
        isActive: true,
        autoAssign: true,
        match: {
            priorities: ["critical", "high"],
        },
        steps: [
            {
                id: "triage",
                name: "Rapid Triage",
                type: "manual",
                taskTemplate: {
                    title: "Triage ${incident.ticketNumber}",
                    description: "Assess impact and assign an incident commander.",
                    priority: "critical",
                    estimatedMinutes: 15,
                    tags: ["incident", "triage"],
                },
            },
            {
                id: "approval",
                name: "Incident Commander Approval",
                type: "approval",
                taskTemplate: {
                    title: "Approve mitigation plan for ${incident.ticketNumber}",
                    description: "Validate mitigation approach before broad rollout.",
                    priority: "high",
                    estimatedMinutes: 30,
                    tags: ["incident", "approval"],
                },
            },
            {
                id: "resolution",
                name: "Resolution Validation",
                type: "manual",
                taskTemplate: {
                    title: "Validate resolution for ${incident.ticketNumber}",
                    description: "Confirm service restoration and customer impact cleared.",
                    priority: "high",
                    estimatedMinutes: 45,
                    tags: ["incident", "resolution"],
                },
            },
        ],
        defaultContext: {
            strictTransitions: true,
            caseType: "incident",
        },
    },
    {
        id: "incident_standard_response_v1",
        name: "Incident Standard Response",
        description: "Standard ITIL incident lifecycle from triage to closure readiness.",
        type: create_workflow_dto_1.WorkflowType.INCIDENT_ESCALATION,
        caseType: "incident",
        isActive: true,
        autoAssign: true,
        steps: [
            {
                id: "intake",
                name: "Intake & Categorization",
                type: "manual",
                taskTemplate: {
                    title: "Categorize ${incident.ticketNumber}",
                    description: "Validate category, impact, urgency, and ownership.",
                    priority: "medium",
                    estimatedMinutes: 20,
                    tags: ["incident", "intake"],
                },
            },
            {
                id: "investigate",
                name: "Investigate",
                type: "manual",
                taskTemplate: {
                    title: "Investigate ${incident.ticketNumber}",
                    description: "Identify root cause and implement remediation.",
                    priority: "medium",
                    estimatedMinutes: 90,
                    tags: ["incident", "investigation"],
                },
            },
            {
                id: "ready_to_resolve",
                name: "Ready to Resolve",
                type: "approval",
                taskTemplate: {
                    title: "Review resolution evidence for ${incident.ticketNumber}",
                    description: "Ensure evidence is complete before resolving incident.",
                    priority: "medium",
                    estimatedMinutes: 20,
                    tags: ["incident", "qa"],
                },
            },
        ],
        defaultContext: {
            strictTransitions: true,
            caseType: "incident",
        },
    },
];
function listWorkflowTemplates(caseType) {
    return WORKFLOW_TEMPLATES.filter((template) => template.isActive &&
        (!caseType || template.caseType.toLowerCase() === caseType.toLowerCase()));
}
function getWorkflowTemplateById(templateId) {
    return WORKFLOW_TEMPLATES.find((template) => template.isActive && template.id === templateId);
}
function selectIncidentWorkflowTemplate(input) {
    const incidentTemplates = listWorkflowTemplates("incident").filter((template) => template.autoAssign);
    if (incidentTemplates.length === 0) {
        return undefined;
    }
    let bestTemplate;
    let bestScore = -1;
    for (const template of incidentTemplates) {
        const priorities = template.match?.priorities || [];
        const channels = template.match?.channels || [];
        const categoryIds = template.match?.categoryIds || [];
        let score = 0;
        if (input.priority && priorities.includes(input.priority.toLowerCase())) {
            score += 3;
        }
        if (input.channel && channels.includes(input.channel.toLowerCase())) {
            score += 2;
        }
        if (input.categoryId && categoryIds.includes(input.categoryId)) {
            score += 4;
        }
        if (priorities.length === 0 && channels.length === 0 && categoryIds.length === 0) {
            score += 1;
        }
        if (score > bestScore) {
            bestScore = score;
            bestTemplate = template;
        }
    }
    return bestTemplate;
}
//# sourceMappingURL=workflow-templates.registry.js.map
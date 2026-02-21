"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@nexusops/ui";
import { Button } from "@nexusops/ui";
import {
  Shield,
  Github,
  ExternalLink,
  Heart,
  Code,
  Database,
  Server,
  Globe,
  Layers,
  Mail,
  FileText,
  Users,
} from "lucide-react";

interface TechStackItem {
  icon: React.ElementType;
  name: string;
  description: string;
}

interface TeamMember {
  name: string;
  role: string;
}

const TECH_STACK: TechStackItem[] = [
  {
    icon: Globe,
    name: "Next.js 14",
    description: "React framework with App Router",
  },
  {
    icon: Server,
    name: "NestJS",
    description: "Backend API framework",
  },
  {
    icon: Database,
    name: "PostgreSQL",
    description: "Primary database with Prisma ORM",
  },
  {
    icon: Layers,
    name: "Tailwind CSS",
    description: "Utility-first styling",
  },
  {
    icon: Code,
    name: "TypeScript",
    description: "Type-safe development",
  },
];

const TEAM_MEMBERS: TeamMember[] = [
  { name: "Engineering Team", role: "Core Development" },
  { name: "Product Team", role: "Product Management" },
  { name: "Design Team", role: "UX/UI Design" },
  { name: "DevOps Team", role: "Infrastructure & SRE" },
];

const APP_INFO = {
  name: "NexusOps",
  version: "1.0.0",
  buildDate: new Date().toLocaleDateString(),
  description:
    "NexusOps is an ITIL-aligned IT Service Management (ITSM) platform designed to streamline incident, problem, change, and service level management workflows.",
};

export default function AboutPage() {
  return (
    <div className="p-8 space-y-8">
      <div className="animate-fade-in text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 mb-6 shadow-lg">
          <Shield className="h-12 w-12 text-white" />
        </div>
        <h1 className="text-4xl font-bold gradient-text">{APP_INFO.name}</h1>
        <p className="text-muted-foreground mt-4 text-lg">{APP_INFO.description}</p>
        <div className="flex items-center justify-center gap-4 mt-6">
          <span className="text-sm text-muted-foreground">Version {APP_INFO.version}</span>
          <span className="text-muted-foreground">|</span>
          <span className="text-sm text-muted-foreground">Built {APP_INFO.buildDate}</span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card variant="glass" className="animate-slide-up lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5 text-violet-500" />
              Technology Stack
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {TECH_STACK.map((tech) => (
                <div
                  key={tech.name}
                  className="flex items-start gap-3 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/20">
                    <tech.icon className="h-5 w-5 text-violet-500" />
                  </div>
                  <div>
                    <p className="font-medium">{tech.name}</p>
                    <p className="text-sm text-muted-foreground">{tech.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card variant="glass" className="animate-slide-up" style={{ animationDelay: "100ms" }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-amber-500" />
              Quick Links
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <a
              href="#"
              className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Github className="h-4 w-4" />
                GitHub Repository
              </span>
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </a>
            <a
              href="#"
              className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Documentation
              </span>
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </a>
            <a
              href="#"
              className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                License (MIT)
              </span>
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </a>
            <a
              href="#"
              className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Contact Us
              </span>
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </a>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card variant="glass" className="animate-slide-up" style={{ animationDelay: "200ms" }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-emerald-500" />
              Credits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {TEAM_MEMBERS.map((member) => (
                <div
                  key={member.name}
                  className="flex items-center justify-between p-3 rounded-xl bg-muted/30"
                >
                  <span className="font-medium">{member.name}</span>
                  <span className="text-sm text-muted-foreground">{member.role}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 rounded-xl bg-gradient-to-br from-violet-500/10 via-purple-500/10 to-pink-500/10 border border-violet-500/20">
              <p className="text-sm text-muted-foreground text-center">
                Built with <Heart className="inline h-4 w-4 text-rose-500 mx-1" /> by the NexusOps
                team
              </p>
            </div>
          </CardContent>
        </Card>

        <Card variant="glass" className="animate-slide-up" style={{ animationDelay: "300ms" }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-cyan-500" />
              ITIL Alignment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              NexusOps follows ITIL 4 best practices for IT Service Management, providing:
            </p>
            <div className="space-y-3">
              {[
                "Incident Management with SLA tracking",
                "Problem Management with root cause analysis",
                "Change Management with approval workflows",
                "Service Level Management and reporting",
                "Knowledge Management integration",
                "Configuration Management Database (CMDB)",
                "Continual Improvement practices",
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-gradient-to-br from-violet-500 to-purple-500" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card variant="glass" className="animate-slide-up" style={{ animationDelay: "400ms" }}>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold">Ready to get started?</h3>
              <p className="text-sm text-muted-foreground">
                Explore our documentation or contact support for assistance.
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/help">
                <Button variant="ghost">
                  <FileText className="h-4 w-4 mr-2" />
                  Documentation
                </Button>
              </Link>
              <Link href="/support">
                <Button variant="gradient">
                  <Mail className="h-4 w-4 mr-2" />
                  Contact Support
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-center text-sm text-muted-foreground animate-fade-in">
        <p>
          &copy; {new Date().getFullYear()} NexusOps. All rights reserved. |{" "}
          <a href="#" className="hover:text-foreground transition-colors">
            Privacy Policy
          </a>{" "}
          |{" "}
          <a href="#" className="hover:text-foreground transition-colors">
            Terms of Service
          </a>
        </p>
      </div>
    </div>
  );
}

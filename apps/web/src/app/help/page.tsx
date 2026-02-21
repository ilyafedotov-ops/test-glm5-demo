"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@nexusops/ui";
import { Button } from "@nexusops/ui";
import {
  BookOpen,
  Search,
  AlertTriangle,
  Wrench,
  GitBranch,
  Gauge,
  Keyboard,
  Play,
  FileText,
  ExternalLink,
  Zap,
  Shield,
  Database,
  CheckSquare,
  Activity,
  Book,
  ChevronRight,
} from "lucide-react";

interface HelpTopic {
  icon: React.ElementType;
  title: string;
  description: string;
  href: string;
  gradient: string;
}

interface KeyboardShortcut {
  keys: string[];
  description: string;
}

const HELP_TOPICS: HelpTopic[] = [
  {
    icon: AlertTriangle,
    title: "Incident Management",
    description: "Create, track, and resolve incidents efficiently",
    href: "/knowledge?category=incidents",
    gradient: "from-rose-500 to-pink-500",
  },
  {
    icon: Wrench,
    title: "Problem Management",
    description: "Root cause analysis and problem resolution",
    href: "/knowledge?category=problems",
    gradient: "from-amber-500 to-orange-500",
  },
  {
    icon: GitBranch,
    title: "Change Management",
    description: "Plan, approve, and implement changes safely",
    href: "/knowledge?category=changes",
    gradient: "from-violet-500 to-purple-500",
  },
  {
    icon: Gauge,
    title: "SLA Management",
    description: "Configure and monitor service level agreements",
    href: "/knowledge?category=sla",
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    icon: Database,
    title: "CMDB",
    description: "Configuration items and asset management",
    href: "/knowledge?category=cmdb",
    gradient: "from-cyan-500 to-blue-500",
  },
  {
    icon: Shield,
    title: "Compliance & Policies",
    description: "Governance, risk, and compliance workflows",
    href: "/knowledge?category=compliance",
    gradient: "from-indigo-500 to-violet-500",
  },
  {
    icon: CheckSquare,
    title: "Task Management",
    description: "Create and track tasks across all processes",
    href: "/knowledge?category=tasks",
    gradient: "from-pink-500 to-rose-500",
  },
  {
    icon: Activity,
    title: "Workflows",
    description: "Automate and orchestrate IT processes",
    href: "/knowledge?category=workflows",
    gradient: "from-orange-500 to-amber-500",
  },
];

const KEYBOARD_SHORTCUTS: KeyboardShortcut[] = [
  { keys: ["Cmd", "K"], description: "Open command palette" },
  { keys: ["Cmd", "/"], description: "Toggle keyboard shortcuts" },
  { keys: ["Cmd", "N"], description: "Create new incident" },
  { keys: ["Cmd", "Shift", "P"], description: "Create new problem" },
  { keys: ["Cmd", "Shift", "C"], description: "Create new change" },
  { keys: ["Cmd", "Shift", "T"], description: "Create new task" },
  { keys: ["G", "D"], description: "Go to Dashboard" },
  { keys: ["G", "I"], description: "Go to Incidents" },
  { keys: ["G", "R"], description: "Go to Reports" },
  { keys: ["?"], description: "Open help" },
];

const QUICK_START_STEPS = [
  { step: 1, title: "Create your first incident", href: "/incidents?create=1" },
  { step: 2, title: "Explore the knowledge base", href: "/knowledge" },
  { step: 3, title: "Configure notification preferences", href: "/settings" },
  { step: 4, title: "Review SLA targets", href: "/sla-dashboard" },
];

export default function HelpPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTopics = HELP_TOPICS.filter(
    (topic) =>
      topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      topic.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 space-y-8">
      <div className="animate-fade-in">
        <h1 className="text-3xl font-bold">Help Center</h1>
        <p className="text-muted-foreground mt-1">
          Documentation, tutorials, and resources to help you get the most out of NexusOps
        </p>
      </div>

      <Card variant="glass" className="animate-slide-up">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search help articles, tutorials, and documentation..."
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/10 bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>
            <Button variant="gradient" onClick={() => router.push("/knowledge")}>
              <BookOpen className="h-4 w-4 mr-2" />
              Knowledge Base
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card variant="glass" className="animate-slide-up" style={{ animationDelay: "100ms" }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" />
            Quick Start Guide
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {QUICK_START_STEPS.map((item) => (
              <Link
                key={item.step}
                href={item.href}
                className="group flex items-start gap-3 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 text-white font-bold text-sm">
                  {item.step}
                </div>
                <div className="flex-1">
                  <p className="font-medium group-hover:text-primary transition-colors">
                    {item.title}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card
            variant="glass"
            className="animate-slide-up h-full"
            style={{ animationDelay: "200ms" }}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Book className="h-5 w-5 text-violet-500" />
                Documentation by Topic
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                {filteredTopics.map((topic) => (
                  <Link
                    key={topic.title}
                    href={topic.href}
                    className="group flex items-start gap-4 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all"
                  >
                    <div
                      className={`p-2.5 rounded-xl bg-gradient-to-br ${topic.gradient} shrink-0`}
                    >
                      <topic.icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium group-hover:text-primary transition-colors">
                        {topic.title}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {topic.description}
                      </p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card variant="glass" className="animate-slide-up" style={{ animationDelay: "300ms" }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5 text-rose-500" />
              Video Tutorials
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl bg-muted/50 aspect-video flex items-center justify-center">
              <div className="text-center">
                <Play className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Video tutorials coming soon</p>
              </div>
            </div>
            <div className="space-y-2">
              {[
                "Getting Started with NexusOps",
                "Incident Management Walkthrough",
                "SLA Configuration Guide",
              ].map((title, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <Play className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{title}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card variant="glass" className="animate-slide-up" style={{ animationDelay: "400ms" }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5 text-cyan-500" />
            Keyboard Shortcuts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {KEYBOARD_SHORTCUTS.map((shortcut, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-xl bg-muted/30"
              >
                <span className="text-sm text-muted-foreground">{shortcut.description}</span>
                <div className="flex items-center gap-1">
                  {shortcut.keys.map((key, i) => (
                    <span key={i}>
                      <kbd className="px-2 py-1 text-xs font-mono rounded bg-muted border border-white/10">
                        {key}
                      </kbd>
                      {i < shortcut.keys.length - 1 && (
                        <span className="text-muted-foreground mx-0.5">+</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card variant="glass" className="animate-slide-up" style={{ animationDelay: "500ms" }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-500" />
              Additional Resources
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <a
              href="#"
              className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <span>ITIL 4 Framework Guide</span>
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </a>
            <a
              href="#"
              className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <span>API Documentation</span>
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </a>
            <a
              href="#"
              className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <span>Release Notes</span>
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </a>
            <a
              href="#"
              className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <span>Community Forum</span>
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </a>
          </CardContent>
        </Card>

        <Card variant="glass" className="animate-slide-up" style={{ animationDelay: "600ms" }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-indigo-500" />
              Need More Help?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Can&apos;t find what you&apos;re looking for? Our support team is here to help.
            </p>
            <div className="flex flex-col gap-2">
              <Button variant="gradient" onClick={() => router.push("/support")}>
                Contact Support
              </Button>
              <Button variant="ghost" onClick={() => router.push("/knowledge")}>
                Browse Knowledge Base
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

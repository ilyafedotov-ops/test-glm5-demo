"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@nexusops/ui";
import { Button } from "@nexusops/ui";
import {
  HelpCircle,
  Mail,
  Phone,
  MessageCircle,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Send,
  Ticket,
  ExternalLink,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { useToastStore } from "@/stores/toast-store";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    question: "How do I create a new incident?",
    answer:
      "Navigate to Incidents from the sidebar and click the 'Create Incident' button. Fill in the required details including title, description, priority, and affected services. The system will automatically assign an incident number and route it based on your configuration.",
  },
  {
    question: "What is the SLA breach notification process?",
    answer:
      "SLA breaches trigger automatic notifications to the assigned technician, their team lead, and the service desk manager. Email and in-app notifications are sent at 75% and 90% of SLA time, with a final alert at breach.",
  },
  {
    question: "How do I link a problem to an incident?",
    answer:
      "Open the incident details page and use the 'Linked Records' section to associate it with an existing problem. This helps track root cause analysis and prevents duplicate work.",
  },
  {
    question: "Can I customize the dashboard widgets?",
    answer:
      "The dashboard currently displays key metrics based on your role. Custom widgets and layout personalization features are planned for an upcoming release.",
  },
  {
    question: "How do I request access to additional features?",
    answer:
      "Contact your system administrator or use the Service Catalog to submit an access request. Admin users can also manage role-based permissions from the Admin section.",
  },
];

const SUPPORT_CHANNELS = [
  {
    icon: Mail,
    title: "Email Support",
    description: "support@nexusops.com",
    availability: "Response within 24 hours",
    gradient: "from-violet-500 to-purple-500",
  },
  {
    icon: MessageCircle,
    title: "Live Chat",
    description: "Click the chat button",
    availability: "Mon-Fri 9AM-6PM EST",
    gradient: "from-amber-500 to-orange-500",
  },
  {
    icon: Phone,
    title: "Phone Support",
    description: "+1 (555) 123-4567",
    availability: "Priority customers only",
    gradient: "from-emerald-500 to-teal-500",
  },
];

export default function SupportPage() {
  const { user } = useAuthStore();
  const addToast = useToastStore((state) => state.addToast);
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: user ? `${user.firstName} ${user.lastName}` : "",
    email: user?.email || "",
    subject: "",
    message: "",
    priority: "medium",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject.trim() || !formData.message.trim()) {
      addToast({
        type: "error",
        title: "Validation Error",
        description: "Please fill in all required fields.",
      });
      return;
    }

    setIsSubmitting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSubmitting(false);

    addToast({
      type: "success",
      title: "Support Request Sent",
      description: "We'll get back to you within 24 hours.",
    });

    setFormData((prev) => ({ ...prev, subject: "", message: "" }));
  };

  return (
    <div className="p-8 space-y-8">
      <div className="animate-fade-in">
        <h1 className="text-3xl font-bold">Support Center</h1>
        <p className="text-muted-foreground mt-1">
          Get help with NexusOps and contact our support team
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {SUPPORT_CHANNELS.map((channel, index) => (
          <Card
            key={channel.title}
            variant="glass"
            className="animate-slide-up group"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CardContent className="p-6">
              <div
                className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${channel.gradient} mb-4`}
              >
                <channel.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-lg">{channel.title}</h3>
              <p className="text-muted-foreground mt-1">{channel.description}</p>
              <p className="text-sm text-muted-foreground/80 mt-2 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {channel.availability}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card variant="glass" className="animate-slide-up" style={{ animationDelay: "300ms" }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-violet-500" />
              Contact Support
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Your name"
                />
                <Input
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="your@email.com"
                />
              </div>
              <Input
                label="Subject"
                value={formData.subject}
                onChange={(e) => setFormData((prev) => ({ ...prev, subject: e.target.value }))}
                placeholder="Brief description of your issue"
              />
              <div>
                <label className="text-sm font-medium mb-2 block">Priority</label>
                <div className="flex gap-2">
                  {["low", "medium", "high", "critical"].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, priority: p }))}
                      className={`px-3 py-1.5 rounded-lg text-sm capitalize transition-all ${
                        formData.priority === p
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted hover:bg-muted/80"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <Textarea
                label="Message"
                value={formData.message}
                onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
                placeholder="Describe your issue or question in detail..."
                rows={4}
              />
              <Button variant="gradient" type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? "Sending..." : "Send Request"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card variant="glass" className="animate-slide-up" style={{ animationDelay: "400ms" }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Emergency Support
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <h4 className="font-semibold text-amber-600 dark:text-amber-400">
                Critical System Outage?
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                For production down scenarios, contact our emergency hotline:
              </p>
              <p className="text-lg font-bold mt-2 text-amber-600 dark:text-amber-400">
                +1 (555) 911-NEXUS
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Available 24/7 for critical incidents
              </p>
            </div>

            <div className="p-4 rounded-xl bg-muted/50">
              <h4 className="font-semibold flex items-center gap-2">
                <Ticket className="h-4 w-4" />
                Recent Tickets
              </h4>
              <p className="text-sm text-muted-foreground mt-2">
                No recent support tickets. Your ticket history will appear here once you submit a
                request.
              </p>
              <Button variant="ghost" size="sm" className="mt-3">
                View All Tickets
                <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            </div>

            <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/20">
              <h4 className="font-semibold text-violet-600 dark:text-violet-400">Quick Links</h4>
              <ul className="text-sm text-muted-foreground mt-2 space-y-2">
                <li>
                  <a href="/knowledge" className="hover:text-foreground transition-colors">
                    Knowledge Base
                  </a>
                </li>
                <li>
                  <a href="/help" className="hover:text-foreground transition-colors">
                    Help Documentation
                  </a>
                </li>
                <li>
                  <a href="/about" className="hover:text-foreground transition-colors">
                    About NexusOps
                  </a>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card variant="glass" className="animate-slide-up" style={{ animationDelay: "500ms" }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-cyan-500" />
            Frequently Asked Questions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {FAQ_DATA.map((faq, index) => (
            <div key={index} className="rounded-xl border border-white/10 overflow-hidden">
              <button
                onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
              >
                <span className="font-medium pr-4">{faq.question}</span>
                {expandedFAQ === index ? (
                  <ChevronUp className="h-5 w-5 shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground" />
                )}
              </button>
              {expandedFAQ === index && (
                <div className="px-4 pb-4 text-sm text-muted-foreground">{faq.answer}</div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

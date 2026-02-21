"use client";

import { FormEvent, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@nexusops/ui";
import { Button } from "@nexusops/ui";
import { API_URL } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { useToastStore } from "@/stores/toast-store";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";

interface CreateKnowledgePayload {
  title: string;
  content: string;
  category: string;
  tags: string[];
}

async function createArticle(token: string, payload: CreateKnowledgePayload) {
  const res = await fetch(`${API_URL}/knowledge`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error("Failed to create knowledge article");
  }

  return res.json();
}

export default function NewKnowledgeArticlePage() {
  const router = useRouter();
  const { token } = useAuthStore();
  const addToast = useToastStore((state) => state.addToast);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("general");
  const [content, setContent] = useState("");
  const [tagsInput, setTagsInput] = useState("");

  const createMutation = useMutation({
    mutationFn: (payload: CreateKnowledgePayload) => createArticle(token!, payload),
    onSuccess: (article) => {
      addToast({
        type: "success",
        title: "Article created",
        description: "Draft article has been created.",
      });
      router.push(`/knowledge/${article.id}`);
    },
    onError: (error: Error) => {
      addToast({ type: "error", title: "Create failed", description: error.message });
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      addToast({
        type: "error",
        title: "Missing fields",
        description: "Title and content are required.",
      });
      return;
    }

    const tags = tagsInput
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    createMutation.mutate({
      title: title.trim(),
      content: content.trim(),
      category,
      tags,
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">New Knowledge Article</h1>
          <p className="text-muted-foreground mt-1">Create a draft and publish after review.</p>
        </div>
        <Button variant="outline" onClick={() => router.push("/knowledge")}>
          Back
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Article Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="How to recover a failed deployment"
            />

            <Select
              label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              options={[
                { label: "General", value: "general" },
                { label: "How-To", value: "howto" },
                { label: "Troubleshooting", value: "troubleshooting" },
                { label: "Reference", value: "reference" },
              ]}
            />

            <Input
              label="Tags (comma separated)"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="incident, outage, runbook"
            />

            <Textarea
              label="Content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={14}
              placeholder="Describe the process, checks, and rollback steps..."
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => router.push("/knowledge")}>
                Cancel
              </Button>
              <Button type="submit" variant="gradient" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create Draft"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@nexusops/ui";
import { Button } from "@nexusops/ui";
import { API_URL } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { useToastStore } from "@/stores/toast-store";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface KnowledgeArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  status: "draft" | "published" | "archived";
  version: string;
  tags: string[];
  views: number;
  helpful: number;
  notHelpful: number;
  createdAt: string;
  updatedAt: string;
  author?: { firstName: string; lastName: string; email: string };
}

interface KnowledgeArticleVersion {
  id: string;
  version: string;
  title: string;
  category: string;
  tags: string[];
  changeSummary?: string;
  createdAt: string;
  editedBy?: { firstName: string; lastName: string; email: string };
}

async function fetchArticle(token: string, id: string): Promise<KnowledgeArticle> {
  const res = await fetch(`${API_URL}/knowledge/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch article");
  }

  return res.json();
}

async function fetchVersions(token: string, id: string): Promise<KnowledgeArticleVersion[]> {
  const res = await fetch(`${API_URL}/knowledge/${id}/versions`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error("Failed to fetch article versions");
  }
  return res.json();
}

export default function KnowledgeArticleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuthStore();
  const addToast = useToastStore((state) => state.addToast);
  const queryClient = useQueryClient();

  const articleId = params["id"] as string;
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("general");
  const [tagsInput, setTagsInput] = useState("");
  const [changeSummary, setChangeSummary] = useState("");

  const queryKey = useMemo(() => ["knowledge-article", articleId], [articleId]);

  const { data: article, isLoading } = useQuery({
    queryKey,
    queryFn: () => fetchArticle(token!, articleId),
    enabled: !!token && !!articleId,
  });

  const { data: versions = [] } = useQuery({
    queryKey: ["knowledge-article-versions", articleId],
    queryFn: () => fetchVersions(token!, articleId),
    enabled: !!token && !!articleId,
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey });

  const publishMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_URL}/knowledge/${articleId}/publish`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to publish article");
      return res.json();
    },
    onSuccess: () => {
      addToast({ type: "success", title: "Published", description: "Article published." });
      refresh();
    },
    onError: (error: Error) =>
      addToast({ type: "error", title: "Publish failed", description: error.message }),
  });

  const archiveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_URL}/knowledge/${articleId}/archive`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to archive article");
      return res.json();
    },
    onSuccess: () => {
      addToast({ type: "success", title: "Archived", description: "Article archived." });
      refresh();
    },
    onError: (error: Error) =>
      addToast({ type: "error", title: "Archive failed", description: error.message }),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const tags = tagsInput
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);
      const res = await fetch(`${API_URL}/knowledge/${articleId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          category,
          tags,
          changeSummary: changeSummary.trim() || undefined,
        }),
      });

      if (!res.ok) throw new Error("Failed to update article");
      return res.json();
    },
    onSuccess: () => {
      addToast({ type: "success", title: "Updated", description: "Article updated." });
      setIsEditing(false);
      setChangeSummary("");
      refresh();
      queryClient.invalidateQueries({ queryKey: ["knowledge-article-versions", articleId] });
    },
    onError: (error: Error) =>
      addToast({ type: "error", title: "Update failed", description: error.message }),
  });

  const voteMutation = useMutation({
    mutationFn: async (action: "helpful" | "not-helpful") => {
      const res = await fetch(`${API_URL}/knowledge/${articleId}/${action}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to record vote");
      return res.json();
    },
    onSuccess: () => refresh(),
  });

  const revertMutation = useMutation({
    mutationFn: async (versionId: string) => {
      const res = await fetch(`${API_URL}/knowledge/${articleId}/revert`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          versionId,
          changeSummary: `Reverted via UI to historical version`,
        }),
      });
      if (!res.ok) throw new Error("Failed to revert article");
      return res.json();
    },
    onSuccess: () => {
      addToast({ type: "success", title: "Article reverted", description: "A new draft revision was created." });
      refresh();
      queryClient.invalidateQueries({ queryKey: ["knowledge-article-versions", articleId] });
    },
    onError: (error: Error) =>
      addToast({ type: "error", title: "Revert failed", description: error.message }),
  });

  if (isLoading || !article) {
    return <div className="p-6">Loading article...</div>;
  }

  const startEditing = () => {
    setTitle(article.title);
    setContent(article.content);
    setCategory(article.category);
    setTagsInput((article.tags || []).join(", "));
    setIsEditing(true);
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="capitalize">
              {article.category}
            </Badge>
            <Badge variant={article.status === "published" ? "success" : "secondary"} className="capitalize">
              {article.status}
            </Badge>
          </div>
          <h1 className="text-3xl font-bold">{article.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Updated {new Date(article.updatedAt).toLocaleString()} • {article.views} views • v{article.version}
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => router.push("/knowledge")}>
            Back
          </Button>
          <Button variant="outline" onClick={startEditing}>
            Edit
          </Button>
          {article.status === "draft" && (
            <Button variant="gradient" onClick={() => publishMutation.mutate()} disabled={publishMutation.isPending}>
              Publish
            </Button>
          )}
          {article.status !== "archived" && (
            <Button variant="outline" onClick={() => archiveMutation.mutate()} disabled={archiveMutation.isPending}>
              Archive
            </Button>
          )}
        </div>
      </div>

      {isEditing ? (
        <Card>
          <CardHeader>
            <CardTitle>Edit Article</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <Input
              label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="general | howto | troubleshooting | reference"
            />
            <Input
              label="Tags"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="incident, outage, runbook"
            />
            <Input
              label="Change Summary"
              value={changeSummary}
              onChange={(e) => setChangeSummary(e.target.value)}
              placeholder="What changed in this revision?"
            />
            <Textarea label="Content" value={content} onChange={(e) => setContent(e.target.value)} rows={14} />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button variant="gradient" onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
                Save
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Article</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="whitespace-pre-wrap text-sm leading-6">{article.content}</p>
            {article.tags?.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {article.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2 pt-2">
              <Button variant="outline" onClick={() => voteMutation.mutate("helpful")}>Helpful ({article.helpful})</Button>
              <Button variant="outline" onClick={() => voteMutation.mutate("not-helpful")}>Not Helpful ({article.notHelpful})</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Version History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {versions.map((version) => (
            <div
              key={version.id}
              className="rounded-xl border border-white/15 bg-white/20 p-3 dark:border-white/10 dark:bg-slate-800/30"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">
                    v{version.version}
                    {version.version === article.version ? " (current)" : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(version.createdAt).toLocaleString()}
                    {version.editedBy
                      ? ` · ${version.editedBy.firstName} ${version.editedBy.lastName}`
                      : ""}
                  </p>
                  {version.changeSummary && (
                    <p className="text-xs text-muted-foreground mt-1">{version.changeSummary}</p>
                  )}
                </div>
                <Button
                  variant="outline"
                  disabled={version.version === article.version || revertMutation.isPending}
                  onClick={() => revertMutation.mutate(version.id)}
                >
                  Revert
                </Button>
              </div>
            </div>
          ))}
          {versions.length === 0 && (
            <p className="text-sm text-muted-foreground">No version history yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

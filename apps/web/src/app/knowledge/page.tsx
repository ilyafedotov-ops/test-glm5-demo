"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@nexusops/ui";
import { Button } from "@nexusops/ui";
import { BookOpen, Search, Plus, FileText, Lightbulb, Wrench, HelpCircle, ThumbsUp, Eye, Calendar } from "lucide-react";
import { API_URL } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { Badge } from "@/components/ui/badge";

interface KnowledgeArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  status: string;
  tags: string[];
  views: number;
  helpful: number;
  notHelpful: number;
  createdAt: string;
  author?: { id: string; firstName: string; lastName: string };
}

interface KnowledgeResponse {
  data: KnowledgeArticle[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

async function fetchKnowledge(token: string, category?: string): Promise<KnowledgeResponse> {
  const params = new URLSearchParams();
  if (category) params.append("category", category);
  params.append("status", "published");

  const res = await fetch(`${API_URL}/knowledge?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) throw new Error("Failed to fetch knowledge articles");
  return res.json();
}

const categoryConfig: Record<string, { icon: any; color: string; label: string }> = {
  general: { icon: FileText, color: "bg-blue-500/10 text-blue-600", label: "General" },
  howto: { icon: Lightbulb, color: "bg-amber-500/10 text-amber-600", label: "How-To" },
  troubleshooting: { icon: Wrench, color: "bg-purple-500/10 text-purple-600", label: "Troubleshooting" },
  reference: { icon: BookOpen, color: "bg-emerald-500/10 text-emerald-600", label: "Reference" },
};

export default function KnowledgeBasePage() {
  const router = useRouter();
  const { token, isAuthenticated } = useAuthStore();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: articles, isLoading } = useQuery({
    queryKey: ["knowledge", selectedCategory],
    queryFn: () => fetchKnowledge(token!, selectedCategory || undefined),
    enabled: isAuthenticated && !!token,
  });

  const filteredArticles = articles?.data?.filter((article) =>
    article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    article.content.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];
  const hasActiveFilters = Boolean(searchTerm.trim()) || selectedCategory !== null;

  const categories = [...new Set(articles?.data?.map((article) => article.category) || [])];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Knowledge Base</h1>
          <p className="text-muted-foreground mt-1">
            Find answers and documentation
          </p>
        </div>
        <Button onClick={() => router.push("/knowledge/new")} variant="gradient">
          <Plus className="h-4 w-4 mr-2" />
          New Article
        </Button>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search articles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-white/20 dark:border-white/10 bg-white/50 dark:bg-slate-900/50"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                onClick={() => setSelectedCategory(null)}
              >
                All
              </Button>
              {categories.map((cat) => {
                const config = categoryConfig[cat] || categoryConfig["general"];
                return (
                  <Button
                    key={cat}
                    variant={selectedCategory === cat ? "default" : "outline"}
                    onClick={() => setSelectedCategory(cat)}
                    className="capitalize"
                  >
                    {config.label}
                  </Button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Articles List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading articles...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredArticles.map((article) => {
            const config = categoryConfig[article.category] || categoryConfig["general"];
            const Icon = config.icon;

            return (
              <Card
                key={article.id}
                className="group hover:shadow-lg transition-all duration-200 cursor-pointer"
                onClick={() => router.push(`/knowledge/${article.id}`)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${config.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{article.title}</h3>
                        <Badge className={config.color}>{config.label}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {article.content}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {article.views} views
                        </span>
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="h-3 w-3" />
                          {article.helpful} helpful
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(article.createdAt).toLocaleDateString()}
                        </span>
                        {article.author && (
                          <span>
                            By {article.author.firstName} {article.author.lastName}
                          </span>
                        )}
                      </div>
                      {article.tags && article.tags.length > 0 && (
                        <div className="flex gap-2 mt-3">
                          {article.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {filteredArticles.length === 0 && !isLoading && (
        <Card>
          <CardContent className="p-16 text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center">
              <BookOpen className="h-8 w-8 text-violet-500" />
            </div>
            <p className="text-lg font-semibold">
              {hasActiveFilters ? "No matching articles" : "Your knowledge base is empty"}
            </p>
            <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
              {hasActiveFilters
                ? "Try adjusting your search terms or clear the active filters"
                : "Start building your team's knowledge base — document solutions, how-tos, and reference material"}
            </p>
            <Button
              variant="gradient"
              className="mt-6"
              onClick={() => {
                if (hasActiveFilters) {
                  setSearchTerm("");
                  setSelectedCategory(null);
                  return;
                }
                router.push("/knowledge/new");
              }}
            >
              {hasActiveFilters ? (
                "Clear Filters"
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Article
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

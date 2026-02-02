import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function Home() {
  const [query, setQuery] = useState("");
  const [, setLocation] = useLocation();
  const { user } = useAuthStore();
  
  const { data: people = [], isLoading: peopleLoading } = useQuery({
    queryKey: ['people', query],
    queryFn: () => api.getPeople(query),
  });

  const { data: stats = { marked: 0, unmarked: 0 }, isLoading: statsLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: () => api.getStats(),
    refetchInterval: 3000, // Refresh every 3 seconds
  });

  // Show login/register options when not logged in
  if (!user) {
    return (
      <Layout>
        <div className="space-y-6">
          {/* Authentication Options */}
          <div className="space-y-3">
            <Button 
              onClick={() => setLocation("/auth")} 
              className="w-full h-12 text-lg font-semibold"
              data-testid="button-login-home"
            >
              Login
            </Button>
            <Button 
              onClick={() => setLocation("/auth")} 
              variant="outline" 
              className="w-full h-12 text-lg font-semibold"
              data-testid="button-create-account-home"
            >
              Create Account
            </Button>
          </div>

          {/* Search Box */}
          <div className="pt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by name, identity number, or father name" 
                className="pl-9 h-12 text-lg bg-card shadow-sm"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                data-testid="input-search-public"
              />
            </div>
          </div>

          {/* Search Results */}
          <div className="space-y-3">
            {peopleLoading ? (
              <div className="text-center py-10 text-muted-foreground">Loading...</div>
            ) : people.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                {query ? "No results found for your search." : "Try searching to view public information."}
              </div>
            ) : (
              people.map((person) => (
                <div key={person.id} className="p-4 rounded-lg border shadow-sm bg-card" data-testid={`person-card-public-${person.id}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-lg" data-testid={`person-name-public-${person.id}`}>
                        {person.name}
                      </h3>
                      <div className="text-sm text-muted-foreground mt-2 space-y-1">
                        {person.gender && <div><span className="font-medium">Gender:</span> {person.gender}</div>}
                        {person.identity_number && <div><span className="font-medium">ID:</span> {person.identity_number}</div>}
                        {person.father_name && <div><span className="font-medium">Father:</span> {person.father_name}</div>}
                        {person.age && <div><span className="font-medium">Age:</span> {person.age}</div>}
                        {person.order_number && <div><span className="font-medium">Order:</span> {person.order_number}</div>}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Layout>
    );
  }

  // Show logged-in user view with stats and full search
  return (
    <Layout>
      <div className="space-y-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by name, house, or area" 
            className="pl-9 h-12 text-lg bg-card shadow-sm"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            data-testid="input-search"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-status-marked text-status-marked-foreground p-6 rounded-xl shadow-sm text-center" data-testid="stat-marked">
            <div className="text-sm font-medium opacity-90 uppercase tracking-wider mb-1">Marked</div>
            <div className="text-5xl font-bold" data-testid="count-marked">
              {statsLoading ? '...' : stats.marked}
            </div>
          </div>
          <div className="bg-status-unmarked text-status-unmarked-foreground p-6 rounded-xl shadow-sm text-center" data-testid="stat-unmarked">
            <div className="text-sm font-medium opacity-90 uppercase tracking-wider mb-1">Not Marked</div>
            <div className="text-5xl font-bold" data-testid="count-unmarked">
              {statsLoading ? '...' : stats.unmarked}
            </div>
          </div>
        </div>

        {/* List */}
        <div className="space-y-3">
          {peopleLoading ? (
            <div className="text-center py-10 text-muted-foreground">Loading...</div>
          ) : people.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              No people found matching your search.
            </div>
          ) : (
            people.map((person) => (
              <Link key={person.id} href={`/person/${person.id}`}>
                <a className="block group" data-testid={`person-card-${person.id}`}>
                  <div className={`
                    p-4 rounded-lg border shadow-sm transition-all hover:shadow-md
                    ${person.is_marked 
                      ? "bg-green-50 border-green-100 dark:bg-green-900/10 dark:border-green-900/20" 
                      : "bg-red-50 border-red-100 dark:bg-red-900/10 dark:border-red-900/20"}
                  `}>
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg leading-tight group-hover:underline decoration-2 underline-offset-2" data-testid={`person-name-${person.id}`}>
                          {person.name}
                        </h3>
                        <div className="text-sm text-muted-foreground mt-1 flex flex-col gap-0.5">
                          {person.house_name && <span>{person.house_name}</span>}
                          {person.area && <span className="opacity-75">{person.area}</span>}
                        </div>
                      </div>
                      <div className={`
                        w-3 h-3 rounded-full mt-1.5
                        ${person.is_marked ? "bg-status-marked" : "bg-status-unmarked"}
                      `} />
                    </div>
                  </div>
                </a>
              </Link>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}

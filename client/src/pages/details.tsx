import React from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Edit2, Trash2, CheckCircle, XCircle, Phone, MapPin, Home, Hash, User, Cake, Users } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

export default function PersonDetails() {
  const [match, params] = useRoute("/person/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const id = params?.id || "";

  const { data: person, isLoading } = useQuery({
    queryKey: ['person', id],
    queryFn: () => api.getPerson(id),
    enabled: !!id,
  });

  const toggleMutation = useMutation({
    mutationFn: () => api.toggleMark(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['person', id] });
      queryClient.invalidateQueries({ queryKey: ['people'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      toast({
        title: person?.is_marked === 0 ? "Marked as Voted" : "Unmarked",
        description: `${person?.name} status has been updated.`,
        duration: 2000,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.deletePerson(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['people'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      toast({
        title: "Person Deleted",
        description: "The record has been permanently removed.",
        variant: "destructive",
      });
      setLocation("/");
    },
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="text-center py-20">Loading...</div>
      </Layout>
    );
  }

  if (!person) {
    return (
      <Layout>
        <div className="text-center py-20">
          <h2 className="text-xl font-bold">Person not found</h2>
          <Button onClick={() => setLocation("/")} className="mt-4">Go Home</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <Button variant="ghost" className="pl-0 gap-2 hover:bg-transparent" onClick={() => setLocation("/")} data-testid="button-back">
          <ArrowLeft className="w-4 h-4" /> Back to List
        </Button>

        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-person-name">{person.name}</h1>
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-sm font-medium ${
            person.is_marked 
              ? "bg-status-marked/10 text-status-marked" 
              : "bg-status-unmarked/10 text-status-unmarked"
          }`} data-testid="badge-status">
            {person.is_marked ? "MARKED" : "NOT MARKED"}
          </div>
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            <DetailRow icon={Users} label="Gender" value={person.gender} />
            <DetailRow icon={Hash} label="Identity Number" value={person.identity_number} />
            <DetailRow icon={Hash} label="Order Number" value={person.order_number} />
            <DetailRow icon={User} label="Father Name" value={person.father_name} />
            <DetailRow icon={Cake} label="Age" value={person.age !== null && person.age !== undefined ? String(person.age) : undefined} />
            <DetailRow icon={Home} label="House Name" value={person.house_name} />
            <DetailRow icon={MapPin} label="Area" value={person.area} />
            <div className="grid grid-cols-2 gap-4">
              <DetailRow icon={Hash} label="Ward No" value={person.ward_no} />
              <DetailRow icon={Hash} label="Booth No" value={person.booth_no} />
            </div>
            <DetailRow icon={Phone} label="Phone" value={person.phone} />
            
            {person.notes && (
              <div className="pt-2 border-t mt-2">
                <span className="text-sm text-muted-foreground block mb-1">Notes</span>
                <p className="text-base whitespace-pre-wrap">{person.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3">
          <Button 
            size="lg" 
            className={`w-full text-lg h-14 font-semibold shadow-md transition-all active:scale-[0.98] ${
              person.is_marked 
                ? "bg-status-unmarked hover:bg-status-unmarked/90 text-white" 
                : "bg-status-marked hover:bg-status-marked/90 text-white"
            }`}
            onClick={() => toggleMutation.mutate()}
            disabled={toggleMutation.isPending}
            data-testid="button-toggle-mark"
          >
            {person.is_marked ? (
              <>
                <XCircle className="w-5 h-5 mr-2" /> UNMARK
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5 mr-2" /> MARK
              </>
            )}
          </Button>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" size="lg" className="h-12" onClick={() => setLocation(`/edit/${id}`)} data-testid="button-edit">
              <Edit2 className="w-4 h-4 mr-2" /> Edit
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="lg" className="h-12 text-destructive hover:bg-destructive/10 border-destructive/20" data-testid="button-delete">
                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete {person.name} from the database.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => deleteMutation.mutate()} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" data-testid="button-confirm-delete">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function DetailRow({ icon: Icon, label, value }: { icon: any, label: string, value?: string | null | number }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="flex items-start gap-3">
      <Icon className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
      <div>
        <span className="text-sm text-muted-foreground block">{label}</span>
        <span className="font-medium text-lg">{value}</span>
      </div>
    </div>
  );
}

"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Vote, UserPlus, Trash2, Ban, ArrowBigUp, ArrowBigDown, Loader2, Award } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { cn } from "@/lib/utils";

const Politics = () => {
  const { user } = useAuth();
  const [candidates, setCandidates] = useState<any[]>([]);
  const [userVote, setUserVote] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  
  const [formData, setFormData] = useState({ program: "" });

  const userRole = user?.user_metadata?.role;
  const isEtatMajor = userRole === 'Etat-Major';

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch candidates with their vote counts
      const { data: candData, error: candError } = await supabase
        .from('candidates')
        .select(`
          *,
          votes (vote_type)
        `)
        .order('created_at', { ascending: false });

      if (candError) throw candError;

      // Process candidates to calculate score
      const processed = (candData || []).map(c => {
        const score = c.votes.reduce((acc: number, v: any) => acc + v.vote_type, 0);
        return { ...c, score };
      }).sort((a, b) => b.score - a.score);

      setCandidates(processed);

      // 2. Fetch current user's votes
      if (user) {
        const { data: voteData } = await supabase
          .from('votes')
          .select('candidate_id, vote_type')
          .eq('voter_id', user.id);
        
        const voteMap: Record<string, number> = {};
        voteData?.forEach(v => {
          voteMap[v.candidate_id] = v.vote_type;
        });
        setUserVote(voteMap);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('candidates')
        .insert([{ 
          user_id: user.id, 
          full_name: user.user_metadata?.full_name || "Anonyme",
          program: formData.program 
        }]);

      if (error) throw error;
      showSuccess("Candidature enregistrée !");
      setOpen(false);
      fetchData();
    } catch (err: any) {
      showError("Vous avez déjà une candidature en cours.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (candidateId: string, type: number) => {
    if (!user) return;
    
    // If clicking the same vote type, remove it
    if (userVote[candidateId] === type) {
      await supabase.from('votes').delete().eq('voter_id', user.id).eq('candidate_id', candidateId);
    } else {
      // Upsert vote
      await supabase.from('votes').upsert({
        voter_id: user.id,
        candidate_id: candidateId,
        vote_type: type
      }, { onConflict: 'voter_id,candidate_id' });
    }
    fetchData();
  };

  const handleAdminAction = async (id: string, action: 'delete' | 'toggle_eligibility', currentStatus?: boolean) => {
    try {
      if (action === 'delete') {
        if (!confirm("Supprimer définitivement cette candidature ?")) return;
        await supabase.from('candidates').delete().eq('id', id);
        showSuccess("Candidature supprimée");
      } else {
        await supabase.from('candidates').update({ is_eligible: !currentStatus }).eq('id', id);
        showSuccess(currentStatus ? "Candidat rendu inéligible" : "Candidat réhabilité");
      }
      fetchData();
    } catch (err) {
      showError("Erreur lors de l'action");
    }
  };

  const isAlreadyCandidate = candidates.some(c => c.user_id === user?.id);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center">
            <Vote className="mr-2 text-primary" /> Élections AfterWorld
          </h2>
          <p className="text-sm text-muted-foreground">Présentez-vous ou votez pour le futur Chef d'État</p>
        </div>
        {!isAlreadyCandidate && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <UserPlus className="mr-2 h-4 w-4" /> Se présenter
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-white/10">
              <DialogHeader>
                <DialogTitle>Déposer votre candidature</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleApply} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Votre Programme / Vision</label>
                  <Textarea 
                    placeholder="Décrivez vos intentions pour la conférence..." 
                    className="min-h-[150px] bg-background/50 border-white/10"
                    value={formData.program}
                    onChange={(e) => setFormData({ program: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Lancer ma campagne
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>
      ) : candidates.length === 0 ? (
        <Card className="bg-white/[0.02] border-white/5 border-dashed p-12 text-center">
          <Award className="mx-auto h-12 w-12 text-muted-foreground/20 mb-4" />
          <h3 className="text-lg font-medium">Aucun candidat</h3>
          <p className="text-muted-foreground">Soyez le premier à vous présenter pour diriger AfterWorld.</p>
        </Card>
      ) : (
        <div className="grid gap-6">
          {candidates.map((cand, index) => (
            <Card key={cand.id} className={cn(
              "bg-white/[0.02] border-white/5 transition-all relative overflow-hidden",
              !cand.is_eligible && "opacity-50 grayscale"
            )}>
              {index === 0 && cand.is_eligible && (
                <div className="absolute top-0 right-0 bg-primary/20 text-primary px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-bl-lg">
                  Favori
                </div>
              )}
              <CardContent className="pt-6 flex items-start space-x-6">
                {/* Vote Controls */}
                <div className="flex flex-col items-center space-y-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={cn("h-10 w-10", userVote[cand.id] === 1 ? "text-primary bg-primary/10" : "text-muted-foreground")}
                    onClick={() => handleVote(cand.id, 1)}
                    disabled={!cand.is_eligible}
                  >
                    <ArrowBigUp size={24} />
                  </Button>
                  <span className="font-bold text-lg">{cand.score}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={cn("h-10 w-10", userVote[cand.id] === -1 ? "text-red-500 bg-red-500/10" : "text-muted-foreground")}
                    onClick={() => handleVote(cand.id, -1)}
                    disabled={!cand.is_eligible}
                  >
                    <ArrowBigDown size={24} />
                  </Button>
                </div>

                {/* Candidate Info */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold flex items-center">
                        {cand.full_name}
                        {!cand.is_eligible && <Badge variant="destructive" className="ml-2">Inéligible</Badge>}
                      </h3>
                      <p className="text-xs text-muted-foreground uppercase tracking-widest">Candidat au poste de Chef d'État</p>
                    </div>
                    
                    {isEtatMajor && (
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="border-white/10"
                          onClick={() => handleAdminAction(cand.id, 'toggle_eligibility', cand.is_eligible)}
                        >
                          <Ban className="mr-2 h-4 w-4" /> {cand.is_eligible ? "Rendre inéligible" : "Réhabiliter"}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-red-400 hover:bg-red-400/10"
                          onClick={() => handleAdminAction(cand.id, 'delete')}
                        >
                          <Trash2 size={18} />
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="bg-white/[0.03] p-4 rounded-xl border border-white/5">
                    <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap italic">
                      "{cand.program}"
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Politics;
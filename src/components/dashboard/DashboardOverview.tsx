"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  FileText, 
  ChevronRight, 
  Loader2, 
  Building2,
  Clock,
  Megaphone,
  Trash2,
  Vote
} from "lucide-react";
import { cn } from "@/lib/utils";
import PublicationForm from "./PublicationForm";
import { showSuccess, showError } from "@/utils/toast";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DashboardOverviewProps {
  profile: any;
  onNavigate: (tab: string) => void;
}

const DashboardOverview = ({ profile, onNavigate }: DashboardOverviewProps) => {
  const [indices, setIndices] = useState<any[]>([]);
  const [latestPubs, setLatestPubs] = useState<any[]>([]);
  const [messagesML, setMessagesML] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: indicesData } = await supabase.from('civilization_indices').select('*');
      setIndices(indicesData || []);

      const { data: pubsData } = await supabase
        .from('publications')
        .select('*')
        .neq('category', 'Message')
        .order('created_at', { ascending: false })
        .limit(5);
      setLatestPubs(pubsData || []);

      const { data: mlData } = await supabase
        .from('publications')
        .select('*')
        .eq('category', 'Message')
        .order('created_at', { ascending: false });
      setMessagesML(mlData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteMessage = async (id: string) => {
    if (!confirm("Supprimer ce message ?")) return;
    setIsDeleting(id);
    try {
      const { error } = await supabase.from('publications').delete().eq('id', id);
      if (error) throw error;
      showSuccess("Message supprimé");
      fetchData();
    } catch (err: any) {
      showError("Erreur : " + err.message);
    } finally {
      setIsDeleting(null);
    }
  };

  const calculateGlobalScore = () => {
    if (indices.length === 0) return 0;
    let standardWeightedSum = 0;
    let standardCoefSum = 0;
    let economicModifier = 0;
    indices.forEach(idx => {
      if (idx.name === "Croissance économique") economicModifier += (idx.value * idx.coefficient);
      else { standardWeightedSum += (idx.value * idx.coefficient); standardCoefSum += idx.coefficient; }
    });
    const baseScore = standardCoefSum > 0 ? (standardWeightedSum / standardCoefSum) : 0;
    return Math.max(0, Math.min(100, Math.round(baseScore + economicModifier)));
  };

  const globalScore = calculateGlobalScore();
  const isEtatMajor = profile?.role === 'Etat-Major';

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-2">
        <h1 className="text-3xl font-bold tracking-tight mb-1">Bonjour, {profile?.full_name?.split(' ')[0]}</h1>
        <p className="text-muted-foreground text-sm">État actuel de la conférence AfterWorld.</p>
      </div>

      {/* 1. Indicateur Global */}
      <Card className="bg-gradient-to-br from-primary/20 to-transparent border-primary/20 cursor-pointer hover:bg-primary/5 transition-all group" onClick={() => onNavigate("indices")}>
        <CardContent className="pt-8 pb-8 flex flex-col items-center text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><TrendingUp size={100} /></div>
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-primary mb-2">Indice de Développement Global</span>
          <div className="text-6xl font-black tracking-tighter mb-4">{globalScore}<span className="text-2xl text-muted-foreground ml-1">%</span></div>
          <div className="w-full max-w-md h-2 bg-white/5 rounded-full overflow-hidden mb-4">
            <div className="h-full bg-primary transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(59,130,246,0.5)]" style={{ width: `${globalScore}%` }} />
          </div>
          <p className="text-xs text-muted-foreground flex items-center group-hover:text-white transition-colors">Voir le détail des indices <ChevronRight size={12} className="ml-1" /></p>
        </CardContent>
      </Card>

      {/* 2. Messages et Bulletin (Côte à côte) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Colonne Messages */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-primary flex items-center">
              <Megaphone className="mr-2 h-4 w-4" /> Messages État-Major
            </h3>
            {isEtatMajor && (
              <PublicationForm onSuccess={fetchData} userRole={profile.role} />
            )}
          </div>
          
          <Card className="bg-white/[0.02] border-white/5 overflow-hidden">
            <ScrollArea className="h-[400px] w-full p-4">
              <div className="grid gap-3 pr-4">
                {messagesML.length === 0 ? (
                  <p className="italic text-sm text-muted-foreground text-center py-8">Aucun message récent.</p>
                ) : (
                  messagesML.map((ml) => (
                    <Card key={ml.id} className="bg-primary/5 border-primary/20 border-l-4 border-l-primary group relative">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-bold text-primary text-sm">{ml.title}</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] text-muted-foreground uppercase">
                              {new Date(ml.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isEtatMajor && (
                              <button 
                                onClick={() => handleDeleteMessage(ml.id)}
                                disabled={isDeleting === ml.id}
                                className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-300"
                              >
                                {isDeleting === ml.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-white/90 leading-relaxed whitespace-pre-wrap">{ml.content}</p>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </Card>
        </div>

        {/* Colonne Bulletin */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center">
              <FileText className="mr-2 h-4 w-4" /> Bulletin Officiel
            </h3>
            <button onClick={() => onNavigate("bulletin")} className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center">Tout voir <ChevronRight size={12} className="ml-1" /></button>
          </div>
          <div className="grid gap-3">
            {latestPubs.length === 0 ? (
              <p className="text-sm text-muted-foreground italic py-4">Aucune publication officielle.</p>
            ) : (
              latestPubs.map((pub) => (
                <Card key={pub.id} className="bg-white/[0.02] border-white/5 hover:bg-white/[0.04] transition-colors cursor-pointer" onClick={() => onNavigate("bulletin")}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={cn("p-2 rounded-lg", pub.category === 'Loi' ? "bg-red-500/10 text-red-400" : "bg-blue-500/10 text-blue-400")}><FileText size={18} /></div>
                      <div>
                        <p className="font-medium text-sm line-clamp-1">{pub.title}</p>
                        <div className="flex items-center space-x-3 text-[10px] text-muted-foreground uppercase tracking-wider">
                          <span className="flex items-center"><Building2 size={10} className="mr-1" /> {pub.provenance || 'Officiel'}</span>
                          <span className="flex items-center"><Clock size={10} className="mr-1" /> {new Date(pub.created_at).toLocaleDateString('fr-FR')}</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-muted-foreground" />
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
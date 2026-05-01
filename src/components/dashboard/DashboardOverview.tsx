"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  FileText, 
  ChevronRight, 
  Loader2, 
  Building2,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardOverviewProps {
  profile: any;
  onNavigate: (tab: string) => void;
}

const DashboardOverview = ({ profile, onNavigate }: DashboardOverviewProps) => {
  const [indices, setIndices] = useState<any[]>([]);
  const [latestPubs, setLatestPubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Récupérer les indices pour le score global
        const { data: indicesData } = await supabase
          .from('civilization_indices')
          .select('*');
        setIndices(indicesData || []);

        // 2. Récupérer les 3 dernières publications
        const { data: pubsData } = await supabase
          .from('publications')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(3);
        setLatestPubs(pubsData || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const calculateGlobalScore = () => {
    if (indices.length === 0) return 0;
    
    let standardWeightedSum = 0;
    let standardCoefSum = 0;
    let economicModifier = 0;

    indices.forEach(idx => {
      if (idx.name === "Croissance économique") {
        economicModifier += (idx.value * idx.coefficient);
      } else {
        standardWeightedSum += (idx.value * idx.coefficient);
        standardCoefSum += idx.coefficient;
      }
    });

    const baseScore = standardCoefSum > 0 ? (standardWeightedSum / standardCoefSum) : 0;
    const finalScore = Math.round(baseScore + economicModifier);
    return Math.max(0, Math.min(100, finalScore));
  };

  const globalScore = calculateGlobalScore();

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Bonjour, {profile?.full_name?.split(' ')[0]}</h1>
        <p className="text-muted-foreground">Voici l'état actuel de la conférence AfterWorld.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Score de Civilisation */}
        <Card 
          className="lg:col-span-2 bg-gradient-to-br from-primary/20 to-transparent border-primary/20 cursor-pointer hover:bg-primary/5 transition-all group"
          onClick={() => onNavigate("indices")}
        >
          <CardContent className="pt-8 pb-8 flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <TrendingUp size={100} />
            </div>
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-primary mb-2">Indice de Développement Global</span>
            <div className="text-6xl font-black tracking-tighter mb-4">
              {globalScore}<span className="text-2xl text-muted-foreground ml-1">%</span>
            </div>
            <div className="w-full max-w-md h-2 bg-white/5 rounded-full overflow-hidden mb-4">
              <div 
                className="h-full bg-primary transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                style={{ width: `${globalScore}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground flex items-center group-hover:text-white transition-colors">
              Voir le détail des indices <ChevronRight size={12} className="ml-1" />
            </p>
          </CardContent>
        </Card>

        {/* Solde Rapide */}
        <Card 
          className="bg-white/[0.02] border-white/5 cursor-pointer hover:bg-white/[0.04] transition-all flex flex-col justify-center items-center text-center p-6"
          onClick={() => onNavigate("bank")}
        >
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground mb-4">Votre Fortune</span>
          <div className="text-4xl font-bold text-white mb-1">{profile?.balance || 0}</div>
          <div className="text-[10px] text-primary font-bold uppercase tracking-widest mb-4">AfterCoins</div>
          <Badge variant="outline" className="border-primary/20 text-primary bg-primary/5">
            {profile?.role}
          </Badge>
        </Card>
      </div>

      {/* Dernières Publications (ML) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center">
            <FileText className="mr-2 h-5 w-5 text-primary" /> Dernières Mises en Ligne
          </h3>
          <button 
            onClick={() => onNavigate("bulletin")}
            className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center"
          >
            Tout voir <ChevronRight size={12} className="ml-1" />
          </button>
        </div>

        <div className="grid gap-4">
          {latestPubs.length === 0 ? (
            <p className="text-sm text-muted-foreground italic py-4">Aucune publication récente.</p>
          ) : (
            latestPubs.map((pub) => (
              <Card 
                key={pub.id} 
                className="bg-white/[0.02] border-white/5 hover:bg-white/[0.04] transition-colors cursor-pointer"
                onClick={() => onNavigate("bulletin")}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={cn(
                      "p-2 rounded-lg",
                      pub.category === 'Loi' ? "bg-red-500/10 text-red-400" : "bg-blue-500/10 text-blue-400"
                    )}>
                      <FileText size={18} />
                    </div>
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
  );
};

export default DashboardOverview;
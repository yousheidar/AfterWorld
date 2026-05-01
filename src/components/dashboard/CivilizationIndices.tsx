"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Trash2, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { showSuccess, showError } from "@/utils/toast";
import IndexForm from "./IndexForm";
import EditIndexDialog from "./EditIndexDialog";
import { cn } from "@/lib/utils";

const CivilizationIndices = () => {
  const { user } = useAuth();
  const [indices, setIndices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  const fetchIndices = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('civilization_indices')
      .select('*')
      .order('name');
    
    if (error) {
      showError("Erreur lors du chargement des indices");
    } else {
      setIndices(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchIndices();
    if (user) {
      const getRole = async () => {
        const { data } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        if (data) setUserRole(data.role);
      };
      getRole();
    }
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cet indice ?")) return;
    const { error } = await supabase.from('civilization_indices').delete().eq('id', id);
    if (error) showError("Erreur de suppression");
    else {
      showSuccess("Indice supprimé");
      fetchIndices();
    }
  };

  const isEtatMajor = userRole === 'Etat-Major';

  const calculateGlobalScore = () => {
    if (indices.length === 0) return 0;
    
    let standardWeightedSum = 0;
    let standardCoefSum = 0;
    let economicModifier = 0;
    let hasEconomic = false;

    indices.forEach(idx => {
      if (idx.name === "Croissance économique") {
        // On stocke la valeur de croissance (ex: 20 pour +20%)
        economicModifier = idx.value;
        hasEconomic = true;
      } else {
        standardWeightedSum += (idx.value * idx.coefficient);
        standardCoefSum += idx.coefficient;
      }
    });

    const baseScore = standardCoefSum > 0 ? (standardWeightedSum / standardCoefSum) : 0;
    
    // Calcul proportionnel : le score de base est multiplié par (1 + croissance%)
    // Exemple : base 50 et croissance +20% -> 50 * 1.2 = 60
    // Exemple : base 80 et croissance -10% -> 80 * 0.9 = 72
    let finalScore = baseScore;
    if (hasEconomic) {
      finalScore = baseScore * (1 + (economicModifier / 100));
    }

    return Math.max(0, Math.min(100, Math.round(finalScore)));
  };

  const globalScore = calculateGlobalScore();

  const getGaugeColor = (value: number, isEconomic: boolean) => {
    if (isEconomic) {
      if (value < 0) return "bg-red-500";
      if (value === 0) return "bg-gray-500";
      return "bg-emerald-500";
    }
    if (value < 30) return "bg-red-500";
    if (value < 60) return "bg-yellow-500";
    return "bg-emerald-500";
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Indices de Civilisation</h2>
          <p className="text-sm text-muted-foreground">État global de la société AfterWorld</p>
        </div>
        {isEtatMajor && <IndexForm onSuccess={fetchIndices} />}
      </div>

      <Card className="bg-gradient-to-br from-primary/20 to-transparent border-primary/20 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <TrendingUp size={120} />
        </div>
        <CardContent className="pt-8 pb-8 flex flex-col items-center text-center">
          <span className="text-sm font-medium uppercase tracking-[0.2em] text-primary mb-2">Développement global de la civilisation</span>
          <div className="text-7xl font-black tracking-tighter mb-4">
            {globalScore}<span className="text-3xl text-muted-foreground ml-1">%</span>
          </div>
          <div className="w-full max-w-md h-3 bg-white/5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(59,130,246,0.5)]"
              style={{ width: `${globalScore}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" /></div>
      ) : (
        <div className="grid gap-6">
          {indices.map((idx) => {
            const isEconomic = idx.name === "Croissance économique";
            
            return (
              <Card key={idx.id} className="bg-white/[0.02] border-white/5 hover:bg-white/[0.04] transition-all">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div>
                        <h3 className="font-semibold">{idx.name}</h3>
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                          {isEconomic 
                            ? "Croissance attendue pour les 5 prochaines années" 
                            : `Coefficient d'impact : ${idx.coefficient}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-right mr-2">
                        <span className={cn(
                          "text-2xl font-bold", 
                          isEconomic && idx.value > 0 ? "text-emerald-400" : isEconomic && idx.value < 0 ? "text-red-400" : ""
                        )}>
                          {idx.value > 0 && isEconomic ? "+" : ""}{idx.value}%
                        </span>
                        <p className="text-[10px] text-muted-foreground uppercase">Variation</p>
                      </div>
                      {isEtatMajor && (
                        <div className="flex items-center border-l border-white/10 pl-2 space-x-1">
                          <EditIndexDialog index={idx} onSuccess={fetchIndices} />
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-red-400 hover:bg-red-400/10"
                            onClick={() => handleDelete(idx.id)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
                    {isEconomic ? (
                      <>
                        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/20 z-10" />
                        <div 
                          className={cn("absolute h-full transition-all duration-1000", getGaugeColor(idx.value, true))}
                          style={{ 
                            left: idx.value >= 0 ? "50%" : `${50 + (idx.value / 2)}%`,
                            width: `${Math.abs(idx.value) / 2}%`
                          }}
                        />
                      </>
                    ) : (
                      <div 
                        className={cn("h-full transition-all duration-1000", getGaugeColor(idx.value, false))}
                        style={{ width: `${idx.value}%` }}
                      />
                    )}
                  </div>
                  {isEconomic && (
                    <div className="flex justify-between mt-1 text-[8px] text-muted-foreground uppercase tracking-tighter">
                      <span>Récession (-100%)</span>
                      <span>Neutre (0%)</span>
                      <span>Expansion (+100%)</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CivilizationIndices;
"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Trash2, TrendingUp, ChevronUp, ChevronDown, BarChart3 } from "lucide-react";
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
    try {
      // On tente d'abord avec le tri par order_index
      let { data, error } = await supabase
        .from('civilization_indices')
        .select('*')
        .order('order_index', { ascending: true });
      
      // Si ça échoue (ex: colonne manquante), on replie sur le nom
      if (error) {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('civilization_indices')
          .select('*')
          .order('name', { ascending: true });
        
        if (fallbackError) throw fallbackError;
        data = fallbackData;
      }
      
      setIndices(data || []);
    } catch (err) {
      console.error("Erreur indices:", err);
      showError("Erreur lors du chargement des indices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIndices();
    if (user) {
      setUserRole(user.user_metadata?.role || 'Participant');
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

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const newIndices = [...indices];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newIndices.length) return;

    const temp = newIndices[index];
    newIndices[index] = newIndices[targetIndex];
    newIndices[targetIndex] = temp;
    setIndices(newIndices);

    try {
      const updates = newIndices.map((idx, i) => ({
        id: idx.id,
        name: idx.name,
        value: idx.value,
        unit: idx.unit,
        coefficient: idx.coefficient,
        order_index: i
      }));

      const { error } = await supabase
        .from('civilization_indices')
        .upsert(updates);

      if (error) throw error;
    } catch (err) {
      showError("Erreur lors du changement d'ordre");
      fetchIndices();
    }
  };

  const isEtatMajor = userRole === 'Etat-Major';

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
      ) : indices.length === 0 ? (
        <Card className="bg-white/[0.02] border-white/5 border-dashed p-12 text-center">
          <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground/20 mb-4" />
          <h3 className="text-lg font-medium">Aucun indice configuré</h3>
          <p className="text-muted-foreground">Les indices de civilisation apparaîtront ici une fois créés par l'État-Major.</p>
        </Card>
      ) : (
        <div className="grid gap-6">
          {indices.map((idx, i) => {
            const isEconomic = idx.name === "Croissance économique";
            
            return (
              <Card key={idx.id} className="bg-white/[0.02] border-white/5 hover:bg-white/[0.04] transition-all">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {isEtatMajor && (
                        <div className="flex flex-col space-y-1 mr-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 text-muted-foreground hover:text-white"
                            onClick={() => handleMove(i, 'up')}
                            disabled={i === 0}
                          >
                            <ChevronUp size={14} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 text-muted-foreground hover:text-white"
                            onClick={() => handleMove(i, 'down')}
                            disabled={i === indices.length - 1}
                          >
                            <ChevronDown size={14} />
                          </Button>
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold">{idx.name}</h3>
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                          {isEconomic ? "Modificateur de score" : `Coef: ${idx.coefficient}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-right mr-2">
                        <span className={cn("text-2xl font-bold", isEconomic && idx.value > 0 ? "text-emerald-400" : isEconomic && idx.value < 0 ? "text-red-400" : "")}>
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
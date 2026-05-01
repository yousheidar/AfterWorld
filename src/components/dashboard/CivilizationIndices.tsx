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
    let totalWeightedValue = 0;
    let totalCoefficients = 0;

    indices.forEach(idx => {
      totalWeightedValue += idx.value * idx.coefficient;
      totalCoefficients += idx.coefficient;
    });

    return totalCoefficients > 0 ? Math.round(totalWeightedValue / totalCoefficients) : 0;
  };

  const globalScore = calculateGlobalScore();

  const getGaugeColor = (value: number, unit: string) => {
    const normalized = unit === 'points' ? (value + 100) / 2 : value;
    if (normalized < 30) return "bg-red-500";
    if (normalized < 60) return "bg-yellow-500";
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
              style={{ width: `${Math.max(0, Math.min(100, globalScore))}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" /></div>
      ) : (
        <div className="grid gap-6">
          {indices.map((idx) => (
            <Card key={idx.id} className="bg-white/[0.02] border-white/5 hover:bg-white/[0.04] transition-all">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div>
                      <h3 className="font-semibold">{idx.name}</h3>
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Coef: {idx.coefficient}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-right mr-2">
                      <span className="text-2xl font-bold">
                        {idx.value}{idx.unit === 'percentage' ? '%' : ''}
                      </span>
                      <p className="text-[10px] text-muted-foreground uppercase">{idx.unit === 'percentage' ? 'Pourcentage' : 'Points'}</p>
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
                  <div 
                    className={`h-full transition-all duration-1000 ${getGaugeColor(idx.value, idx.unit)}`}
                    style={{ 
                      width: idx.unit === 'percentage' 
                        ? `${idx.value}%` 
                        : `${(idx.value + 100) / 2}%` 
                    }}
                  />
                  {idx.unit === 'points' && (
                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/20" />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CivilizationIndices;
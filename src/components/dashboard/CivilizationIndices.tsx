"use client";

import React from 'react';
import { Card } from "@/components/ui/card";
import { BarChart3, Lock } from "lucide-react";

const CivilizationIndices = () => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-2xl font-bold tracking-tight">Indices de Civilisation</h2>
      
      <Card className="h-[400px] bg-white/[0.02] border-white/5 border-dashed flex flex-col items-center justify-center text-center p-8">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <BarChart3 size={32} className="text-primary" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Données en cours de traitement</h3>
        <p className="text-muted-foreground max-w-md">
          Les indices de civilisation sont calculés en temps réel selon les décisions prises durant la conférence. Ce module sera activé prochainement.
        </p>
        <div className="mt-6 flex items-center text-xs text-primary/60 font-mono uppercase tracking-widest">
          <Lock size={12} className="mr-2" /> Accès restreint - Phase d'initialisation
        </div>
      </Card>
    </div>
  );
};

export default CivilizationIndices;
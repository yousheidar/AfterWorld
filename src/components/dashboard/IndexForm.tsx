"use client";

import React, { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Loader2 } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";

interface IndexFormProps {
  onSuccess: () => void;
}

const IndexForm = ({ onSuccess }: IndexFormProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    value: "50",
    unit: "percentage",
    coefficient: "1"
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase
        .from('civilization_indices')
        .insert([
          {
            name: formData.name,
            value: parseInt(formData.value),
            unit: formData.unit,
            coefficient: parseFloat(formData.coefficient)
          }
        ]);

      if (error) throw error;

      showSuccess("Indice ajouté");
      setFormData({ name: "", value: "50", unit: "percentage", coefficient: "1" });
      setOpen(false);
      onSuccess();
    } catch (err: any) {
      showError("Erreur : " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" /> Nouvel Indice
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-white/10">
        <DialogHeader>
          <DialogTitle>Ajouter un indice de civilisation</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nom de l'indice</label>
            <Input 
              placeholder="Ex: Stabilité Sociale" 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Unité</label>
              <Select value={formData.unit} onValueChange={(v) => setFormData({...formData, unit: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Pourcentage (%)</SelectItem>
                  <SelectItem value="points">Points (-100 à 100)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Valeur initiale</label>
              <Input 
                type="number" 
                min={formData.unit === 'percentage' ? 0 : -100}
                max={100}
                value={formData.value}
                onChange={(e) => setFormData({...formData, value: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Coefficient d'importance</label>
            <Input 
              type="number" 
              step="0.1"
              min="0.1"
              value={formData.coefficient}
              onChange={(e) => setFormData({...formData, coefficient: e.target.value})}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Créer l'indice
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default IndexForm;
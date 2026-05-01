"use client";

import React, { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Edit2, Loader2 } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";

interface EditIndexDialogProps {
  index: any;
  onSuccess: () => void;
}

const EditIndexDialog = ({ index, onSuccess }: EditIndexDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [value, setValue] = useState(index.value.toString());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase
        .from('civilization_indices')
        .update({ value: parseInt(value) })
        .eq('id', index.id);

      if (error) throw error;

      showSuccess(`Indice "${index.name}" mis à jour`);
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
        <Button variant="ghost" size="icon" className="text-primary hover:bg-primary/10">
          <Edit2 size={16} />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-white/10 sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Modifier l'indice : {index.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Nouvelle valeur ({index.unit === 'percentage' ? '0 à 100 %' : '-100 à 100 pts'})
            </label>
            <Input 
              type="number" 
              min={index.unit === 'percentage' ? 0 : -100}
              max={100}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              required
              autoFocus
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Enregistrer les modifications
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditIndexDialog;
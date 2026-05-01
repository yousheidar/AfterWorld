"use client";

import React, { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Loader2 } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";

interface PublicationFormProps {
  onSuccess: () => void;
}

const PublicationForm = ({ onSuccess }: PublicationFormProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    category: "Décision",
    content: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('publications')
        .insert([
          {
            title: formData.title,
            category: formData.category,
            content: formData.content,
            excerpt: formData.content.substring(0, 150) + "...",
            author_id: user.id
          }
        ]);

      if (error) throw error;

      showSuccess("Publication enregistrée avec succès");
      setFormData({ title: "", category: "Décision", content: "" });
      setOpen(false);
      onSuccess();
    } catch (err: any) {
      showError("Erreur lors de la publication : " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" /> Nouvelle Publication
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px] bg-card border-white/10">
        <DialogHeader>
          <DialogTitle>Publier au Bulletin Officiel</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Titre</label>
            <Input 
              placeholder="Titre de la publication" 
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              required
              className="bg-background/50 border-white/10"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Libellé</label>
            <Select 
              value={formData.category} 
              onValueChange={(v) => setFormData({...formData, category: v})}
            >
              <SelectTrigger className="bg-background/50 border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Loi">Loi</SelectItem>
                <SelectItem value="Décision">Décision</SelectItem>
                <SelectItem value="Décret">Décret</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Contenu</label>
            <Textarea 
              placeholder="Détails de la publication..." 
              className="min-h-[200px] bg-background/50 border-white/10"
              value={formData.content}
              onChange={(e) => setFormData({...formData, content: e.target.value})}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Publier officiellement
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PublicationForm;
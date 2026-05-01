"use client";

import React, { useState, useEffect } from 'react';
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
  userRole: string | null;
}

const PublicationForm = ({ onSuccess, userRole }: PublicationFormProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    category: "Loi",
    content: ""
  });

  // Ajuster la catégorie par défaut si le rôle change
  useEffect(() => {
    if (userRole === 'Présidence') {
      setFormData(prev => ({ ...prev, category: "Loi" }));
    } else {
      setFormData(prev => ({ ...prev, category: "Décision" }));
    }
  }, [userRole]);

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
      setFormData({ 
        title: "", 
        category: userRole === 'Présidence' ? "Loi" : "Décision", 
        content: "" 
      });
      setOpen(false);
      onSuccess();
    } catch (err: any) {
      showError("Erreur lors de la publication : " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const categories = userRole === 'Présidence' 
    ? [{ value: "Loi", label: "Loi" }]
    : [
        { value: "Loi", label: "Loi" },
        { value: "Décision", label: "Décision" },
        { value: "Décret", label: "Décret" }
      ];

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
              disabled={userRole === 'Présidence'}
            >
              <SelectTrigger className="bg-background/50 border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {userRole === 'Présidence' && (
              <p className="text-[10px] text-muted-foreground italic">Votre rôle est restreint à la publication de Lois.</p>
            )}
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
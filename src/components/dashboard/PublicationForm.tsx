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

  useEffect(() => {
    if (userRole === 'Présidence') {
      setFormData(prev => ({ ...prev, category: "Loi" }));
    } else if (userRole === 'Etat-Major') {
      setFormData(prev => ({ ...prev, category: "Message" }));
    } else {
      setFormData(prev => ({ ...prev, category: "Décision" }));
    }
  }, [userRole]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    try {
      const role = user.user_metadata?.role || 'Participant';
      const committee = user.user_metadata?.committee || (role === 'Etat-Major' ? 'État-Major' : 'Comité Inconnu');

      const { error } = await supabase
        .from('publications')
        .insert([
          {
            title: formData.title,
            category: formData.category,
            content: formData.content,
            excerpt: formData.content.substring(0, 150) + (formData.content.length > 150 ? "..." : ""),
            author_id: user.id,
            provenance: committee
          }
        ]);

      if (error) throw error;

      showSuccess(formData.category === 'Message' ? "Message ML envoyé" : "Publication enregistrée");
      setFormData({ 
        title: "", 
        category: userRole === 'Etat-Major' ? "Message" : (userRole === 'Présidence' ? "Loi" : "Décision"), 
        content: "" 
      });
      setOpen(false);
      onSuccess();
    } catch (err: any) {
      showError("Erreur : " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const categories = userRole === 'Présidence' 
    ? [{ value: "Loi", label: "Loi" }]
    : userRole === 'Etat-Major'
    ? [
        { value: "Message", label: "Message ML (Flash)" },
        { value: "Loi", label: "Loi" },
        { value: "Décision", label: "Décision" },
        { value: "Décret", label: "Décret" }
      ]
    : [
        { value: "Loi", label: "Loi" },
        { value: "Décision", label: "Décision" },
        { value: "Décret", label: "Décret" }
      ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" /> Nouvelle Publication / ML
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px] bg-card border-white/10">
        <DialogHeader>
          <DialogTitle>Publier au Bulletin ou Envoyer un ML</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Titre / Objet</label>
            <Input 
              placeholder={formData.category === 'Message' ? "Objet du message flash" : "Titre de la publication"} 
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              required
              className="bg-background/50 border-white/10"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Type de publication</label>
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
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Contenu</label>
            <Textarea 
              placeholder={formData.category === 'Message' ? "Écrivez votre message à la conférence..." : "Détails de la publication..."} 
              className="min-h-[200px] bg-background/50 border-white/10"
              value={formData.content}
              onChange={(e) => setFormData({...formData, content: e.target.value})}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {formData.category === 'Message' ? "Envoyer le Message ML" : "Publier officiellement"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PublicationForm;
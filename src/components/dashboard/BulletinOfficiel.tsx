"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  ChevronRight, 
  FileText, 
  Loader2, 
  User, 
  Building2, 
  Clock,
  Trash2
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import PublicationForm from "./PublicationForm";
import { showSuccess, showError } from "@/utils/toast";

const BulletinOfficiel = () => {
  const { user } = useAuth();
  const [publications, setPublications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [selectedPub, setSelectedPub] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const fetchPublications = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('publications')
        .select(`
          *,
          profiles:author_id (full_name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) {
        const { data: simpleData } = await supabase
          .from('publications')
          .select('*')
          .order('created_at', { ascending: false });
        setPublications(simpleData || []);
      } else {
        setPublications(data || []);
      }
    } catch (err) {
      console.error("Erreur inattendue:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublications();

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

  const handleDelete = async (e: React.MouseEvent, pubId: string) => {
    e.stopPropagation(); // Empêche l'ouverture de la modal
    if (!confirm("Voulez-vous vraiment supprimer cette publication ?")) return;

    setIsDeleting(pubId);
    try {
      const { error } = await supabase
        .from('publications')
        .delete()
        .eq('id', pubId);

      if (error) throw error;

      showSuccess("Publication supprimée");
      setPublications(publications.filter(p => p.id !== pubId));
    } catch (err: any) {
      showError("Erreur lors de la suppression : " + err.message);
    } finally {
      setIsDeleting(null);
    }
  };

  const canPublish = userRole === 'Etat-Major' || userRole === 'Présidence';
  
  const canDelete = (pub: any) => {
    if (userRole === 'Etat-Major') return true;
    if (userRole === 'Présidence' && pub.author_id === user?.id) return true;
    return false;
  };

  const getCategoryStyle = (cat: string) => {
    switch (cat) {
      case 'Loi': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'Décret': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      default: return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    }
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      date: date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      time: date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    };
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Bulletin Officiel</h2>
          <p className="text-sm text-muted-foreground">Archives et décisions de la conférence</p>
        </div>
        {canPublish && <PublicationForm onSuccess={fetchPublications} userRole={userRole} />}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
          <p>Chargement des archives...</p>
        </div>
      ) : publications.length === 0 ? (
        <Card className="bg-white/[0.02] border-white/5 border-dashed p-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground/20 mb-4" />
          <h3 className="text-lg font-medium">Aucune publication</h3>
          <p className="text-muted-foreground">Le bulletin officiel est actuellement vide.</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {publications.map((pub) => {
            const { date, time } = formatDateTime(pub.created_at);
            const showDelete = canDelete(pub);
            
            return (
              <Card 
                key={pub.id} 
                className="bg-white/[0.02] border-white/5 hover:bg-white/[0.04] transition-colors cursor-pointer group relative"
                onClick={() => setSelectedPub(pub)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex gap-2">
                      <Badge className={getCategoryStyle(pub.category)}>
                        {pub.category}
                      </Badge>
                      {pub.provenance && (
                        <Badge variant="outline" className="border-white/10 text-muted-foreground">
                          <Building2 size={10} className="mr-1" /> {pub.provenance}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                        <span className="flex items-center"><Calendar size={12} className="mr-1" /> {date}</span>
                        <span className="flex items-center"><Clock size={12} className="mr-1" /> {time}</span>
                      </div>
                      {showDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-400/10 z-10"
                          onClick={(e) => handleDelete(e, pub.id)}
                          disabled={isDeleting === pub.id}
                        >
                          {isDeleting === pub.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        </Button>
                      )}
                    </div>
                  </div>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors flex items-center justify-between">
                    {pub.title}
                    <ChevronRight size={18} className="text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4 whitespace-pre-wrap">
                    {pub.excerpt || pub.content}
                  </p>
                  <div className="flex items-center text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium">
                    <User size={10} className="mr-1" /> Émis par : {pub.profiles?.full_name || "Utilisateur AfterWorld"}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!selectedPub} onOpenChange={(open) => !open && setSelectedPub(null)}>
        <DialogContent className="sm:max-w-[700px] bg-[#0A0A0A] border-white/10 text-white max-h-[90vh] overflow-y-auto">
          {selectedPub && (
            <>
              <DialogHeader className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge className={getCategoryStyle(selectedPub.category)}>
                    {selectedPub.category}
                  </Badge>
                  {selectedPub.provenance && (
                    <Badge variant="outline" className="border-white/10 text-muted-foreground">
                      <Building2 size={12} className="mr-1" /> {selectedPub.provenance}
                    </Badge>
                  )}
                </div>
                <DialogTitle className="text-3xl font-bold leading-tight text-primary">
                  {selectedPub.title}
                </DialogTitle>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground border-b border-white/5 pb-4">
                  <div className="flex items-center"><Calendar size={14} className="mr-2" /> {formatDateTime(selectedPub.created_at).date}</div>
                  <div className="flex items-center"><Clock size={14} className="mr-2" /> {formatDateTime(selectedPub.created_at).time}</div>
                  <div className="flex items-center"><User size={14} className="mr-2" /> {selectedPub.profiles?.full_name || "Utilisateur AfterWorld"}</div>
                </div>
              </DialogHeader>
              <div className="mt-6 text-lg leading-relaxed text-gray-300 whitespace-pre-wrap font-light">
                {selectedPub.content}
              </div>
              <div className="mt-12 pt-6 border-t border-white/5 flex justify-end">
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/40">
                  Document Officiel AfterWorld Conference — ID: {selectedPub.id.substring(0, 8)}
                </p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BulletinOfficiel;
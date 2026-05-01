"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, ChevronRight, FileText, Loader2, User, Building2 } from "lucide-react";
import PublicationForm from "./PublicationForm";

const BulletinOfficiel = () => {
  const { user } = useAuth();
  const [publications, setPublications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  const fetchPublications = async () => {
    setLoading(true);
    try {
      // On tente de récupérer avec la jointure profil
      const { data, error } = await supabase
        .from('publications')
        .select(`
          *,
          profiles:author_id (full_name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Erreur fetch:", error);
        // Repli si la jointure échoue
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

  const canPublish = userRole === 'Etat-Major' || userRole === 'Présidence';

  const getCategoryStyle = (cat: string) => {
    switch (cat) {
      case 'Loi': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'Décret': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      default: return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    }
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
          {publications.map((pub) => (
            <Card key={pub.id} className="bg-white/[0.02] border-white/5 hover:bg-white/[0.04] transition-colors cursor-pointer group">
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
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Calendar size={12} className="mr-1" />
                    {new Date(pub.created_at).toLocaleDateString('fr-FR')}
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
          ))}
        </div>
      )}
    </div>
  );
};

export default BulletinOfficiel;
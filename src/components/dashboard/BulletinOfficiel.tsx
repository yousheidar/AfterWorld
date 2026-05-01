"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Calendar, ChevronRight } from "lucide-react";

const BulletinOfficiel = () => {
  // Données fictives pour l'instant
  const publications = [
    {
      id: 1,
      title: "Décret N°2024-01 : Protocole de sécurité AfterWorld",
      date: "15 Mars 2024",
      category: "Décision",
      excerpt: "Mise en place des nouvelles directives concernant l'accès aux zones restreintes du secteur 7..."
    },
    {
      id: 2,
      title: "Analyse de l'évolution technologique post-effondrement",
      date: "12 Mars 2024",
      category: "Article",
      excerpt: "Une étude approfondie sur la résilience des infrastructures numériques dans les zones de transition."
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Bulletin Officiel</h2>
        <Badge variant="outline" className="border-primary/30 text-primary">Lecture seule</Badge>
      </div>

      <div className="grid gap-4">
        {publications.map((pub) => (
          <Card key={pub.id} className="bg-white/[0.02] border-white/5 hover:bg-white/[0.04] transition-colors cursor-pointer group">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between mb-2">
                <Badge className={pub.category === 'Décision' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-purple-500/10 text-purple-400 border-purple-500/20'}>
                  {pub.category}
                </Badge>
                <div className="flex items-center text-xs text-muted-foreground">
                  <Calendar size={12} className="mr-1" />
                  {pub.date}
                </div>
              </div>
              <CardTitle className="text-lg group-hover:text-primary transition-colors flex items-center justify-between">
                {pub.title}
                <ChevronRight size={18} className="text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {pub.excerpt}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default BulletinOfficiel;
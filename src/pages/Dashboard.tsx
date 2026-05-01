"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from "@/components/AuthProvider";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, User, Shield, Star, LayoutDashboard } from "lucide-react";

const Dashboard = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{ role: string; full_name: string } | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/");
    }

    if (user) {
      const fetchProfile = async () => {
        const { data } = await supabase
          .from('profiles')
          .select('role, full_name')
          .eq('id', user.id)
          .single();
        setProfile(data);
      };
      fetchProfile();
    }
  }, [user, loading, navigate]);

  if (loading || !user) return null;

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'Présidence': return <Star className="text-yellow-500" />;
      case 'Etat-Major': return <Shield className="text-blue-500" />;
      default: return <User className="text-gray-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation Bar */}
      <nav className="border-b border-white/10 bg-card/30 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <LayoutDashboard size={18} className="text-white" />
            </div>
            <span className="font-bold tracking-tight text-xl">AfterWorld</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex flex-col items-end mr-2">
              <span className="text-sm font-medium">{user.email}</span>
              <span className="text-xs text-muted-foreground">{profile?.role || 'Chargement...'}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={() => signOut()} className="hover:bg-destructive/10 hover:text-destructive transition-colors">
              <LogOut size={20} />
            </Button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          <header>
            <h1 className="text-3xl font-bold tracking-tight">Bienvenue dans l'AfterWorld</h1>
            <p className="text-muted-foreground mt-2">Voici votre espace personnel pour la conférence.</p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-card/50 border-white/10 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Votre Statut</CardTitle>
                {profile && getRoleIcon(profile.role)}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{profile?.role || '...'}</div>
                <p className="text-xs text-muted-foreground mt-1">Accès vérifié</p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-white/10 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sessions</CardTitle>
                <LayoutDashboard className="text-primary" size={18} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12</div>
                <p className="text-xs text-muted-foreground mt-1">Conférences prévues</p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-white/10 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Messages</CardTitle>
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3</div>
                <p className="text-xs text-muted-foreground mt-1">Nouvelles notifications</p>
              </CardContent>
            </Card>
          </div>

          {/* Section spécifique au rôle */}
          <div className="mt-12 p-8 rounded-2xl border border-white/10 bg-gradient-to-br from-primary/10 to-transparent">
            <h2 className="text-xl font-semibold mb-4">Actualités de la Conférence</h2>
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all cursor-pointer">
                  <h3 className="font-medium">Ouverture des portes - Jour {i}</h3>
                  <p className="text-sm text-muted-foreground mt-1">Les détails de l'organisation pour le jour {i} sont maintenant disponibles.</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
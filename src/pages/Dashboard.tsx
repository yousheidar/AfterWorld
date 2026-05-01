"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from "@/components/AuthProvider";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { 
  LogOut, 
  User, 
  Shield, 
  Star, 
  LayoutDashboard, 
  Calendar, 
  MessageSquare, 
  Settings,
  Bell,
  Menu,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

const Dashboard = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{ role: string; full_name: string } | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
        
        if (data) setProfile(data);
      };
      fetchProfile();
    }
  }, [user, loading, navigate]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    </div>
  );
  
  if (!user) return null;

  const navItems = [
    { icon: LayoutDashboard, label: "Vue d'ensemble", active: true },
    { icon: Calendar, label: "Programme", active: false },
    { icon: MessageSquare, label: "Messagerie", active: false },
    { icon: Settings, label: "Paramètres", active: false },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white flex overflow-hidden">
      {/* Sidebar Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-[#0A0A0A] border-r border-white/5 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center space-x-3 mb-12">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <LayoutDashboard size={22} className="text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">AfterWorld</span>
          </div>

          <nav className="flex-1 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.label}
                className={cn(
                  "w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                  item.active 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:bg-white/5 hover:text-white"
                )}
              >
                <item.icon size={20} />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="pt-6 border-t border-white/5">
            <button 
              onClick={() => signOut()}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-400/10 transition-all duration-200"
            >
              <LogOut size={20} />
              <span className="font-medium">Déconnexion</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-6 lg:px-10 bg-[#050505]/50 backdrop-blur-xl sticky top-0 z-30">
          <button 
            className="lg:hidden p-2 hover:bg-white/5 rounded-lg"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>

          <div className="flex-1 lg:flex-none" />

          <div className="flex items-center space-x-6">
            <button className="relative p-2 text-muted-foreground hover:text-white transition-colors">
              <Bell size={22} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-[#050505]" />
            </button>
            
            <div className="flex items-center space-x-4 pl-6 border-l border-white/5">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold">{profile?.full_name || 'Utilisateur'}</p>
                <p className="text-xs text-muted-foreground">{profile?.role || 'Participant'}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center">
                <User size={20} className="text-primary" />
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-10">
          <div className="max-w-5xl mx-auto">
            <div className="mb-10">
              <h1 className="text-3xl font-bold tracking-tight mb-2">Tableau de bord</h1>
              <p className="text-muted-foreground">Bienvenue dans votre espace AfterWorld personnalisé.</p>
            </div>

            {/* Placeholders pour le futur contenu */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-40 rounded-2xl border border-white/5 bg-white/[0.02] animate-pulse" />
              ))}
            </div>
            
            <div className="mt-8 h-96 rounded-2xl border border-white/5 bg-white/[0.02] flex items-center justify-center text-muted-foreground italic">
              Espace prêt pour vos nouveaux modules...
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
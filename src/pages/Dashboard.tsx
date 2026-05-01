"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from "@/components/AuthProvider";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { 
  LogOut, 
  User, 
  LayoutDashboard, 
  FileText, 
  BarChart3,
  Menu,
  Settings,
  MessageSquare,
  Vote
} from "lucide-react";
import { cn } from "@/lib/utils";
import BulletinOfficiel from "@/components/dashboard/BulletinOfficiel";
import CivilizationIndices from "@/components/dashboard/CivilizationIndices";
import DashboardOverview from "@/components/dashboard/DashboardOverview";
import PrivateMessaging from "@/components/dashboard/PrivateMessaging";
import Politics from "@/components/dashboard/Politics";

const Dashboard = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{ role: string; full_name: string; balance: number } | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/");
    }

    if (user) {
      const fetchProfile = async () => {
        const { data } = await supabase
          .from('profiles')
          .select('role, full_name, balance')
          .eq('id', user.id)
          .single();
        
        if (data) {
          setProfile(data);
        } else {
          setProfile({
            role: user.user_metadata?.role || 'Participant',
            full_name: user.user_metadata?.full_name || 'Utilisateur AfterWorld',
            balance: 500
          });
        }
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

  const userRole = profile?.role || user.user_metadata?.role;
  const canAccessPrivate = userRole === 'Etat-Major' || userRole === 'Présidence';
  const isEtatMajor = userRole === 'Etat-Major';

  const navItems = [
    { id: "overview", icon: LayoutDashboard, label: "Vue d'ensemble" },
    { id: "bulletin", icon: FileText, label: "Bulletin officiel" },
    { id: "indices", icon: BarChart3, label: "Indices de civilisation" },
    { id: "politics", icon: Vote, label: "Politique" },
    ...(canAccessPrivate ? [{ id: "messages", icon: MessageSquare, label: "Canal Sécurisé" }] : []),
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "bulletin": return <BulletinOfficiel />;
      case "indices": return <CivilizationIndices />;
      case "politics": return <Politics />;
      case "messages": return <PrivateMessaging />;
      case "overview":
      default:
        return <DashboardOverview profile={profile} onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex overflow-hidden">
      {isSidebarOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />}
      <aside className={cn("fixed inset-y-0 left-0 z-50 w-72 bg-[#0A0A0A] border-r border-white/5 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0", isSidebarOpen ? "translate-x-0" : "-translate-x-full")}>
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center space-x-3 mb-12"><span className="font-bold text-xl tracking-tight text-primary">AfterWorld</span></div>
          <nav className="flex-1 space-y-2">
            {navItems.map((item) => (
              <button key={item.id} onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }} className={cn("w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group", activeTab === item.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-white/5 hover:text-white")}>
                <item.icon size={20} /><span className="font-medium">{item.label}</span>
              </button>
            ))}
            {isEtatMajor && (
              <button onClick={() => navigate("/admin")} className="w-full flex items-center space-x-3 px-4 py-3 mt-8 rounded-xl border border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 transition-all duration-200">
                <Settings size={20} /><span className="font-medium">Panel Admin</span>
              </button>
            )}
          </nav>
          <div className="pt-6 border-t border-white/5">
            <button onClick={() => signOut()} className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-400/10 transition-all duration-200">
              <LogOut size={20} /><span className="font-medium">Déconnexion</span>
            </button>
          </div>
        </div>
      </aside>
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-6 lg:px-10 bg-[#050505]/50 backdrop-blur-xl sticky top-0 z-30">
          <button className="lg:hidden p-2 hover:bg-white/5 rounded-lg" onClick={() => setIsSidebarOpen(true)}><Menu size={24} /></button>
          <div className="flex-1 lg:flex-none" />
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-4 pl-6 border-l border-white/5">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold">{profile?.full_name || 'Utilisateur'}</p>
                <p className="text-xs text-muted-foreground">{profile?.role || 'Participant'}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center"><User size={20} className="text-primary" /></div>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-6 lg:p-10"><div className="max-w-5xl mx-auto">{renderContent()}</div></div>
      </main>
    </div>
  );
};

export default Dashboard;
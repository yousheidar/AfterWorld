"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/cell";
import { 
  UserPlus, Lock, Loader2, RefreshCw, Eye, EyeOff, Trash2, ShieldCheck
} from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";

const UserManagement = () => {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showPasswords, setShowPasswords] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(sessionStorage.getItem("admin_unlocked") === "true");
  const [adminPass, setAdminPass] = useState("");
  
  const [formData, setFormData] = useState({ 
    email: "", 
    password: "", 
    fullName: "", 
    role: "Participant", 
    committee: "" 
  });

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('profiles').select('*');
      if (error) throw error;
      const sorted = [...(data || [])].sort((a, b) => {
        const order: Record<string, number> = { "Etat-Major": 1, "Présidence": 2, "Participant": 3 };
        return (order[a.role] || 4) - (order[b.role] || 4);
      });
      setProfiles(sorted);
    } catch (err) {
      showError("Erreur de lecture.");
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (isUnlocked) {
      fetchProfiles();
    }
  }, [isUnlocked]);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPass === "MUN-X26") {
      setIsUnlocked(true);
      sessionStorage.setItem("admin_unlocked", "true");
      showSuccess("Accès autorisé");
    } else {
      showError("Code incorrect");
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const { error } = await supabase.functions.invoke('create-user', { body: formData });
      if (error) throw error;
      showSuccess(`Compte créé pour ${formData.fullName}`);
      setFormData({ email: "", password: "", fullName: "", role: "Participant", committee: "" });
      fetchProfiles();
    } catch (err: any) { showError(err.message); } finally { setCreating(false); }
  };

  const handleDeleteUser = async (userId: string, fullName: string) => {
    if (!confirm(`Supprimer le compte de ${fullName} ?`)) return;
    setDeletingId(userId);
    try {
      const { error } = await supabase.functions.invoke('delete-user', { body: { userId } });
      if (error) throw error;
      showSuccess("Compte supprimé");
      fetchProfiles();
    } catch (err: any) { showError(err.message); } finally { setDeletingId(null); }
  };

  if (!isUnlocked) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-6 animate-in fade-in duration-500">
        <div className="p-4 bg-primary/10 rounded-full">
          <Lock className="text-primary h-12 w-12" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">Zone Sécurisée</h2>
          <p className="text-muted-foreground">Veuillez saisir le code d'accès État-Major</p>
        </div>
        <form onSubmit={handleUnlock} className="flex flex-col w-full max-w-xs gap-3">
          <Input 
            type="password" 
            placeholder="Code secret" 
            value={adminPass}
            onChange={(e) => setAdminPass(e.target.value)}
            className="text-center bg-white/5 border-white/10"
            autoFocus
          />
          <Button type="submit" className="w-full">Déverrouiller</Button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheck className="text-primary h-6 w-6" />
          <h2 className="text-2xl font-bold tracking-tight">Gestion des Comptes</h2>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowPasswords(!showPasswords)}>
            {showPasswords ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {showPasswords ? "Masquer" : "Afficher MDP"}
          </Button>
          <Button variant="outline" size="sm" onClick={fetchProfiles} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            Actualiser
          </Button>
        </div>
      </div>

      <Card className="border-white/10 bg-white/[0.02]">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center">
            <UserPlus className="mr-2 h-4 w-4 text-primary" /> Nouveau Compte
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-muted-foreground">Nom</label>
              <Input placeholder="Nom" value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} required className="h-9 text-sm bg-background/50" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-muted-foreground">Email</label>
              <Input type="email" placeholder="Email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required className="h-9 text-sm bg-background/50" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-muted-foreground">MDP</label>
              <Input type="text" placeholder="MDP" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required className="h-9 text-sm bg-background/50" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-muted-foreground">Rôle</label>
              <Select value={formData.role} onValueChange={(v) => setFormData({...formData, role: v})}>
                <SelectTrigger className="h-9 text-sm bg-background/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Participant">Participant</SelectItem>
                  <SelectItem value="Présidence">Présidence</SelectItem>
                  <SelectItem value="Etat-Major">Etat-Major</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-muted-foreground">Comité</label>
              <Input placeholder="Comité" value={formData.committee} onChange={(e) => setFormData({...formData, committee: e.target.value})} required={formData.role !== 'Participant'} className="h-9 text-sm bg-background/50" />
            </div>
            <Button type="submit" disabled={creating} className="h-9">
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Créer"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-white/[0.02] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] uppercase tracking-wider text-muted-foreground border-b border-white/5">
              <tr>
                <th className="px-6 py-4 font-medium">Utilisateur</th>
                <th className="px-6 py-4 font-medium">Rôle / Comité</th>
                <th className="px-6 py-4 font-medium">Accès</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-10 text-center text-muted-foreground">Chargement des profils...</td></tr>
              ) : profiles.map((p) => (
                <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 font-medium">{p.full_name}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full w-fit mb-1",
                        p.role === 'Etat-Major' ? "bg-primary/20 text-primary" : 
                        p.role === 'Présidence' ? "bg-purple-500/20 text-purple-400" : "bg-white/10 text-white"
                      )}>
                        {p.role}
                      </span>
                      <span className="text-xs text-muted-foreground">{p.committee || '-'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <code className="bg-black/40 px-2 py-1 rounded text-[11px] font-mono">
                      {showPasswords ? (p.password_plain || "Inconnu") : "••••••••"}
                    </code>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-red-400 hover:bg-red-400/10" 
                      onClick={() => handleDeleteUser(p.id, p.full_name)} 
                      disabled={deletingId === p.id}
                    >
                      {deletingId === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 size={14} />}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default UserManagement;
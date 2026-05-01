"use client";

import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Shield, Star, User, Loader2, RefreshCw, Eye, EyeOff } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";

const AdminPanel = () => {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    role: "Participant"
  });

  useEffect(() => {
    if (sessionStorage.getItem("admin_access") !== "true") {
      navigate("/admin");
    }
    fetchProfiles();
  }, [navigate]);

  const fetchProfiles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*');
    
    if (error) {
      showError("Erreur lors du chargement des profils");
    } else {
      const sorted = [...(data || [])].sort((a, b) => {
        const order: Record<string, number> = { "Etat-Major": 1, "Présidence": 2, "Participant": 3 };
        return (order[a.role] || 4) - (order[b.role] || 4);
      });
      setProfiles(sorted);
    }
    setLoading(false);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: formData
      });

      if (error) throw error;
      
      showSuccess(`Compte créé pour ${formData.fullName}`);
      setFormData({ email: "", password: "", fullName: "", role: "Participant" });
      fetchProfiles();
    } catch (err: any) {
      showError("Erreur : " + err.message);
    } finally {
      setCreating(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'Etat-Major': return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50"><Shield size={12} className="mr-1" /> Etat-Major</Badge>;
      case 'Présidence': return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50"><Star size={12} className="mr-1" /> Présidence</Badge>;
      default: return <Badge variant="outline" className="text-muted-foreground"><User size={12} className="mr-1" /> Participant</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 space-y-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Gestion des Comptes</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowPasswords(!showPasswords)}>
              {showPasswords ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              {showPasswords ? "Masquer MDP" : "Afficher MDP"}
            </Button>
            <Button variant="outline" size="sm" onClick={fetchProfiles} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Actualiser
            </Button>
          </div>
        </div>

        <Card className="border-white/10 bg-card/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <UserPlus className="mr-2 h-5 w-5 text-primary" /> Créer un nouveau compte
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Nom Complet</label>
                <Input 
                  placeholder="Nom" 
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Email</label>
                <Input 
                  type="email" 
                  placeholder="Email" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Mot de passe</label>
                <Input 
                  type="text" 
                  placeholder="Mot de passe" 
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Rôle</label>
                <Select value={formData.role} onValueChange={(v) => setFormData({...formData, role: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Participant">Participant</SelectItem>
                    <SelectItem value="Présidence">Présidence</SelectItem>
                    <SelectItem value="Etat-Major">Etat-Major</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={creating} className="w-full">
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Créer"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-card/30">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-white/10">
                <TableHead>Nom</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Mot de passe</TableHead>
                <TableHead className="text-right">ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Chargement...</TableCell></TableRow>
              ) : profiles.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Aucun compte trouvé</TableCell></TableRow>
              ) : (
                profiles.map((p) => (
                  <TableRow key={p.id} className="border-white/5 hover:bg-white/5">
                    <TableCell className="font-medium">{p.full_name}</TableCell>
                    <TableCell>{getRoleBadge(p.role)}</TableCell>
                    <TableCell>
                      <code className="bg-black/30 px-2 py-1 rounded text-xs">
                        {showPasswords ? (p.password_plain || "Inconnu") : "••••••••"}
                      </code>
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground font-mono">{p.id.split('-')[0]}...</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
};

export default AdminPanel;
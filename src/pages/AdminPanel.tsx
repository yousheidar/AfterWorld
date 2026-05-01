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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  UserPlus, Shield, Star, User, Loader2, RefreshCw, Eye, EyeOff, Trash2, Building2, Lock, AlertTriangle, Coins, PlusCircle, MinusCircle
} from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const AdminPanel = () => {
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showPasswords, setShowPasswords] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({ email: "", password: "", fullName: "", role: "Participant", committee: "" });

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
    const checkAuth = async () => {
      const auth = sessionStorage.getItem("admin_access") === "true";
      if (!auth) { navigate("/admin"); return; }
      setIsAuthorized(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserRole(user.user_metadata?.role || 'Participant');
      fetchProfiles();
    };
    checkAuth();
  }, [navigate]);

  const handleAdjustBalance = async (userId: string, amount: number, reason: string) => {
    try {
      const { error } = await supabase.rpc('admin_adjust_balance', {
        target_user_id: userId,
        amount_change: amount,
        reason: reason
      });
      if (error) throw error;
      showSuccess("Solde mis à jour");
      fetchProfiles();
    } catch (err: any) { showError(err.message); }
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

  if (isAuthorized === null) return null;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 space-y-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg"><Lock className="text-primary h-6 w-6" /></div>
            <h1 className="text-3xl font-bold tracking-tight">Gestion des Comptes</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowPasswords(!showPasswords)}>{showPasswords ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />} {showPasswords ? "Masquer MDP" : "Afficher MDP"}</Button>
            <Button variant="outline" size="sm" onClick={fetchProfiles} disabled={loading}><RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Actualiser</Button>
          </div>
        </div>

        {currentUserRole !== 'Etat-Major' && (
          <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 text-red-400">
            <AlertTriangle className="h-4 w-4" /><AlertTitle>Accès Restreint</AlertTitle><AlertDescription>Seul l'État-Major peut gérer les comptes et les soldes.</AlertDescription>
          </Alert>
        )}

        <Card className="border-white/10 bg-card/30 backdrop-blur-sm">
          <CardHeader><CardTitle className="text-lg flex items-center"><UserPlus className="mr-2 h-5 w-5 text-primary" /> Créer un nouveau compte</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
              <div className="space-y-2"><label className="text-xs font-medium text-muted-foreground">Nom Complet</label><Input placeholder="Nom" value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} required /></div>
              <div className="space-y-2"><label className="text-xs font-medium text-muted-foreground">Email</label><Input type="email" placeholder="Email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required /></div>
              <div className="space-y-2"><label className="text-xs font-medium text-muted-foreground">Mot de passe</label><Input type="text" placeholder="Mot de passe" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required /></div>
              <div className="space-y-2"><label className="text-xs font-medium text-muted-foreground">Rôle</label><Select value={formData.role} onValueChange={(v) => setFormData({...formData, role: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Participant">Participant</SelectItem><SelectItem value="Présidence">Présidence</SelectItem><SelectItem value="Etat-Major">Etat-Major</SelectItem></SelectContent></Select></div>
              <div className="space-y-2"><label className="text-xs font-medium text-muted-foreground">Comité</label><Input placeholder="Nom du comité" value={formData.committee} onChange={(e) => setFormData({...formData, committee: e.target.value})} required={formData.role !== 'Participant'} /></div>
              <Button type="submit" disabled={creating} className="w-full">{creating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Créer"}</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-card/30">
          <Table>
            <TableHeader><TableRow className="hover:bg-transparent border-white/10"><TableHead>Nom</TableHead><TableHead>Rôle</TableHead><TableHead>Solde</TableHead><TableHead>Mot de passe</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {loading ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Chargement...</TableCell></TableRow> : profiles.map((p) => (
                <TableRow key={p.id} className="border-white/5 hover:bg-white/5">
                  <TableCell className="font-medium">{p.full_name}</TableCell>
                  <TableCell>{p.role}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Coins size={14} className="text-primary" />
                      <span className="font-bold">{p.balance || 0}</span>
                      {currentUserRole === 'Etat-Major' && (
                        <Dialog>
                          <DialogTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6 text-primary"><PlusCircle size={14} /></Button></DialogTrigger>
                          <DialogContent className="bg-card border-white/10">
                            <DialogHeader><DialogTitle>Ajuster le solde de {p.full_name}</DialogTitle></DialogHeader>
                            <div className="space-y-4 pt-4">
                              <Input id="adj-amount" type="number" placeholder="Montant (ex: 100 ou -100)" />
                              <Input id="adj-reason" placeholder="Raison de l'ajustement" />
                              <Button className="w-full" onClick={() => {
                                const amt = parseInt((document.getElementById('adj-amount') as HTMLInputElement).value);
                                const reason = (document.getElementById('adj-reason') as HTMLInputElement).value;
                                handleAdjustBalance(p.id, amt, reason);
                              }}>Appliquer</Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </TableCell>
                  <TableCell><code className="bg-black/30 px-2 py-1 rounded text-xs">{showPasswords ? (p.password_plain || "Inconnu") : "••••••••"}</code></TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="text-red-400 hover:bg-red-400/10" onClick={() => handleDeleteUser(p.id, p.full_name)} disabled={deletingId === p.id}>
                      {deletingId === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 size={16} />}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
};

export default AdminPanel;
"use client";

import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, ArrowRight } from "lucide-react";
import { showError } from "@/utils/toast";

const AdminLogin = () => {
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "MUN-X26") {
      sessionStorage.setItem("admin_access", "true");
      navigate("/admin/panel");
    } else {
      showError("Mot de passe incorrect");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md border-white/10 bg-card/50 backdrop-blur-xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-4">
            <Lock className="text-primary" size={24} />
          </div>
          <CardTitle className="text-2xl">Accès Administration</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              type="password"
              placeholder="Code d'accès"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-background/50 border-white/10"
            />
            <Button type="submit" className="w-full">
              Entrer <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
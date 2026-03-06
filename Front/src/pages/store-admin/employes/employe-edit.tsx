import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react';
import api from '@/api/axios';

export default function EmployeEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    role: 'Commercial',
    password: '',
  });

  // 1. Fetch Data
  useEffect(() => {
    const fetchEmploye = async () => {
      try {
        const response = await api.get(`/employes/${id}`);
        const data = response.data;
        
        setFormData({
          nom: data.nom || '',
          prenom: data.prenom || '',
          email: data.email || '',
          telephone: data.telephone || '',
          role: data.role || 'Commercial',
          password: '', // Never prefill password
        });
      } catch (err: any) {
        console.error(err);
        setError("Impossible de charger les données de l'employé.");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchEmploye();
  }, [id]);

  // 2. Handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, role: value }));
  };

  // 3. Submit
  const handleSubmit = async () => {
    setError(null);

    // Validation Basic
    if (!formData.nom || !formData.prenom || !formData.email || !formData.telephone) {
      setError("Veuillez remplir tous les champs obligatoires (*)");
      return;
    }

    setSaving(true);

    // Prepare Payload
    const payload: any = {
      nom: formData.nom,
      prenom: formData.prenom,
      email: formData.email,
      telephone: formData.telephone,
      role: formData.role,
    };

    // Only add password if typed
    if (formData.password.trim()) {
      payload.motDePasse = formData.password;
    }

    try {
      await api.put(`/employes/${id}`, payload);
      navigate('/store-admin/employes');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || err.message || "Échec de la modification");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 lg:gap-7.5 max-w-4xl mx-auto p-6">
      
      {/* Header with Back Button */}
      <div className="flex items-center gap-4 mb-2">
        <Button variant="outline" size="icon" onClick={() => navigate('/store-admin/employes')}>
          <ArrowLeft size={18} />
        </Button>
        <div>
           <h2 className="text-2xl font-bold tracking-tight">Modifier un employé</h2>
           <p className="text-muted-foreground text-sm">Mettez à jour les informations et les droits d'accès.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm font-medium">
          {error}
        </div>
      )}

      <Card>
        <CardHeader className="border-b bg-gray-50/50">
          <div className="flex items-center justify-between">
            <CardTitle>Informations Personnelles</CardTitle>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold border border-blue-200">
               {formData.role}
            </span>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="space-y-2">
              <Label>Prénom <span className="text-red-500">*</span></Label>
              <Input 
                name="prenom" 
                value={formData.prenom} 
                onChange={handleChange} 
                placeholder="Ex: Sarah" 
              />
            </div>

            <div className="space-y-2">
              <Label>Nom <span className="text-red-500">*</span></Label>
              <Input 
                name="nom" 
                value={formData.nom} 
                onChange={handleChange} 
                placeholder="Ex: Dupont" 
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Email <span className="text-red-500">*</span></Label>
              <Input 
                name="email" 
                type="email" 
                value={formData.email} 
                onChange={handleChange} 
                placeholder="sarah.dupont@email.com" 
              />
            </div>

            <div className="space-y-2">
              <Label>Téléphone <span className="text-red-500">*</span></Label>
              <Input 
                name="telephone" 
                value={formData.telephone} 
                onChange={handleChange} 
                placeholder="+212..." 
              />
            </div>

            <div className="space-y-2">
              <Label>Rôle <span className="text-red-500">*</span></Label>
              <Select value={formData.role} onValueChange={handleSelectChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un rôle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Commercial">Commercial</SelectItem>
                  <SelectItem value="Developpeur">Développeur</SelectItem>
                  <SelectItem value="Admin">Administrateur</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Password Section */}
            <div className="space-y-2 md:col-span-2 pt-4 border-t mt-2">
               <Label>Mot de passe</Label>
               <span className="text-xs text-muted-foreground ml-2">(Laisser vide si inchangé)</span>
               <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Nouveau mot de passe..."
                    className="pr-10"
                    autoComplete="new-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={16} className="text-gray-500" /> : <Eye size={16} className="text-gray-500" />}
                  </Button>
               </div>
            </div>

          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-8 pt-4 border-t">
            <Button variant="outline" onClick={() => navigate('/store-admin/employes')}>
              Annuler
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enregistrer
            </Button>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
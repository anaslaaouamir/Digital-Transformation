import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
// IMPORT YOUR API INSTANCE HERE
import api from '@/api/axios'; // Adjust path if your file is named differently

const GeneralInfo = () => {

  // ... (I kept the list collapsed for readability, it remains unchanged)
  const PAYS_LIST = [
    "Afghanistan", "Afrique du Sud", "Albanie", "Algérie", "Allemagne", "Maroc", "France", "Espagne", "États-Unis", "Canada", "..." 
    // ... Imagine the rest of your countries here
  ];

  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Store the list of commercials from API
  const [commercials, setCommercials] = useState<any[]>([]);

  // 2. Fetch data when page loads (UPDATED TO AXIOS)
  useEffect(() => {
    const fetchCommercials = async () => {
      try {
        // Axios handles the base URL and parsing automatically
        const response = await api.get('/employes?role=Commercial');
        setCommercials(response.data);
      } catch (err) {
        console.error("Erreur chargement commerciaux", err);
      }
    };
    fetchCommercials();
  }, []);

  // 1. STATE
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    siteWeb: '',
    telephone: '',
    mobile: '',
    adresse: '',
    ville: '',
    codePostal: '',
    pays: 'Maroc',
    departementCanton: '',
    ice: '',
    rc: '',
    ifFisc: '',
    cnss: '',
    capital: '',
    devise: 'MAD',
    conditionReglement: '',
    tags: '',
    etat: 'ouvert',
    estClient: false,
    estProspect: false,
    estFournisseur: false,
    typeEntiteLegale: '',
    commercialAssigne: '',
  });

  // 2. HANDLER: Typing
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // 3. HANDLER: Selects
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 4. API SUBMIT (UPDATED TO AXIOS)
  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    // 1. Validation des champs de base obligatoires
    if (!formData.nom || !formData.ville || !formData.pays || !formData.etat) {
      setError("Merci de remplir les champs obligatoires : Nom, Ville, Pays et État.");
      setLoading(false);
      return;
    }

    // 2. Validation Nature
    if (!formData.estClient && !formData.estProspect && !formData.estFournisseur) {
      setError("Veuillez sélectionner le type de tiers (Client, Prospect ou Fournisseur).");
      setLoading(false);
      return;
    }

    // 3. Validation Contact
    if (!formData.email && !formData.telephone && !formData.mobile) {
      setError("Vous devez saisir au moins un moyen de contact (Email, Téléphone ou Mobile).");
      setLoading(false);
      return;
    }

    // CLEAN DATA & FORMAT FOR BACKEND
    const payload = {
      nom: formData.nom,
      email: formData.email,
      siteWeb: formData.siteWeb,
      telephone: formData.telephone,
      mobile: formData.mobile,
      adresse: formData.adresse,
      ville: formData.ville,
      codePostal: formData.codePostal,
      pays: formData.pays,
      departementCanton: formData.departementCanton,
      ice: formData.ice,
      rc: formData.rc,
      ifFisc: formData.ifFisc,
      cnss: formData.cnss,
      etat: formData.etat,
      estClient: formData.estClient,
      estProspect: formData.estProspect,
      estFournisseur: formData.estFournisseur,
      typeEntiteLegale: formData.typeEntiteLegale,
      conditionReglement: formData.conditionReglement,
      
      // Handle Capital (Ensure it's a number or null)
      capital: formData.capital ? Number(formData.capital) : null,

      // Handle Commercial Logic
      commercialAssigne: formData.commercialAssigne 
        ? { id: Number(formData.commercialAssigne) } 
        : null
    };

    try {
      // AXIOS CALL:
      // 1. No need to stringify payload
      // 2. No need to set Headers manually
      // 3. Base URL is automatic
      await api.post('/tiers', payload);

      // If we reach here, it worked (Axios throws on error)
      navigate('/account/members/tiers'); 

    } catch (err: any) {
      // Axios error handling
      console.error(err);
      if (err.response && err.response.data) {
        // Backend sent a specific error message
        setError(err.response.data.error || err.response.data.message || "Erreur lors de la création");
      } else {
        // Network error or server down
        setError("Impossible de contacter le serveur (Vérifiez si le Backend est démarré)");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 lg:gap-7.5">
      
      {/* ERROR MESSAGE */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <strong className="font-bold">Erreur: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* SECTION 1: IDENTITÉ & RÔLES */}
      <Card className="min-w-full">
        <CardHeader>
          <CardTitle>Identité du Tiers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Logo */}
            <div className="md:col-span-2">
               <Label className="font-semibold text-gray-900 mb-2 block">Logo de la société</Label>
               <input type="file" className="file-input file-input-bordered w-full max-w-xs" accept="image/*" />
            </div>

            {/* Nom */}
            <div className="flex flex-col gap-2">
              <Label className="font-semibold text-gray-900">Nom de la société <span className="text-red-500">*</span></Label>
              <Input 
                 name="nom" 
                 value={formData.nom} 
                 onChange={handleChange} 
                 placeholder="Ex: Hexlab S.A.R.L" 
              />
            </div>

            {/* Etat */}
             <div className="flex flex-col gap-2">
              <Label className="font-semibold text-gray-900">État <span className="text-red-500">*</span></Label>
              <Select onValueChange={(val) => handleSelectChange('etat', val)} defaultValue="ouvert">
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ouvert">Ouvert</SelectItem>
                  <SelectItem value="ferme">Fermé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Code Client (Read Only) */}
            <div className="flex flex-col gap-2">
              <Label className="font-semibold text-gray-900">Code Client (Généré auto)</Label>
              <Input placeholder="CL-XXXX" disabled className="bg-gray-100 text-gray-500 cursor-not-allowed" />
            </div>

            {/* Code Fournisseur (Read Only) */}
            <div className="flex flex-col gap-2">
              <Label className="font-semibold text-gray-900">Code Fournisseur (Généré auto)</Label>
              <Input placeholder="FO-XXXX" disabled className="bg-gray-100 text-gray-500 cursor-not-allowed" />
            </div>

            {/* RÔLES (Checkboxes) */}
            <div className="md:col-span-2 p-4 border rounded-lg bg-gray-50">
               <Label className="font-semibold text-gray-900 mb-3 block">Nature du Tiers <span className="text-red-500">*</span></Label>
               <div className="flex flex-wrap gap-6">
                 <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="checkbox checkbox-sm checkbox-secondary rounded-md" 
                        name="estProspect" 
                        checked={formData.estProspect} 
                        onChange={handleChange} /> 
                    <span className="text-sm font-medium">Prospect</span>
                 </label>
                 <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="checkbox checkbox-sm checkbox-primary rounded-md" 
                        name="estClient" 
                        checked={formData.estClient} 
                        onChange={handleChange} /> 
                    <span className="text-sm font-medium">Client</span>
                 </label>
                 <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="checkbox checkbox-sm checkbox-primary rounded-md" 
                        name="estFournisseur" 
                        checked={formData.estFournisseur} 
                        onChange={handleChange} /> 
                    <span className="text-sm font-medium">Fournisseur</span>
                 </label>
               </div>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* SECTION 2: COORDONNÉES */}
      <Card className="min-w-full">
        <CardHeader>
          <CardTitle>Coordonnées</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            <div className="flex flex-col gap-2">
              <Label>Email <span className="text-red-500">*</span></Label>
              <Input type="email" placeholder="contact@hexlab.io" name="email" value={formData.email} onChange={handleChange} />
            </div>
            
            <div className="flex flex-col gap-2">
              <Label>Site Web</Label>
              <Input placeholder="www.site.com" name="siteWeb" value={formData.siteWeb} onChange={handleChange} />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Mobile <span className="text-red-500">*</span></Label>
              <Input placeholder="+212 6..." name="mobile" value={formData.mobile} onChange={handleChange} />
            </div>

            <div className="md:col-span-2 flex flex-col gap-2">
               <Label>Adresse Complète</Label>
               <textarea className="textarea textarea-bordered w-full" rows={2} name="adresse" value={formData.adresse} onChange={handleChange} placeholder="Numéro, Rue..."></textarea>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Ville <span className="text-red-500">*</span></Label>
              <Input name="ville" value={formData.ville} onChange={handleChange} />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Code Postal</Label>
              <Input name="codePostal" value={formData.codePostal} onChange={handleChange} />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Pays <span className="text-red-500">*</span></Label>
              <Select 
                onValueChange={(val) => handleSelectChange('pays', val)} 
                value={formData.pays}
              >
                <SelectTrigger>
                    <SelectValue placeholder="Pays" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {PAYS_LIST.map((pays) => (
                    <SelectItem key={pays} value={pays}>
                      {pays}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
               <Label>Département / Canton</Label>
               <Select onValueChange={(val) => handleSelectChange('departementCanton', val)}>
                <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="rabat">Rabat-Salé</SelectItem>
                  <SelectItem value="casablanca">Casablanca-Settat</SelectItem>
                  <SelectItem value="tanger">Tanger-Tétouan</SelectItem>
                </SelectContent>
              </Select>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* SECTION 3: DÉTAILS SOCIÉTÉ */}
      <Card className="min-w-full">
        <CardHeader>
          <CardTitle>Détails Juridiques & Fiscaux</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            <div className="flex flex-col gap-2">
              <Label>ICE</Label>
              <Input name="ice" value={formData.ice} onChange={handleChange} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>RC</Label>
              <Input name="rc" value={formData.rc} onChange={handleChange} />
            </div>

            <div className="flex flex-col gap-2">
               <Label>Identifiant Fiscal (IF)</Label>
               <Input name="ifFisc" value={formData.ifFisc} onChange={handleChange} />
            </div>

             <div className="flex flex-col gap-2">
               <Label>CNSS</Label>
               <Input name="cnss" value={formData.cnss} onChange={handleChange} />
            </div>

            <div className="flex flex-col gap-2">
               <Label>Forme Juridique</Label>
               <Select onValueChange={(val) => handleSelectChange('typeEntiteLegale', val)}>
                <SelectTrigger><SelectValue placeholder="Ex: SARL" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sarl">SARL</SelectItem>
                  <SelectItem value="sa">SA</SelectItem>
                  <SelectItem value="personne_physique">Personne Physique</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
               <Label>Capital (Dhs)</Label>
               <Input type="number" name="capital" value={formData.capital} onChange={handleChange} placeholder="10000.00" />
            </div>

          </div>
        </CardContent>
      </Card>

      {/* SECTION 4: FINANCIER & GESTION */}
      <Card className="min-w-full">
        <CardHeader>
          <CardTitle>Financier & Gestion</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
             <div className="flex flex-col gap-2">
               <Label>Devise</Label>
               <Select onValueChange={(val) => handleSelectChange('devise', val)} defaultValue="MAD">
                <SelectTrigger><SelectValue placeholder="Devise" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MAD">MAD (Dirham)</SelectItem>
                  <SelectItem value="EUR">EUR (Euro)</SelectItem>
                  <SelectItem value="USD">USD (Dollar)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Commercial - Loaded from API */}
            <div className="flex flex-col gap-2">
               <Label className="font-semibold text-blue-700">Commercial Assigné</Label>
               <Select onValueChange={(val) => handleSelectChange('commercialAssigne', val)}>
                <SelectTrigger>
                    <SelectValue placeholder="Choisir un commercial..." />
                </SelectTrigger>
                <SelectContent>
                  {commercials.map((comm) => (
                    <SelectItem key={comm.id} value={comm.id.toString()}>
                      {comm.nom} {comm.prenom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
               <Label>Conditions de règlement</Label>
               <Select onValueChange={(val) => handleSelectChange('conditionReglement', val)}>
                <SelectTrigger><SelectValue placeholder="Ex: 30 jours" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="comptant">Comptant</SelectItem>
                  <SelectItem value="30jours">30 Jours</SelectItem>
                  <SelectItem value="60jours">60 Jours</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
               <Label>Tags</Label>
               <Input placeholder="VIP, Mauvais Payeur, ..." name="tags" value={formData.tags} onChange={handleChange} />
            </div>

          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
         <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Enregistrement..." : "Enregistrer le Tiers"}
         </Button>
      </div>
    </div>
  );
};

export { GeneralInfo };
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import api from '@/api/axios'; // Import Axios instance

// Keep your existing PAYS_LIST here
const PAYS_LIST = [
  "Afghanistan", "Afrique du Sud", "Algérie", "Allemagne", "Maroc", "France", 
  // ... (Keep the rest of your list)
  "Zambie", "Zimbabwe"
];

const EditTiers = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [commercials, setCommercials] = useState<any[]>([]);

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
    codeClient: '',      
    codeFournisseur: ''  
  });

  // 1. Load Data (Commercials + Tiers)
  useEffect(() => {
    const loadData = async () => {
      try {
        // Parallel requests for efficiency
        const [commResponse, tiersResponse] = await Promise.all([
            api.get('/employes?role=Commercial'),
            id ? api.get(`/tiers/${id}`) : Promise.resolve(null)
        ]);

        if (commResponse) setCommercials(commResponse.data);

        if (tiersResponse) {
          const data = tiersResponse.data;
          
          // Map backend data to form state
          setFormData({
             ...data,
             siteWeb: data.siteWeb || '',
             telephone: data.telephone || '',
             mobile: data.mobile || '',
             adresse: data.adresse || '',
             ville: data.ville || '',
             codePostal: data.codePostal || '',
             departementCanton: data.departementCanton || '',
             ice: data.ice || '',
             rc: data.rc || '',
             ifFisc: data.ifFisc || '',
             cnss: data.cnss || '',
             capital: data.capital || '',
             tags: data.tags || '',
             // Handle nested object for Select component
             commercialAssigne: data.commercialAssigne ? data.commercialAssigne.id.toString() : '',
             codeClient: data.codeClient || '',
             codeFournisseur: data.codeFournisseur || ''
          });
        }
      } catch (err: any) {
        console.error("Erreur chargement", err);
        setError("Impossible de charger les données (Erreur serveur).");
      }
    };
    loadData();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 2. Submit Update
  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    // Validation
    if (!formData.nom || !formData.ville || !formData.pays || !formData.etat) {
      setError("Merci de remplir les champs obligatoires : Nom, Ville, Pays et État.");
      setLoading(false);
      return;
    }

    if (!formData.estClient && !formData.estProspect && !formData.estFournisseur) {
      setError("Veuillez sélectionner le type de tiers.");
      setLoading(false);
      return;
    }

    if (!formData.email && !formData.telephone && !formData.mobile) {
      setError("Vous devez saisir au moins un moyen de contact.");
      setLoading(false);
      return;
    }

    const payload = {
      ...formData,
      capital: formData.capital ? Number(formData.capital) : null,
      commercialAssigne: formData.commercialAssigne ? { id: Number(formData.commercialAssigne) } : null,
    };

    try {
      await api.put(`/tiers/${id}`, payload);
      navigate(`/account/members/tiers`); 
    } catch (err: any) {
      setError(err.response?.data?.error || "Erreur lors de la modification");
    } finally {
      setLoading(false);
    }
  };

  if (!id) return <div>ID manquant</div>;

  return (
    <div className="flex flex-col gap-5 lg:gap-7.5">
      <div className="mb-4">
        <h2 className="text-2xl font-bold">Modifier le Tiers</h2>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <strong className="font-bold">Erreur: </strong><span>{error}</span>
        </div>
      )}

      {/* SECTION 1: IDENTITÉ */}
      <Card className="min-w-full">
        <CardHeader><CardTitle>Identité du Tiers</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            <div className="md:col-span-2">
               <Label className="font-semibold text-gray-900 mb-2 block">Logo de la société</Label>
               <input type="file" className="file-input file-input-bordered w-full max-w-xs" accept="image/*" />
            </div>

            <div className="flex flex-col gap-2">
              <Label className="font-semibold text-gray-900">Nom de la société <span className="text-red-500">*</span></Label>
              <Input name="nom" value={formData.nom} onChange={handleChange} />
            </div>

             <div className="flex flex-col gap-2">
              <Label className="font-semibold text-gray-900">État <span className="text-red-500">*</span></Label>
              <Select onValueChange={(val) => handleSelectChange('etat', val)} value={formData.etat}>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ouvert">Ouvert</SelectItem>
                  <SelectItem value="ferme">Fermé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Read Only Codes */}
            <div className="flex flex-col gap-2">
              <Label className="font-semibold text-gray-900">Code Client</Label>
              <Input value={formData.codeClient || ''} disabled className="bg-gray-100 cursor-not-allowed" />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="font-semibold text-gray-900">Code Fournisseur</Label>
              <Input value={formData.codeFournisseur || ''} disabled className="bg-gray-100 cursor-not-allowed"/>
            </div>

            <div className="md:col-span-2 p-4 border rounded-lg bg-gray-50">
               <Label className="font-semibold text-gray-900 mb-3 block">Nature du Tiers <span className="text-red-500">*</span></Label>
               <div className="flex flex-wrap gap-6">
                 <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="checkbox checkbox-sm checkbox-secondary rounded-md" 
                        name="estProspect" checked={formData.estProspect} onChange={handleChange} /> 
                    <span className="text-sm font-medium">Prospect</span>
                 </label>
                 <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="checkbox checkbox-sm checkbox-primary rounded-md" 
                        name="estClient" checked={formData.estClient} onChange={handleChange} /> 
                    <span className="text-sm font-medium">Client</span>
                 </label>
                 <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="checkbox checkbox-sm checkbox-primary rounded-md" 
                        name="estFournisseur" checked={formData.estFournisseur} onChange={handleChange} /> 
                    <span className="text-sm font-medium">Fournisseur</span>
                 </label>
               </div>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* SECTION 2: COORDONNÉES */}
      <Card className="min-w-full">
        <CardHeader><CardTitle>Coordonnées</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col gap-2">
              <Label>Email <span className="text-red-500">*</span></Label>
              <Input type="email" name="email" value={formData.email} onChange={handleChange} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Site Web</Label>
              <Input name="siteWeb" value={formData.siteWeb} onChange={handleChange} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Mobile <span className="text-red-500">*</span></Label>
              <Input name="mobile" value={formData.mobile} onChange={handleChange} />
            </div>
            <div className="md:col-span-2 flex flex-col gap-2">
               <Label>Adresse Complète</Label>
               <textarea className="textarea textarea-bordered w-full" rows={2} name="adresse" value={formData.adresse} onChange={handleChange}></textarea>
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
              <Select onValueChange={(val) => handleSelectChange('pays', val)} value={formData.pays}>
                <SelectTrigger><SelectValue placeholder="Pays" /></SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {PAYS_LIST.map((pays) => (
                    <SelectItem key={pays} value={pays}>{pays}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
               <Label>Département / Canton</Label>
               <Select onValueChange={(val) => handleSelectChange('departementCanton', val)} value={formData.departementCanton}>
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

      {/* SECTION 3: JURIDIQUE */}
      <Card className="min-w-full">
        <CardHeader><CardTitle>Détails Juridiques & Fiscaux</CardTitle></CardHeader>
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
               <Select onValueChange={(val) => handleSelectChange('typeEntiteLegale', val)} value={formData.typeEntiteLegale}>
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
               <Input type="number" name="capital" value={formData.capital} onChange={handleChange} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 4: FINANCIER */}
      <Card className="min-w-full">
        <CardHeader><CardTitle>Financier & Gestion</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
             <div className="flex flex-col gap-2">
               <Label>Devise</Label>
               <Select onValueChange={(val) => handleSelectChange('devise', val)} value={formData.devise}>
                <SelectTrigger><SelectValue placeholder="Devise" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MAD">MAD (Dirham)</SelectItem>
                  <SelectItem value="EUR">EUR (Euro)</SelectItem>
                  <SelectItem value="USD">USD (Dollar)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
               <Label className="font-semibold text-blue-700">Commercial Assigné</Label>
               <Select onValueChange={(val) => handleSelectChange('commercialAssigne', val)} value={formData.commercialAssigne}>
                <SelectTrigger><SelectValue placeholder="Choisir un commercial..." /></SelectTrigger>
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
               <Select onValueChange={(val) => handleSelectChange('conditionReglement', val)} value={formData.conditionReglement}>
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
               <Input name="tags" value={formData.tags} onChange={handleChange} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
         <Button onClick={handleSubmit} disabled={loading} className="bg-orange-600 hover:bg-orange-700">
            {loading ? "Modification..." : "Mettre à jour le Tiers"}
         </Button>
      </div>
    </div>
  );
};

export default EditTiers;
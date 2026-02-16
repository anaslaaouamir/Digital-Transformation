import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
// Change this line:
import { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const GeneralInfo = () => {

  // AJOUTER CECI APRES LES IMPORTS ET AVANT LE COMPOSANT
const PAYS_LIST = [
  "Afghanistan", "Afrique du Sud", "Albanie", "Algérie", "Allemagne", "Andorre", "Angola", "Arabie saoudite", "Argentine", "Arménie", "Australie", "Autriche", "Azerbaïdjan",
  "Bahamas", "Bahreïn", "Bangladesh", "Barbade", "Belgique", "Belize", "Bénin", "Bhoutan", "Biélorussie", "Birmanie", "Bolivie", "Bosnie-Herzégovine", "Botswana", "Brésil", "Brunei", "Bulgarie", "Burkina Faso", "Burundi",
  "Cambodge", "Cameroun", "Canada", "Cap-Vert", "Centrafrique", "Chili", "Chine", "Chypre", "Colombie", "Comores", "Congo", "Corée du Nord", "Corée du Sud", "Costa Rica", "Côte d'Ivoire", "Croatie", "Cuba",
  "Danemark", "Djibouti", "Dominique",
  "Égypte", "Émirats arabes unis", "Équateur", "Érythrée", "Espagne", "Estonie", "États-Unis", "Éthiopie",
  "Fidji", "Finlande", "France",
  "Gabon", "Gambie", "Géorgie", "Ghana", "Grèce", "Grenade", "Guatemala", "Guinée", "Guinée-Bissau", "Guinée équatoriale", "Guyana",
  "Haïti", "Honduras", "Hongrie",
  "Inde", "Indonésie", "Irak", "Iran", "Irlande", "Islande", "Israël", "Italie",
  "Jamaïque", "Japon", "Jordanie",
  "Kazakhstan", "Kenya", "Kirghizistan", "Kiribati", "Koweït",
  "Laos", "Lesotho", "Lettonie", "Liban", "Libéria", "Libye", "Liechtenstein", "Lituanie", "Luxembourg",
  "Macédoine du Nord", "Madagascar", "Malaisie", "Malawi", "Maldives", "Mali", "Malte", "Maroc", "Marshall", "Maurice", "Mauritanie", "Mexique", "Micronésie", "Moldavie", "Monaco", "Mongolie", "Monténégro", "Mozambique",
  "Namibie", "Nauru", "Népal", "Nicaragua", "Niger", "Nigéria", "Norvège", "Nouvelle-Zélande",
  "Oman", "Ouganda", "Ouzbékistan",
  "Pakistan", "Palaos", "Palestine", "Panama", "Papouasie-Nouvelle-Guinée", "Paraguay", "Pays-Bas", "Pérou", "Philippines", "Pologne", "Portugal",
  "Qatar",
  "Roumanie", "Royaume-Uni", "Russie", "Rwanda",
  "Saint-Christophe-et-Niévès", "Sainte-Lucie", "Saint-Marin", "Saint-Vincent-et-les-Grenadines", "Salomon", "Salvador", "Samoa", "São Tomé-et-Principe", "Sénégal", "Serbie", "Seychelles", "Sierra Leone", "Singapour", "Slovaquie", "Slovénie", "Somalie", "Soudan", "Soudan du Sud", "Sri Lanka", "Suède", "Suisse", "Suriname", "Syrie",
  "Tadjikistan", "Tanzanie", "Tchad", "Tchéquie", "Thaïlande", "Timor oriental", "Togo", "Tonga", "Trinité-et-Tobago", "Tunisie", "Turkménistan", "Turquie", "Tuvalu",
  "Ukraine", "Uruguay",
  "Vanuatu", "Vatican", "Venezuela", "Vietnam",
  "Yémen",
  "Zambie", "Zimbabwe"
];


  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Store the list of commercials from API
  const [commercials, setCommercials] = useState<any[]>([]);

  // 2. Fetch data when page loads
  useEffect(() => {
    const fetchCommercials = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/employes?role=Commercial');
        if (response.ok) {
          const data = await response.json();
          setCommercials(data);
        }
      } catch (err) {
        console.error("Erreur chargement commerciaux", err);
      }
    };
    fetchCommercials();
  }, []);

  // 1. STATE: Updated to CamelCase to match Java Backend
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    siteWeb: '',           // Fixed: was site_web
    telephone: '',
    mobile: '',
    adresse: '',
    ville: '',
    codePostal: '',        // Fixed: was code_postal
    pays: 'Maroc',
    departementCanton: '', // Fixed: was departement_canton
    ice: '',
    rc: '',
    ifFisc: '',            // Fixed: was if_fisc
    cnss: '',
    capital: '',
    devise: 'MAD',
    conditionReglement: '', // Fixed: was condition_reglement
    tags: '',
    etat: 'ouvert',
    estClient: false,      // Fixed: was est_client
    estProspect: false,    // Fixed: was est_prospect
    estFournisseur: false, // Fixed: was est_fournisseur
    typeEntiteLegale: '',  // Fixed: was type_entite_legale
    commercialAssigne: '', // Fixed: camelCase (logic pending per your request)
  });

  // 2. HANDLER: Typing
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    // Safe check for checkboxes
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

  // 4. API SUBMIT
  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    // 1. Validation des champs de base obligatoires
    if (!formData.nom || !formData.ville || !formData.pays || !formData.etat) {
      setError("Merci de remplir les champs obligatoires : Nom, Ville, Pays et État.");
      setLoading(false);
      return;
    }

    // 2. Validation Nature (Au moins une case doit être cochée)
    if (!formData.estClient && !formData.estProspect && !formData.estFournisseur) {
      setError("Veuillez sélectionner le type de tiers (Client, Prospect ou Fournisseur).");
      setLoading(false);
      return;
    }

    // 3. Validation Contact (Logique intelligente : Au moins UN des trois requis)
    // Si (Pas d'email ET Pas de tel ET Pas de mobile) => Erreur
    if (!formData.email && !formData.telephone && !formData.mobile) {
      setError("Vous devez saisir au moins un moyen de contact (Email, Téléphone ou Mobile).");
      setLoading(false);
      return;
    }

    // CLEAN DATA & FORMAT FOR BACKEND
    const payload = {
      // ... keep all other fields exactly as they were (nom, email, etc.) ...
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
      typeEntiteLegale: formData.typeEntiteLegale, // Make sure this is included
      conditionReglement: formData.conditionReglement, // Make sure this is included

      // --- THE MAGIC FIX FOR COMMERCIAL ---
      // If a commercial is selected (ID exists), send { id: 1 }. If not, send null.
      commercialAssigne: formData.commercialAssigne 
        ? { id: Number(formData.commercialAssigne) } 
        : null
    };

    try {
      const response = await fetch('http://localhost:8080/api/tiers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload), // Send the cleaned payload
      });

      if (response.ok) {
        alert("Tiers créé avec succès !");
        navigate('/tiers'); // Redirect to list
      } else {
        const data = await response.json();
        setError(data.error || "Erreur lors de la création");
      }
    } catch (err) {
      setError("Impossible de contacter le serveur (Vérifiez si le Backend est démarré)");
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
              <Label className="font-semibold text-gray-900">Nom de la société *</Label>
              <Input 
                 name="nom" 
                 value={formData.nom} 
                 onChange={handleChange} 
                 placeholder="Ex: Hexlab S.A.R.L" 
              />
            </div>

            {/* Etat */}
             <div className="flex flex-col gap-2">
              <Label className="font-semibold text-gray-900">État</Label>
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

            {/* RÔLES (Checkboxes) - Names Updated to CamelCase */}
            <div className="md:col-span-2 p-4 border rounded-lg bg-gray-50">
               <Label className="font-semibold text-gray-900 mb-3 block">Nature du Tiers</Label>
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
              <Label>Email</Label>
              <Input type="email" placeholder="contact@hexlab.io" name="email" value={formData.email} onChange={handleChange} />
            </div>
            
            {/* Site Web - Name Updated */}
            <div className="flex flex-col gap-2">
              <Label>Site Web</Label>
              <Input placeholder="www.site.com" name="siteWeb" value={formData.siteWeb} onChange={handleChange} />
            </div>

           
            <div className="flex flex-col gap-2">
              <Label>Mobile</Label>
              <Input placeholder="+212 6..." name="mobile" value={formData.mobile} onChange={handleChange} />
            </div>

            <div className="md:col-span-2 flex flex-col gap-2">
               <Label>Adresse Complète</Label>
               <textarea className="textarea textarea-bordered w-full" rows={2} name="adresse" value={formData.adresse} onChange={handleChange} placeholder="Numéro, Rue..."></textarea>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Ville</Label>
              <Input name="ville" value={formData.ville} onChange={handleChange} />
            </div>

            {/* Code Postal - Name Updated */}
            <div className="flex flex-col gap-2">
              <Label>Code Postal</Label>
              <Input name="codePostal" value={formData.codePostal} onChange={handleChange} />
            </div>

            {/* REMPLACER LE BLOC PAYS EXISTANT PAR CELUI-CI */}
            <div className="flex flex-col gap-2">
              <Label>Pays</Label>
              <Select 
                onValueChange={(val) => handleSelectChange('pays', val)} 
                value={formData.pays} // Important: Lie la valeur au state
              >
                <SelectTrigger>
                    <SelectValue placeholder="Pays" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]"> {/* Ajoute un scroll si la liste est longue */}
                  {PAYS_LIST.map((pays) => (
                    <SelectItem key={pays} value={pays}>
                      {pays}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Departement - Name Updated */}
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

            {/* IF Fisc - Name Updated */}
            <div className="flex flex-col gap-2">
               <Label>Identifiant Fiscal (IF)</Label>
               <Input name="ifFisc" value={formData.ifFisc} onChange={handleChange} />
            </div>

             <div className="flex flex-col gap-2">
               <Label>CNSS</Label>
               <Input name="cnss" value={formData.cnss} onChange={handleChange} />
            </div>

            {/* Forme Juridique - Name Updated */}
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

            {/* Commercial - Updated to use API Data */}
            <div className="flex flex-col gap-2">
               <Label className="font-semibold text-blue-700">Commercial Assigné</Label>
               <Select onValueChange={(val) => handleSelectChange('commercialAssigne', val)}>
                <SelectTrigger>
                    {/* Show the name if selected, otherwise placeholder */}
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

            {/* Conditions - Name Updated */}
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
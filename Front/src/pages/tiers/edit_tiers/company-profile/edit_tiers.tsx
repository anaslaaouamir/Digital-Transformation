import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useNavigate, useParams } from 'react-router-dom'; // AJOUT DE useParams
import { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

// MÊME LISTE DE PAYS QUE PRÉCÉDEMMENT
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

const EditTiers = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // 1. RÉCUPÉRATION DE L'ID DEPUIS L'URL
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [commercials, setCommercials] = useState<any[]>([]);

  // State initial (avec champs vides par défaut)
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
    // CHAMPS READ-ONLY (récupérés du backend)
    codeClient: '',      
    codeFournisseur: ''  
  });

  // 2. CHARGEMENT DES DONNÉES (Commerciaux + Le Tiers spécifique)
  useEffect(() => {
    const loadData = async () => {
      try {
        // A. Charger les commerciaux
        const respComm = await fetch('http://localhost:8080/api/employes?role=Commercial');
        if (respComm.ok) setCommercials(await respComm.json());

        // B. Charger le Tiers à modifier
        if (id) {
          const respTiers = await fetch(`http://localhost:8080/api/tiers/${id}`);
          if (respTiers.ok) {
            const data = await respTiers.json();
            
            // C. MAPPING DES DONNÉES
            // On s'assure que si une valeur est null, on met une chaine vide ''
            setFormData({
                ...data, // Remplit tout ce qui correspond (nom, email, etc.)
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
                // Gestion spéciale pour l'objet Commercial (on extrait juste l'ID)
                commercialAssigne: data.commercialAssigne ? data.commercialAssigne.id.toString() : '',
                // Codes (si le backend les renvoie)
                codeClient: data.codeClient || '',
                codeFournisseur: data.codeFournisseur || ''
            });
          } else {
            setError("Tiers introuvable.");
          }
        }
      } catch (err) {
        console.error("Erreur chargement", err);
        setError("Erreur de connexion au serveur.");
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

  // 3. MISE A JOUR (PUT)
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

    const payload = {
      ...formData,
      // On nettoie l'objet commercial
      commercialAssigne: formData.commercialAssigne ? { id: Number(formData.commercialAssigne) } : null,
      // On ne renvoie pas forcément codeClient/codeFournisseur s'ils sont gérés par le backend, 
      // mais ça ne gêne généralement pas s'ils sont dans le JSON.
    };

    try {
      // NOTE: Méthode PUT et URL avec ID
      const response = await fetch(`http://localhost:8080/api/tiers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        alert("Tiers modifié avec succès !");
        navigate(`/edit_tiers/${id}`); 
      } else {
        const data = await response.json();
        setError(data.error || "Erreur lors de la modification");
      }
    } catch (err) {
      setError("Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  };

  if (!id) return <div>ID manquant</div>;

  return (
    <div className="flex flex-col gap-5 lg:gap-7.5">
      {/* TITRE MODIFIÉ */}
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

            {/* Code Client (READ ONLY - AFFICHE LA VALEUR DE LA BDD) */}
            <div className="flex flex-col gap-2">
              <Label className="font-semibold text-gray-900">Code Client</Label>
              <Input 
                value={formData.codeClient || ''} 
                disabled 
                className="bg-gray-100 text-gray-700 font-mono cursor-not-allowed" 
                placeholder="Généré automatiquement..."
              />
            </div>

            {/* Code Fournisseur (READ ONLY - AFFICHE LA VALEUR DE LA BDD) */}
            <div className="flex flex-col gap-2">
              <Label className="font-semibold text-gray-900">Code Fournisseur</Label>
              <Input 
                value={formData.codeFournisseur || ''} 
                disabled 
                className="bg-gray-100 text-gray-700 font-mono cursor-not-allowed"
                placeholder="Généré automatiquement..."
               />
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

            {/* LISTE DES PAYS (Gardée telle quelle) */}
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

      {/* SECTION 3 & 4: IDENTIQUES MAIS AVEC value={formData...} POUR TOUT */}
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
         {/* BOUTON MODIFIÉ */}
         <Button onClick={handleSubmit} disabled={loading} className="bg-orange-600 hover:bg-orange-700">
            {loading ? "Modification..." : "Mettre à jour le Tiers"}
         </Button>
      </div>
    </div>
  );
};

export default EditTiers;
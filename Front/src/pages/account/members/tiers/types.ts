export interface ITiers {
  id: number;
  est_prospect: boolean;
  est_client: boolean;
  est_fournisseur: boolean;
  code_client?: string;
  code_fournisseur?: string;
  nom: string;
  etat: string;
  adresse?: string;
  code_postal?: string;
  ville?: string;
  pays?: string;
  departement_canton?: string;
  telephone?: string;
  mobile?: string;
  email?: string;
  site_web?: string;
  rc?: string;
  if_fisc?: string;
  cnss?: string;
  ice?: string;
  type_tiers?: string;
  type_entite_legale?: string;
  capital?: number;
  effectif?: string;
  devise: string;
  condition_reglement?: string;
  mode_reglement?: string;
  tags?: string;
  maison_mere_id?: number;
  commercial_assigne_id?: number;
  logo?: string;
  date_creation: string;
}

export interface ITiersFilters {
  searchTerm?: string;
  estClient?: boolean;
  estFournisseur?: boolean;
  estProspect?: boolean;
  etat?: string;
}

export interface ITiersResponse {
  data: ITiers[];
  total: number;
  page: number;
  limit: number;
}

export interface ITiersApiParams {
  page?: number;
  limit?: number;
  search?: string;
  estClient?: boolean;
  estFournisseur?: boolean;
  estProspect?: boolean;
  etat?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
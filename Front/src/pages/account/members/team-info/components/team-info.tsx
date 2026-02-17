import { useEffect, useState } from 'react';
import { Check, Loader2, Lock, SquarePen, X, AlertCircle, Eye, EyeOff } from 'lucide-react'; 
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import api from '@/api/axios';

// Types matching your Backend DTO
interface AdminData {
  id?: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
}

// Fields that can be edited
type EditableField = 'nom' | 'prenom' | 'email' | 'telephone' | 'password';

const TeamInfo = () => {
  const [data, setData] = useState<AdminData>({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
  });

  const [loading, setLoading] = useState(true);
  const [editingField, setEditingField] = useState<EditableField | null>(null);
  
  // State for the red error message
  const [error, setError] = useState<string | null>(null);
  
  // Temp values for editing
  const [tempValue, setTempValue] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  // Password Visibility States
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  
  // Security: Current Password is REQUIRED for any update
  const [currentPassword, setCurrentPassword] = useState('');
  const [isVerifyingIdentity, setIsVerifyingIdentity] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 1. Fetch Data on Mount
  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const response = await api.get<AdminData>('/admin/me');
      setData(response.data);
    } catch (error: any) {
      console.error('Error fetching admin data:', error);
      setError("Impossible de charger les données du serveur (authentification requise ?).");
    } finally {
      setLoading(false);
    }
  };

  // 2. Start Editing
  const handleEdit = (field: EditableField, currentValue: string) => {
    setEditingField(field);
    setTempValue(currentValue);
    setNewPassword('');
    setCurrentPassword('');
    setIsVerifyingIdentity(false);
    setError(null);
    // Reset visibility
    setShowNewPassword(false);
    setShowCurrentPassword(false);
  };

  // 3. Cancel Editing
  const handleCancel = () => {
    setEditingField(null);
    setTempValue('');
    setCurrentPassword('');
    setNewPassword('');
    setIsVerifyingIdentity(false);
    setError(null);
    // Reset visibility
    setShowNewPassword(false);
    setShowCurrentPassword(false);
  };

  // 4. Pre-Save: Show Password Input
  const handleSaveAttempt = () => {
    setError(null);

    if (!tempValue && editingField !== 'password') {
      setError('Ce champ ne peut pas être vide');
      return;
    }
    // Show the "Confirm Password" input
    setIsVerifyingIdentity(true);
  };

  // 5. Submit to Backend
  const submitUpdate = async () => {
    setError(null);

    if (!currentPassword) {
      setError('Mot de passe actuel requis');
      return;
    }

    setIsSaving(true);

    const payload: any = {
      nom: data.nom,
      prenom: data.prenom,
      email: data.email,
      telephone: data.telephone,
      currentPassword: currentPassword, // Mandatory
    };

    if (editingField === 'password') {
      payload.newPassword = newPassword;
    } else if (editingField) {
      payload[editingField] = tempValue;
    }

    try {
      const response = await api.put('/admin/update', payload);
      const result = response.data as any;
      setData(result); // Update UI
      handleCancel();
    } catch (error: any) {
      console.error(error);
      // Axios error with response from backend
      const backendError = error?.response?.data || {};
      const code = backendError.error;
      const errorTranslations: Record<string, string> = {
        "INVALID_CURRENT_PASSWORD": "Le mot de passe actuel est incorrect.",
        "PASSWORD_TOO_SHORT": "Le mot de passe est trop court (min 8 caractères).",
        "PASSWORD_MISSING_UPPERCASE": "Le mot de passe doit contenir une majuscule.",
        "PASSWORD_MISSING_LOWERCASE": "Le mot de passe doit contenir une minuscule.",
        "PASSWORD_MISSING_DIGIT": "Le mot de passe doit contenir un chiffre.",
        "NEW_PASSWORD_SAME_AS_OLD": "Le nouveau mot de passe doit être différent de l'ancien."
      };
      setError(errorTranslations[code] || code || "Erreur lors de la mise à jour");
    } finally {
      setIsSaving(false);
    }
  };

  // Helper Row Render
  const renderEditableRow = (field: EditableField, label: string, value: string) => {
    const isEditing = editingField === field;

    return (
      <TableRow>
        <TableCell className="py-4 font-medium text-gray-500 w-1/3">
          {label}
        </TableCell>
        <TableCell className="py-4 w-full">
          {isEditing ? (
            <div className="flex flex-col gap-3">
              {!isVerifyingIdentity ? (
                <Input
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                  autoFocus
                  className={error ? "border-red-500" : ""}
                />
              ) : (
                <div className="animate-in fade-in zoom-in duration-200">
                  <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
                    <Lock size={12} /> Confirmez votre mot de passe actuel :
                  </p>
                  <div className="relative">
                    <Input
                      type={showCurrentPassword ? "text" : "password"}
                      placeholder="Mot de passe actuel..."
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="border-orange-300 pr-10"
                      autoFocus
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? (
                        <EyeOff size={16} className="text-gray-500" />
                      ) : (
                        <Eye size={16} className="text-gray-500" />
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <span className="text-gray-900 font-medium">{value || '-'}</span>
          )}
        </TableCell>
        <TableCell className="py-4 text-right">
          {isEditing ? (
            <div className="flex items-center justify-end gap-2">
              {isVerifyingIdentity ? (
                <Button 
                  size="sm" 
                  onClick={submitUpdate} 
                  disabled={isSaving || !currentPassword}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirmer'}
                </Button>
              ) : (
                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={handleSaveAttempt}
                  className="text-green-600 hover:bg-green-50"
                >
                  <Check size={18} />
                </Button>
              )}
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={handleCancel}
                disabled={isSaving}
                className="text-red-500 hover:bg-red-50"
              >
                <X size={18} />
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleEdit(field, value)}
              className="text-gray-400 hover:text-primary"
            >
              <SquarePen size={18} />
            </Button>
          )}
        </TableCell>
      </TableRow>
    );
  };

  if (loading) return <div className="p-10 text-center">Chargement...</div>;

  return (
    <Card className="min-w-full">
      <CardHeader>
        <CardTitle>Informations Admin</CardTitle>
      </CardHeader>

      {/* ERROR MESSAGE BOX */}
      {error && (
        <div className="mx-6 mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-sm text-red-600">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <CardContent className="p-0">
        <Table>
          <TableBody>
            {renderEditableRow('nom', 'Nom', data.nom)}
            {renderEditableRow('prenom', 'Prénom', data.prenom)}
            {renderEditableRow('email', 'Email', data.email)}
            {renderEditableRow('telephone', 'Téléphone', data.telephone)}

            {/* Password Row */}
            <TableRow>
              <TableCell className="py-4 font-medium text-gray-500">
                Mot de passe
              </TableCell>
              <TableCell className="py-4">
                {editingField === 'password' ? (
                  <div className="flex flex-col gap-3">
                    {!isVerifyingIdentity ? (
                      <div className="relative">
                        <Input
                          type={showNewPassword ? "text" : "password"}
                          placeholder="Nouveau mot de passe"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className={error ? "border-red-500 pr-10" : "pr-10"}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? (
                            <EyeOff size={16} className="text-gray-500" />
                          ) : (
                            <Eye size={16} className="text-gray-500" />
                          )}
                        </Button>
                      </div>
                    ) : (
                      <div className="animate-in fade-in zoom-in duration-200">
                        <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
                          <Lock size={12} /> Confirmez votre mot de passe actuel :
                        </p>
                        <div className="relative">
                          <Input
                            type={showCurrentPassword ? "text" : "password"}
                            placeholder="Mot de passe actuel..."
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="border-orange-300 pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          >
                            {showCurrentPassword ? (
                              <EyeOff size={16} className="text-gray-500" />
                            ) : (
                              <Eye size={16} className="text-gray-500" />
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="text-gray-400 italic">••••••••</span>
                )}
              </TableCell>
              <TableCell className="py-4 text-right">
                {editingField === 'password' ? (
                  <div className="flex items-center justify-end gap-2">
                    {isVerifyingIdentity ? (
                      <Button 
                        size="sm" 
                        onClick={submitUpdate} 
                        disabled={isSaving}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Valider'}
                      </Button>
                    ) : (
                      <Button variant="ghost" size="icon" onClick={handleSaveAttempt}>
                        <Check size={18} className="text-green-600" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={handleCancel}>
                      <X size={18} className="text-red-500" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit('password', '')}
                  >
                    <SquarePen size={18} />
                  </Button>
                )}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export { TeamInfo };
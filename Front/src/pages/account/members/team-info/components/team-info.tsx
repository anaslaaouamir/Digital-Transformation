import { useState } from 'react';
import { AvatarInput } from '@/partials/common/avatar-input';
import { Check, InfoIcon, SquarePen, X } from 'lucide-react';
import { useLocationData } from '@/hooks/use-location-data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { EditableField, EditableStringField, TeamInfoData } from '../types';

const TeamInfo = () => {
  const [data, setData] = useState<TeamInfoData>({
    commercialName: '',
    codeClient: '',
    address: '',
    country: 'Morocco',
    department: '',
    accountManager: '',
    types: [],
  });

  const [editingField, setEditingField] = useState<EditableField | null>(null);
  const [tempValue, setTempValue] = useState('');
  const [tempTypes, setTempTypes] = useState<string[]>([]);

  const {
    countries,
    departments,
    isCountriesLoading,
    isDepartmentsLoading,
    isAddressLoading,
    addressSuggestions,
    showAddressSuggestions,
    requestAddressSuggestions,
    hideAddressSuggestions,
    resetAddressSuggestions,
  } = useLocationData({ country: data.country });

  const typeOptions = [
    { value: 'prospect', label: 'Prospect' },
    { value: 'client', label: 'Client' },
    { value: 'fournisseur', label: 'Fournisseur' },
  ];

  const handleEdit = (
    field: EditableField,
    currentValue: string | string[],
  ) => {
    setEditingField(field);

    if (field === 'types') {
      setTempTypes(currentValue as string[]);
      resetAddressSuggestions();
      return;
    }

    if (field !== 'address') {
      resetAddressSuggestions();
    }

    setTempValue(currentValue as string);
  };

  const handleSave = (field: EditableField) => {
    if (field === 'types') {
      setData((prev) => ({ ...prev, types: tempTypes }));
    } else if (field === 'country') {
      setData((prev) => ({
        ...prev,
        country: tempValue,
        department: prev.country === tempValue ? prev.department : '',
      }));
    } else {
      setData((prev) => ({ ...prev, [field]: tempValue }));
    }

    setEditingField(null);
    resetAddressSuggestions();
  };

  const handleCancel = () => {
    setEditingField(null);
    setTempValue('');
    setTempTypes([]);
    resetAddressSuggestions();
  };

  const handleAddressChange = (value: string) => {
    setTempValue(value);
    requestAddressSuggestions(value);
  };

  const handleTypeToggle = (value: string) => {
    setTempTypes((prev) =>
      prev.includes(value)
        ? prev.filter((type) => type !== value)
        : [...prev, value],
    );
  };

  const getDisplayValue = (value: string) =>
    value.trim() ? value : 'Not specified';

  const renderEditableCell = (
    field: EditableStringField,
    value: string,
    label: string,
    type: 'text' | 'select' | 'address' = 'text',
    options?: string[],
    isLoading = false,
    isDisabled = false,
    emptyMessage = 'No options available',
  ) => {
    const isEditing = editingField === field;
    const hasOptions = Boolean(options?.length);

    return (
      <TableRow>
        <TableCell className="py-3 text-secondary font-normal">
          {label}
        </TableCell>
        <TableCell className="py-3 text-secondary">
          {isEditing ? (
            <div className="relative">
              {type === 'select' && options ? (
                <Select
                  value={tempValue || undefined}
                  onValueChange={setTempValue}
                  disabled={isDisabled || isLoading}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={
                        isLoading
                          ? 'Loading...'
                          : `Select ${label.toLowerCase()}`
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoading ? (
                      <SelectItem value="__loading__" disabled>
                        Loading...
                      </SelectItem>
                    ) : hasOptions ? (
                      options.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="__empty__" disabled>
                        {emptyMessage}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              ) : type === 'address' ? (
                <div className="relative">
                  <Input
                    value={tempValue}
                    onChange={(event) =>
                      handleAddressChange(event.target.value)
                    }
                    placeholder="Start typing an address"
                    className="w-full"
                  />

                  {isAddressLoading && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-border rounded-md shadow-lg px-3 py-2 text-sm text-muted-foreground">
                      Loading suggestions...
                    </div>
                  )}

                  {!isAddressLoading &&
                    showAddressSuggestions &&
                    addressSuggestions.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                        {addressSuggestions.map((suggestion, index) => (
                          <div
                            key={`${suggestion}-${index}`}
                            className="px-3 py-2 hover:bg-muted cursor-pointer text-sm"
                            onClick={() => {
                              setTempValue(suggestion);
                              hideAddressSuggestions();
                            }}
                          >
                            {suggestion}
                          </div>
                        ))}
                      </div>
                    )}
                </div>
              ) : (
                <Input
                  value={tempValue}
                  onChange={(event) => setTempValue(event.target.value)}
                  placeholder={`Enter ${label.toLowerCase()}`}
                  className="w-full"
                />
              )}
            </div>
          ) : (
            getDisplayValue(value)
          )}
        </TableCell>
        <TableCell className="py-3 text-center">
          {isEditing ? (
            <div className="flex gap-1 justify-center">
              <Button
                variant="ghost"
                mode="icon"
                onClick={() => handleSave(field)}
              >
                <Check size={16} className="text-[#66C39E]" />
              </Button>
              <Button variant="ghost" mode="icon" onClick={handleCancel}>
                <X size={16} className="text-[#dc2626]" />
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              mode="icon"
              onClick={() => handleEdit(field, value)}
            >
              <SquarePen size={16} className="text-primary" />
            </Button>
          )}
        </TableCell>
      </TableRow>
    );
  };

  return (
    <Card className="min-w-full">
      <CardHeader>
        <CardTitle>Team Info</CardTitle>
        <div className="flex items-center space-x-2">
          <Label htmlFor="size-sm" className="text-sm">
            Visible to all
          </Label>
          <Switch id="size-sm" size="sm" />
        </div>
      </CardHeader>
      <CardContent className="card-table kt-scrollable-x-auto pb-3 p-0">
        <Table className="align-middle text-sm">
          <TableBody>
            <TableRow>
              <TableCell className="py-2 min-w-32 text-secondary font-normal">
                Logo
              </TableCell>
              <TableCell className="py-2 text-secondary font-normal min-w-32 text-sm">
                150x150px JPEG, PNG Image
              </TableCell>
              <TableCell className="py-2 text-center min-w-16">
                <AvatarInput />
              </TableCell>
            </TableRow>

            {renderEditableCell(
              'commercialName',
              data.commercialName,
              'Commercial Name',
            )}

            <TableRow>
              <TableCell className="py-2 text-secondary font-normal">
                Code Client
              </TableCell>
              <TableCell className="py-2 text-muted-foreground font-normal opacity-60">
                {data.codeClient || 'Not assigned'}
              </TableCell>
              <TableCell className="py-2 text-center">
                <Tooltip>
                  <TooltipTrigger
                    aria-label="Code client info"
                    className="inline-flex size-8.5 items-center justify-center rounded-md text-primary hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <InfoIcon size={18} className="text-primary" />
                  </TooltipTrigger>
                  <TooltipContent className='bg-white text-primary border border-primary' side="top" align="center">
                    <p className="text-sm">
                      the code is generated automatically on validation
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TableCell>
            </TableRow>

            {renderEditableCell(
              'country',
              data.country,
              'Country',
              'select',
              countries.map((country) => country.name),
              isCountriesLoading,
            )}

            {renderEditableCell(
              'department',
              data.department,
              'Department/Canton',
              'select',
              departments,
              isDepartmentsLoading,
              !data.country,
              data.country
                ? 'No departments available'
                : 'Select country first',
            )}

            {renderEditableCell('address', data.address, 'Address', 'address')}

            {renderEditableCell(
              'accountManager',
              data.accountManager,
              'Assigned account manager',
            )}

            <TableRow>
              <TableCell className="py-3 text-secondary font-normal">
                Type
              </TableCell>
              <TableCell className="py-3 text-secondary">
                {editingField === 'types' ? (
                  <div className="flex flex-col gap-2">
                    {typeOptions.map((option) => (
                      <div
                        key={option.value}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={option.value}
                          checked={tempTypes.includes(option.value)}
                          onCheckedChange={() => handleTypeToggle(option.value)}
                        />
                        <Label
                          htmlFor={option.value}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span>
                    {data.types.length > 0
                      ? data.types
                          .map(
                            (type) =>
                              typeOptions.find(
                                (option) => option.value === type,
                              )?.label,
                          )
                          .join(', ')
                      : 'Not specified'}
                  </span>
                )}
              </TableCell>
              <TableCell className="py-3 text-center">
                {editingField === 'types' ? (
                  <div className="flex gap-1 justify-center">
                    <Button
                      variant="ghost"
                      mode="icon"
                      onClick={() => handleSave('types')}
                    >
                      <Check size={16} className="text-[#66C39E]" />
                    </Button>
                    <Button variant="ghost" mode="icon" onClick={handleCancel}>
                      <X size={16} className="text-[#dc2626]" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    mode="icon"
                    onClick={() => handleEdit('types', data.types)}
                  >
                    <SquarePen size={16} className="text-primary" />
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

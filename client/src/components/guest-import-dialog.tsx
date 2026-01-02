import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, X } from "lucide-react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import type { Event } from "@shared/schema";

interface GuestImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  weddingId: string;
  events: Event[];
  onImport: (guests: ParsedGuest[]) => Promise<void>;
}

interface ParsedGuest {
  name: string;
  email?: string;
  phone?: string;
  side?: 'bride' | 'groom' | 'mutual';
  eventIds?: string[];
  rsvpStatus?: 'pending' | 'confirmed' | 'declined';
  plusOne?: boolean;
  dietaryRestrictions?: string;
  householdName?: string;
  isMainHouseholdContact?: boolean;
}

interface ColumnMapping {
  name?: string;
  email?: string;
  phone?: string;
  side?: string;
  plusOne?: string;
  dietaryRestrictions?: string;
  householdName?: string;
  isMainHouseholdContact?: string;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export function GuestImportDialog({ open, onOpenChange, weddingId, events, onImport }: GuestImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [rawData, setRawData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);
  const [defaultSide, setDefaultSide] = useState<'bride' | 'groom' | 'mutual'>('mutual');
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [importing, setImporting] = useState(false);
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview'>('upload');

  const handleFileUpload = async (uploadedFile: File) => {
    setFile(uploadedFile);
    setErrors([]);
    
    const fileType = uploadedFile.name.split('.').pop()?.toLowerCase();
    
    try {
      if (fileType === 'csv') {
        Papa.parse(uploadedFile, {
          complete: (results) => {
            if (results.data && results.data.length > 0) {
              const data = results.data as any[];
              const detectedHeaders = Object.keys(data[0]);
              setHeaders(detectedHeaders);
              setRawData(data);
              setColumnMapping(autoMapColumns(detectedHeaders));
              setStep('mapping');
            }
          },
          header: true,
          skipEmptyLines: true,
        });
      } else if (fileType === 'xlsx' || fileType === 'xls') {
        const reader = new FileReader();
        reader.onload = (e) => {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet);
          
          if (jsonData && jsonData.length > 0) {
            const detectedHeaders = Object.keys(jsonData[0]);
            setHeaders(detectedHeaders);
            setRawData(jsonData);
            setColumnMapping(autoMapColumns(detectedHeaders));
            setStep('mapping');
          }
        };
        reader.readAsArrayBuffer(uploadedFile);
      }
    } catch (error) {
      console.error("Error parsing file:", error);
      setErrors([{ row: 0, field: 'file', message: 'Failed to parse file. Please check the format.' }]);
    }
  };

  const autoMapColumns = (detectedHeaders: string[]): ColumnMapping => {
    const mapping: ColumnMapping = {};
    
    detectedHeaders.forEach(header => {
      const lower = header.toLowerCase().trim();
      
      // Check for "main contact" BEFORE "household" to properly detect "Main Household Contact"
      if (lower.includes('main') && lower.includes('contact')) mapping.isMainHouseholdContact = header;
      else if (lower.includes('primary') && lower.includes('contact')) mapping.isMainHouseholdContact = header;
      else if (lower.includes('point of contact')) mapping.isMainHouseholdContact = header;
      else if (lower.includes('household') || lower.includes('family')) mapping.householdName = header;
      else if (lower.includes('name')) mapping.name = header;
      else if (lower.includes('email') || lower.includes('e-mail')) mapping.email = header;
      else if (lower.includes('phone') || lower.includes('mobile') || lower.includes('cell')) mapping.phone = header;
      else if (lower.includes('side') || lower.includes('party')) mapping.side = header;
      else if (lower.includes('plus') || lower.includes('+1')) mapping.plusOne = header;
      else if (lower.includes('dietary') || lower.includes('diet') || lower.includes('restriction') || lower.includes('allerg')) mapping.dietaryRestrictions = header;
    });
    
    return mapping;
  };

  const validateAndPreview = () => {
    const validationErrors: ValidationError[] = [];
    
    rawData.forEach((row, index) => {
      if (!columnMapping.name || !row[columnMapping.name]) {
        validationErrors.push({
          row: index + 1,
          field: 'name',
          message: 'Name is required'
        });
      }
      
      if (columnMapping.email && row[columnMapping.email]) {
        const email = row[columnMapping.email].toString().trim();
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          validationErrors.push({
            row: index + 1,
            field: 'email',
            message: 'Invalid email format'
          });
        }
      }
      
      if (columnMapping.side && row[columnMapping.side]) {
        const side = row[columnMapping.side].toString().toLowerCase();
        if (!['bride', 'groom', 'mutual'].includes(side)) {
          validationErrors.push({
            row: index + 1,
            field: 'side',
            message: `Invalid side value: ${side}. Must be bride, groom, or mutual`
          });
        }
      }
    });
    
    setErrors(validationErrors);
    
    if (validationErrors.length === 0) {
      setStep('preview');
    }
  };

  const parseGuests = (): ParsedGuest[] => {
    return rawData.map(row => {
      const guest: ParsedGuest = {
        name: columnMapping.name ? row[columnMapping.name]?.toString().trim() : '',
        email: columnMapping.email && row[columnMapping.email] ? row[columnMapping.email].toString().trim() : undefined,
        phone: columnMapping.phone && row[columnMapping.phone] ? row[columnMapping.phone].toString().trim() : undefined,
        side: columnMapping.side && row[columnMapping.side] 
          ? (row[columnMapping.side].toString().toLowerCase() as 'bride' | 'groom' | 'mutual')
          : defaultSide,
        eventIds: selectedEventIds.length > 0 ? selectedEventIds : undefined,
        rsvpStatus: 'pending',
        plusOne: columnMapping.plusOne && row[columnMapping.plusOne]
          ? parseBooleanValue(row[columnMapping.plusOne])
          : false,
        dietaryRestrictions: columnMapping.dietaryRestrictions && row[columnMapping.dietaryRestrictions]
          ? row[columnMapping.dietaryRestrictions].toString().trim()
          : undefined,
        householdName: columnMapping.householdName && columnMapping.householdName !== 'none' && row[columnMapping.householdName]
          ? row[columnMapping.householdName].toString().trim()
          : undefined,
        isMainHouseholdContact: columnMapping.isMainHouseholdContact && row[columnMapping.isMainHouseholdContact]
          ? parseBooleanValue(row[columnMapping.isMainHouseholdContact])
          : false,
      };
      return guest;
    }).filter(guest => guest.name); // Filter out rows without names
  };

  const parseBooleanValue = (value: any): boolean => {
    if (typeof value === 'boolean') return value;
    const str = value.toString().toLowerCase().trim();
    return ['yes', 'true', '1', 'y'].includes(str);
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      const guests = parseGuests();
      await onImport(guests);
      resetDialog();
      onOpenChange(false);
    } catch (error) {
      console.error("Import error:", error);
      setErrors([{ row: 0, field: 'import', message: 'Failed to import guests. Please try again.' }]);
    } finally {
      setImporting(false);
    }
  };

  const resetDialog = () => {
    setFile(null);
    setRawData([]);
    setHeaders([]);
    setColumnMapping({});
    setSelectedEventIds([]);
    setErrors([]);
    setStep('upload');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileUpload(droppedFile);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen) resetDialog();
      onOpenChange(newOpen);
    }}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Guest List</DialogTitle>
          <DialogDescription>
            Upload a CSV or Excel file containing your guest list
          </DialogDescription>
        </DialogHeader>

        {errors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-semibold mb-2">Found {errors.length} error(s):</div>
              <ul className="list-disc list-inside space-y-1">
                {errors.slice(0, 5).map((error, i) => (
                  <li key={i} className="text-sm">
                    Row {error.row}: {error.message}
                  </li>
                ))}
                {errors.length > 5 && (
                  <li className="text-sm font-semibold">...and {errors.length - 5} more</li>
                )}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {step === 'upload' && (
          <div className="space-y-4">
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center hover-elevate cursor-pointer"
              onClick={() => document.getElementById('file-upload')?.click()}
              data-testid="dropzone-upload"
            >
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-semibold mb-2">Drop your file here</h3>
              <p className="text-sm text-muted-foreground mb-4">
                or click to browse for CSV or Excel (.xlsx, .xls) files
              </p>
              <input
                id="file-upload"
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={(e) => {
                  const uploadedFile = e.target.files?.[0];
                  if (uploadedFile) handleFileUpload(uploadedFile);
                }}
                data-testid="input-file-upload"
              />
            </div>

            {file && (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <FileSpreadsheet className="w-5 h-5 text-primary" />
                <span className="flex-1 font-medium">{file.name}</span>
                <span className="text-sm text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB
                </span>
              </div>
            )}

            <div className="bg-muted/50 p-4 rounded-lg space-y-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">File Format Guidelines:</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Include a header row with column names</li>
                  <li>Required: <strong>Name</strong> column</li>
                  <li>Optional: Household Name, Main Contact, Email, Phone, Side (bride/groom/mutual), Plus One (yes/no), Dietary Restrictions</li>
                  <li><strong>Household Name</strong>: Group guests together by using the same household name</li>
                  <li><strong>Main Contact</strong>: Mark one person per household as the main point of contact (yes/no)</li>
                  <li>Side values: "bride", "groom", or "mutual"</li>
                  <li>Plus One / Main Contact: "yes", "no", "true", "false", "1", or "0"</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Example Format:</h4>
                <div className="border rounded-lg overflow-hidden bg-background overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="text-xs font-semibold">Household Name</TableHead>
                        <TableHead className="text-xs font-semibold">Name</TableHead>
                        <TableHead className="text-xs font-semibold">Main Contact</TableHead>
                        <TableHead className="text-xs font-semibold">Email</TableHead>
                        <TableHead className="text-xs font-semibold">Phone</TableHead>
                        <TableHead className="text-xs font-semibold">Side</TableHead>
                        <TableHead className="text-xs font-semibold">Plus One</TableHead>
                        <TableHead className="text-xs font-semibold">Dietary</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="text-xs">Sharma Family</TableCell>
                        <TableCell className="text-xs">Priya Sharma</TableCell>
                        <TableCell className="text-xs">Yes</TableCell>
                        <TableCell className="text-xs">priya@email.com</TableCell>
                        <TableCell className="text-xs">555-123-4567</TableCell>
                        <TableCell className="text-xs">bride</TableCell>
                        <TableCell className="text-xs">yes</TableCell>
                        <TableCell className="text-xs">vegetarian</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-xs">Sharma Family</TableCell>
                        <TableCell className="text-xs">Raj Sharma</TableCell>
                        <TableCell className="text-xs">No</TableCell>
                        <TableCell className="text-xs"></TableCell>
                        <TableCell className="text-xs"></TableCell>
                        <TableCell className="text-xs">bride</TableCell>
                        <TableCell className="text-xs">no</TableCell>
                        <TableCell className="text-xs"></TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-xs">Patel Family</TableCell>
                        <TableCell className="text-xs">Rahul Patel</TableCell>
                        <TableCell className="text-xs">Yes</TableCell>
                        <TableCell className="text-xs">rahul@email.com</TableCell>
                        <TableCell className="text-xs">555-987-6543</TableCell>
                        <TableCell className="text-xs">groom</TableCell>
                        <TableCell className="text-xs">no</TableCell>
                        <TableCell className="text-xs"></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
                <p className="text-xs text-muted-foreground">Empty cells are fine for optional fields. Guests with the same Household Name will be grouped together. Mark one person per household as the Main Contact.</p>
              </div>
            </div>
          </div>
        )}

        {step === 'mapping' && (
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name-column">
                    Name Column <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={columnMapping.name}
                    onValueChange={(value) => setColumnMapping({ ...columnMapping, name: value })}
                  >
                    <SelectTrigger id="name-column" data-testid="select-name-column">
                      <SelectValue placeholder="Select column" />
                    </SelectTrigger>
                    <SelectContent>
                      {headers.map((header) => (
                        <SelectItem key={header} value={header}>
                          {header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="household-column">Household Name Column</Label>
                  <Select
                    value={columnMapping.householdName}
                    onValueChange={(value) => setColumnMapping({ ...columnMapping, householdName: value })}
                  >
                    <SelectTrigger id="household-column" data-testid="select-household-column">
                      <SelectValue placeholder="Select column (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {headers.map((header) => (
                        <SelectItem key={header} value={header}>
                          {header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email-column">Email Column</Label>
                  <Select
                    value={columnMapping.email}
                    onValueChange={(value) => setColumnMapping({ ...columnMapping, email: value })}
                  >
                    <SelectTrigger id="email-column" data-testid="select-email-column">
                      <SelectValue placeholder="Select column (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {headers.map((header) => (
                        <SelectItem key={header} value={header}>
                          {header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone-column">Phone Column</Label>
                  <Select
                    value={columnMapping.phone}
                    onValueChange={(value) => setColumnMapping({ ...columnMapping, phone: value })}
                  >
                    <SelectTrigger id="phone-column" data-testid="select-phone-column">
                      <SelectValue placeholder="Select column (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {headers.map((header) => (
                        <SelectItem key={header} value={header}>
                          {header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="side-column">Side Column</Label>
                  <Select
                    value={columnMapping.side}
                    onValueChange={(value) => setColumnMapping({ ...columnMapping, side: value })}
                  >
                    <SelectTrigger id="side-column" data-testid="select-side-column">
                      <SelectValue placeholder="Select column (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {headers.map((header) => (
                        <SelectItem key={header} value={header}>
                          {header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="plusone-column">Plus One Column</Label>
                  <Select
                    value={columnMapping.plusOne}
                    onValueChange={(value) => setColumnMapping({ ...columnMapping, plusOne: value })}
                  >
                    <SelectTrigger id="plusone-column" data-testid="select-plusone-column">
                      <SelectValue placeholder="Select column (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {headers.map((header) => (
                        <SelectItem key={header} value={header}>
                          {header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dietary-column">Dietary Restrictions Column</Label>
                  <Select
                    value={columnMapping.dietaryRestrictions}
                    onValueChange={(value) => setColumnMapping({ ...columnMapping, dietaryRestrictions: value })}
                  >
                    <SelectTrigger id="dietary-column" data-testid="select-dietary-column">
                      <SelectValue placeholder="Select column (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {headers.map((header) => (
                        <SelectItem key={header} value={header}>
                          {header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maincontact-column">Main Household Contact Column</Label>
                  <Select
                    value={columnMapping.isMainHouseholdContact}
                    onValueChange={(value) => setColumnMapping({ ...columnMapping, isMainHouseholdContact: value })}
                  >
                    <SelectTrigger id="maincontact-column" data-testid="select-maincontact-column">
                      <SelectValue placeholder="Select column (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {headers.map((header) => (
                        <SelectItem key={header} value={header}>
                          {header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label htmlFor="default-side">Default Side (if not in file)</Label>
                  <Select
                    value={defaultSide}
                    onValueChange={(value) => setDefaultSide(value as 'bride' | 'groom' | 'mutual')}
                  >
                    <SelectTrigger id="default-side" data-testid="select-default-side">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bride">Bride's Side</SelectItem>
                      <SelectItem value="groom">Groom's Side</SelectItem>
                      <SelectItem value="mutual">Mutual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Invite to Events</Label>
                  <div className="flex flex-wrap gap-2">
                    {events.map((event) => (
                      <Button
                        key={event.id}
                        type="button"
                        size="sm"
                        variant={selectedEventIds.includes(event.id) ? "default" : "outline"}
                        onClick={() => {
                          setSelectedEventIds(prev =>
                            prev.includes(event.id)
                              ? prev.filter(id => id !== event.id)
                              : [...prev, event.id]
                          );
                        }}
                        data-testid={`button-event-${event.id}`}
                      >
                        {event.name}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between gap-2">
              <Button variant="outline" onClick={resetDialog} data-testid="button-back">
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={validateAndPreview} disabled={!columnMapping.name} data-testid="button-next">
                Next: Preview
              </Button>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            <div className="bg-muted/50 p-3 rounded-lg flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-primary" />
              <span className="font-semibold">Ready to import {rawData.length} guests</span>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Side</TableHead>
                      <TableHead>Plus One</TableHead>
                      <TableHead>Dietary</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parseGuests().slice(0, 10).map((guest, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{guest.name}</TableCell>
                        <TableCell>{guest.email || '-'}</TableCell>
                        <TableCell>{guest.phone || '-'}</TableCell>
                        <TableCell className="capitalize">{guest.side || defaultSide}</TableCell>
                        <TableCell>{guest.plusOne ? 'Yes' : 'No'}</TableCell>
                        <TableCell>{guest.dietaryRestrictions || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {rawData.length > 10 && (
                <div className="p-3 bg-muted text-sm text-center text-muted-foreground">
                  Showing first 10 of {rawData.length} guests
                </div>
              )}
            </div>

            <div className="flex justify-between gap-2">
              <Button variant="outline" onClick={() => setStep('mapping')} data-testid="button-back-mapping">
                Back
              </Button>
              <Button onClick={handleImport} disabled={importing} data-testid="button-import">
                {importing ? "Importing..." : `Import ${rawData.length} Guests`}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

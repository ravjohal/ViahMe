import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, X, Copy, Check, ClipboardPaste, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
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
  address?: string;
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
  address?: string;
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
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [rawData, setRawData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);
  const [defaultSide, setDefaultSide] = useState<'bride' | 'groom' | 'mutual'>('mutual');
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [importing, setImporting] = useState(false);
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview'>('upload');
  const [copied, setCopied] = useState(false);
  const [pastedData, setPastedData] = useState("");
  const [importMethod, setImportMethod] = useState<'file' | 'paste'>('file');
  const [previewGuests, setPreviewGuests] = useState<ParsedGuest[]>([]);

  const handlePastedData = (text: string) => {
    setPastedData(text);
    if (!text.trim()) return;

    try {
      // Parse TSV/CSV data - Google Sheets copies as TSV
      const lines = text.trim().split('\n');
      if (lines.length < 2) {
        setErrors([{ row: 0, field: 'paste', message: 'Please include a header row and at least one data row' }]);
        return;
      }

      // Detect delimiter (tab for Google Sheets, comma for CSV)
      const firstLine = lines[0];
      const delimiter = firstLine.includes('\t') ? '\t' : ',';

      const parsedRows = lines.map(line => {
        // Handle quoted values with commas
        if (delimiter === ',') {
          const result: string[] = [];
          let current = '';
          let inQuotes = false;
          for (const char of line) {
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              result.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          result.push(current.trim());
          return result;
        }
        return line.split(delimiter).map(cell => cell.trim());
      });

      const headerRow = parsedRows[0];
      const dataRows = parsedRows.slice(1).filter(row => row.some(cell => cell)); // Filter empty rows

      if (dataRows.length === 0) {
        setErrors([{ row: 0, field: 'paste', message: 'No data rows found after header' }]);
        return;
      }

      // Convert to object format like file upload
      const jsonData = dataRows.map(row => {
        const obj: Record<string, string> = {};
        headerRow.forEach((header, index) => {
          obj[header] = row[index] || '';
        });
        return obj;
      });

      setHeaders(headerRow);
      setRawData(jsonData);
      setColumnMapping(autoMapColumns(headerRow));
      setErrors([]);
      setStep('mapping');
    } catch (error) {
      console.error("Error parsing pasted data:", error);
      setErrors([{ row: 0, field: 'paste', message: 'Failed to parse pasted data. Make sure you copied the data correctly.' }]);
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        handlePastedData(text);
      } else {
        toast({
          title: "Clipboard empty",
          description: "Copy your data from Google Sheets first, then click Paste",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Paste failed",
        description: "Please use the text area below to paste your data",
        variant: "destructive",
      });
    }
  };

  const copyTemplateToClipboard = async () => {
    const templateData = [
      ["Household Name", "Name", "Main Contact", "Email", "Phone", "Address", "Side", "Plus One", "Dietary"],
      ["Sharma Family", "Priya Sharma", "Yes", "priya@email.com", "555-123-4567", "123 Main St, San Jose, CA 95123", "bride", "yes", "vegetarian"],
      ["Sharma Family", "Raj Sharma", "No", "", "", "", "bride", "no", ""],
      ["Patel Family", "Rahul Patel", "Yes", "rahul@email.com", "555-987-6543", "456 Oak Ave, Fremont, CA 94536", "groom", "no", ""],
    ];
    
    const tsvContent = templateData.map(row => row.join("\t")).join("\n");
    
    try {
      await navigator.clipboard.writeText(tsvContent);
      setCopied(true);
      toast({
        title: "Template copied",
        description: "Paste it directly into Google Sheets or Excel",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Please try again or manually copy the template",
        variant: "destructive",
      });
    }
  };

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
      else if (lower.includes('address') || lower.includes('street') || lower.includes('location')) mapping.address = header;
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
      // Parse guests and set preview data for editing
      const guests = parseGuests();
      setPreviewGuests(guests);
      setStep('preview');
    }
  };

  const updatePreviewGuest = (index: number, field: keyof ParsedGuest, value: any) => {
    setPreviewGuests(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const removePreviewGuest = (index: number) => {
    setPreviewGuests(prev => prev.filter((_, i) => i !== index));
  };

  const parseGuests = (): ParsedGuest[] => {
    return rawData.map((row) => {
      const householdValue = columnMapping.householdName && columnMapping.householdName !== 'none' 
        ? row[columnMapping.householdName] 
        : undefined;
      
      const guest: ParsedGuest = {
        name: columnMapping.name ? row[columnMapping.name]?.toString().trim() : '',
        email: columnMapping.email && row[columnMapping.email] ? row[columnMapping.email].toString().trim() : undefined,
        phone: columnMapping.phone && row[columnMapping.phone] ? row[columnMapping.phone].toString().trim() : undefined,
        address: columnMapping.address && row[columnMapping.address] ? row[columnMapping.address].toString().trim() : undefined,
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
        householdName: householdValue ? householdValue.toString().trim() : undefined,
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
      // Debug: log what we're sending
      console.log("Importing guests with data:", JSON.stringify(previewGuests.slice(0, 2), null, 2));
      console.log("Column mapping:", columnMapping);
      
      // Use previewGuests which may have been edited by the user
      await onImport(previewGuests);
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
    setPastedData("");
    setImportMethod('file');
    setPreviewGuests([]);
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
            Upload a CSV, Excel, or Google Sheets export containing your guest list
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
            <Tabs value={importMethod} onValueChange={(v) => setImportMethod(v as 'file' | 'paste')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="file" data-testid="tab-file-upload">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload File
                </TabsTrigger>
                <TabsTrigger value="paste" data-testid="tab-paste">
                  <ClipboardPaste className="w-4 h-4 mr-2" />
                  Paste from Sheets
                </TabsTrigger>
              </TabsList>

              <TabsContent value="file" className="space-y-4">
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
              </TabsContent>

              <TabsContent value="paste" className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handlePasteFromClipboard}
                      variant="outline"
                      className="flex-1"
                      data-testid="button-paste-clipboard"
                    >
                      <ClipboardPaste className="w-4 h-4 mr-2" />
                      Paste from Clipboard
                    </Button>
                  </div>
                  <div className="text-center text-sm text-muted-foreground">or paste directly below</div>
                  <Textarea
                    placeholder="Select your data in Google Sheets (including headers), copy it (Ctrl+C / Cmd+C), then paste here (Ctrl+V / Cmd+V)"
                    value={pastedData}
                    onChange={(e) => setPastedData(e.target.value)}
                    className="min-h-[150px] font-mono text-sm"
                    data-testid="textarea-paste-data"
                  />
                  {pastedData && (
                    <Button
                      onClick={() => handlePastedData(pastedData)}
                      className="w-full"
                      data-testid="button-process-paste"
                    >
                      Process Pasted Data
                    </Button>
                  )}
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <h4 className="font-semibold text-sm mb-2">How to copy from Google Sheets:</h4>
                  <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>Open your Google Sheet with guest data</li>
                    <li>Select all cells including the header row</li>
                    <li>Copy (Ctrl+C on Windows, Cmd+C on Mac)</li>
                    <li>Click "Paste from Clipboard" above or paste in the text area</li>
                  </ol>
                </div>
              </TabsContent>
            </Tabs>

            <div className="bg-muted/50 p-4 rounded-lg space-y-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">File Format Guidelines:</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Include a header row with column names</li>
                  <li>Required: <strong>Name</strong> column</li>
                  <li>Optional: Household Name, Main Contact, Email, Phone, Address, Side (bride/groom/mutual), Plus One (yes/no), Dietary Restrictions</li>
                  <li><strong>Household Name</strong>: Group guests together by using the same household name</li>
                  <li><strong>Main Contact</strong>: Mark one person per household as the main point of contact (yes/no)</li>
                  <li>Side values: "bride", "groom", or "mutual"</li>
                  <li>Plus One / Main Contact: "yes", "no", "true", "false", "1", or "0"</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm">Example Format:</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyTemplateToClipboard}
                    data-testid="button-copy-template"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Template
                      </>
                    )}
                  </Button>
                </div>
                <div className="border rounded-lg overflow-hidden bg-background overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="text-xs font-semibold">Household Name</TableHead>
                        <TableHead className="text-xs font-semibold">Name</TableHead>
                        <TableHead className="text-xs font-semibold">Main Contact</TableHead>
                        <TableHead className="text-xs font-semibold">Email</TableHead>
                        <TableHead className="text-xs font-semibold">Phone</TableHead>
                        <TableHead className="text-xs font-semibold">Address</TableHead>
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
                        <TableCell className="text-xs">123 Main St, San Jose</TableCell>
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
                        <TableCell className="text-xs">456 Oak Ave, Fremont</TableCell>
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
                  <Label htmlFor="address-column">Address Column</Label>
                  <Select
                    value={columnMapping.address}
                    onValueChange={(value) => setColumnMapping({ ...columnMapping, address: value })}
                  >
                    <SelectTrigger id="address-column" data-testid="select-address-column">
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
            <div className="bg-muted/50 p-3 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-primary" />
                <span className="font-semibold">Review and edit {previewGuests.length} guests before importing</span>
              </div>
              <span className="text-sm text-muted-foreground">Click any field to edit</span>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <div className="max-h-[400px] overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead className="w-8"></TableHead>
                      <TableHead className="min-w-[140px]">Name</TableHead>
                      <TableHead className="min-w-[120px]">Household</TableHead>
                      <TableHead className="min-w-[160px]">Email</TableHead>
                      <TableHead className="min-w-[120px]">Phone</TableHead>
                      <TableHead className="min-w-[180px]">Address</TableHead>
                      <TableHead className="min-w-[90px]">Side</TableHead>
                      <TableHead className="min-w-[70px]">+1</TableHead>
                      <TableHead className="min-w-[120px]">Dietary</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewGuests.map((guest, index) => (
                      <TableRow key={index}>
                        <TableCell className="p-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => removePreviewGuest(index)}
                            data-testid={`button-remove-guest-${index}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                        <TableCell className="p-1">
                          <Input
                            value={guest.name}
                            onChange={(e) => updatePreviewGuest(index, 'name', e.target.value)}
                            className="h-8 text-sm"
                            data-testid={`input-name-${index}`}
                          />
                        </TableCell>
                        <TableCell className="p-1">
                          <Input
                            value={guest.householdName || ''}
                            onChange={(e) => updatePreviewGuest(index, 'householdName', e.target.value || undefined)}
                            placeholder="Household"
                            className="h-8 text-sm"
                            data-testid={`input-household-${index}`}
                          />
                        </TableCell>
                        <TableCell className="p-1">
                          <Input
                            value={guest.email || ''}
                            onChange={(e) => updatePreviewGuest(index, 'email', e.target.value || undefined)}
                            placeholder="Email"
                            className="h-8 text-sm"
                            data-testid={`input-email-${index}`}
                          />
                        </TableCell>
                        <TableCell className="p-1">
                          <Input
                            value={guest.phone || ''}
                            onChange={(e) => updatePreviewGuest(index, 'phone', e.target.value || undefined)}
                            placeholder="Phone"
                            className="h-8 text-sm"
                            data-testid={`input-phone-${index}`}
                          />
                        </TableCell>
                        <TableCell className="p-1">
                          <Input
                            value={guest.address || ''}
                            onChange={(e) => updatePreviewGuest(index, 'address', e.target.value || undefined)}
                            placeholder="Address"
                            className="h-8 text-sm"
                            data-testid={`input-address-${index}`}
                          />
                        </TableCell>
                        <TableCell className="p-1">
                          <Select
                            value={guest.side || defaultSide}
                            onValueChange={(value) => updatePreviewGuest(index, 'side', value as 'bride' | 'groom' | 'mutual')}
                          >
                            <SelectTrigger className="h-8 text-sm" data-testid={`select-side-${index}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="bride">Bride</SelectItem>
                              <SelectItem value="groom">Groom</SelectItem>
                              <SelectItem value="mutual">Mutual</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="p-1 text-center">
                          <Checkbox
                            checked={guest.plusOne || false}
                            onCheckedChange={(checked) => updatePreviewGuest(index, 'plusOne', !!checked)}
                            data-testid={`checkbox-plusone-${index}`}
                          />
                        </TableCell>
                        <TableCell className="p-1">
                          <Input
                            value={guest.dietaryRestrictions || ''}
                            onChange={(e) => updatePreviewGuest(index, 'dietaryRestrictions', e.target.value || undefined)}
                            placeholder="Dietary"
                            className="h-8 text-sm"
                            data-testid={`input-dietary-${index}`}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="flex justify-between gap-2">
              <Button variant="outline" onClick={() => setStep('mapping')} data-testid="button-back-mapping">
                Back
              </Button>
              <Button 
                onClick={handleImport} 
                disabled={importing || previewGuests.length === 0} 
                data-testid="button-import"
              >
                {importing ? "Importing..." : `Import ${previewGuests.length} Guests`}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

'use client'

import { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FolderOpen, FileText, Download, AlertCircle, CheckCircle2, Scan, Image, AlertTriangle, HardDrive, Users } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface MonthReport {
  month: string
  groups: {
    [key: string]: {
      path: string
      files: Array<{ name: string; type: 'pdf' | 'image'; file: File }>
    }
  }
  errors: string[]
  totalFiles: number
  hasChanges?: boolean
  previousScanDate?: string
}

interface ScanResult {
  year: string
  monthReports: MonthReport[]
  totalFiles: number
  scanTimestamp: string
}

interface PersonData {
  name: string
  months: string[]
}

interface PersonFileData {
  name: string
  months: string[]
  isSimple: boolean // true if just "MM_YYYY NAME.pdf", false if has extra text
  fullFilenames: string[] // Track all filenames for this person
}


export default function PDFCompilerPage() {
  const [year, setYear] = useState('2025')
  const [selectedMonths, setSelectedMonths] = useState<string[]>([])
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [rhDirectoryHandle, setRhDirectoryHandle] = useState<any>(null)
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; month: string; groupCount: number } | null>(null)
  const { toast } = useToast()

  const [availableMonthsForFinal, setAvailableMonthsForFinal] = useState<string[]>([])
  const [selectedMonthsForFinal, setSelectedMonthsForFinal] = useState<string[]>([])
  const [personsData, setPersonsData] = useState<PersonFileData[]>([]) // Changed to PersonFileData
  const [selectedPersons, setSelectedPersons] = useState<string[]>([])
  const [isScanningPersons, setIsScanningPersons] = useState(false)
  const [isJoiningFinal, setIsJoiningFinal] = useState(false)
  const [hasAutoScanned, setHasAutoScanned] = useState(false)
  const [activeTab, setActiveTab] = useState('base')
  const rhHandleVersionRef = useRef(0)


  const months = Array.from({ length: 12 }, (_, i) => {
    const monthNum = String(i + 1).padStart(2, '0')
    return `${monthNum}_${year}`
  })

  const toggleMonth = (month: string) => {
    setSelectedMonths(prev =>
      prev.includes(month)
        ? prev.filter(m => m !== month)
        : [...prev, month]
    )
  }

  const handleSelectRHFolder = async () => {
    try {
      const dirHandle = await window.showDirectoryPicker({
        mode: 'readwrite'
      })

      rhHandleVersionRef.current += 1
      setRhDirectoryHandle(dirHandle)
      setAvailableMonthsForFinal([])
      setSelectedMonthsForFinal([])
      setPersonsData([])
      setSelectedPersons([])
      setHasAutoScanned(false)
      
      toast({
        title: 'Pasta Selecionada',
        description: `Pasta RH: ${dirHandle.name}`,
      })
      
      console.log('[v0] Selected RH folder:', dirHandle.name)
    } catch (error) {
      console.error('[v0] Error selecting folder:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao selecionar pasta. Use Chrome ou Edge.',
        variant: 'destructive'
      })
    }
  }

  const handleScan = async () => {
    if (!rhDirectoryHandle) {
      toast({
        title: 'Erro',
        description: 'Por favor, selecione a pasta RH primeiro.',
        variant: 'destructive'
      })
      return
    }

    if (selectedMonths.length === 0) {
      toast({
        title: 'Erro',
        description: 'Por favor, selecione pelo menos um mês.',
        variant: 'destructive'
      })
      return
    }

    setIsScanning(true)

    try {
      const scanTimestamp = new Date().toISOString()
      const monthReports: MonthReport[] = []
      let totalFiles = 0

      for (const month of selectedMonths) {
        const groups: { [key: string]: { path: string; files: Array<{ name: string; type: 'pdf' | 'image'; file: File }> } } = {}
        const errors: string[] = []
        let monthTotalFiles = 0

        for (let i = 2; i <= 13; i++) {
          const groupKey = i.toString()
          
          try {
            const groupDirHandle = await rhDirectoryHandle.getDirectoryHandle(groupKey)
            const monthDirHandle = await groupDirHandle.getDirectoryHandle(month)
            
            const files: Array<{ name: string; type: 'pdf' | 'image'; file: File }> = []
            
            for await (const entry of monthDirHandle.values()) {
              if (entry.kind === 'file') {
                const file = await entry.getFile()
                const ext = file.name.split('.').pop()?.toLowerCase()
                if (ext === 'pdf' || ext === 'jpg' || ext === 'jpeg' || ext === 'png') {
                  files.push({
                    name: file.name,
                    type: ext === 'pdf' ? 'pdf' : 'image',
                    file: file
                  })
                }
              }
            }
            
            if (files.length > 0) {
              groups[groupKey] = {
                path: `RH/${groupKey}/${month}`,
                files
              }
              monthTotalFiles += files.length
            } else {
              errors.push(`Grupo ${i} sem ficheiros PDF/imagens válidos: RH/${i}/${month}`)
            }
          } catch (error) {
            errors.push(`Grupo ${i} não encontrado ou vazio: RH/${i}/${month}`)
          }
        }

        const previousScan = loadPreviousScanFromStorage(year, month)
        let hasChanges = false
        let previousScanDate: string | undefined

        if (previousScan) {
          previousScanDate = previousScan.scanDate
          hasChanges = detectChanges(previousScan.groups, groups)
        } else {
          hasChanges = true
        }

        saveScanStateToStorage(year, month, {
          scanDate: scanTimestamp,
          groups: Object.keys(groups).reduce((acc, key) => {
            acc[key] = {
              path: groups[key].path,
              files: groups[key].files.map(f => ({ name: f.name, type: f.type }))
            }
            return acc
          }, {} as any),
          totalFiles: monthTotalFiles
        })

        monthReports.push({
          month,
          groups,
          errors,
          totalFiles: monthTotalFiles,
          hasChanges,
          previousScanDate
        })

        totalFiles += monthTotalFiles
      }

      setScanResult({
        year,
        monthReports,
        totalFiles,
        scanTimestamp
      })

      const changedMonths = monthReports.filter(m => m.hasChanges).length
      if (changedMonths > 0) {
        toast({
          title: 'Scan Completo - Alterações Detectadas!',
          description: `${changedMonths} mês(es) com alterações. Total: ${totalFiles} ficheiros.`,
          variant: 'default'
        })
      } else {
        toast({
          title: 'Scan Completo',
          description: `${totalFiles} ficheiros encontrados. Nenhuma alteração detectada.`
        })
      }
    } catch (error) {
      console.error('[v0] Error scanning:', error)
      toast({
        title: 'Erro',
        description: `Erro ao fazer scan: ${(error as Error).message}`,
        variant: 'destructive'
      })
    } finally {
      setIsScanning(false)
    }
  }

  const handleJoinMonth = async (month: string, skipValidation = false) => {
    console.log('[v0] handleJoinMonth called for month:', month)
    
    if (!scanResult) {
      console.log('[v0] No scan result available')
      return
    }

    const monthReport = scanResult.monthReports.find(m => m.month === month)
    if (!monthReport) {
      console.log('[v0] Month report not found for:', month)
      return
    }

    if (!skipValidation) {
      const validation = validateMonthData(monthReport)
      if (!validation.valid) {
        setConfirmDialog({
          open: true,
          month: month,
          groupCount: validation.groupCount
        })
        return
      }
    }

    setIsJoining(true)

    try {
      const allFiles: File[] = []
      const groupKeys = Object.keys(monthReport.groups).sort((a, b) => parseInt(a) - parseInt(b))
      
      console.log('[v0] Processing groups:', groupKeys)
      
      for (const groupKey of groupKeys) {
        for (const fileData of monthReport.groups[groupKey].files) {
          allFiles.push(fileData.file)
        }
      }

      console.log('[v0] Total files to process:', allFiles.length)

      const filesData = []
      for (let i = 0; i < allFiles.length; i++) {
        const file = allFiles[i]
        console.log(`[v0] Processing file ${i + 1}/${allFiles.length}:`, file.name)
        
        try {
          const buffer = await file.arrayBuffer()
          const bytes = new Uint8Array(buffer)
          let binary = ''
          const chunkSize = 8192
          
          for (let j = 0; j < bytes.length; j += chunkSize) {
            const chunk = bytes.slice(j, Math.min(j + chunkSize, bytes.length))
            binary += String.fromCharCode(...chunk)
          }
          
          const base64 = btoa(binary)
          
          filesData.push({
            name: file.name,
            data: base64,
            type: file.type
          })
          
          console.log(`[v0] Successfully processed: ${file.name}`)
        } catch (error) {
          console.error('[v0] Error processing file:', file.name, error)
          throw new Error(`Erro ao processar ${file.name}: ${(error as Error).message}`)
        }
      }

      console.log('[v0] All files converted, sending to API')

      const response = await fetch('/api/rh/join/base', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          year, 
          months: [month],
          files: filesData
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[v0] API error:', errorText)
        throw new Error(`Erro ao fazer join: ${errorText}`)
      }

      console.log('[v0] API call successful, saving to folder 14')

      const blob = await response.blob()
      const filename = `base_${month}.pdf`

      try {
        const folder14Handle = await rhDirectoryHandle.getDirectoryHandle('14', { create: true })
        const fileHandle = await folder14Handle.getFileHandle(filename, { create: true })
        const writable = await fileHandle.createWritable()
        await writable.write(blob)
        await writable.close()
        
        console.log('[v0] PDF saved to folder 14:', filename)
        
        toast({
          title: 'Sucesso!',
          description: `PDF salvo em RH/14/${filename}`,
        })
      } catch (error) {
        console.error('[v0] Error saving to folder 14:', error)
        throw new Error(`Erro ao salvar em pasta 14: ${(error as Error).message}`)
      }

    } catch (error) {
      console.error('[v0] Error joining PDFs:', error)
      toast({
        title: 'Erro',
        description: `Erro ao compilar: ${(error as Error).message}`,
        variant: 'destructive'
      })
    } finally {
      console.log('[v0] handleJoinMonth finished')
      setIsJoining(false)
    }
  }

  const handleJoinAll = async () => {
    if (!scanResult) {
      toast({
        title: 'Erro',
        description: 'Faça primeiro um scan dos meses.',
        variant: 'destructive'
      })
      return
    }

    const invalidMonths: string[] = []
    for (const monthReport of scanResult.monthReports) {
      const validation = validateMonthData(monthReport)
      if (!validation.valid) {
        invalidMonths.push(`${monthReport.month} (${validation.groupCount}/12 grupos)`)
      }
    }

    if (invalidMonths.length > 0) {
      toast({
        title: 'Aviso - Dados Insuficientes',
        description: `Os seguintes meses não têm dados suficientes e serão omitidos: ${invalidMonths.join(', ')}`,
        variant: 'destructive'
      })
      
      const validMonths = scanResult.monthReports.filter(m => validateMonthData(m).valid)
      
      if (validMonths.length === 0) {
        toast({
          title: 'Erro',
          description: 'Nenhum mês tem dados suficientes para compilar.',
          variant: 'destructive'
        })
        return
      }
    }

    setIsJoining(true)

    try {
      let successCount = 0
      let failCount = 0
      let skippedCount = 0

      for (const monthReport of scanResult.monthReports) {
        const validation = validateMonthData(monthReport)
        if (!validation.valid) {
          console.log(`[v0] Skipping month ${monthReport.month} - insufficient data (${validation.groupCount}/12 groups)`)
          skippedCount++
          continue
        }

        try {
          console.log(`[v0] Processing month: ${monthReport.month}`)
          
          const allFiles: File[] = []
          const groupKeys = Object.keys(monthReport.groups).sort((a, b) => parseInt(a) - parseInt(b))
          
          for (const groupKey of groupKeys) {
            for (const fileData of monthReport.groups[groupKey].files) {
              allFiles.push(fileData.file)
            }
          }

          console.log(`[v0] Total files for ${monthReport.month}:`, allFiles.length)

          const filesData = []
          for (const file of allFiles) {
            const buffer = await file.arrayBuffer()
            const bytes = new Uint8Array(buffer)
            let binary = ''
            const chunkSize = 8192
            
            for (let j = 0; j < bytes.length; j += chunkSize) {
              const chunk = bytes.slice(j, Math.min(j + chunkSize, bytes.length))
              binary += String.fromCharCode(...chunk)
            }
            
            const base64 = btoa(binary)
            
            filesData.push({
              name: file.name,
              data: base64,
              type: file.type
            })
          }

          const response = await fetch('/api/rh/join/base', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              year, 
              months: [monthReport.month],
              files: filesData
            })
          })

          if (!response.ok) {
            throw new Error(`Erro ao fazer join do mês ${monthReport.month}`)
          }

          const blob = await response.blob()
          const filename = `base_${monthReport.month}.pdf`

          const folder14Handle = await rhDirectoryHandle.getDirectoryHandle('14', { create: true })
          const fileHandle = await folder14Handle.getFileHandle(filename, { create: true })
          const writable = await fileHandle.createWritable()
          await writable.write(blob)
          await writable.close()
          
          console.log(`[v0] PDF saved for ${monthReport.month}:`, filename)
          successCount++
          
        } catch (error) {
          console.error(`[v0] Error processing month ${monthReport.month}:`, error)
          failCount++
        }
      }

      toast({
        title: 'Join All Completo!',
        description: `${successCount} PDF(s) criado(s) em RH/14/. ${skippedCount > 0 ? `${skippedCount} omitido(s). ` : ''}${failCount > 0 ? `${failCount} falharam.` : ''}`,
      })

    } catch (error) {
      console.error('[v0] Error in Join All:', error)
      toast({
        title: 'Erro',
        description: `Erro ao compilar: ${(error as Error).message}`,
        variant: 'destructive'
      })
    } finally {
      setIsJoining(false)
    }
  }

  const getFileIcon = (type: 'pdf' | 'image') => {
    return type === 'pdf' ? (
      <FileText className="h-4 w-4 text-red-500 flex-shrink-0" />
    ) : (
      <Image className="h-4 w-4 text-blue-500 flex-shrink-0" />
    )
  }

  const validateMonthData = (monthReport: MonthReport): { valid: boolean; groupCount: number; totalGroups: number } => {
    const totalGroups = 12
    const groupCount = Object.keys(monthReport.groups).length
    const minRequired = Math.ceil(totalGroups / 2)
    
    return {
      valid: groupCount >= minRequired,
      groupCount,
      totalGroups
    }
  }

  const scanFolder14 = async () => {
    if (!rhDirectoryHandle) {
      toast({
        title: 'Erro',
        description: 'Por favor, selecione a pasta RH primeiro.',
        variant: 'destructive'
      })
      return
    }

    const versionAtStart = rhHandleVersionRef.current

    try {
      const folder14Handle = await rhDirectoryHandle.getDirectoryHandle('14')
      const availableMonths: string[] = []

      for await (const entry of folder14Handle.values()) {
        if (entry.kind === 'file' && entry.name.startsWith('base_') && entry.name.endsWith('.pdf')) {
          const month = entry.name.replace('base_', '').replace('.pdf', '')
          availableMonths.push(month)
        }
      }

      availableMonths.sort()
      if (versionAtStart !== rhHandleVersionRef.current) {
        return
      }
      setAvailableMonthsForFinal(availableMonths)
      setHasAutoScanned(true)

      if (availableMonths.length === 0) {
        toast({
          title: 'Nenhum Base PDF',
          description: 'Não foram encontrados base PDFs na pasta 14. Execute primeiro o Base Join.',
          variant: 'destructive'
        })
      } else {
        toast({
          title: 'Scan Completo',
          description: `${availableMonths.length} base PDF(s) encontrado(s) na pasta 14.`
        })
      }
    } catch (error) {
      if (versionAtStart !== rhHandleVersionRef.current) {
        return
      }

      console.error('[v0] Error scanning folder 14:', error)
      toast({
        title: 'Erro',
        description: 'Pasta 14 não encontrada. Execute primeiro o Base Join.',
        variant: 'destructive'
      })
    }
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)
  }

  const handleScanPersons = async () => {
    if (!rhDirectoryHandle) {
      toast({
        title: 'Erro',
        description: 'Por favor, selecione a pasta RH primeiro.',
        variant: 'destructive'
      })
      return
    }

    if (selectedMonthsForFinal.length === 0) {
      toast({
        title: 'Erro',
        description: 'Por favor, selecione pelo menos um mês.',
        variant: 'destructive'
      })
      return
    }

    setIsScanningPersons(true)

    try {
      const folder1Handle = await rhDirectoryHandle.getDirectoryHandle('1')
      const personsMap = new Map<string, { months: Set<string>, filenames: string[] }>()

      for (const month of selectedMonthsForFinal) {
        try {
          const monthHandle = await folder1Handle.getDirectoryHandle(month)

          for await (const entry of monthHandle.values()) {
            if (entry.kind === 'file' && entry.name.endsWith('.pdf')) {
              const match = entry.name.match(/^\d{2}_\d{4}\s+(.+)\.pdf$/)
              if (match) {
                const personName = match[1]
                  .replace(/\d+/g, '')
                  .replace(/\s+/g, ' ')
                  .trim()

                if (!personsMap.has(personName)) {
                  personsMap.set(personName, { months: new Set(), filenames: [] })
                }
                personsMap.get(personName)!.months.add(month)
                personsMap.get(personName)!.filenames.push(entry.name)
              }
            }
          }
        } catch (error) {
          console.log(`[v0] Month folder ${month} not found in folder 1`)
        }
      }

      const calculateSimilarity = (str1: string, str2: string): number => {
        const longer = str1.length > str2.length ? str1 : str2
        const shorter = str1.length > str2.length ? str2 : str1
        
        if (longer.length === 0) return 1.0
        
        let matches = 0
        for (let i = 0; i < shorter.length; i++) {
          if (longer.includes(shorter[i])) {
            matches++
          }
        }
        
        return matches / longer.length
      }

      const sortedNames = Array.from(personsMap.keys()).sort()
      
      const persons: PersonFileData[] = sortedNames.map((name, index) => {
        let isComplex = false
        
        // Check previous name
        if (index > 0) {
          const prevName = sortedNames[index - 1]
          const similarity = calculateSimilarity(name, prevName)
          if (similarity > 0.3) {
            isComplex = true
          }
        }
        
        // Check next name
        if (index < sortedNames.length - 1) {
          const nextName = sortedNames[index + 1]
          const similarity = calculateSimilarity(name, nextName)
          if (similarity > 0.3) {
            isComplex = true
          }
        }
        
        const data = personsMap.get(name)!
        return {
          name,
          months: Array.from(data.months).sort(),
          isSimple: !isComplex,
          fullFilenames: data.filenames
        }
      })

      setPersonsData(persons)

      const folder15Handle = await rhDirectoryHandle.getDirectoryHandle('15', { create: true })
      const personsFileHandle = await folder15Handle.getFileHandle('persons.json', { create: true })
      const writable = await personsFileHandle.createWritable()
      await writable.write(JSON.stringify(persons, null, 2))
      await writable.close()

      toast({
        title: 'Scan Completo',
        description: `${persons.length} pessoa(s) encontrada(s). Lista salva em RH/15/persons.json`
      })

    } catch (error) {
      console.error('[v0] Error scanning persons:', error)
      toast({
        title: 'Erro',
        description: `Erro ao fazer scan: ${(error as Error).message}`,
        variant: 'destructive'
      })
    } finally {
      setIsScanningPersons(false)
    }
  }

  const toggleMonthForFinal = (month: string) => {
    setSelectedMonthsForFinal(prev =>
      prev.includes(month) ? prev.filter(m => m !== month) : [...prev, month]
    )
  }

  const togglePerson = (personName: string) => {
    setSelectedPersons(prev =>
      prev.includes(personName) ? prev.filter(p => p !== personName) : [...prev, personName]
    )
  }

  const selectAllPersons = () => {
    setSelectedPersons(personsData.map(p => p.name))
  }

  const deselectAllPersons = () => {
    setSelectedPersons([])
  }

  const handleJoinFinal = async () => {
    if (selectedPersons.length === 0) {
      toast({
        title: 'Erro',
        description: 'Selecione pelo menos uma pessoa.',
        variant: 'destructive'
      })
      return
    }

    if (selectedMonthsForFinal.length === 0) {
      toast({
        title: 'Erro',
        description: 'Selecione pelo menos um mês.',
        variant: 'destructive'
      })
      return
    }

    setIsJoiningFinal(true)

    try {
      let successCount = 0
      let failCount = 0

      const folder1Handle = await rhDirectoryHandle.getDirectoryHandle('1')
      const folder14Handle = await rhDirectoryHandle.getDirectoryHandle('14')
      const folder15Handle = await rhDirectoryHandle.getDirectoryHandle('15', { create: true })

      for (const person of selectedPersons) {
        const personData = personsData.find(p => p.name === person)
        if (!personData) continue

        const personFolderHandle = await folder15Handle.getDirectoryHandle(person, { create: true })

        for (const month of selectedMonthsForFinal) {
          if (!personData.months.includes(month)) {
            console.log(`[v0] Skipping ${person} - ${month}: no document found`)
            continue
          }

          try {
            console.log(`[v0] Processing ${person} - ${month}`)

            const baseFileHandle = await folder14Handle.getFileHandle(`base_${month}.pdf`)
            const baseFile = await baseFileHandle.getFile()
            const baseBuffer = await baseFile.arrayBuffer()
            const baseBytes = new Uint8Array(baseBuffer)
            let baseBinary = ''
            const chunkSize = 8192
            for (let j = 0; j < baseBytes.length; j += chunkSize) {
              const chunk = baseBytes.slice(j, Math.min(j + chunkSize, baseBytes.length))
              baseBinary += String.fromCharCode(...chunk)
            }
            const baseBase64 = btoa(baseBinary)

            const monthFolderHandle = await folder1Handle.getDirectoryHandle(month)
            let personFile: File | null = null

            for await (const entry of monthFolderHandle.values()) {
              if (entry.kind === 'file' && entry.name.includes(person) && entry.name.endsWith('.pdf')) {
                personFile = await entry.getFile()
                break
              }
            }

            if (!personFile) {
              console.log(`[v0] Person file not found for ${person} in ${month}`)
              failCount++
              continue
            }

            const personBuffer = await personFile.arrayBuffer()
            const personBytes = new Uint8Array(personBuffer)
            let personBinary = ''
            for (let j = 0; j < personBytes.length; j += chunkSize) {
              const chunk = personBytes.slice(j, Math.min(j + chunkSize, personBytes.length))
              personBinary += String.fromCharCode(...chunk)
            }
            const personBase64 = btoa(personBinary)

            const response = await fetch('/api/rh/join/final', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                baseFile: { name: `base_${month}.pdf`, data: baseBase64 },
                personFile: { name: personFile.name, data: personBase64 },
                personName: person,
                month
              })
            })

            if (!response.ok) {
              throw new Error(`API error for ${person} - ${month}`)
            }

            const blob = await response.blob()
            const sanitizedName = person.replace(/[^a-zA-Z0-9]/g, '_')
            const filename = `final_${month}_${sanitizedName}.pdf`

            const monthFolderInPersonHandle = await personFolderHandle.getDirectoryHandle(month, { create: true })
            const finalFileHandle = await monthFolderInPersonHandle.getFileHandle(filename, { create: true })
            const writable = await finalFileHandle.createWritable()
            await writable.write(blob)
            await writable.close()

            console.log(`[v0] Final PDF saved: RH/15/${person}/${month}/${filename}`)
            successCount++

          } catch (error) {
            console.error(`[v0] Error processing ${person} - ${month}:`, error)
            failCount++
          }
        }
      }

      toast({
        title: 'Final Join Completo!',
        description: `${successCount} PDF(s) final criado(s) em RH/15/. ${failCount > 0 ? `${failCount} falharam.` : ''}`,
      })

    } catch (error) {
      console.error('[v0] Error in Final Join:', error)
      toast({
        title: 'Erro',
        description: `Erro ao compilar: ${(error as Error).message}`,
        variant: 'destructive'
      })
    } finally {
      setIsJoiningFinal(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'final' && rhDirectoryHandle) {
      scanFolder14()
    }
  }, [activeTab, rhDirectoryHandle])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
            PDFCompile - Agix RH
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300">
            Sistema automático de compilação de documentos RH para projetos financiados
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              Seleção de Pasta RH
            </CardTitle>
            <CardDescription>
              Selecione a pasta raiz RH que contém a estrutura: RH/{'{group}'}/{'{month}'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={handleSelectRHFolder}>
                <FolderOpen className="mr-2 h-4 w-4" />
                Selecionar Pasta RH
              </Button>
              {rhDirectoryHandle && (
                <Badge variant="secondary" className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Pasta: {rhDirectoryHandle.name}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Added onValueChange prop to Tabs for auto-scanning */}
        <Tabs defaultValue="base" className="w-full" onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="base">Base Join (Grupos 2-13)</TabsTrigger>
            <TabsTrigger value="final">Final Join (Pasta 1)</TabsTrigger>
          </TabsList>

          <TabsContent value="base" className="mt-6">
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Scan className="h-5 w-5" />
                    Controlo de Operações
                  </CardTitle>
                  <CardDescription>
                    Selecione o ano e meses (grupos 2-13)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="year">Ano</Label>
                    <Select value={year} onValueChange={setYear}>
                      <SelectTrigger id="year">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2024">2024</SelectItem>
                        <SelectItem value="2025">2025</SelectItem>
                        <SelectItem value="2026">2026</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Meses ({selectedMonths.length} selecionados)</Label>
                    <div className="max-h-48 overflow-y-auto border rounded-lg p-2 space-y-2">
                      {months.map(month => (
                        <div key={month} className="flex items-center space-x-2">
                          <Checkbox
                            id={month}
                            checked={selectedMonths.includes(month)}
                            onCheckedChange={() => toggleMonth(month)}
                          />
                          <label
                            htmlFor={month}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {month}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2 pt-4 border-t">
                    <Button
                      onClick={handleScan}
                      disabled={!rhDirectoryHandle || selectedMonths.length === 0 || isScanning}
                      className="w-full"
                      variant="outline"
                    >
                      {isScanning ? (
                        <>Analisando...</>
                      ) : (
                        <>
                          <Scan className="mr-2 h-4 w-4" />
                          Scan Meses
                        </>
                      )}
                    </Button>

                    <Button
                      onClick={handleJoinAll}
                      disabled={!scanResult || isJoining}
                      className="w-full"
                    >
                      {isJoining ? (
                        <>Compilando...</>
                      ) : (
                        <>
                          <Download className="mr-2 h-4 w-4" />
                          Join All Meses
                        </>
                      )}
                    </Button>
                  </div>

                  {scanResult && (
                    <div className="mt-4 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg space-1">
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Último Scan</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {new Date(scanResult.scanTimestamp).toLocaleString('pt-PT')}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {scanResult.monthReports.length} mês(es) • {scanResult.totalFiles} ficheiros
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FolderOpen className="h-5 w-5" />
                    Resultados do Scan
                    {scanResult && ` - ${scanResult.totalFiles} ficheiros`}
                  </CardTitle>
                  <CardDescription>
                    Grupos 2-13 • PDFs e imagens organizados por mês (Grupo 1 omitido)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!scanResult ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <FolderOpen className="h-16 w-16 text-slate-400 mb-4" />
                      <p className="text-slate-500 dark:text-slate-400">
                        Nenhum scan realizado
                      </p>
                      <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">
                        Selecione a pasta RH, escolha o ano e meses, depois clique em "Scan Meses"
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {scanResult.monthReports.map((monthReport) => (
                        <Card key={monthReport.month} className="border-2">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <CardTitle className="text-lg">Mês {monthReport.month}</CardTitle>
                                {monthReport.hasChanges && (
                                  <Badge variant="destructive" className="flex items-center gap-1">
                                    <AlertTriangle className="h-3 w-3" />
                                    Alterações Detectadas
                                  </Badge>
                                )}
                              </div>
                              <Button
                                size="sm"
                                onClick={() => handleJoinMonth(monthReport.month)}
                                disabled={isJoining || monthReport.totalFiles === 0}
                              >
                                <Download className="mr-2 h-4 w-4" />
                                Join Base
                              </Button>
                            </div>
                            <CardDescription>
                              {monthReport.totalFiles} ficheiros • {Object.keys(monthReport.groups).length} grupos
                              {monthReport.previousScanDate && (
                                <span className="ml-2 text-xs">
                                  (Último scan: {new Date(monthReport.previousScanDate).toLocaleString('pt-PT')})
                                </span>
                              )}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {monthReport.errors.length > 0 && (
                              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                <div className="flex items-start gap-2">
                                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                                  <div className="space-y-1">
                                    <p className="text-sm font-semibold text-red-800 dark:text-red-300">
                                      Erros de Estrutura
                                    </p>
                                    {monthReport.errors.map((error, idx) => (
                                      <p key={idx} className="text-xs text-red-700 dark:text-red-400">
                                        {error}
                                      </p>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}

                            <div className="space-y-3 max-h-64 overflow-y-auto">
                              {Object.keys(monthReport.groups)
                                .sort((a, b) => parseInt(a) - parseInt(b))
                                .map(group => (
                                  <div key={group} className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                                      Grupo {group} ({monthReport.groups[group].files.length} ficheiros)
                                    </div>
                                    <div className="pl-6 space-y-1">
                                      {monthReport.groups[group].files.map((file, idx) => (
                                        <div
                                          key={idx}
                                          className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded text-xs"
                                        >
                                          {getFileIcon(file.type)}
                                          <span className="truncate">{file.name}</span>
                                          <span className="ml-auto text-slate-500 uppercase text-[10px]">
                                            {file.type}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="final" className="mt-6">
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Controlo Final Join
                  </CardTitle>
                  <CardDescription>
                    Base (14) + Pessoa (1) → Final (15)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    variant="outline"
                    onClick={scanFolder14}
                    disabled={!rhDirectoryHandle}
                    className="w-full"
                  >
                    <Scan className="mr-2 h-4 w-4" />
                    {hasAutoScanned ? 'Recarregar Meses Disponíveis' : 'Carregar Meses Disponíveis'}
                  </Button>

                  {availableMonthsForFinal.length === 0 && hasAutoScanned && (
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <p className="text-sm text-yellow-800 dark:text-yellow-300">
                        Nenhum base PDF encontrado na pasta 14. Execute primeiro o Base Join.
                      </p>
                    </div>
                  )}

                  {availableMonthsForFinal.length > 0 && (
                    <>
                      <div className="space-y-2">
                        <Label>Meses com Base PDF ({selectedMonthsForFinal.length} selecionados)</Label>
                        <div className="max-h-48 overflow-y-auto border rounded-lg p-2 space-y-2">
                          {availableMonthsForFinal.map(month => (
                            <div key={month} className="flex items-center space-x-2">
                              <Checkbox
                                id={`final-${month}`}
                                checked={selectedMonthsForFinal.includes(month)}
                                onCheckedChange={() => toggleMonthForFinal(month)}
                              />
                              <label
                                htmlFor={`final-${month}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                              >
                                {month}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <Button
                        onClick={handleScanPersons}
                        disabled={selectedMonthsForFinal.length === 0 || isScanningPersons}
                        className="w-full"
                        variant="outline"
                      >
                        {isScanningPersons ? (
                          <>Analisando Pessoas...</>
                        ) : (
                          <>
                            <Scan className="mr-2 h-4 w-4" />
                            Scan Pessoas (Pasta 1)
                          </>
                        )}
                      </Button>
                    </>
                  )}

                  {personsData.length > 0 && (
                    <>
                      <div className="flex gap-2 pt-4 border-t">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={selectAllPersons}
                          className="flex-1"
                        >
                          Selecionar Todos
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={deselectAllPersons}
                          className="flex-1"
                        >
                          Desmarcar Todos
                        </Button>
                      </div>

                      <Button
                        onClick={handleJoinFinal}
                        disabled={selectedPersons.length === 0 || isJoiningFinal}
                        className="w-full"
                      >
                        {isJoiningFinal ? (
                          <>Compilando Final...</>
                        ) : (
                          <>
                            <Download className="mr-2 h-4 w-4" />
                            Join Final ({selectedPersons.length} pessoas)
                          </>
                        )}
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Pessoas Encontradas
                    {personsData.length > 0 && ` - ${personsData.length} pessoa(s)`}
                  </CardTitle>
                  <CardDescription>
                    Nomes simples aparecem normalmente. Nomes com descritores aparecem cinzentos (clique para ativar).
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {personsData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Users className="h-16 w-16 text-slate-400 mb-4" />
                      <p className="text-slate-500 dark:text-slate-400">
                        Nenhuma pessoa encontrada
                      </p>
                      {/* Updated instruction text */}
                      <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">
                        Os meses disponíveis serão carregados automaticamente. Depois faça scan das pessoas.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {personsData.map((person) => (
                        <div
                          key={person.name}
                          className={`flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 ${
                            !person.isSimple ? 'opacity-50' : ''
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <Checkbox
                              id={`person-${person.name}`}
                              checked={selectedPersons.includes(person.name)}
                              onCheckedChange={() => togglePerson(person.name)}
                            />
                            <label
                              htmlFor={`person-${person.name}`}
                              className="text-sm font-medium cursor-pointer"
                            >
                              {person.name}
                              {!person.isSimple && (
                                <Badge variant="outline" className="ml-2 text-xs">
                                  Nome Complexo
                                </Badge>
                              )}
                            </label>
                          </div>
                          <div className="flex gap-1 flex-wrap">
                            {person.months.map((month: string) => (
                              <Badge key={month} variant="secondary" className="text-xs">
                                {month}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <AlertDialog open={confirmDialog?.open || false} onOpenChange={(open) => !open && setConfirmDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Dados Insuficientes
            </AlertDialogTitle>
            <AlertDialogDescription>
              O mês <strong>{confirmDialog?.month}</strong> tem apenas <strong>{confirmDialog?.groupCount}</strong> de 12 grupos com ficheiros.
              <br /><br />
              É necessário pelo menos <strong>6 grupos</strong> (metade) para garantir a integridade da compilação.
              <br /><br />
              Deseja continuar mesmo assim?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmDialog(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDialog) {
                  handleJoinMonth(confirmDialog.month, true)
                  setConfirmDialog(null)
                }
              }}
            >
              Continuar Mesmo Assim
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function loadPreviousScanFromStorage(year: string, month: string) {
  try {
    const key = `rh_scan_${year}_${month}`
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : null
  } catch {
    return null
  }
}

function saveScanStateToStorage(year: string, month: string, state: any) {
  try {
    const key = `rh_scan_${year}_${month}`
    localStorage.setItem(key, JSON.stringify(state))
  } catch (error) {
    console.error('[v0] Error saving to localStorage:', error)
  }
}

function detectChanges(previousGroups: any, currentGroups: any): boolean {
  const prevGroupKeys = Object.keys(previousGroups || {})
  const currGroupKeys = Object.keys(currentGroups || {})
  
  if (prevGroupKeys.length !== currGroupKeys.length) {
    return true
  }

  for (const groupKey of currGroupKeys) {
    const prevGroup = previousGroups?.[groupKey]
    const currGroup = currentGroups[groupKey]

    if (!prevGroup) {
      return true
    }

    if (prevGroup.files.length !== currGroup.files.length) {
      return true
    }

    const prevFileNames = prevGroup.files.map((f: any) => f.name).sort()
    const currFileNames = currGroup.files.map((f: any) => f.name).sort()

    for (let i = 0; i < prevFileNames.length; i++) {
      if (prevFileNames[i] !== currFileNames[i]) {
        return true
      }
    }
  }

  return false
}

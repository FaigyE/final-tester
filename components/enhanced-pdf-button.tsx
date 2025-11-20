"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { FileDown } from "lucide-react"
import type { CustomerInfo, InstallationData, Note } from "@/lib/types"
import { useReportContext } from "@/lib/report-context"
// Import the formatNote function
import { formatNote } from "@/lib/utils/aerator-helpers"
import { getStoredNotes, getFinalDetailForUnit, getStoredDetails } from "@/lib/notes"
import { getNotesAndDetails } from "@/lib/notes"

interface EnhancedPdfButtonProps {
  customerInfo: CustomerInfo
  installationData: InstallationData[]
  toiletCount: number
  notes: Note[]
}

export default function EnhancedPdfButton({
  customerInfo,
  installationData: installationDataProp,
  toiletCount,
  notes,
}: EnhancedPdfButtonProps) {
  const [unitType, setUnitType] = useState<"Unit" | "Room">("Unit")
  const [isGenerating, setIsGenerating] = useState(false)
  const [jsPDFLoaded, setJsPDFLoaded] = useState(false)
  const [logoLoaded, setLogoLoaded] = useState(false)
  const [footerLoaded, setFooterLoaded] = useState(false)
  const [logoImage, setLogoImage] = useState<string | null>(null)
  const [footerImage, setFooterImage] = useState<{ dataUrl: string; width: number; height: number } | null>(null)
  const [signatureLoaded, setSignatureLoaded] = useState(false)
  const [signatureImage, setSignatureImage] = useState<string | null>(null)
  const [editedInstallations, setEditedInstallations] = useState<Record<string, Record<string, string>>>({})
  const [editedReportNotes, setEditedReportNotes] = useState<Note[]>([])
  const [columnHeaders, setColumnHeaders] = useState({
    unit: unitType, // Use unitType state instead of hardcoded "Unit"
    kitchen: "Kitchen Aerator\nInstalled",
    bathroom: "Bathroom Aerator\nInstalled",
    shower: "Shower Head\nInstalled",
    toilet: "Toilet\nInstalled",
    notes: "Notes",
  })
  const [editedUnits, setEditedUnits] = useState<Record<string, string>>({})


  // Get the latest state from context
  const {
    reportTitle,
    letterText,
    signatureName,
    signatureTitle,
    rePrefix,
    dearPrefix,
    sectionTitles,
    coverImage,
    coverImageSize,
    notes: contextNotes,
  } = useReportContext()

  // Load edited installations from localStorage
  useEffect(() => {
    const storedInstallations = localStorage.getItem("detailInstallations")
    if (storedInstallations) {
      try {
        const parsedInstallations = JSON.parse(storedInstallations)
        setEditedInstallations(parsedInstallations)
        console.log("PDF: Loaded edited installations from localStorage:", parsedInstallations)
      } catch (error) {
        console.error("PDF: Error parsing stored installations:", error)
      }
    }
  }, [])

   useEffect(() => {
    setColumnHeaders(prev => ({
      ...prev,
      unit: unitType
    }))
    console.log("PDF: Updated column headers with unit type:", unitType)
  }, [unitType])

  // Load edited report notes from localStorage
  useEffect(() => {
    const storedReportNotes = localStorage.getItem("reportNotes")
    if (storedReportNotes) {
      try {
        const parsedReportNotes = JSON.parse(storedReportNotes)
        setEditedReportNotes(parsedReportNotes)
        console.log("PDF: Loaded edited report notes from localStorage:", parsedReportNotes)
      } catch (error) {
        console.error("PDF: Error parsing stored report notes:", error)
      }
    }
  }, [])

  useEffect(() => {
    const loadUnitType = () => {
      try {
        const storedUnitType = localStorage.getItem("unitType")
        if (storedUnitType) {
          const parsedUnitType = JSON.parse(storedUnitType) as "Unit" | "Room"
          setUnitType(parsedUnitType)
          console.log("PDF: Loaded unit type from localStorage:", parsedUnitType)
        }
      } catch (error) {
        console.error("PDF: Error loading unit type:", error)
      }
    }

    loadUnitType()

    // Listen for unit type changes
    const handleUnitTypeChange = () => {
      console.log("PDF: Received unit type change event")
      loadUnitType()
    }

    window.addEventListener("unitTypeChanged", handleUnitTypeChange)
    
    return () => {
      window.removeEventListener("unitTypeChanged", handleUnitTypeChange)
    }
  }, [])
  // Load column headers from localStorage
  useEffect(() => {
    const storedHeaders = localStorage.getItem("columnHeaders")
    if (storedHeaders) {
      try {
        const parsedHeaders = JSON.parse(storedHeaders)
        setColumnHeaders(parsedHeaders)
        console.log("PDF: Loaded column headers from localStorage:", parsedHeaders)
      } catch (error) {
        console.error("PDF: Error parsing stored column headers:", error)
      }
    }
  }, [])

  // Load edited units from localStorage
  useEffect(() => {
    const storedUnits = localStorage.getItem("editedUnits")
    if (storedUnits) {
      try {
        const parsedUnits = JSON.parse(storedUnits)
        setEditedUnits(parsedUnits)
        console.log("PDF: Loaded edited units from localStorage:", parsedUnits)
      } catch (error) {
        console.error("PDF: Error parsing stored units:", error)
      }
    }
  }, [])

  useEffect(() => {
    // Load jsPDF dynamically
    const script = document.createElement("script")
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"
    script.async = true
    script.onload = () => setJsPDFLoaded(true)
    document.body.appendChild(script)

    // Load logo image
    const logoImg = new Image()
    logoImg.crossOrigin = "anonymous"
    logoImg.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = logoImg.width
      canvas.height = logoImg.height
      const ctx = canvas.getContext("2d")
      ctx?.drawImage(logoImg, 0, 0)
      setLogoImage(canvas.toDataURL("image/png"))
      setLogoLoaded(true)
    }
    logoImg.src =
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202025-04-29%20115501-BD1uw5tVq9PtVYW6Z6FKM1i8in6GeV.png"

    // Load footer image
    const footerImg = new Image()
    footerImg.crossOrigin = "anonymous"
    footerImg.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = footerImg.width
      canvas.height = footerImg.height
      const ctx = canvas.getContext("2d")
      ctx?.drawImage(footerImg, 0, 0)
      setFooterImage({
        dataUrl: canvas.toDataURL("image/png"),
        width: footerImg.width,
        height: footerImg.height,
      })
      setFooterLoaded(true)
    }
    footerImg.src =
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202025-04-29%20115454-uWCS2yWrowegSqw9c2SIVcLdedTk82.png"

    // Load signature image
    const signatureImg = new Image()
    signatureImg.crossOrigin = "anonymous"
    signatureImg.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = signatureImg.width
      canvas.height = signatureImg.height
      const ctx = canvas.getContext("2d")
      ctx?.drawImage(signatureImg, 0, 0)
      setSignatureImage(canvas.toDataURL("image/png"))
      setSignatureLoaded(true)
    }
    signatureImg.src =
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-VtZjpVdUqjQTct2lQsw6FsvfgvFeiU.png"

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [])

  // Helper function to find the toilet column and check if installed
  const getToiletColumnInfo = (item: InstallationData): { installed: boolean; columnName: string | null } => {
    const toiletColumn = Object.keys(item).find((key) => key.startsWith("Toilets Installed"))

    if (toiletColumn && item[toiletColumn] && item[toiletColumn] !== "") {
      return { installed: true, columnName: toiletColumn }
    }

    return { installed: false, columnName: null }
  }

  const hasToiletInstalled = (item: InstallationData): boolean => {
    return getToiletColumnInfo(item).installed
  }

  // Updated findColumnName function to prioritize columns with data
const findColumnName = (possibleNames: string[], dataToUse: InstallationData[]): string | null => {
  if (!dataToUse || dataToUse.length === 0) return null

  console.log("PDF: Looking for columns:", possibleNames)
  console.log("PDF: Available columns:", Object.keys(dataToUse[0]))

  const matchingColumns: { key: string; hasData: boolean; dataCount: number; sampleValues: string[] }[] = []

  for (const key of Object.keys(dataToUse[0])) {
    // SKIP LEAK COLUMNS - they are not installation columns
    const lowerKey = key.toLowerCase()
    if (lowerKey.includes('leak') || lowerKey.includes('issue')) {
      continue
    }

    let isMatch = false

    if (possibleNames.includes(key)) {
      isMatch = true
    }

    if (!isMatch) {
      for (const possibleName of possibleNames) {
        if (key.toLowerCase() === possibleName.toLowerCase()) {
          isMatch = true
          break
        }
      }
    }

    if (!isMatch) {
      for (const possibleName of possibleNames) {
        if (
          key.toLowerCase().includes(possibleName.toLowerCase()) ||
          possibleName.toLowerCase().includes(key.toLowerCase())
        ) {
          isMatch = true
          break
        }
      }
    }

    if (isMatch) {
      const meaningfulValues = dataToUse
        .map((item) => item[key])
        .filter((value) => {
          if (!value) return false
          const trimmed = String(value).trim().toLowerCase()
          return (
            trimmed !== "" &&
            trimmed !== "0" &&
            trimmed !== "no" &&
            trimmed !== "n/a" &&
            trimmed !== "na" &&
            trimmed !== "none" &&
            trimmed !== "nan"
          )
        })

      const dataCount = meaningfulValues.length
      const sampleValues = meaningfulValues.slice(0, 5).map((v) => String(v))

      matchingColumns.push({
        key,
        hasData: dataCount > 0,
        dataCount,
        sampleValues,
      })

      console.log(
        `PDF: Found matching column "${key}" with ${dataCount} meaningful data entries. Sample values:`,
        sampleValues,
      )
    }
  }

  if (matchingColumns.length === 0) {
    console.log("PDF: No matching columns found")
    return null
  }

  matchingColumns.sort((a, b) => b.dataCount - a.dataCount)

  const selectedColumn = matchingColumns[0].key
  console.log(`PDF: Selected column "${selectedColumn}" with ${matchingColumns[0].dataCount} meaningful data entries`)
  console.log(`PDF: Sample values from selected column:`, matchingColumns[0].sampleValues)

  return selectedColumn
}

  const handleGeneratePdf = async () => {
    // CRITICAL: Load installation data from localStorage first to get deleted rows
    let installationData = installationDataProp
    try {
      const storedData = localStorage.getItem("installationData")
      if (storedData) {
        installationData = JSON.parse(storedData)
        console.log("PDF: Loaded installation data from localStorage (reflects deletions):", installationData.length, "items")
      } else {
        console.log("PDF: No localStorage data, using prop data")
      }
    } catch (error) {
      console.error("PDF: Error loading installation data from localStorage:", error)
    }

    const findUnitColumn = (data: InstallationData[]): string | null => {
      if (!data || data.length === 0) return null

      const item = data[0]

      console.log("PDF: All column names for unit detection:", Object.keys(item))

      for (const key of Object.keys(item)) {
        if (key.toLowerCase() === "bldg/unit" || key.toLowerCase() === "bldg/unit") {
          console.log(`PDF: Found exact match for BLDG/Unit column: ${key}`)
          return key
        }
      }

      for (const key of Object.keys(item)) {
        const keyLower = key.toLowerCase()
        if (keyLower.includes("bldg") && keyLower.includes("unit")) {
          console.log(`PDF: Found column containing both BLDG and Unit: ${key}`)
          return key
        }
      }

      const unitKeywords = ["unit", "apt", "apartment", "room", "number"]
      for (const key of Object.keys(item)) {
        const keyLower = key.toLowerCase()
        for (const keyword of unitKeywords) {
          if (keyLower.includes(keyword)) {
            console.log(`PDF: Found column containing ${keyword}: ${key}`)
            return key
          }
        }
      }

      const firstKey = Object.keys(item)[0]
      console.log(`PDF: No unit column found, using first column as fallback: ${firstKey}`)
      return firstKey
    }

    if (!jsPDFLoaded || !logoLoaded || !footerLoaded || !signatureLoaded) {
      alert("PDF generation is still loading. Please try again in a moment.")
      return
    }

    try {
      setIsGenerating(true)
      console.log("Starting PDF generation...")

      const unitColumn: string | null = findUnitColumn(installationData)
      console.log("PDF: Using unit column:", unitColumn)

      // STEP 1: Filter out invalid rows FIRST
      const filteredInstallationData = installationData.filter((item) => {
        const unitValue = unitColumn ? item[unitColumn] : item.Unit
        if (!unitValue || String(unitValue).trim() === "") return false

        const trimmedUnit = String(unitValue).trim()
        const lowerUnit = trimmedUnit.toLowerCase()
        const invalidValues = ["total", "sum", "average", "avg", "count", "header"]

        return !invalidValues.some((val) => lowerUnit === val || lowerUnit.includes(val))
      })

      // STEP 2: Count duplicates for numbering
      const unitCount: Record<string, number> = {}
      const unitTotal: Record<string, number> = {}

      for (const item of filteredInstallationData) {
        const unitValue = unitColumn ? item[unitColumn] : item.Unit
        const key = String(unitValue || "").trim()
        if (!key) continue
        unitTotal[key] = (unitTotal[key] || 0) + 1
      }

      // STEP 3: Apply numbering to duplicates
      const numberedData = filteredInstallationData.map((item) => {
        const unitValue = unitColumn ? item[unitColumn] : item.Unit
        const key = String(unitValue || "").trim()
        if (!key) return item

        unitCount[key] = (unitCount[key] || 0) + 1
        let displayUnit = key
        if (unitTotal[key] > 1) {
          displayUnit = `${key} ${unitCount[key]}`
        }

        const newItem = { ...item }
        newItem[unitColumn || "Unit"] = displayUnit
        newItem.Unit = displayUnit
        return newItem
      })
    

        // STEP 2: THEN build consolidatedData using numbered data
        const consolidatedData: Record<
          string,
          {
            unit: string
            kitchenQuantity: number
            bathroomQuantity: number
            showerADAQuantity: number
            showerRegularQuantity: number
            toiletQuantity: number
            notes: string[]
          }
        > = {}

      // Helper function to find specific quantity columns (same as preview)
      const findSpecificColumns = () => {
        if (!numberedData.length) return {}

        const firstItem = numberedData[0]
        const keys = Object.keys(firstItem)

        const columns = {
          kitchenAerator: keys.find((key) => {
            const lowerKey = key.toLowerCase()
            return lowerKey.includes("kitchen") && lowerKey.includes("aerator")
          }),
          bathroomAeratorColumns: keys.filter((key) => {
            const lowerKey = key.toLowerCase()
            return lowerKey.includes("bathroom") && lowerKey.includes("aerator")
          }),
          bathroomAeratorMaster: keys.find((key) => {
            const lowerKey = key.toLowerCase()
            return lowerKey.includes("bathroom") && lowerKey.includes("aerator") && lowerKey.includes("master")
          }),
          adaShowerHead: keys.find((key) => {
            const lowerKey = key.toLowerCase()
            return lowerKey.includes("ada") && lowerKey.includes("shower")
          }),
          regularShowerHead: keys.find((key) => {
            const lowerKey = key.toLowerCase()
            return (
              lowerKey.includes("shower") &&
              (lowerKey.includes("head") || lowerKey === "showerhead") &&
              !lowerKey.includes("ada")
            )
          }),
          toiletInstalled: keys.find((key) => {
            const lowerKey = key.toLowerCase()
            return lowerKey.includes("toilet") && lowerKey.includes("install")
          }),
        }

        return columns
      }

      const specificColumns = findSpecificColumns()

      // Type for specificColumns
      const typedSpecificColumns = specificColumns as Record<string, string | string[] | undefined>;


      // Process installation data using same logic as preview
   for (const item of numberedData) {
        const unitValue = unitColumn ? item[unitColumn] : item.Unit
        const unitKey = String(unitValue || "").trim()

        if (!unitKey) continue

        if (!consolidatedData[unitKey]) {
          consolidatedData[unitKey] = {
            unit: unitKey,
            kitchenQuantity: 0,
            bathroomQuantity: 0,
            showerADAQuantity: 0,
            showerRegularQuantity: 0,
            toiletQuantity: 0,
            notes: [],
          }
        }

        // Kitchen: Always 1 if kitchen aerator column has data
        const kitchenAeratorCol = typedSpecificColumns.kitchenAerator
        if (typeof kitchenAeratorCol === "string" && item[kitchenAeratorCol]) {
          const kitchenValue = String(item[kitchenAeratorCol]).trim()
          if (kitchenValue && kitchenValue !== "" && kitchenValue !== "0") {
            consolidatedData[unitKey].kitchenQuantity = 1
          }
        }

        // Bathroom: Count ALL bathroom aerator columns (each counts as 1 if has data)
        let bathroomCount = 0;
        if (typedSpecificColumns.bathroomAeratorColumns && typedSpecificColumns.bathroomAeratorColumns.length > 0) {
          for (const bathroomCol of typedSpecificColumns.bathroomAeratorColumns) {
            if (item[bathroomCol]) {
              const bathroomValue = String(item[bathroomCol]).trim();
              if (bathroomValue && bathroomValue !== "" && bathroomValue !== "0") {
                bathroomCount += 1;
                console.log(`PDF: Bathroom aerator "${bathroomCol}" for ${unitKey}: +1 (has data: ${bathroomValue})`);
              }
            }
          }
        } else {
          console.log(`PDF: No bathroom aerator columns found for ${unitKey}`);
        }
        consolidatedData[unitKey].bathroomQuantity = bathroomCount;
        console.log(`PDF: Total bathroom quantity for ${unitKey}: ${bathroomCount}`);

        // Shower: Read actual quantities from both columns
        const adaShowerCol = typedSpecificColumns.adaShowerHead
        if (adaShowerCol) {
          let adaQuantity = 0
          if (typeof adaShowerCol === "string") {
            const adaValue = item[adaShowerCol]
            adaQuantity =
              adaValue && adaValue !== "" && adaValue !== "0" ? Number.parseInt(String(adaValue)) || 0 : 0
          } else if (Array.isArray(adaShowerCol)) {
            for (const col of adaShowerCol) {
              const adaValue = item[col]
              if (adaValue && adaValue !== "" && adaValue !== "0") {
                adaQuantity += Number.parseInt(String(adaValue)) || 0
              }
            }
          }
          consolidatedData[unitKey].showerADAQuantity = adaQuantity
        }
        const regularShowerCol = typedSpecificColumns.regularShowerHead
        if (regularShowerCol) {
          let regularQuantity = 0
          if (regularShowerCol) {
            if (typeof regularShowerCol === "string") {
              const regularValue = item[regularShowerCol]
              regularQuantity =
                regularValue && regularValue !== "" && regularValue !== "0" ? Number.parseInt(String(regularValue)) || 0 : 0
            } else if (Array.isArray(regularShowerCol)) {
              for (const col of regularShowerCol) {
                const regularValue = item[col]
                if (regularValue && regularValue !== "" && regularValue !== "0") {
                  regularQuantity += Number.parseInt(String(regularValue)) || 0
                }
              }
            }
          }
          consolidatedData[unitKey].showerRegularQuantity = regularQuantity
        }

        // Toilet: Read direct quantity from toilets installed column
        const toiletCol = typedSpecificColumns.toiletInstalled
        let toiletQuantity = 0
        if (toiletCol) {
          if (typeof toiletCol === "string") {
            if (item[toiletCol]) {
              toiletQuantity = Number.parseInt(String(item[toiletCol])) || 0
            }
          } else if (Array.isArray(toiletCol)) {
            for (const col of toiletCol) {
              if (item[col]) {
                toiletQuantity += Number.parseInt(String(item[col])) || 0
              }
            }
          }
          consolidatedData[unitKey].toiletQuantity = toiletQuantity
        }
          consolidatedData[unitKey].toiletQuantity = toiletQuantity
        }
      

      console.log("Using context values:", {
        reportTitle,
        letterText,
        signatureName,
        signatureTitle,
        rePrefix,
        dearPrefix,
        sectionTitles,
      })

      let picturesData: any[] = []
      try {
        const storedImages = localStorage.getItem("reportImages")
        if (storedImages) {
          picturesData = JSON.parse(storedImages)
          console.log("PDF: Loaded pictures data:", picturesData.length, "images")
        }
      } catch (error) {
        console.error("PDF: Error loading pictures data:", error)
      }

      // Get the actual column names from the data
      const kitchenAeratorColumn = findColumnName(["Kitchen Aerator", "kitchen aerator", "kitchen", "kitchen aerators"], installationData)
      const bathroomAeratorColumn = findColumnName([
        "Bathroom aerator",
        "bathroom aerator",
        "bathroom",
        "bathroom aerators",
        "bath aerator",
      ], installationData)
      const showerHeadColumn = findColumnName(["Shower Head", "shower head", "shower", "shower heads"], installationData)

      console.log("PDF: Found column names:", {
        kitchenAeratorColumn,
        bathroomAeratorColumn,
        showerHeadColumn,
      })

      // Load the latest edited units from localStorage right before generating the PDF
      let latestEditedUnits: Record<string, string> = {}
      try {
        const storedUnits = localStorage.getItem("editedUnits")
        if (storedUnits) {
          latestEditedUnits = JSON.parse(storedUnits)
          console.log("PDF: Loaded latest edited units from localStorage:", latestEditedUnits)
        }
      } catch (error) {
        console.error("PDF: Error parsing stored units:", error)
      }

      // Load the latest details from localStorage right before generating the PDF
      let latestEditedDetails: Record<string, string> = {}
      try {
        latestEditedDetails = getStoredDetails()
        console.log("PDF: Loaded latest details from localStorage:", latestEditedDetails)
      } catch (error) {
        console.error("PDF: Error loading details:", error)
      }

      // Load the latest edited installations from localStorage right before generating the PDF
      let latestEditedInstallations: Record<string, Record<string, string>> = {}
      try {
        const storedInstallations = localStorage.getItem("detailInstallations")
        if (storedInstallations) {
          latestEditedInstallations = JSON.parse(storedInstallations)
          console.log("PDF: Loaded latest edited installations from localStorage:", latestEditedInstallations)
        }
      } catch (error) {
        console.error("PDF: Error parsing stored installations:", error)
      }

      // Load the latest column headers from localStorage
      let latestColumnHeaders = { ...columnHeaders }
      try {
        const storedHeaders = localStorage.getItem("columnHeaders")
        if (storedHeaders) {
          latestColumnHeaders = JSON.parse(storedHeaders)
          console.log("PDF: Loaded latest column headers from localStorage:", latestColumnHeaders)
        }
      } catch (error) {
        console.error("PDF: Error parsing stored column headers:", error)
      }

      // Load the latest edited report notes from localStorage
      let latestReportNotes: Note[] = []
      try {
        const storedReportNotes = localStorage.getItem("reportNotes")
        if (storedReportNotes) {
          latestReportNotes = JSON.parse(storedReportNotes)
          console.log("PDF: Loaded report notes from localStorage:", latestReportNotes)
        } else if (contextNotes && contextNotes.length > 0) {
          latestReportNotes = [...contextNotes]
          console.log("PDF: Using context notes as fallback:", latestReportNotes)
        } else {
          latestReportNotes = [...notes]
          console.log("PDF: Using props notes as final fallback:", latestReportNotes)
        }

        latestReportNotes = latestReportNotes.sort((a, b) => {
          const unitA = a.unit || ""
          const unitB = b.unit || ""

          const numA = Number.parseInt(unitA)
          const numB = Number.parseInt(unitB)

          if (!isNaN(numA) && !isNaN(numB)) {
            return numA - numB
          }

          return unitA.localeCompare(unitB, undefined, { numeric: true, sensitivity: "base" })
        })

        console.log("PDF: Final sorted report notes for PDF:", latestReportNotes)
      } catch (error) {
        console.error("PDF: Error processing report notes:", error)
        latestReportNotes = [...notes]
      }

      // Filter out rows without valid unit numbers and apply edits
 const filteredData = (() => {
        const result = [];
        console.log("PDF: Starting to process installation data...");
        console.log("PDF: Total rows to process:", numberedData.length);
        for (let i = 0; i < numberedData.length; i++) {
          const item = numberedData[i];
          const unitValue = unitColumn ? item[unitColumn] : item.Unit;
          console.log(
            `PDF Row ${i + 1}: Unit="${unitValue}" (type: ${typeof unitValue}, length: ${unitValue ? unitValue.length : "null"})`,
          );
          if (
            unitValue === undefined ||
            unitValue === null ||
            unitValue === "" ||
            (typeof unitValue === "string" && unitValue.trim() === "")
          ) {
            console.log(
              `PDF STOPPING: Found empty unit at row ${i + 1}. Unit value: "${unitValue}". Processed ${result.length} valid rows.`,
            );
            break;
          }
          const trimmedUnit = String(unitValue).trim();
          if (trimmedUnit === "") {
            console.log(
              `PDF STOPPING: Found empty unit after trimming at row ${i + 1}. Original: "${unitValue}". Processed ${result.length} valid rows.`,
            );
            break;
          }
          if (latestEditedUnits[trimmedUnit] === "") {
            console.log(`PDF: Skipping deleted unit "${trimmedUnit}" (marked as completely blank)`);
            continue;
          }
          const lowerUnit = trimmedUnit.toLowerCase();
          const invalidValues = ["total", "sum", "average", "avg", "count", "header", "grand total", "subtotal"];
          const isInvalidUnit = invalidValues.some((val) => lowerUnit === val || lowerUnit.includes(val));
          const hasInstallationData =
            (kitchenAeratorColumn && item[kitchenAeratorColumn] && item[kitchenAeratorColumn] !== "") ||
            (bathroomAeratorColumn && item[bathroomAeratorColumn] && item[bathroomAeratorColumn] !== "") ||
            (showerHeadColumn && item[showerHeadColumn] && item[showerHeadColumn] !== "") ||
            hasToiletInstalled(item);
          const hasLeakData =
            item["Leak Issue Kitchen Faucet"] || item["Leak Issue Bath Faucet"] || item["Tub Spout/Diverter Leak Issue"];
          if (isInvalidUnit && !hasInstallationData && !hasLeakData) {
            console.log(
              `PDF: Skipping invalid unit "${trimmedUnit}" at row ${i + 1} (contains: ${invalidValues.find((val) => lowerUnit.includes(val))} and no relevant data)`,
            );
            continue;
          }
          console.log(`PDF: Adding valid unit: "${trimmedUnit}"`);
          result.push(item);
        }
        console.log(`PDF: Final result: ${result.length} valid units processed`);
        return result.sort((a, b) => {
          const unitA = unitColumn ? a[unitColumn] : a.Unit;
          const unitB = unitColumn ? b[unitColumn] : b.Unit;
          const finalUnitA = unitA && latestEditedUnits[unitA] !== undefined ? latestEditedUnits[unitA] : unitA || "";
          const finalUnitB = unitB && latestEditedUnits[unitB] !== undefined ? latestEditedUnits[unitB] : unitB || "";
          const numA = Number.parseInt(finalUnitA);
          const numB = Number.parseInt(finalUnitB);
          if (!isNaN(numA) && !isNaN(numB)) {
            return numA - numB;
          }
          return finalUnitA.localeCompare(finalUnitB, undefined, { numeric: true, sensitivity: "base" });
        });
      })();

      console.log(`PDF: Processed ${filteredData.length} valid units (stopped at first empty unit, sorted ascending)`)

      console.log("Using edited installations:", latestEditedInstallations)
      console.log("Using column headers:", latestColumnHeaders)
      console.log("Using edited details:", latestEditedDetails)
      console.log("Using report notes:", latestReportNotes)

      // Create a new jsPDF instance
      const { jsPDF } = window.jspdf
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "letter",
      })

      // Set font
      doc.setFont("helvetica", "normal")

      // Get page dimensions
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()

      // Calculate logo and footer dimensions
      const logoWidth = 90
      const logoHeight = 27
      const logoX = 5
      const logoY = 5

      const contentStartY = logoY + logoHeight + 5

      const footerWidth = pageWidth
      let footerHeight = 20
      let footerAspectRatio = 180 / 20

      if (footerImage) {
        const tempImg = new Image()
        tempImg.src = footerImage.dataUrl
        if (tempImg.width && tempImg.height) {
          footerAspectRatio = tempImg.width / tempImg.height
        }
      }

      footerHeight = footerWidth / footerAspectRatio
      const footerX = 0
      const footerY = pageHeight - footerHeight

      const safeBottomMargin = 15
      const availableHeight = pageHeight - contentStartY - footerHeight - safeBottomMargin

      // Helper function to add header and footer to each page
      const addHeaderFooter = (pageNum: number, totalPages: number) => {
        if (logoImage) {
          doc.addImage(logoImage, "PNG", logoX, logoY, logoWidth, logoHeight)
        }

        if (footerImage) {
          const footerWidth = pageWidth
          const footerHeight = pageWidth * (footerImage.height / footerImage.width)
          const footerX = 0
          const footerY = pageHeight - footerHeight
          doc.addImage(footerImage.dataUrl, "PNG", footerX, footerY, footerWidth, footerHeight)
        }

        doc.setFontSize(10)
        doc.text(`Page ${pageNum} of ${totalPages}`, 190, logoY + 10, { align: "right" })
      }

      // Calculate total pages
      let totalPages = 2

      const filteredNotes = latestReportNotes
        .filter((note) => {
          if (!note.unit || note.unit.trim() === "") return false
          const lowerUnit = note.unit.toLowerCase()
          const invalidValues = ["total", "sum", "average", "avg", "count", "header", "n/a", "na"]
          if (invalidValues.some((val) => lowerUnit.includes(val))) return false
          return true
        })
        .sort((a, b) => {
          const unitA = a.unit || ""
          const unitB = b.unit || ""

          const numA = Number.parseInt(unitA)
          const numB = Number.parseInt(unitB)

          if (!isNaN(numA) && !isNaN(numB)) {
            return numA - numB
          }

          return unitA.localeCompare(unitB, undefined, { numeric: true, sensitivity: "base" })
        })

      const estimatedNotesPerPage = Math.floor(availableHeight / 10)
      const estimatedNotesPages = filteredNotes.length > 0 ? Math.ceil(filteredNotes.length / estimatedNotesPerPage) : 0
      totalPages += estimatedNotesPages

      const estimatedRowsPerPage = Math.floor(availableHeight / 10)
      const estimatedDetailPages = Math.ceil(filteredData.length / estimatedRowsPerPage)
      totalPages += estimatedDetailPages

      const imagesPerPage = 6
      const picturesPages = picturesData.length > 0 ? Math.ceil(picturesData.length / imagesPerPage) : 0
      totalPages += picturesPages
      console.log("PDF: Adding", picturesPages, "pictures pages to total")

      // Cover Page
      addHeaderFooter(1, totalPages)

      doc.setFontSize(24)
      doc.setTextColor("#1F497D")
      doc.text(reportTitle, 105, 50, { align: "center" })
      doc.setDrawColor("#1F497D")
      doc.line(20, 65, 190, 65)

      doc.setFontSize(14)
      doc.text(`${customerInfo.address} ${customerInfo.city}, ${customerInfo.state} ${customerInfo.zip}`, 105, 60, {
        align: "center",
      })

      doc.setTextColor(0, 0, 0)

      let imageBottomY = 65

      if (coverImage) {
        try {
          const tempImg = new Image()
          tempImg.src = coverImage

          await new Promise((resolve, reject) => {
            tempImg.onload = resolve
            tempImg.onerror = reject
            setTimeout(reject, 5000)
          })

          const topBoundary = 70
          const bottomBoundary = 200
          const availableHeight = bottomBoundary - topBoundary

          const maxWidth = pageWidth * 0.85
          const maxHeight = availableHeight

          const aspectRatio = tempImg.width / tempImg.height

          let imgWidth = maxWidth
          let imgHeight = imgWidth / aspectRatio

          if (imgHeight > maxHeight) {
            imgHeight = maxHeight
            imgWidth = imgHeight * aspectRatio
          }

          const imgX = (pageWidth - imgWidth) / 2

          const verticalPadding = (availableHeight - imgHeight) / 2
          const imgY = topBoundary + verticalPadding

          doc.addImage(coverImage, "JPEG", imgX, imgY, imgWidth, imgHeight)

          imageBottomY = imgY + imgHeight
        } catch (error) {
          console.error("Error adding cover image to PDF:", error)
          try {
            const maxWidth = pageWidth * 0.85
            const imgX = (pageWidth - maxWidth) / 2
            const defaultHeight = maxWidth * 0.75
            const imgY = 70 + (130 - defaultHeight) / 2
            doc.addImage(coverImage, "JPEG", imgX, imgY, maxWidth, defaultHeight)
            imageBottomY = imgY + defaultHeight
          } catch (fallbackError) {
            console.error("Fallback error adding cover image:", fallbackError)
          }
        }
      }

      doc.setFontSize(14)
      const attnY = Math.max(imageBottomY + 20, 210)

      doc.text("ATTN:", 105, attnY, { align: "center" })
      doc.setFontSize(13)
      doc.text(customerInfo.customerName, 105, attnY + 5, { align: "center" })
      doc.text(customerInfo.propertyName, 105, attnY + 10, { align: "center" })
      doc.text(
        `${customerInfo.address} ${customerInfo.city}, ${customerInfo.state} ${customerInfo.zip}`,
        105,
        attnY + 15,
        { align: "center" },
      )

      // Letter Page
      doc.addPage()
      addHeaderFooter(2, totalPages)

      doc.setFontSize(12)
      let yPos = contentStartY

      doc.text(customerInfo.date, 15, yPos)
      yPos += 10
      doc.text(customerInfo.propertyName, 15, yPos)
      yPos += 7
      doc.text(customerInfo.customerName, 15, yPos)
      yPos += 7
      doc.text(`${rePrefix} ${customerInfo.address}`, 15, yPos)
      yPos += 7
      doc.text(`${customerInfo.city}, ${customerInfo.state} ${customerInfo.zip}`, 15, yPos)
      yPos += 20

      doc.text(`${dearPrefix} ${customerInfo.customerName.split(" ")[0]},`, 15, yPos)
      yPos += 10

      const processedLetterText = letterText.map((text) => text.replace("{toiletCount}", toiletCount.toString()))

      processedLetterText.forEach((paragraph) => {
        const lines = doc.splitTextToSize(paragraph, 180)
        lines.forEach((line: string) => {
          doc.text(line, 15, yPos)
          yPos += 7
        })
        yPos += 5
      })

      yPos += 5
      doc.text("Very truly yours,", 15, yPos)
      yPos += 10

      if (signatureImage) {
        doc.addImage(signatureImage, "PNG", 15, yPos, 40, 15)
        yPos += 15
      } else {
        yPos += 5
      }

      doc.text(signatureName, 15, yPos)
      yPos += 7
      doc.text(signatureTitle, 15, yPos)

      // Notes Pages
      if (filteredNotes.length > 0) {
        let currentPage = 3
        let currentNoteIndex = 0

        const notesUnitColumnWidth = 30
        const notesColumnX = 20
        const notesTextColumnX = notesColumnX + notesUnitColumnWidth + 5
        const notesTextColumnWidth = 180 - (notesTextColumnX - 15)

        while (currentNoteIndex < filteredNotes.length) {
          doc.addPage()
          addHeaderFooter(currentPage, totalPages)
          currentPage++

          doc.setFontSize(18)
          doc.text(sectionTitles.notes || "Notes", 105, contentStartY, { align: "center" })

          doc.setFontSize(12)

          yPos = contentStartY + 10
          doc.setFillColor(240, 240, 240)
          doc.rect(15, yPos - 5, 180, 10, "F")
          doc.setFont("helvetica", "bold")
          doc.setFontSize(10)
          doc.text(latestColumnHeaders.unit, notesColumnX, yPos)
          doc.text(latestColumnHeaders.notes, notesTextColumnX, yPos)
          doc.setFont("helvetica", "normal")
          yPos += 10

          const maxYPos = pageHeight - footerHeight - safeBottomMargin

          let rowCount = 0
          while (currentNoteIndex < filteredNotes.length) {
            const note = filteredNotes[currentNoteIndex]

            const unitLines = doc.splitTextToSize(note.unit, notesUnitColumnWidth - 2)

            const noteParagraphs = note.note.split("\n")
            const noteLines: string[] = []

            noteParagraphs.forEach((paragraph) => {
              const wrappedLines = doc.splitTextToSize(paragraph.trim(), notesTextColumnWidth - 2)
              noteLines.push(...wrappedLines)
            })

            doc.setFontSize(10)

            const unitHeight = unitLines.length * 7
            const noteHeight = noteLines.length * 7
            const rowHeight = Math.max(unitHeight, noteHeight, 10)

            if (yPos + rowHeight > maxYPos && rowCount > 0) {
              break
            }

            const rowStartY = yPos

            if (rowCount % 2 === 0) {
              doc.setFillColor(250, 250, 250)
              doc.rect(15, rowStartY - 5, 180, rowHeight, "F")
            }

            unitLines.forEach((line: string, lineIndex: number) => {
              doc.text(line, notesColumnX, rowStartY + lineIndex * 7)
            })

            noteLines.forEach((line: string, lineIndex: number) => {
              doc.text(line, notesTextColumnX, rowStartY + lineIndex * 7)
            })

            yPos = rowStartY + rowHeight + 1
            currentNoteIndex++
            rowCount++

            if (yPos + 10 > maxYPos) {
              break
            }
          }
        }
      }

      // Detail Pages
      let currentPage = 3 + (filteredNotes.length > 0 ? Math.ceil(filteredNotes.length / estimatedNotesPerPage) : 0)

      console.log(
        "PDF: First 5 items in installation data:",
        filteredData.slice(0, 5).map((item) => ({
          Unit: unitColumn ? item[unitColumn] : item.Unit,
          KitchenAerator: kitchenAeratorColumn ? item[kitchenAeratorColumn] : undefined,
          BathroomAerator: bathroomAeratorColumn ? item[bathroomAeratorColumn] : undefined,
          ShowerHead: showerHeadColumn ? item[showerHeadColumn] : undefined,
        })),
      )

console.log("PDF: Checking column visibility with filteredData:", {
  dataLength: filteredData.length,
  firstItem: filteredData[0],
  kitchenAeratorColumn,
  sampleKitchenValues: kitchenAeratorColumn
    ? filteredData.slice(0, 5).map(item => item[kitchenAeratorColumn])
    : []
})

const hasKitchenAeratorData =
  kitchenAeratorColumn &&
  filteredData.some((item) => {
    const rawValue = item[kitchenAeratorColumn]
    if (rawValue !== null && rawValue !== undefined && rawValue !== '') {
      const trimmedValue = String(rawValue).trim()
      const hasData = trimmedValue !== "" && trimmedValue !== "0" && trimmedValue.toLowerCase() !== "nan"
      if (hasData) {
        console.log("PDF: Found kitchen aerator data:", rawValue, "->", trimmedValue)
      }
      return hasData
    }
    return false
  })

console.log("PDF: hasKitchenAeratorData =", hasKitchenAeratorData)


      const hasBathroomAeratorData =
        bathroomAeratorColumn &&
        filteredData.some((item) => item[bathroomAeratorColumn] && item[bathroomAeratorColumn] !== "")
      const hasShowerData =
        showerHeadColumn && filteredData.some((item) => item[showerHeadColumn] && item[showerHeadColumn] !== "")

      const hasKitchenAerators = Boolean(hasKitchenAeratorData)
      const hasBathroomAerators = Boolean(hasBathroomAeratorData)
      const hasShowers = Boolean(hasShowerData)

      const hasToilets = filteredData.some((item) => hasToiletInstalled(item))

      const hasNotes = true // Always show notes column

      console.log("PDF Column visibility:", {
        kitchenAeratorColumn,
        hasKitchenAeratorData,
        hasKitchenAerators,
        bathroomAeratorColumn,
        hasBathroomAeratorData,
        hasBathroomAerators,
        showerHeadColumn,
        hasShowerData,
        hasShowers,
        hasToilets,
        hasNotes,
      })

      // Calculate column positions
      const columnPositions = [17]

      const visibleColumns = [hasKitchenAerators, hasBathroomAerators, hasShowers, hasToilets, hasNotes].filter(
        Boolean,
      ).length

      const availableWidth = 180
      const unitColumnWidth = 25
      const remainingWidth = availableWidth - unitColumnWidth

      const columnWidths = [unitColumnWidth]

      const minColumnWidths = {
        kitchen: 30,
        bathroom: 30,
        shower: 30,
        toilet: 20,
        notes: 55,
      }

      let totalMinWidth = 0
      if (hasKitchenAerators) totalMinWidth += minColumnWidths.kitchen
      if (hasBathroomAerators) totalMinWidth += minColumnWidths.bathroom
      if (hasShowers) totalMinWidth += minColumnWidths.shower
      if (hasToilets) totalMinWidth += minColumnWidths.toilet
      if (hasNotes) totalMinWidth += minColumnWidths.notes

      const scaleFactor = totalMinWidth > remainingWidth ? remainingWidth / totalMinWidth : 1

      if (hasKitchenAerators) columnWidths.push(Math.floor(minColumnWidths.kitchen * scaleFactor))
      if (hasBathroomAerators) columnWidths.push(Math.floor(minColumnWidths.bathroom * scaleFactor))
      if (hasShowers) columnWidths.push(Math.floor(minColumnWidths.shower * scaleFactor))
      if (hasToilets) columnWidths.push(Math.floor(minColumnWidths.toilet * scaleFactor))
      if (hasNotes) columnWidths.push(Math.floor(minColumnWidths.notes * scaleFactor))

      let currentPos = 17
      columnPositions[0] = currentPos
      for (let i = 1; i < columnWidths.length; i++) {
        currentPos += columnWidths[i - 1]
        columnPositions.push(currentPos)
      }

      // Process installation data in batches
      let currentDataIndex = 0

      while (currentDataIndex < filteredData.length) {
        doc.addPage()
        addHeaderFooter(currentPage, totalPages)
        currentPage++

        doc.setFontSize(18)
        doc.text(sectionTitles.detailsTitle || "Detailed Unit Information", 105, contentStartY, { align: "center" })

        yPos = contentStartY + 10
        doc.setFillColor(240, 240, 240)
        doc.rect(15, yPos - 5, 180, 10, "F")
        doc.setFont("helvetica", "bold")
        doc.setFontSize(8)

        let colIndex = 0
        const unitHeaderLines = doc.splitTextToSize(latestColumnHeaders.unit, columnWidths[colIndex] - 2)
        unitHeaderLines.forEach((line: string, lineIndex: number) => {
          doc.text(line, columnPositions[colIndex], yPos + lineIndex * 3)
        })
        colIndex++

        if (hasKitchenAerators) {
          const kitchenHeaderLines = latestColumnHeaders.kitchen.split("\n")
          kitchenHeaderLines.forEach((line: string, lineIndex: number) => {
            doc.text(line, columnPositions[colIndex], yPos + lineIndex * 3)
          })
          colIndex++
        }
        if (hasBathroomAerators) {
          const bathroomHeaderLines = latestColumnHeaders.bathroom.split("\n")
          bathroomHeaderLines.forEach((line: string, lineIndex: number) => {
            doc.text(line, columnPositions[colIndex], yPos + lineIndex * 3)
          })
          colIndex++
        }
        if (hasShowers) {
          const showerHeaderLines = latestColumnHeaders.shower.split("\n")
          showerHeaderLines.forEach((line: string, lineIndex: number) => {
            doc.text(line, columnPositions[colIndex], yPos + lineIndex * 3)
          })
          colIndex++
        }
        if (hasToilets) {
          const toiletHeaderLines = latestColumnHeaders.toilet.split("\n")
          toiletHeaderLines.forEach((line: string, lineIndex: number) => {
            doc.text(line, columnPositions[colIndex], yPos + lineIndex * 3)
          })
          colIndex++
        }
        if (hasNotes) {
          const notesHeaderLines = doc.splitTextToSize("Details", columnWidths[colIndex] - 2)
          notesHeaderLines.forEach((line: string, lineIndex: number) => {
            doc.text(line, columnPositions[colIndex], yPos + lineIndex * 3)
          })
          colIndex++
        }

        doc.setFont("helvetica", "normal")
        yPos += 10

        const maxYPos = pageHeight - footerHeight - safeBottomMargin

        let rowCount = 0
        while (currentDataIndex < filteredData.length) {
          const item = filteredData[currentDataIndex]

          const rowStartY = yPos - 5

          const originalUnitValue = unitColumn ? item[unitColumn] : item.Unit
          const displayUnit =
            originalUnitValue && latestEditedUnits[originalUnitValue] !== undefined
              ? latestEditedUnits[originalUnitValue]
              : originalUnitValue || ""

          // FIX: Use displayUnit as the key for consolidatedData to support renamed/numbered units
          const consolidated = consolidatedData[String(displayUnit)] || {
            kitchenQuantity: 0,
            bathroomQuantity: 0,
            showerADAQuantity: 0,
            showerRegularQuantity: 0,
            toiletQuantity: 0,
            notes: [],
          }

          // Kitchen display
          const kitchenAerator =
            originalUnitValue && latestEditedInstallations[originalUnitValue]?.kitchen !== undefined
              ? latestEditedInstallations[originalUnitValue].kitchen
              : consolidated.kitchenQuantity > 0
                ? "1.0 GPM"
                : "Unable"

          // Bathroom display
          const bathroomAerator =
            originalUnitValue && latestEditedInstallations[originalUnitValue]?.bathroom !== undefined
              ? latestEditedInstallations[originalUnitValue].bathroom
              : consolidated.bathroomQuantity > 0
                ? consolidated.bathroomQuantity === 1
                  ? "1.0 GPM"
                  : `1.0 GPM (${consolidated.bathroomQuantity})`
                : "Unable"

          // Shower display
          const showerHead = (() => {
            if (originalUnitValue && latestEditedInstallations[originalUnitValue]?.shower !== undefined) {
              return latestEditedInstallations[originalUnitValue].shower
            }

            const parts = []
            if (consolidated.showerRegularQuantity > 0) {
              if (consolidated.showerRegularQuantity === 1) {
                parts.push("1.75 GPM")
              } else {
                parts.push(`1.75 GPM (${consolidated.showerRegularQuantity})`)
              }
            }
            if (consolidated.showerADAQuantity > 0) {
              if (consolidated.showerADAQuantity === 1) {
                parts.push("1.5 GPM")
              } else {
                parts.push(`1.5 GPM (${consolidated.showerADAQuantity})`)
              }
            }
            const showerText = parts.length === 2 ? `${parts[0]},\n${parts[1]}` : parts.join("")
            return showerText || "Unable"
          })()

          // Toilet display
          const toilet =
            originalUnitValue && latestEditedInstallations[originalUnitValue]?.toilet !== undefined
              ? latestEditedInstallations[originalUnitValue].toilet
              : consolidated.toiletQuantity > 0
                ? consolidated.toiletQuantity === 1
                  ? "0.8 GPF"
                  : `0.8 GPF (${consolidated.toiletQuantity})`
                : ""

// CRITICAL FIX: Use the details system for the notes column
const unitValue = unitColumn ? item[unitColumn] : item.Unit

// Get notes from the unified notes system (includes CSV selected cells)
const { note: csvSelectedNotes, detail: unitDetail } = (() => {
  try {
    let selectedCells: Record<string, string[]> = {}
    let selectedNotesColumns: string[] = []
    const storedSelectedCells = localStorage.getItem("selectedCells")
    const storedSelectedNotesColumns = localStorage.getItem("selectedNotesColumns")
    if (storedSelectedCells) selectedCells = JSON.parse(storedSelectedCells)
    if (storedSelectedNotesColumns) selectedNotesColumns = JSON.parse(storedSelectedNotesColumns)
    
    const notesAndDetails = getNotesAndDetails({
      installationData: filteredData,
      unitColumn: unitColumn || "Unit",
      selectedCells,
      selectedNotesColumns,
    })
    
    // Find the matching unit (handle both original and numbered units)
    const baseUnit = String(unitValue || "").replace(/\s+\d+$/, "") // Remove numbering
    let found = notesAndDetails.find(nd => nd.unit === unitValue)
    
    // If not found with numbered name, try base unit
    if (!found) {
      found = notesAndDetails.find(nd => nd.unit === baseUnit)
    }
    
    if (found) return { note: found.note, detail: found.detail }
    return { note: "", detail: "" }
  } catch (error) {
    console.error("PDF: Error getting notes/details for unit:", unitValue, error)
    return { note: "", detail: "" }
  }
})()

// Compile leak notes for this unit
let compiledNote = ""
if (item["Leak Issue Kitchen Faucet"]) {
  const leakValue = String(item["Leak Issue Kitchen Faucet"]).trim().toLowerCase()
  if (leakValue === "light") {
    compiledNote += "Light leak from kitchen faucet. "
  } else if (leakValue === "moderate") {
    compiledNote += "Moderate leak from kitchen faucet. "
  } else if (leakValue === "heavy") {
    compiledNote += "Heavy leak from kitchen faucet. "
  } else if (leakValue === "dripping" || leakValue === "driping") {
    compiledNote += "Dripping from kitchen faucet. "
  } else if (leakValue && leakValue !== "0" && leakValue !== "") {
    compiledNote += "Leak from kitchen faucet. "
  }
}

if (item["Leak Issue Bath Faucet"]) {
  const leakValue = String(item["Leak Issue Bath Faucet"]).trim().toLowerCase()
  if (leakValue === "light") {
    compiledNote += "Light leak from bathroom faucet. "
  } else if (leakValue === "moderate") {
    compiledNote += "Moderate leak from bathroom faucet. "
  } else if (leakValue === "heavy") {
    compiledNote += "Heavy leak from bathroom faucet. "
  } else if (leakValue === "dripping" || leakValue === "driping") {
    compiledNote += "Dripping from bathroom faucet. "
  } else if (leakValue && leakValue !== "0" && leakValue !== "") {
    compiledNote += "Leak from bathroom faucet. "
  }
}

if (item["Tub Spout/Diverter Leak Issue"]) {
  const leakValue = String(item["Tub Spout/Diverter Leak Issue"]).trim()
  if (leakValue === "Light") {
    compiledNote += "Light leak from tub spout/diverter. "
  } else if (leakValue === "Moderate") {
    compiledNote += "Moderate leak from tub spout/diverter. "
  } else if (leakValue === "Heavy") {
    compiledNote += "Heavy leak from tub spout/diverter. "
  } else if (leakValue && leakValue !== "0" && leakValue !== "") {
    compiledNote += "Leak from tub spout/diverter. "
  }
}

// Combine CSV selected notes with leak notes
let combinedNotes = ""
if (csvSelectedNotes && csvSelectedNotes.trim()) {
  combinedNotes = csvSelectedNotes.trim() + " "
}
if (compiledNote.trim()) {
  combinedNotes += compiledNote.trim()
}

// Determine the final text based on whether unit was accessed
let finalNoteText = ""

const valuesToCheck = [
  kitchenAerator,
  bathroomAerator,
  showerHead,
  toilet
]

const allEmptyOrUnable = valuesToCheck.every(
  v => v === "Unable" || v === "" || v === "—"
)

// If user edited the detail, always show the updated detail
if (latestEditedDetails[unitValue || ""]) {
  finalNoteText = latestEditedDetails[unitValue || ""]
  console.log(`PDF: Unit ${unitValue} - using user-edited detail: "${finalNoteText}"`)
} else if (allEmptyOrUnable) {
  // Show "Unit not accessed" or "Room not accessed" based on unitType
  finalNoteText = `${unitType} not accessed`
  console.log(`PDF: Unit ${unitValue} - not accessed, using: "${finalNoteText}"`)
} else {
  // Use combined notes (CSV selected + leaks) or unitDetail
  finalNoteText = combinedNotes.trim() || unitDetail || ""
}

console.log(`PDF: Final details for unit ${unitValue}:`, finalNoteText)

          // Calculate note lines
          let noteLines: string[] = []
          if (hasNotes && finalNoteText) {
            const maxWidth = columnWidths[columnWidths.length - 1] - 5
            noteLines = doc.splitTextToSize(finalNoteText, maxWidth)
          }

          const unitLinesForHeight = doc.splitTextToSize(displayUnit, columnWidths[0] - 2)
          const unitHeight = Math.max(10, unitLinesForHeight.length * 3)
          const rowHeight = Math.max(10, Math.max(unitHeight, noteLines.length * 5 + 5))

          if (yPos + rowHeight > maxYPos && rowCount > 0) {
            break
          }

          if (rowCount % 2 === 0) {
            doc.setFillColor(250, 250, 250)
            doc.rect(15, rowStartY, 180, rowHeight, "F")
          }

          doc.setFontSize(9)

          colIndex = 0

          // Unit text
          const unitLines = doc.splitTextToSize(displayUnit, columnWidths[colIndex] - 2)
          const finalUnitLines: string[] = []
          for (const line of unitLines) {
            if (doc.getTextWidth(line) > columnWidths[colIndex] - 2) {
              let currentLine = ""
              for (const char of line) {
                if (doc.getTextWidth(currentLine + char) > columnWidths[colIndex] - 2) {
                  if (currentLine) finalUnitLines.push(currentLine)
                  currentLine = char
                } else {
                  currentLine += char
                }
              }
              if (currentLine) finalUnitLines.push(currentLine)
            } else {
              finalUnitLines.push(line)
            }
          }

          finalUnitLines.forEach((line: string, lineIndex: number) => {
            doc.text(line, columnPositions[colIndex], yPos + lineIndex * 3)
          })
          colIndex++

          const baseYPos = yPos

          if (hasKitchenAerators) {
            const kitchenText = kitchenAerator === "Unable" ? "—" : kitchenAerator
            if (kitchenText === "—") {
              doc.text("\t—\t", columnPositions[colIndex], baseYPos)
            } else {
              doc.text(kitchenText, columnPositions[colIndex], baseYPos)
            }
            colIndex++
          }

          if (hasBathroomAerators) {
            const bathroomText = bathroomAerator === "Unable" ? "—" : bathroomAerator
            if (bathroomText === "—") {
              doc.text("\t—\t", columnPositions[colIndex], baseYPos)
            } else {
              doc.text(bathroomText, columnPositions[colIndex], baseYPos)
            }
            colIndex++
          }

          if (hasShowers) {
            const showerText = showerHead === "Unable" ? "—" : showerHead
            if (showerText === "—") {
              doc.text("\t—\t", columnPositions[colIndex], baseYPos)
            } else {
              const showerLines = doc.splitTextToSize(showerText, columnWidths[colIndex] - 2)
              showerLines.forEach((line: string, lineIndex: number) => {
                doc.text(line, columnPositions[colIndex], baseYPos + lineIndex * 3)
              })
            }
            colIndex++
          }

          if (hasToilets) {
            const toiletText = toilet ? toilet : "—"
            if (toiletText === "—") {
              doc.text("\t—\t", columnPositions[colIndex], baseYPos)
            } else {
              doc.text(toiletText, columnPositions[colIndex], baseYPos)
            }
            colIndex++
          }

          // Notes/Details column
          if (hasNotes) {
            doc.setFontSize(10)
            noteLines.forEach((line, lineIndex) => {
              doc.text(line, columnPositions[colIndex], baseYPos + lineIndex * 5)
            })
          }

          yPos = rowStartY + rowHeight + 5
          currentDataIndex++
          rowCount++

          if (yPos + 10 > maxYPos) {
            break
          }
        }
      }

      // Pictures Pages (code continues but truncated for length - same as before)
      if (picturesData.length > 0) {
        console.log("PDF: Adding pictures pages...")

        const imagesByUnit: { [unit: string]: any[] } = {}
        picturesData.forEach((image) => {
          if (!imagesByUnit[image.unit]) {
            imagesByUnit[image.unit] = []
          }
          imagesByUnit[image.unit].push(image)
        })

        const sortedUnits = Object.keys(imagesByUnit).sort((a, b) => {
          const numA = Number.parseInt(a)
          const numB = Number.parseInt(b)
          if (!isNaN(numA) && !isNaN(numB)) {
            return numA - numB
          }
          return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
        })

        const sortedImages = sortedUnits.flatMap((unit) => imagesByUnit[unit])

        const loadedImages = await Promise.all(
          sortedImages.map(async (image) => {
            if (image.url && !image.googleDriveId) {
              try {
                const response = await fetch(image.url)
                const blob = await response.blob()
                return new Promise<{ image: any; dataUrl: string }>((resolve, reject) => {
                  const reader = new FileReader()
                  reader.onload = () => resolve({ image, dataUrl: reader.result as string })
                  reader.onerror = reject
                  reader.readAsDataURL(blob)
                })
              } catch (error) {
                console.error("Error loading image:", error)
                return { image, dataUrl: null }
              }
            }
            return { image, dataUrl: null }
          }),
        )

        const imagesPerPage = 6
        for (let i = 0; i < loadedImages.length; i += imagesPerPage) {
          const pageImages = loadedImages.slice(i, i + imagesPerPage)

          doc.addPage()
          addHeaderFooter(currentPage, totalPages)

          if (i === 0) {
            doc.setFontSize(18)
            doc.text(sectionTitles.pictures || "Installation Pictures", 105, contentStartY, { align: "center" })
            yPos = contentStartY + 15
          } else {
            yPos = contentStartY + 5
          }

          const maxImageWidth = 80
          const maxImageHeight = 50
          const imageSpacing = 10

          for (let j = 0; j < pageImages.length; j++) {
            const { image, dataUrl } = pageImages[j]

            const col = j % 2
            const row = Math.floor(j / 2)
            const x = 20 + col * (maxImageWidth + imageSpacing)
            const y = yPos + row * (maxImageHeight + 15)

            try {
              if (dataUrl) {
                const tempImg = new Image()
                tempImg.src = dataUrl

                await new Promise<void>((resolve) => {
                  tempImg.onload = () => resolve()
                  tempImg.onerror = () => resolve()
                })

                let imgWidth = maxImageWidth
                let imgHeight = maxImageHeight

                if (tempImg.width && tempImg.height) {
                  const aspectRatio = tempImg.width / tempImg.height

                  if (aspectRatio > 1) {
                    imgWidth = maxImageWidth
                    imgHeight = imgWidth / aspectRatio
                    if (imgHeight > maxImageHeight) {
                      imgHeight = maxImageHeight
                      imgWidth = imgHeight * aspectRatio
                    }
                  } else {
                    imgHeight = maxImageHeight
                    imgWidth = imgHeight * aspectRatio
                    if (imgWidth > maxImageWidth) {
                      imgWidth = maxImageWidth
                      imgHeight = imgWidth / aspectRatio
                    }
                  }
                }

                const imgX = x + (maxImageWidth - imgWidth) / 2
                const imgY = y + (maxImageHeight - imgHeight) / 2

                doc.addImage(dataUrl, "JPEG", imgX, imgY, imgWidth, imgHeight)
              } else if (image.googleDriveId) {
                doc.setFillColor(240, 240, 240)
                doc.rect(x, y, maxImageWidth, maxImageHeight, "F")
                doc.setFontSize(10)
                doc.text("Google Drive Image", x + maxImageWidth / 2, y + maxImageHeight / 2, {
                  align: "center",
                })
              } else {
                doc.setFillColor(240, 240, 240)
                doc.rect(x, y, maxImageWidth, maxImageHeight, "F")
                doc.setFontSize(10)
                doc.text("Image Error", x + maxImageWidth / 2, y + maxImageHeight / 2, {
                  align: "center",
                })
              }

              doc.setFontSize(9)
              doc.setFont("helvetica", "bold")
              doc.text(`Unit ${image.unit}`, x, y + maxImageHeight + 5)
              doc.setFont("helvetica", "normal")
              doc.setFontSize(8)
              const captionLines = doc.splitTextToSize(image.caption || "", maxImageWidth)
              captionLines.forEach((line: string, lineIndex: number) => {
                doc.text(line, x, y + maxImageHeight + 10 + lineIndex * 3)
              })
            } catch (error) {
              console.error("Error processing image for PDF:", error)
              doc.setFillColor(240, 240, 240)
              doc.rect(x, y, maxImageWidth, maxImageHeight, "F")
              doc.setFontSize(10)
              doc.text("Image Unavailable", x + maxImageWidth / 2, y + maxImageHeight / 2, {
                align: "center",
              })
            }
          }

          currentPage++
        }
      }

      totalPages = currentPage - 1

      const filename = `${customerInfo.propertyName.replace(/\s+/g, "-")}_Water_Conservation_Report.pdf`
      console.log("Saving enhanced PDF as:", filename)
      doc.save(filename)

      console.log("Enhanced PDF generation complete!")
    } catch (error) {
      console.error("Error generating PDF:", error)
      alert(`There was an error generating the PDF: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsGenerating(false)
    }
  }

  const allLoaded = jsPDFLoaded && logoLoaded && footerLoaded && signatureLoaded

  return (
    <Button onClick={handleGeneratePdf} disabled={isGenerating || !allLoaded}>
      <FileDown className="mr-2 h-4 w-4" />
      {isGenerating
        ? "Generating PDF..."
        : allLoaded
          ? "Download Complete PDF"
          : `Loading PDF Generator (${[
              jsPDFLoaded ? "✓" : "✗",
              logoLoaded ? "✓" : "✗",
              footerLoaded ? "✓" : "✗",
              signatureLoaded ? "✓" : "✗",
            ].join(" ")})`}
    </Button>
  )
}
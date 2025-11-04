"use client"
import { useState, useEffect } from "react"
import EditableText from "@/components/editable-text"
import { getAeratorDescription, formatNote } from "@/lib/utils/aerator-helpers"
import { useReportContext } from "@/lib/report-context"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Trash2 } from "lucide-react"
import { updateStoredNote, updateStoredDetail, getStoredNotes, getNotesAndDetails, getStoredDetails } from "@/lib/notes"

import type { InstallationData } from "@/lib/types"



interface ReportDetailPageProps {
  installationData: InstallationData[]
  isPreview?: boolean
  isEditable?: boolean
  unitTypeProp?: string
  onDeleteUnit?: (unit: string) => void
}

export default function ReportDetailPage({
  installationData,
  isPreview = true,
  isEditable = true,
  unitTypeProp,
  onDeleteUnit,
}: ReportDetailPageProps) {
  const { sectionTitles, setSectionTitles } = useReportContext()

  // State to store edited notes
  const [unitType, setUnitType] = useState<"Unit" | "Room">((unitTypeProp as "Unit" | "Room") || "Unit")  // ← Initialize with prop value
  const [editedNotes, setEditedNotes] = useState<Record<string, string>>({})
  const [editedDetails, setEditedDetails] = useState<Record<string, string>>({})
  const [editedInstallations, setEditedInstallations] = useState<Record<string, Record<string, string>>>({})
  const [editedUnits, setEditedUnits] = useState<Record<string, string>>({})
  const [additionalRows, setAdditionalRows] = useState<InstallationData[]>([])
  // Add state for sync checkbox - default to true (checked)
  const [syncDetailsAndNotes, setSyncDetailsAndNotes] = useState<boolean>(true)
  const [columnHeaders, setColumnHeaders] = useState({
    unit: unitType,
    kitchen: "Kitchen Aerator Installed",
    bathroom: "Bathroom Aerator Installed",
    shower: "Shower Head Installed",
    toilet: "Toilet Installed",
    notes: "Notes",
  })
  // Add installationData state for UI updates
  const [installationDataState, setInstallationData] = useState<InstallationData[]>(installationData)

  // Load installation data from localStorage first, fallback to prop
  useEffect(() => {
    try {
      const storedData = localStorage.getItem("installationData")
      if (storedData) {
        const parsedData = JSON.parse(storedData)
        setInstallationData(parsedData)
        console.log("Loaded installation data from localStorage:", parsedData.length, "items")
      } else {
        setInstallationData(installationData)
        // Save initial data to localStorage if not present
        localStorage.setItem("installationData", JSON.stringify(installationData))
      }
    } catch (error) {
      console.error("Error loading installation data from localStorage:", error)
      setInstallationData(installationData)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])


  const findUnitColumn = (data: InstallationData[]): string | null => {
    if (!data || data.length === 0) return null

    const firstItem = data[0]
    const keys = Object.keys(firstItem)

    // Look for "Unit" column first
    if (keys.includes("Unit")) return "Unit"

    // Look for any column containing "unit"
    for (const key of keys) {
      if (key.toLowerCase().includes("unit")) return key
    }

    // Fallback to first column
    return keys[0]
  }

  const findColumnName = (possibleNames: string[]): string | null => {
    if (!installationDataState || installationDataState.length === 0) return null

    const firstItem = installationDataState[0]
    const keys = Object.keys(firstItem)

    // Look for exact matches first
    for (const possibleName of possibleNames) {
      if (keys.includes(possibleName)) return possibleName
    }

    // Look for case-insensitive matches
    for (const key of keys) {
      for (const possibleName of possibleNames) {
        if (key.toLowerCase() === possibleName.toLowerCase()) return key
      }
    }

    // Look for partial matches
    for (const key of keys) {
      for (const possibleName of possibleNames) {
        if (key.toLowerCase().includes(possibleName.toLowerCase())) return key
      }
    }

    return null
  }

  const findAllShowerColumns = (): string[] => {
    if (!installationDataState || installationDataState.length === 0) return []

    const showerColumns: string[] = []
    const keys = Object.keys(installationDataState[0])

    for (const key of keys) {
      if (key.toLowerCase().includes("shower")) {
        showerColumns.push(key)
      }
    }

    return showerColumns
  }

  const getShowerValue = (item: InstallationData): string => {
    const showerColumns = findAllShowerColumns()

    for (const column of showerColumns) {
      const value = item[column]
      if (value && String(value).trim() !== "" && String(value).trim() !== "0") {
        return getAeratorDescription(value, "shower")
      }
    }

    return "Unable"
  }

  const kitchenAeratorColumn = findColumnName(["Kitchen Aerator", "kitchen aerator", "kitchen", "kitchen aerators"])
  const bathroomAeratorColumn = findColumnName([
    "Bathroom aerator",
    "bathroom aerator",
    "bathroom",
    "bathroom aerators",
    "bath aerator",
  ])
  const showerHeadColumn = findColumnName(["Shower Head", "shower head", "shower", "shower heads"])

  // Helper functions
  const getToiletColumnInfo = (item: InstallationData): { installed: boolean; columnName: string | null } => {
    const toiletColumn = Object.keys(item).find((key) => key.startsWith("Toilets Installed:"))
    if (toiletColumn && item[toiletColumn] && item[toiletColumn] !== "") {
      return { installed: true, columnName: toiletColumn }
    }
    return { installed: false, columnName: null }
  }

  const hasToiletInstalled = (item: InstallationData): boolean => {
    return getToiletColumnInfo(item).installed
  }

  // Use the new notes/details system
  const getNotesAndDetailsForUnit = (unitValue: string): { note: string; detail: string } => {
    try {
      let selectedCells: Record<string, string[]> = {}
      let selectedNotesColumns: string[] = []
      const storedSelectedCells = localStorage.getItem("selectedCells")
      const storedSelectedNotesColumns = localStorage.getItem("selectedNotesColumns")
      if (storedSelectedCells) selectedCells = JSON.parse(storedSelectedCells)
      if (storedSelectedNotesColumns) selectedNotesColumns = JSON.parse(storedSelectedNotesColumns)
      const notesAndDetails = getNotesAndDetails({
        installationData,
        unitColumn: unitColumn || "Unit",
        selectedCells,
        selectedNotesColumns,
      })
      const found = notesAndDetails.find(nd => nd.unit === unitValue)
      return found ? { note: found.note, detail: found.detail } : { note: "", detail: "" }
    } catch (error) {
      console.error("Error getting notes/details for unit:", unitValue, error)
      return { note: "", detail: "" }
    }
  }

  const unitColumn = findUnitColumn(installationDataState)
  const allData = [...installationDataState, ...additionalRows]

  const filteredData = (() => {
  const result: InstallationData[] = []

    for (let i = 0; i < allData.length; i++) {
      const item = allData[i]
      const unitValue = unitColumn ? item[unitColumn] : item.Unit

      if (!unitValue || String(unitValue).trim() === "") continue

      result.push(item)
    }

    // Group installations by unit and read quantities from specific Excel columns
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
        originalItem: InstallationData
      }
    > = {}

    // Helper function to find specific quantity columns
    const findSpecificColumns = () => {
      if (!result.length) return {};
      const firstItem = result[0];
      const keys = Object.keys(firstItem);
      const columns: {
        kitchenAerator?: string;
        bathroomAeratorColumns?: string[];
        adaShowerHead?: string;
        regularShowerHead?: string;
        toiletInstalled?: string;
      } = {
        kitchenAerator: keys.find((key) => {
          const lowerKey = key.toLowerCase();
          return lowerKey.includes("kitchen") && lowerKey.includes("aerator");
        }),

        bathroomAeratorColumns: keys.filter((key) => {
        const lowerKey = key.toLowerCase();
        return lowerKey.includes("bathroom") && lowerKey.includes("aerator");
      }),
        adaShowerHead: keys.find((key) => {
          const lowerKey = key.toLowerCase();
          return lowerKey.includes("ada") && lowerKey.includes("shower");
        }),
        regularShowerHead: keys.find((key) => {
          const lowerKey = key.toLowerCase();
          return (
            lowerKey.includes("shower") &&
            (lowerKey.includes("head") || lowerKey === "showerhead") &&
            !lowerKey.includes("ada")
          );
        }),
        toiletInstalled: keys.find((key) => {
          const lowerKey = key.toLowerCase();
          return lowerKey.includes("toilet") && lowerKey.includes("install");
        }),
      };
      console.log("Found specific columns:", columns);
      return columns;
    }

    const specificColumns = findSpecificColumns()

    // Process each row and consolidate by unit
    for (const item of result) {
      const unitValue = unitColumn ? item[unitColumn] : item.Unit
      const unitKey = String(unitValue || "").trim()

      if (!unitKey) continue

      // Initialize unit data if not exists
      if (!consolidatedData[unitKey]) {
        consolidatedData[unitKey] = {
          unit: unitKey,
          kitchenQuantity: 0,
          bathroomQuantity: 0,
          showerADAQuantity: 0,
          showerRegularQuantity: 0,
          toiletQuantity: 0,
          notes: [],
          originalItem: item,
        }
      }

      console.log(`Processing Unit ${unitKey}:`)

      // Kitchen: Always 1 if kitchen aerator column has data
      if (specificColumns.kitchenAerator && item[specificColumns.kitchenAerator]) {
        const kitchenValue = String(item[specificColumns.kitchenAerator]).trim()
        if (kitchenValue && kitchenValue !== "" && kitchenValue !== "0") {
          consolidatedData[unitKey].kitchenQuantity = 1
          console.log(`Kitchen quantity for ${unitKey}: 1 (has data: ${kitchenValue})`)
        }
      }

      let bathroomCount = 0
      if (specificColumns.bathroomAeratorColumns && specificColumns.bathroomAeratorColumns.length > 0) {
        for (const bathroomCol of specificColumns.bathroomAeratorColumns) {
          if (item[bathroomCol]) {
            const bathroomValue = String(item[bathroomCol]).trim()
            if (bathroomValue && bathroomValue !== "" && bathroomValue !== "0") {
              bathroomCount += 1
              console.log(`Preview: Bathroom aerator "${bathroomCol}" for ${unitKey}: +1 (has data: ${bathroomValue})`)
            }
          }
        }
      } else {
        console.log(`Preview: No bathroom aerator columns found for ${unitKey}`)
      }
      consolidatedData[unitKey].bathroomQuantity = bathroomCount
      console.log(`Preview: Total bathroom quantity for ${unitKey}: ${bathroomCount}`)

      // Shower: Read actual quantities from both columns
      // Only use the value from the correct cell for each type
      if (specificColumns.adaShowerHead) {
        const adaValue = item[specificColumns.adaShowerHead];
        const adaQuantity = adaValue && adaValue !== '' ? Number.parseInt(String(adaValue as string)) || 0 : 0;
        consolidatedData[unitKey].showerADAQuantity = adaQuantity;
        console.log(`ADA Shower quantity for ${unitKey}: ${adaQuantity}`);
      } else {
        consolidatedData[unitKey].showerADAQuantity = 0;
      }
      if (specificColumns.regularShowerHead) {
        const regularValue = item[specificColumns.regularShowerHead];
        const regularQuantity = regularValue && regularValue !== '' ? Number.parseInt(String(regularValue as string)) || 0 : 0;
        consolidatedData[unitKey].showerRegularQuantity = regularQuantity;
        console.log(`Regular Shower quantity for ${unitKey}: ${regularQuantity}`);
      } else {
        consolidatedData[unitKey].showerRegularQuantity = 0;
      }

      // Toilet: Read direct quantity from toilets installed column
      if (specificColumns.toiletInstalled && item[specificColumns.toiletInstalled]) {
        const toiletQuantity = Number.parseInt(String(item[specificColumns.toiletInstalled] as string)) || 0;
        consolidatedData[unitKey].toiletQuantity = toiletQuantity;
        console.log(`Toilet quantity for ${unitKey}: ${toiletQuantity}`);
      } else {
        consolidatedData[unitKey].toiletQuantity = 0;
      }

      // Get notes using the new notes/details system
      const { note: unitNote } = getNotesAndDetailsForUnit(unitKey)
      if (unitNote && unitNote.trim()) {
        consolidatedData[unitKey].notes.push(unitNote.trim())
      }
    }

    // Convert back to array format with new quantity data
    const consolidatedResult = Object.values(consolidatedData).map((unitData) => {
      // Create a new item with quantity information
      const consolidatedItem = { ...unitData.originalItem };
      // Store quantities in the item for later use (as numbers)
      (consolidatedItem as any)._kitchenQuantity = unitData.kitchenQuantity;
      (consolidatedItem as any)._bathroomQuantity = unitData.bathroomQuantity;
      (consolidatedItem as any)._showerADAQuantity = unitData.showerADAQuantity;
      (consolidatedItem as any)._showerRegularQuantity = unitData.showerRegularQuantity;
      (consolidatedItem as any)._toiletQuantity = unitData.toiletQuantity;
      (consolidatedItem as any)._consolidatedNotes = [...new Set(unitData.notes)].join(" ");
      return consolidatedItem;
    });

    return consolidatedResult.sort((a, b) => {
      const unitA = unitColumn ? a[unitColumn] : a.Unit
      const unitB = unitColumn ? b[unitColumn] : b.Unit

      const numA = Number.parseInt(String(unitA))
      const numB = Number.parseInt(String(unitB))

      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB
      }

      return String(unitA).localeCompare(String(unitB), undefined, { numeric: true, sensitivity: "base" })
    })
  })()

  // Check what columns to show
  const hasKitchenAerators = filteredData.some((item) => Number(item._kitchenQuantity) > 0);
const hasBathroomAerators = filteredData.some((item) => {
  const bathroomQty = Number(item._bathroomQuantity);
  console.log(`Checking bathroom for unit ${item.Unit || item[unitColumn || 'Unit']}: quantity=${bathroomQty}`);
  return bathroomQty > 0;
});

  const hasShowers = filteredData.some((item) => Number(item._showerADAQuantity) > 0 || Number(item._showerRegularQuantity) > 0);
  const hasToilets = filteredData.some((item) => Number(item._toiletQuantity) > 0);
  const hasNotes = true

useEffect(() => {
  // Update unit type when prop changes
  const newUnitType = (unitTypeProp as "Unit" | "Room") || "Unit"
  setUnitType(newUnitType)
  // Update column header when unit type changes
  setColumnHeaders(prev => ({
    ...prev,
    unit: newUnitType as "Unit" | "Room"
  }))
}, [unitTypeProp])
  // Load CSV preview data from localStorage and listen for unified notes updates
  useEffect(() => {
    try {
      // Load selected cells from CSV preview
      const selectedCellsData = localStorage.getItem("selectedCells")
      if (selectedCellsData) {
        const selectedCells = JSON.parse(selectedCellsData)
        console.log("Details: Loaded CSV preview selected cells:", selectedCells)
      }
      
      // Load selected notes columns from CSV preview
      const selectedNotesColumnsData = localStorage.getItem("selectedNotesColumns")
      if (selectedNotesColumnsData) {
        const selectedNotesColumns = JSON.parse(selectedNotesColumnsData)
        console.log("Details: Loaded CSV preview selected columns:", selectedNotesColumns)
      }
    } catch (error) {
      console.error("Details: Error loading CSV preview data:", error)
    }
  }, [])

  // Listen for notes/details updates
  useEffect(() => {
    const handleNotesUpdate = () => {
      setEditedNotes({ ...getStoredNotes() })
    }
    const handleDetailsUpdate = () => {
      setEditedDetails({ ...getStoredDetails() })
    }
    window.addEventListener("unifiedNotesUpdated", handleNotesUpdate)
    window.addEventListener("unitDetailsUpdated", handleDetailsUpdate)
    return () => {
      window.removeEventListener("unifiedNotesUpdated", handleNotesUpdate)
      window.removeEventListener("unitDetailsUpdated", handleDetailsUpdate)
    }
  }, [])

  // Event handlers
  const handleNoteEdit = (unit: string, value: string) => {
    if (isEditable) {
      updateStoredNote(unit, value)
      setEditedNotes((prev) => ({
        ...prev,
        [unit]: value,
      }))
    }
  }

  const handleDetailEdit = (unit: string, value: string) => {
    if (isEditable) {
      updateStoredDetail(unit, value)
      
      // If sync is enabled, also update notes
      if (syncDetailsAndNotes) {
        updateStoredNote(unit, value)
        console.log(`Synced detail to notes for unit ${unit}`)
      }
      
      setEditedDetails((prev) => ({
        ...prev,
        [unit]: value,
      }))
    }
  }

  const handleInstallationEdit = (unit: string, type: string, value: string) => {
    if (isEditable) {
      setEditedInstallations((prev) => ({
        ...prev,
        [unit]: {
          ...prev[unit],
          [type]: value,
        },
      }))
    }
  }

  const handleUnitEdit = (originalUnit: string, newUnit: string) => {
    if (isEditable) {
      setEditedUnits((prev) => ({
        ...prev,
        [originalUnit]: newUnit,
      }))
    }
  }

  const handleColumnHeaderChange = (column: string, value: string) => {
    if (isEditable) {
      setColumnHeaders((prev) => ({
        ...prev,
        [column]: value,
      }))
    }
  }

  const handleSectionTitleChange = (value: string) => {
    if (isEditable && setSectionTitles) {
      setSectionTitles((prev) => ({
        ...prev,
        detailsTitle: value,
      }))
    }
  }

  const addNewRow = () => {
    const newRow: InstallationData = {
      Unit: `New-${additionalRows.length + 1}`,
      "Shower Head": "",
      "Bathroom aerator": "",
      "Kitchen Aerator": "",
      "Leak Issue Kitchen Faucet": "",
      "Leak Issue Bath Faucet": "",
      "Tub Spout/Diverter Leak Issue": "",
      Notes: "",
    }
    setAdditionalRows((prev) => [...prev, newRow])
  }

  const removeRow = (unitToRemove: string) => {
    console.log("Removing unit:", unitToRemove)
    
    // Remove from additionalRows
    setAdditionalRows((prev) => prev.filter((row) => row.Unit !== unitToRemove))

    // Remove from installationDataState and update localStorage
    setInstallationData((prev) => {
      const unitColumn = findUnitColumn(prev)
      const filtered = prev.filter((row) => {
        const rowUnit = unitColumn ? row[unitColumn] : row.Unit
        return rowUnit !== unitToRemove
      })
      // Update localStorage immediately
      localStorage.setItem("installationData", JSON.stringify(filtered))
      console.log("Updated installationData in localStorage, new length:", filtered.length)
      return filtered
    })

    // Remove from additionalDetailRows in localStorage
    try {
      const additionalRows = JSON.parse(localStorage.getItem("additionalDetailRows") || "[]")
      const unitColumn = findUnitColumn(additionalRows)
      const filteredAdditionalRows = additionalRows.filter((row: any) => {
        const rowUnit = unitColumn ? row[unitColumn] : row.Unit
        return rowUnit !== unitToRemove
      })
      localStorage.setItem("additionalDetailRows", JSON.stringify(filteredAdditionalRows))
      console.log("Updated additionalDetailRows in localStorage")
    } catch (error) {
      console.error("Error removing unit from additionalDetailRows:", error)
    }

    // Remove from details only (not notes)
    try {
      const details = JSON.parse(localStorage.getItem("unitDetails") || "{}")
      if (details[unitToRemove] !== undefined) {
        delete details[unitToRemove]
        localStorage.setItem("unitDetails", JSON.stringify(details))
        console.log("Removed unit from unitDetails")
      }
    } catch (error) {
      console.error("Error removing unit from unitDetails:", error)
    }

    setEditedDetails((prev) => {
      const updated = { ...prev }
      delete updated[unitToRemove]
      return updated
    })
    
    console.log("Row removal complete for unit:", unitToRemove)
  }

  // Load stored notes/details on component mount
  useEffect(() => {
    setEditedNotes(getStoredNotes())
    setEditedDetails(getStoredDetails())
  }, [])

  if (!installationData || installationData.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">No installation data available.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Section Title */}
      <div className="sticky top-0 bg-white z-10 pb-4 border-b">
        <div className="flex items-center justify-between pt-2">
          <h2 className="text-xl font-bold">
            {isEditable ? (
              <EditableText
                value={sectionTitles?.detailsTitle || "Detailed Unit Information"}
                onChange={handleSectionTitleChange}
                placeholder="Section Title"
              />
            ) : (
              sectionTitles?.detailsTitle || "Detailed Unit Information"
            )}
          </h2>
          {isEditable && isPreview && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="sync-details-notes"
                  checked={syncDetailsAndNotes}
                  onCheckedChange={(checked) => setSyncDetailsAndNotes(checked as boolean)}
                />
                <label
                  htmlFor="sync-details-notes"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Sync details with notes section
                </label>
              </div>
              <Button onClick={addNewRow} variant="outline" size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Row
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Preview Mode - Single Table */}
      {isPreview && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left py-2 px-2 border-b">
                  {isEditable ? (
                    <EditableText
                      value={columnHeaders.unit}
                      onChange={(value) => handleColumnHeaderChange("unit", value)}
                      placeholder="Unit"
                    />
                  ) : (
                    columnHeaders.unit
                  )}
                </th>
                {hasKitchenAerators && (
                  <th className="text-left py-2 px-2 border-b">
                    {isEditable ? (
                      <EditableText
                        value={columnHeaders.kitchen}
                        onChange={(value) => handleColumnHeaderChange("kitchen", value)}
                        placeholder="Kitchen"
                      />
                    ) : (
                      columnHeaders.kitchen
                    )}
                  </th>
                )}
                {hasBathroomAerators && (
                  <th className="text-left py-2 px-2 border-b">
                    {isEditable ? (
                      <EditableText
                        value={columnHeaders.bathroom}
                        onChange={(value) => handleColumnHeaderChange("bathroom", value)}
                        placeholder="Bathroom"
                      />
                    ) : (
                      columnHeaders.bathroom
                    )}
                  </th>
                )}
                {hasShowers && (
                  <th className="text-left py-2 px-2 border-b">
                    {isEditable ? (
                      <EditableText
                        value={columnHeaders.shower}
                        onChange={(value) => handleColumnHeaderChange("shower", value)}
                        placeholder="Shower"
                      />
                    ) : (
                      columnHeaders.shower
                    )}
                  </th>
                )}
                {hasToilets && (
                  <th className="text-left py-2 px-2 border-b">
                    {isEditable ? (
                      <EditableText
                        value={columnHeaders.toilet}
                        onChange={(value) => handleColumnHeaderChange("toilet", value)}
                        placeholder="Toilet"
                      />
                    ) : (
                      columnHeaders.toilet
                    )}
                  </th>
                )}
                {hasNotes && (
                  <th className="text-left py-2 px-2 border-b">
                    {isEditable ? (
                      <EditableText
                        value={"Details"}
                        onChange={() => {}}
                        placeholder="Details"
                      />
                    ) : (
                      "Details"
                    )}
                  </th>
                )}
                {isEditable && <th className="text-left py-2 px-2 border-b">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item, index) => {
                const unitValue = unitColumn ? item[unitColumn] : item.Unit
                const isAdditionalRow = additionalRows.some(
                  (row) => (unitColumn ? row[unitColumn] : row.Unit) === unitValue,
                )

                const kitchenAerator = (() => {
                  if (unitValue !== undefined && editedInstallations[unitValue]?.kitchen !== undefined) {
                    return editedInstallations[unitValue]!.kitchen
                  }
                  return Number(item._kitchenQuantity) > 0 ? "1.0 GPM (1)" : "Unable"
                })()

                const bathroomAerator = (() => {
                  if (unitValue !== undefined && editedInstallations[unitValue]?.bathroom !== undefined) {
                    return editedInstallations[unitValue]!.bathroom
                  }
                  if (Number(item._bathroomQuantity) > 0) {
                    return Number(item._bathroomQuantity) === 1
                      ? "1.0 GPM"
                      : `1.0 GPM (${item._bathroomQuantity})`
                  }
                  return "Unable"
                })()

                const shower = (() => {
                  if (unitValue !== undefined && editedInstallations[unitValue]?.shower !== undefined) {
                  return editedInstallations[unitValue]!.shower
                  }

                  const parts = []
                  if (Number(item._showerRegularQuantity) > 0) {
                  if (Number(item._showerRegularQuantity) === 1 && Number(item._showerADAQuantity) === 0) {
                    parts.push("1.75 GPM")
                  } else {
                    parts.push(`1.75 GPM (${item._showerRegularQuantity})`)
                  }
                  }
                  if (Number(item._showerADAQuantity) > 0) {
                  if (Number(item._showerADAQuantity) === 1 && Number(item._showerRegularQuantity) === 0) {
                    parts.push("1.5 GPM")
                  } else {
                    parts.push(`1.5 GPM (${item._showerADAQuantity})`)
                  }
                  }

                  // Add a comma if both types exist
                  return parts.length > 1 ? parts.join(", ") : (parts.length > 0 ? parts[0] : "Unable")
                })()

                const toilet = (() => {
                  if (unitValue !== undefined && editedInstallations[unitValue]?.toilet !== undefined) {
                    return editedInstallations[unitValue]!.toilet
                  }
                    if (Number(item._toiletQuantity) > 0) {
                    return Number(item._toiletQuantity) === 1
                      ? "0.8 GPF"
                      : `0.8 GPF (${item._toiletQuantity})`
                    }
                    return ""
                })()

                return (
                  <tr key={index}>
                    <td className="py-2 px-2 border-b">
                      {isEditable ? (
                        <EditableText
                          value={
                            editedUnits[unitValue ?? ""] !== undefined
                              ? editedUnits[unitValue ?? ""]
                              : (unitValue ?? "")
                          }
                          onChange={(value) => handleUnitEdit(unitValue ?? "", value)}
                          placeholder="Unit number"
                        />
                      ) : editedUnits[unitValue ?? ""] !== undefined ? (
                        editedUnits[unitValue ?? ""]
                      ) : (
                        (unitValue ?? "")
                      )}
                    </td>
                    {hasKitchenAerators && (
                      <td className="py-2 px-2 border-b text-center">
                        {isEditable ? (
                          <EditableText
                            value={
                              unitValue !== undefined && editedInstallations[unitValue]?.kitchen !== undefined
                                ? editedInstallations[unitValue]!.kitchen
                                : kitchenAerator
                            }
                            onChange={(value) => handleInstallationEdit(unitValue ?? "", "kitchen", value)}
                            placeholder="Kitchen installation"
                          />
                        ) : unitValue !== undefined && editedInstallations[unitValue]?.kitchen !== undefined ? (
                          editedInstallations[unitValue]!.kitchen
                        ) : (
                          kitchenAerator
                        )}
                      </td>
                    )}
                    {hasBathroomAerators && (
                      <td className="py-2 px-2 border-b text-center">
                        {isEditable ? (
                          <EditableText
                            value={
                              unitValue !== undefined && editedInstallations[unitValue]?.bathroom !== undefined
                                ? editedInstallations[unitValue]!.bathroom
                                : bathroomAerator
                            }
                            onChange={(value) => handleInstallationEdit(unitValue ?? "", "bathroom", value)}
                            placeholder="Bathroom installation"
                          />
                        ) : unitValue !== undefined && editedInstallations[unitValue]?.bathroom !== undefined ? (
                          editedInstallations[unitValue]!.bathroom
                        ) : (
                          bathroomAerator
                        )}
                      </td>
                    )}
                    {hasShowers && (
                      <td className="py-2 px-2 border-b text-center">
                        {isEditable ? (
                          <EditableText
                            value={
                              unitValue !== undefined && editedInstallations[unitValue]?.shower !== undefined
                                ? editedInstallations[unitValue]!.shower
                                : shower
                            }
                            onChange={(value) => handleInstallationEdit(unitValue ?? "", "shower", value)}
                            placeholder="Shower installation"
                          />
                        ) : unitValue !== undefined && editedInstallations[unitValue]?.shower !== undefined ? (
                          editedInstallations[unitValue]!.shower
                        ) : (
                          shower
                        )}
                      </td>
                    )}
                    {hasToilets && (
                      <td className="py-2 px-2 border-b text-center">
                        {isEditable ? (
                          <EditableText
                            value={
                              unitValue !== undefined && editedInstallations[unitValue]?.toilet !== undefined
                                ? editedInstallations[unitValue]!.toilet
                                : toilet
                            }
                            onChange={(value) => handleInstallationEdit(unitValue ?? "", "toilet", value)}
                            placeholder="Toilet installation"
                          />
                        ) : unitValue !== undefined && editedInstallations[unitValue]?.toilet !== undefined ? (
                          editedInstallations[unitValue]!.toilet
                        ) : (
                          toilet
                        )}
                      </td>
                    )}
                    {hasNotes && (
                      <td className="py-2 px-2 border-b">
                        {(() => {
                          // Check if all columns are empty or 'Unable'
                          const valuesToCheck = [
                            kitchenAerator,
                            bathroomAerator,
                            shower,
                            toilet
                          ];
                          const allEmptyOrUnable = valuesToCheck.every(
                            v => v === "Unable" || v === ""
                          );
                          const detailsText = allEmptyOrUnable
                            ? `${unitType === "Room" ? "Room" : "Unit"} not accessed`
                            : (editedDetails[unitValue ?? ""] !== undefined
                                ? editedDetails[unitValue ?? ""]
                                : getNotesAndDetailsForUnit(unitValue ?? "").detail);
                          if (isEditable) {
                            return (
                              <EditableText
                                value={detailsText}
                                onChange={(value) => handleDetailEdit(unitValue ?? "", value)}
                                placeholder="Details"
                              />
                            );
                          } else {
                            return (
                              <div>
                                {detailsText}
                                <div className="text-xs text-blue-600 mt-1">
                                  📄 Details
                                </div>
                              </div>
                            );
                          }
                        })()}
                      </td>
                    )}
                    {isEditable && (
                      <td className="py-2 px-2 border-b">
                        <Button
                          onClick={() => removeRow(unitValue ?? "")}
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          title="Delete unit"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>

          {isEditable && (
            <div className="mt-4">
              <Button onClick={addNewRow} variant="outline" size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Row
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Print Mode - Multiple Pages */}
      {!isPreview && (
        <div className="space-y-8">
          {filteredData.map((item, index) => (
            <div key={index} className="page-break-before">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left py-2 px-2 border-b">{columnHeaders.unit}</th>
                    {hasKitchenAerators && <th className="text-left py-2 px-2 border-b">{columnHeaders.kitchen}</th>}
                    {hasBathroomAerators && <th className="text-left py-2 px-2 border-b">{columnHeaders.bathroom}</th>}
                    {hasShowers && <th className="text-left py-2 px-2 border-b">{columnHeaders.shower}</th>}
                    {hasToilets && <th className="text-left py-2 px-2 border-b">{columnHeaders.toilet}</th>}
                    {hasNotes && <th className="text-left py-2 px-2 border-b">Details</th>}
                  </tr>
                </thead>
                <tbody>
                  <tr key={index}>
                    <td className="py-2 px-2 border-b">{unitColumn ? item[unitColumn] : item.Unit}</td>
                    {hasKitchenAerators && (
                      <td className="py-2 px-2 border-b text-center">
                        {(() => {
                          if (unitColumn && editedInstallations[item[unitColumn] ?? ""]?.kitchen !== undefined) {
                            return editedInstallations[item[unitColumn] ?? ""]!.kitchen
                          }
                            if (Number(item._kitchenQuantity) > 0) {
                            return Number(item._kitchenQuantity) === 1
                              ? "1.0 GPM"
                              : `1.0 GPM (${item._kitchenQuantity})`
                            }
                            return "Unable"
                        })()}
                      </td>
                    )}
                    {hasBathroomAerators && (
                      <td className="py-2 px-2 border-b text-center">
                        {(() => {
                          if (unitColumn && editedInstallations[item[unitColumn] ?? ""]?.bathroom !== undefined) {
                            return editedInstallations[item[unitColumn] ?? ""]!.bathroom
                          }
                          if (Number(item._bathroomQuantity) > 0) {
                            return Number(item._bathroomQuantity) === 1
                              ? "1.0 GPM"
                              : `1.0 GPM (${item._bathroomQuantity})`
                          }
                          return "Unable"
                        })()}
                      </td>
                    )}
                    {hasShowers && (
                      <td className="py-2 px-2 border-b text-center">
                        {(() => {
                          if (unitColumn && editedInstallations[item[unitColumn] ?? ""]?.shower !== undefined) {
                            return editedInstallations[item[unitColumn] ?? ""]!.shower
                          }

                            const parts = []
                            if (Number(item._showerRegularQuantity) > 0) {
                            if (Number(item._showerRegularQuantity) === 1 && Number(item._showerADAQuantity) === 0) {
                              parts.push("1.75 GPM")
                            } else {
                              parts.push(`1.75 GPM (${item._showerRegularQuantity})`)
                            }
                            }
                            if (Number(item._showerADAQuantity) > 0) {
                            if (Number(item._showerADAQuantity) === 1 && Number(item._showerRegularQuantity) === 0) {
                              parts.push("1.5 GPM")
                            } else {
                              parts.push(`1.5 GPM (${item._showerADAQuantity})`)
                            }
                            }

                          return parts.length > 0 ? parts.join("\n") : "Unable"
                        })()}
                      </td>
                    )}
                    {hasToilets && (
                      <td className="py-2 px-2 border-b text-center">
                        {(() => {
                          if (unitColumn && editedInstallations[item[unitColumn] ?? ""]?.toilet !== undefined) {
                            return editedInstallations[item[unitColumn] ?? ""]!.toilet
                          }
                            if (Number(item._toiletQuantity) > 0) {
                            return Number(item._toiletQuantity) === 1
                              ? "0.8 GPF"
                              : `0.8 GPF (${item._toiletQuantity})`
                            }
                            return ""
                        })()}
                      </td>
                    )}
                    {hasNotes && (
                      <td className="py-2 px-2 border-b">
                        {editedDetails[item.Unit ?? ""] !== undefined
                          ? editedDetails[item.Unit ?? ""]
                          : (
                            <div>
                              {getNotesAndDetailsForUnit(item.Unit ?? "").detail}
                              <div className="text-xs text-blue-600 mt-1">
                                📄 Details
                              </div>
                            </div>
                          )}
                      </td>
                    )}
                  </tr>
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
"use client"

import { useReportContext } from "@/lib/report-context"
import EditableText from "@/components/editable-text"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Trash2 } from "lucide-react"
import { formatNote } from "@/lib/utils/aerator-helpers"
import { getNotesAndDetails, updateStoredNote, updateStoredDetail, getStoredNotes } from "@/lib/notes"

interface Note {
  unit: string
  note: string
  [key: string]: any // Allow dynamic properties
}

interface ReportNotesPageProps {
  notes: Note[]
  isPreview?: boolean
  isEditable?: boolean
}

export default function ReportNotesPage({ notes, isPreview = true, isEditable = true }: ReportNotesPageProps) {
  const { setNotes, sectionTitles, setSectionTitles } = useReportContext()
  // Add state to track edited notes
  const [editedNotes, setEditedNotes] = useState<Note[]>([])
  // Add state for sync checkbox - default to true (checked)
  const [syncNotesAndDetails, setSyncNotesAndDetails] = useState<boolean>(true)

  // Get installation data from localStorage directly (same as details page)
  const [installationData, setInstallationData] = useState<any[]>([])

  // Load installation data from localStorage
  useEffect(() => {
    try {
      const storedInstallationData = localStorage.getItem("installationData")
      if (storedInstallationData) {
        const parsedData = JSON.parse(storedInstallationData)
        setInstallationData(parsedData)
        console.log("Notes: Loaded installation data from localStorage:", parsedData.length, "items")
      } else {
        console.log("Notes: No installation data found in localStorage")
      }
    } catch (error) {
      console.error("Notes: Error loading installation data:", error)
    }
  }, [])

  // Function to find the unit property in notes
  const getUnitProperty = (note: Note): string => {
    // If the note has a property that looks like a unit identifier, use that
    for (const key of Object.keys(note)) {
      const keyLower = key.toLowerCase()
      if (
        keyLower === "unit" ||
        keyLower === "bldg/unit" ||
        keyLower.includes("unit") ||
        keyLower.includes("apt") ||
        keyLower.includes("room")
      ) {
        return key
      }
    }
    // Default to "unit"
    return "unit"
  }

  const findUnitColumn = (data: any[]): string | null => {
    if (!data || data.length === 0) return null

    const item = data[0]
    console.log("Notes: All column names for unit detection:", Object.keys(item))

    for (const key of Object.keys(item)) {
      if (key.toLowerCase().includes("unit")) {
        console.log("Notes: Found unit column:", key)
        return key
      }
    }

    const unitKeywords = ["unit", "apt", "apartment", "room", "number"]
    for (const key of Object.keys(item)) {
      const keyLower = key.toLowerCase()
      for (const keyword of unitKeywords) {
        if (keyLower.includes(keyword)) {
          console.log(`Notes: Found column containing ${keyword}: ${key}`)
          return key
        }
      }
    }

    const firstKey = Object.keys(item)[0]
    console.log(`Notes: No unit column found, using first column as fallback: ${firstKey}`)
    return firstKey
  }

  const getToiletColumnInfo = (item: any): { installed: boolean; columnName: string | null } => {
    const toiletColumn = Object.keys(item).find((key) => key.startsWith("Toilets Installed:"))
    if (toiletColumn && item[toiletColumn] && item[toiletColumn] !== "") {
      return { installed: true, columnName: toiletColumn }
    }
    return { installed: false, columnName: null }
  }

  const hasToiletInstalled = (item: any): boolean => {
    return getToiletColumnInfo(item).installed
  }

  const findColumnName = (possibleNames: string[]): string | null => {
    if (!installationData || installationData.length === 0) return null
    const item = installationData[0]

    for (const key of Object.keys(item)) {
      if (possibleNames.includes(key)) {
        return key
      }
    }

    for (const key of Object.keys(item)) {
      for (const possibleName of possibleNames) {
        if (key.toLowerCase() === possibleName.toLowerCase()) {
          return key
        }
      }
    }

    return null
  }

  const compileNotesForUnit = (item: any, unitColumn: string | null, includeNotAccessed = false): string => {
    // Compile notes from leak issues only
    let notes = ""
    let noteText = ""

    // Handle kitchen faucet leaks with severity
    if (item["Leak Issue Kitchen Faucet"]) {
      const leakValue = item["Leak Issue Kitchen Faucet"].trim()
      const lowerLeakValue = leakValue.toLowerCase()

      if (lowerLeakValue === "light") {
        noteText += "Light leak from kitchen faucet. "
      } else if (lowerLeakValue === "moderate") {
        noteText += "Moderate leak from kitchen faucet. "
      } else if (lowerLeakValue === "heavy") {
        noteText += "Heavy leak from kitchen faucet. "
      } else if (lowerLeakValue === "dripping" || lowerLeakValue === "driping") {
        noteText += "Dripping from kitchen faucet. "
      } else {
        // For any other non-empty value, show "leak from kitchen faucet"
        noteText += "Leak from kitchen faucet. "
      }
    }

    // Handle bathroom faucet leaks with severity
    if (item["Leak Issue Bath Faucet"]) {
      const leakValue = item["Leak Issue Bath Faucet"].trim()
      const lowerLeakValue = leakValue.toLowerCase()

      if (lowerLeakValue === "light") {
        noteText += "Light leak from bathroom faucet. "
      } else if (lowerLeakValue === "moderate") {
        noteText += "Moderate leak from bathroom faucet. "
      } else if (lowerLeakValue === "heavy") {
        noteText += "Heavy leak from bathroom faucet. "
      } else if (lowerLeakValue === "dripping" || lowerLeakValue === "driping") {
        noteText += "Dripping from bathroom faucet. "
      } else {
        // For any other non-empty value, show "leak from bathroom faucet"
        noteText += "Leak from bathroom faucet. "
      }
    }

    // Handle tub spout/diverter leaks with severity
    if (item["Tub Spout/Diverter Leak Issue"]) {
      const leakValue = item["Tub Spout/Diverter Leak Issue"]
      if (leakValue === "Light") {
        notes += "Light leak from tub spout/diverter. "
      } else if (leakValue === "Moderate") {
        notes += "Moderate leak from tub spout/diverter. "
      } else if (leakValue === "Heavy") {
        notes += "Heavy leak from tub spout/diverter. "
      } else {
        // For any other value, just write "leak from tub spout/diverter"
        notes += "Leak from tub spout/diverter. "
      }
    }

    // For notes section, do NOT include "not accessed" messages
    // Only return leak-related notes
    return formatNote(noteText + notes.trim())
  }

  // Initialize editedNotes using notes/details system
  useEffect(() => {
    console.log("Notes: Processing installation data, length:", installationData.length)

    // CRITICAL: Load from localStorage first to get any deletions
    let dataToProcess = installationData
    try {
      const storedData = localStorage.getItem("installationData")
      if (storedData) {
        dataToProcess = JSON.parse(storedData)
        console.log("Notes: Loaded installation data from localStorage (reflects deletions):", dataToProcess.length, "items")
      }
    } catch (error) {
      console.error("Notes: Error loading installation data from localStorage:", error)
    }

    if (!dataToProcess || dataToProcess.length === 0) {
      console.log("Notes: No installation data available")
      return
    }

    const unitColumn = findUnitColumn(dataToProcess)
    console.log("Notes: Using unit column:", unitColumn)

    if (!unitColumn) {
      console.log("Notes: No unit column found")
      return
    }

    // Load selected cells and columns from localStorage (from CSV preview)
    let selectedCells: Record<string, string[]> = {}
    let selectedNotesColumns: string[] = []

    try {
      const storedSelectedCells = localStorage.getItem("selectedCells")
      const storedSelectedNotesColumns = localStorage.getItem("selectedNotesColumns")

      if (storedSelectedCells) {
        selectedCells = JSON.parse(storedSelectedCells)
        console.log("Notes: Loaded selected cells from preview:", selectedCells)
      }

      if (storedSelectedNotesColumns) {
        selectedNotesColumns = JSON.parse(storedSelectedNotesColumns)
        console.log("Notes: Loaded selected notes columns from preview:", selectedNotesColumns)
      }
    } catch (error) {
      console.error("Notes: Error loading selected data from preview:", error)
    }

    // Load the blacklist of deleted units
    let deletedUnitsBlacklist: string[] = []
    try {
      const storedBlacklist = localStorage.getItem("deletedNotesBlacklist")
      if (storedBlacklist) {
        deletedUnitsBlacklist = JSON.parse(storedBlacklist)
        console.log("Notes: Loaded deleted units blacklist:", deletedUnitsBlacklist)
      }
    } catch (error) {
      console.error("Notes: Error loading deleted units blacklist:", error)
    }

    // Use notes/details system to get notes
    console.log("Notes: Using notes/details system...")
    const notesAndDetails = getNotesAndDetails({
      installationData: dataToProcess,
      unitColumn,
      selectedCells,
      selectedNotesColumns,
    })

    // Filter to only include notes with content AND not in blacklist
    const filteredNotes = notesAndDetails.filter((note) => {
      // Check if unit is blacklisted
      if (deletedUnitsBlacklist.includes(note.unit)) {
        console.log(`Notes: Filtering out blacklisted unit ${note.unit}`)
        return false
      }
      
      const hasContent = note.note && note.note.trim() !== ""
      console.log(`Notes: Filtering note for unit ${note.unit}, has content: ${hasContent}, note: "${note.note}"`)
      return hasContent
    })

    console.log("Notes: Final processed notes:", filteredNotes.length, "notes")

    // Update state with notes
    setEditedNotes(filteredNotes)
    setNotes(filteredNotes)

    // Also update localStorage for backward compatibility
    localStorage.setItem("reportNotes", JSON.stringify(filteredNotes))
  }, [setNotes]) // Remove installationData dependency to avoid re-running when prop changes

  // Listen for notes/details updates
  useEffect(() => {
    const handleNotesUpdate = () => {
      console.log("Notes: Received notes/details update event")
      // Re-process notes when notes/details are updated
      
      // Load from localStorage first
      let dataToProcess = installationData
      try {
        const storedData = localStorage.getItem("installationData")
        if (storedData) {
          dataToProcess = JSON.parse(storedData)
        }
      } catch (error) {
        console.error("Notes: Error loading installation data:", error)
      }
      
      if (dataToProcess.length > 0) {
        const unitColumn = findUnitColumn(dataToProcess)
        if (unitColumn) {
          let selectedCells: Record<string, string[]> = {}
          let selectedNotesColumns: string[] = []

          try {
            const storedSelectedCells = localStorage.getItem("selectedCells")
            const storedSelectedNotesColumns = localStorage.getItem("selectedNotesColumns")

            if (storedSelectedCells) {
              selectedCells = JSON.parse(storedSelectedCells)
            }

            if (storedSelectedNotesColumns) {
              selectedNotesColumns = JSON.parse(storedSelectedNotesColumns)
            }
          } catch (error) {
            console.error("Notes: Error loading selected data:", error)
          }

          // Load the blacklist
          let deletedUnitsBlacklist: string[] = []
          try {
            const storedBlacklist = localStorage.getItem("deletedNotesBlacklist")
            if (storedBlacklist) {
              deletedUnitsBlacklist = JSON.parse(storedBlacklist)
            }
          } catch (error) {
            console.error("Notes: Error loading deleted units blacklist:", error)
          }

          const notesAndDetails = getNotesAndDetails({
            installationData: dataToProcess,
            unitColumn,
            selectedCells,
            selectedNotesColumns,
          })

          const filteredNotes = notesAndDetails.filter((note) => {
            // Check blacklist
            if (deletedUnitsBlacklist.includes(note.unit)) {
              return false
            }
            
            const hasContent = note.note && note.note.trim() !== ""
            return hasContent
          })

          setEditedNotes(filteredNotes)
          setNotes(filteredNotes)
          localStorage.setItem("reportNotes", JSON.stringify(filteredNotes))
        }
      }
    }

    window.addEventListener("unitNotesUpdated", handleNotesUpdate)
    return () => window.removeEventListener("unitNotesUpdated", handleNotesUpdate)
  }, [installationData, setNotes])

  // Filter out notes without valid unit numbers - use editedNotes directly for reactivity
  const filteredNotes = editedNotes.filter((note) => {
    if (isEditable) return true;
    if (!note.unit || note.unit.trim() === "") return false;
    const lowerUnit = note.unit.toLowerCase();
    const invalidValues = ["total", "sum", "average", "avg", "count", "header"];
    if (invalidValues.some((val) => lowerUnit.includes(val))) return false;
    return note.note && note.note.trim() !== "";
  });

  // Sort notes by unit ascending
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    const unitA = a.unit || "";
    const unitB = b.unit || "";
    const numA = Number.parseInt(unitA);
    const numB = Number.parseInt(unitB);
    if (!isNaN(numA) && !isNaN(numB)) {
      return numA - numB;
    }
    return unitA.localeCompare(unitB, undefined, { numeric: true, sensitivity: "base" });
  });

  // Split notes into pages of 15 items each
  const notesPerPage = 15;
  const notePages = [];
  for (let i = 0; i < sortedNotes.length; i += notesPerPage) {
    notePages.push(sortedNotes.slice(i, i + notesPerPage));
  }

  // Add function to sort notes by unit number
  const sortNotesByUnit = (notesToSort: Note[]) => {
    return [...notesToSort].sort((a, b) => {
      const unitA = a.unit || ""
      const unitB = b.unit || ""

      // Try to parse as numbers first
      const numA = Number.parseInt(unitA)
      const numB = Number.parseInt(unitB)

      // If both are valid numbers, sort numerically
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB
      }

      // Otherwise, sort alphabetically
      return unitA.localeCompare(unitB, undefined, { numeric: true, sensitivity: "base" })
    })
  }

  const handleNoteChange = (index: number, field: keyof Note, value: string) => {
    if (isEditable) {
      // Create a deep copy of the edited notes array
      const updatedNotes = JSON.parse(JSON.stringify(editedNotes))

      // Handle the unit field properly
      if (field === "unit" || field === getUnitProperty(updatedNotes[index])) {
        // Update the unit field
        const unitProp = getUnitProperty(updatedNotes[index])
        const oldUnit = updatedNotes[index][unitProp]
        updatedNotes[index][unitProp] = value
        updatedNotes[index].unit = value // Also update the standard unit field

        // If unit changed, update the stored note with the new unit
        if (oldUnit !== value) {
          const storedNotes = getStoredNotes()
          if (storedNotes[oldUnit] !== undefined) {
            // Move the note from old unit to new unit
            updateStoredNote(value, storedNotes[oldUnit])
            
            // If sync is enabled, also update details
            if (syncNotesAndDetails) {
              updateStoredDetail(value, storedNotes[oldUnit])
            }
            
            // Remove the old unit entry
            const updatedStoredNotes = { ...storedNotes }
            delete updatedStoredNotes[oldUnit]
            localStorage.setItem("unitNotes", JSON.stringify(updatedStoredNotes))
          }
        }

        // If this is a new unit being added, ensure it appears in the details section
        if (value && value.trim() !== "" && oldUnit === "") {
          // Add the unit to the details section as an additional row
          const additionalRows = JSON.parse(localStorage.getItem("additionalDetailRows") || "[]")
          const unitColumn = findUnitColumn(installationData)

          // Check if this unit already exists in additional rows
          const existingRow = additionalRows.find((row: any) => {
            const rowUnit = unitColumn ? row[unitColumn] : row.Unit
            return rowUnit === value
          })

          if (!existingRow) {
            // Create a new row for the details section
            const newRow: any = {
              Unit: value,
            }

            // Add the unit column if it exists and is different from "Unit"
            if (unitColumn && unitColumn !== "Unit") {
              newRow[unitColumn] = value
            }

            // Add all standard columns
            newRow["Shower Head"] = ""
            newRow["Bathroom aerator"] = ""
            newRow["Kitchen Aerator"] = ""
            newRow["Leak Issue Kitchen Faucet"] = ""
            newRow["Leak Issue Bath Faucet"] = ""
            newRow["Tub Spout/Diverter Leak Issue"] = ""
            newRow["Notes"] = ""

            // Add to the beginning of additional rows
            const updatedAdditionalRows = [newRow, ...additionalRows]
            localStorage.setItem("additionalDetailRows", JSON.stringify(updatedAdditionalRows))

            console.log("Added unit to details section:", value)
          }
        }
      } else if (field === "note") {
        // Update the note content using unified system
        const unitValue = updatedNotes[index].unit
        updateStoredNote(unitValue, value)
        
        // If sync is enabled, also update the details
        if (syncNotesAndDetails) {
          updateStoredDetail(unitValue, value)
          console.log(`Synced note to details for unit ${unitValue}`)
        }
        
        updatedNotes[index][field] = value
      } else {
        updatedNotes[index][field] = value
      }

      console.log(`Updating note ${index}, field ${String(field)} to "${value}"`, updatedNotes[index])

      // If we're changing a unit number, resort the entire array
      if (field === "unit" || field === getUnitProperty(updatedNotes[index])) {
        const sortedNotes = sortNotesByUnit(updatedNotes)
        setEditedNotes(sortedNotes)
        setNotes(sortedNotes)
        localStorage.setItem("reportNotes", JSON.stringify(sortedNotes))
        console.log("Notes resorted after unit change:", sortedNotes)
      } else {
        // Update the local state
        setEditedNotes(updatedNotes)
        setNotes(updatedNotes)
        localStorage.setItem("reportNotes", JSON.stringify(updatedNotes))
      }
    }
  }

  // Add function to add a new note
  const handleAddNote = () => {
    if (isEditable) {
      const newNote: Note = {
        unit: "",
        note: "",
      }

      const updatedNotes = [newNote, ...editedNotes]
      setEditedNotes(updatedNotes)
      setNotes(updatedNotes)
      localStorage.setItem("reportNotes", JSON.stringify(updatedNotes))
      console.log("Added new note successfully")
    }
  }

  // Add function to delete a note
  const handleDeleteNote = (index: number) => {
    if (isEditable) {
      const noteToDelete = editedNotes[index]
      const unitToDelete = noteToDelete.unit
      const updatedNotes = editedNotes.filter((_, i) => i !== index)

      console.log(`Deleting note for unit: ${unitToDelete}`)

      // CRITICAL: Add to blacklist so it never reappears
      try {
        const storedBlacklist = localStorage.getItem("deletedNotesBlacklist")
        let blacklist: string[] = storedBlacklist ? JSON.parse(storedBlacklist) : []
        
        if (!blacklist.includes(unitToDelete)) {
          blacklist.push(unitToDelete)
          localStorage.setItem("deletedNotesBlacklist", JSON.stringify(blacklist))
          console.log(`Added unit ${unitToDelete} to blacklist. Current blacklist:`, blacklist)
        }
      } catch (error) {
        console.error("Error updating blacklist:", error)
      }

      // Remove from unitNotes in localStorage (only the note text, not the unit)
      try {
        const storedNotes = getStoredNotes()
        if (unitToDelete && storedNotes[unitToDelete] !== undefined) {
          const updatedStoredNotes = { ...storedNotes }
          delete updatedStoredNotes[unitToDelete]
          localStorage.setItem("unitNotes", JSON.stringify(updatedStoredNotes))
        }
      } catch (error) {
        console.error("Error removing unit from unitNotes:", error)
      }

      // Remove from reportNotes in localStorage
      try {
        const reportNotes = JSON.parse(localStorage.getItem("reportNotes") || "[]")
        const filteredReportNotes = reportNotes.filter((note: any) => note.unit !== unitToDelete)
        localStorage.setItem("reportNotes", JSON.stringify(filteredReportNotes))
      } catch (error) {
        console.error("Error removing unit from reportNotes:", error)
      }

      // NOTE: We do NOT remove from installationData or unitDetails
      // This allows the unit to still appear in the details page
      // Only the note is deleted, not the entire unit

      setEditedNotes(updatedNotes)
      setNotes(updatedNotes)
      localStorage.setItem("reportNotes", JSON.stringify(updatedNotes))
      console.log(`Deleted note at index ${index} for unit ${unitToDelete}`)
      console.log("Updated notes after deletion:", updatedNotes)
    }
  }

  // Add useEffect to resort notes when loaded
  useEffect(() => {
    if (editedNotes.length > 0) {
      const sortedNotes = sortNotesByUnit(editedNotes)
      // Only update if the order actually changed
      if (JSON.stringify(sortedNotes) !== JSON.stringify(editedNotes)) {
        setEditedNotes(sortedNotes)
        setNotes(sortedNotes)
        localStorage.setItem("reportNotes", JSON.stringify(sortedNotes))
        console.log("Notes resorted on load:", sortedNotes)
      }
    }
  }, []) // Only run once when component mounts

  // Handle section title change
  const handleSectionTitleChange = (value: string) => {
    if (isEditable) {
      setSectionTitles((prev) => {
        const updated = { ...prev, notes: value }
        console.log(`Updated notes section title to "${value}"`, updated)

        // Save to localStorage immediately
        localStorage.setItem("sectionTitles", JSON.stringify(updated))

        return updated
      })
    }
  }

  // Get the section title from context or use default
  const notesTitle = sectionTitles.notes || "Notes"

  return isPreview ? (
    // Preview mode - show all notes in one continuous list
    <div className="report-page min-h-[1056px] relative">
      {/* Header with logo - made bigger and higher up */}
      <div className="mb-8">
        <img
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202025-04-29%20115501-BD1uw5tVq9PtVYW6Z6FKM1i8in6GeV.png"
          alt="GreenLight Logo"
          className="h-24" // Increased from h-16
          crossOrigin="anonymous"
        />
      </div>

      {/* Notes content */}
      <div className="mb-16">
        <div className="sticky top-0 bg-white z-10 pb-4 border-b mb-6">
          <div className="flex items-center justify-between pt-2">
            <h2 className="text-xl font-bold">
              {isEditable ? (
                <EditableText
                  value={notesTitle}
                  onChange={handleSectionTitleChange}
                  placeholder="Section Title"
                  className="text-xl font-bold"
                />
              ) : (
                notesTitle
              )}
            </h2>
            <div className="flex items-center gap-4">
              {isEditable && (
                <>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="sync-notes-details"
                      checked={syncNotesAndDetails}
                      onCheckedChange={(checked) => setSyncNotesAndDetails(checked as boolean)}
                    />
                    <label
                      htmlFor="sync-notes-details"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      Sync notes with details section
                    </label>
                  </div>
                  <Button onClick={handleAddNote} size="sm" className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add Note
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        <table className="w-full notes-table">
          <thead>
            <tr>
              <th className="text-left py-2 px-4 border-b w-[150px]">Unit</th>
              <th className="text-left py-2 px-4 border-b">Notes</th>
              {isEditable && <th className="text-left py-2 px-4 border-b w-16">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filteredNotes.length === 0 ? (
              <tr>
                <td colSpan={isEditable ? 3 : 2} className="py-4 px-4 text-center text-gray-500">
                  No notes with leak issues found
                </td>
              </tr>
            ) : (
              filteredNotes.map((note, index) => {
                const unitProp = getUnitProperty(note)
                
                return (
                  <tr key={index}>
                    <td className="py-2 px-4 border-b">
                      {isEditable ? (
                        <EditableText
                          value={note[unitProp]}
                          onChange={(value) => handleNoteChange(index, unitProp, value)}
                          placeholder="Unit"
                        />
                      ) : (
                        note[unitProp]
                      )}
                    </td>
                    <td className="py-2 px-4 border-b whitespace-pre-line">
                      {isEditable ? (
                        <EditableText
                          value={note.note}
                          onChange={(value) => handleNoteChange(index, "note", value)}
                          placeholder="Note"
                          multiline={true}
                        />
                      ) : (
                        note.note
                      )}
                    </td>
                    {isEditable && (
                      <td className="py-2 px-4 border-b">
                        <Button
                          onClick={() => handleDeleteNote(index)}
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    )}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer - full width */}
      <div className="footer-container">
        <img
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202025-04-29%20115454-uWCS2yWrowegSqw9c2SIVcLdedTk82.png"
          alt="GreenLight Footer"
          className="w-full h-auto"
          crossOrigin="anonymous"
        />
      </div>
    </div>
  ) : (
    // PDF/Print mode - paginate the notes
    <>
      {notePages.map((pageNotes, pageIndex) => (
        <div key={pageIndex} className="report-page min-h-[1056px] relative">
          {/* Header with logo - made bigger and higher up */}
          <div className="mb-8">
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202025-04-29%20115501-BD1uw5tVq9PtVYW6Z6FKM1i8in6GeV.png"
              alt="GreenLight Logo"
              className="h-24" // Increased from h-16
              crossOrigin="anonymous"
            />
          </div>

          {/* Notes content */}
          <div className="mb-16">
            <h2 className="text-xl font-bold mb-6">{notesTitle}</h2>

            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left py-2 px-4 border-b w-[150px]">Unit</th>
                  <th className="text-left py-2 px-4 border-b">Notes</th>
                </tr>
              </thead>
              <tbody>
                {pageNotes.map((note, index) => {
                  // Calculate the actual index in the full notes array
                  const actualIndex = pageIndex * notesPerPage + index
                  const unitProp = getUnitProperty(note)

                  return (
                    <tr key={index}>
                      <td className="py-2 px-4 border-b">
                        {isEditable ? (
                          <EditableText
                            value={note[unitProp]}
                            onChange={(value) => handleNoteChange(actualIndex, unitProp, value)}
                            placeholder="Unit"
                          />
                        ) : (
                          note[unitProp]
                        )}
                      </td>
                      <td className="py-2 px-4 border-b whitespace-pre-line">
                        {isEditable ? (
                          <EditableText
                            value={note.note}
                            onChange={(value) => handleNoteChange(actualIndex, "note", value)}
                            placeholder="Note"
                            multiline={true}
                          />
                        ) : (
                          note.note
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Footer - full width */}
          <div className="footer-container">
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202025-04-29%20115454-uWCS2yWrowegSqw9c2SIVcLdedTk82.png"
              alt="GreenLight Footer"
              className="w-full h-auto"
              crossOrigin="anonymous"
            />
          </div>

          {/* Page number */}
          <div className="absolute top-4 right-4 text-sm">Page {3 + pageIndex} of 21</div>
        </div>
      ))}
    </>
  )
}
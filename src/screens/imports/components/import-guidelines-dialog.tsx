"use client"

import { InfoIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { IMPORT_GUIDELINES } from "@/lib/imports/import.constants"

export function ImportGuidelinesDialog() {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <InfoIcon aria-hidden="true" />
        Import Guidelines
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import guidelines</DialogTitle>
          <DialogDescription>
            Check your file against these requirements before importing.
          </DialogDescription>
        </DialogHeader>
        <ul className="flex list-disc flex-col gap-2 pl-5">
          {IMPORT_GUIDELINES.map((guideline) => (
            <li key={guideline}>{guideline}</li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  )
}

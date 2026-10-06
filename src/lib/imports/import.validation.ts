import {
  IMPORT_FILE_EXTENSION,
  IMPORT_MAX_FILE_SIZE_BYTES,
  IMPORT_MAX_FILE_SIZE_LABEL,
} from "@/lib/imports/import.constants"

/** Returns a message the admin can act on, or null when the file can be imported. */
export function validateImportFile(file: Pick<File, "name" | "size">) {
  if (!file.name.toLowerCase().endsWith(IMPORT_FILE_EXTENSION)) {
    return `“${file.name}” is not a CSV file. Choose a file that ends in ${IMPORT_FILE_EXTENSION}.`
  }

  if (file.size > IMPORT_MAX_FILE_SIZE_BYTES) {
    return `“${file.name}” is too large. The maximum file size is ${IMPORT_MAX_FILE_SIZE_LABEL}.`
  }

  return null
}

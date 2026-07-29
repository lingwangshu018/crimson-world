export type LibraryImportKind = "character" | "worldbook" | "library";

export type LibraryImportResult = {
  kind: LibraryImportKind;
  data: unknown;
};

export async function parseLibraryImport(file: File): Promise<LibraryImportResult | null> {
  const ext = file.name.split(".").pop()?.toLowerCase();

  if (ext === "json") {
    const value = JSON.parse(await file.text());

    if (value?.version === 1 && Array.isArray(value.characters) && Array.isArray(value.worldbooks)) {
      return { kind: "library", data: value };
    }

    if (value?.name && value?.profile) {
      return { kind: "character", data: value };
    }

    if (value?.title && value?.content) {
      return { kind: "worldbook", data: value };
    }
  }

  if (ext === "txt") {
    return {
      kind: "character",
      data: {
        name: file.name.replace(/\.txt$/i, ""),
        nickname: "",
        profile: await file.text(),
      },
    };
  }

  return null;
}

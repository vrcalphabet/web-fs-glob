export async function getDirectoryHandleSafe(
  handle: FileSystemDirectoryHandle,
  name: string,
): Promise<FileSystemDirectoryHandle | undefined> {
  try {
    return await handle.getDirectoryHandle(name)
  } catch {
    return undefined
  }
}

export async function getFileHandleSafe(
  handle: FileSystemDirectoryHandle,
  name: string,
): Promise<FileSystemFileHandle | undefined> {
  try {
    return await handle.getFileHandle(name)
  } catch {
    return undefined
  }
}

export async function getFileOrDirectoryHandleSafe(
  handle: FileSystemDirectoryHandle,
  name: string,
): Promise<FileSystemFileHandle | FileSystemDirectoryHandle | undefined> {
  return (
    (await getFileHandleSafe(handle, name)) ??
    (await getDirectoryHandleSafe(handle, name))
  )
}

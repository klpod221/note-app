import { create } from "zustand";
import {
  getNoteById,
  createNote,
  fetchRootNotes as fetchRootApi,
  fetchFolderChildren as fetchChildrenApi,
  fetchTrashNotes as fetchTrashApi,
  updateNote,
  trashNote,
  restoreNote as restoreNoteApi,
  moveNote as moveNoteApi,
} from "@/services/noteService";

const useNoteStore = create((set, get) => ({
  // State
  note: {},
  notes: [],
  trashNotes: [],
  loading: false,
  noteLoading: false,
  loadedFolders: new Set(),
  trashLoaded: false,

  // Actions
  setNote: (note) => set({ note }),
  setNotes: (notes) => set({ notes }),
  setTrashNotes: (trashNotes) => set({ trashNotes }),
  setLoading: (loading) => set({ loading }),

  // Track loaded folders
  addLoadedFolder: (folderId) =>
    set((state) => ({
      loadedFolders: new Set([...state.loadedFolders, folderId]),
    })),

  resetLoadedFolders: () => set({ loadedFolders: new Set() }),

  // Set trash loaded status
  setTrashLoaded: (loaded) => set({ trashLoaded: loaded }),

  fetchNote: async (id) => {
    try {
      set({ noteLoading: true });
      const { data } = await getNoteById(id);

      const note = {
        ...data,
        id,
      };

      set({ note, noteLoading: false });

      // Load all parent folders and their notes
      if (note.parentId) {
        await get().loadParentFoldersAndNotes(note);
      }

      return note;
    } catch (error) {
      console.error("Error fetching note:", error);
      return null;
    } finally {
      set({ noteLoading: false });
    }
  },

  // Load all parent folders and their notes
  loadParentFoldersAndNotes: async (note) => {
    try {
      if (!note || !note.parentId) return false;

      // Track the complete chain of parent IDs
      const parentChain = [];
      let currentParentId = note.parentId;
      const state = get();

      // First pass: collect all parent IDs without loading data
      while (currentParentId) {
        // Avoid circular references
        if (parentChain.includes(currentParentId)) {
          console.warn("Circular parent reference detected", currentParentId);
          break;
        }

        parentChain.push(currentParentId);

        // Check if we already have this parent in our notes
        const existingParent = state.notes.find(
          (n) => n._id === currentParentId
        );
        if (existingParent) {
          currentParentId = existingParent.parentId;
        } else {
          // Need to fetch this parent
          try {
            const { data } = await getNoteById(currentParentId);
            if (!data) break;

            currentParentId = data.parentId;

            // Add the fetched parent to notes state to avoid fetching again
            set((state) => ({
              notes: [...state.notes, { ...data, id: currentParentId }],
            }));
          } catch (err) {
            console.error("Error in parent chain lookup:", err);
            break;
          }
        }
      }

      // Second pass: load folder contents in parallel using promises
      // This ensures we load the hierarchy efficiently
      if (parentChain.length > 0) {
        const folderLoadPromises = parentChain
          .reverse()
          .filter((folderId) => !get().loadedFolders.has(folderId))
          .map((folderId) => get().fetchFolderChildren(folderId));

        // Wait for all folder contents to load concurrently
        await Promise.all(folderLoadPromises);
      }

      return true;
    } catch (error) {
      console.error("Error loading parent folders:", error);
      return false;
    }
  },

  // Fetch root notes
  fetchRootNotes: async () => {
    set({ loading: true });
    // Reset loaded state on root fetch
    get().resetLoadedFolders();
    set({ trashLoaded: false });
    set({ trashNotes: [] });

    try {
      const notes = await fetchRootApi();
      set({ notes });

      const currentNote = get().note;
      if (currentNote && currentNote.parentId) {
        await get().loadParentFoldersAndNotes(currentNote);
      }

      return notes;
    } catch (error) {
      console.error("Error fetching root notes:", error);
      return [];
    } finally {
      set({ loading: false });
    }
  },

  // Fetch folder children
  fetchFolderChildren: async (folderId) => {
    try {
      const children = await fetchChildrenApi(folderId);

      // Add new notes to the state
      set((state) => {
        // Create a map of existing notes for easy lookup
        const notesMap = new Map(state.notes.map((note) => [note._id, note]));

        // Add or update children notes
        children.forEach((child) => {
          notesMap.set(child._id, child);
        });

        // Convert map back to array
        return { notes: Array.from(notesMap.values()) };
      });

      // Mark folder as loaded
      get().addLoadedFolder(folderId);

      return children;
    } catch (error) {
      console.error(`Error fetching folder children for ${folderId}:`, error);
      return [];
    }
  },

  // Fetch trash items
  fetchTrashItems: async () => {
    // Don't reload if already loaded
    if (get().trashLoaded) return get().trashNotes;

    try {
      const trashNotes = await fetchTrashApi();
      set({ trashNotes, trashLoaded: true });
      return trashNotes;
    } catch (error) {
      console.error("Error fetching trash items:", error);
      return [];
    }
  },

  // Delete note
  deleteNote: async (noteId) => {
    try {
      // Find the note to be deleted
      const noteToTrash = get().notes.find((note) => note._id === noteId);

      if (noteToTrash) {
        // Optimistically update UI first
        set((state) => ({
          notes: state.notes.filter((note) => note._id !== noteId),
        }));

        // Add to trash with deletedAt timestamp
        const trashedNote = {
          ...noteToTrash,
          deletedAt: new Date().toISOString(),
        };

        set((state) => ({
          trashNotes: [...state.trashNotes, trashedNote],
        }));

        // Call API
        const response = await trashNote(noteId);

        if (!response.success) {
          // Rollback if API fails
          set((state) => ({
            notes: [...state.notes, noteToTrash],
            trashNotes: state.trashNotes.filter((note) => note._id !== noteId),
          }));

          throw new Error(response.error || "Failed to delete note");
        }

        return { success: true };
      }

      const noteToDelete = get().trashNotes.find((note) => note._id === noteId);
      if (noteToDelete) {
        // Optimistically update UI first
        set((state) => ({
          trashNotes: state.trashNotes.filter((note) => note._id !== noteId),
        }));

        // Call API
        const response = await trashNote(noteId, true);

        if (!response.success) {
          // Rollback if API fails
          set((state) => ({
            trashNotes: [...state.trashNotes, noteToDelete],
          }));

          throw new Error(response.error || "Failed to delete note");
        }

        return { success: true };
      }

      return { success: false, error: "Note not found" };
    } catch (error) {
      console.error(`Error deleting note ${noteId}:`, error);
      return { success: false, error: error.message };
    }
  },

  // Restore note
  restoreNote: async (noteId) => {
    try {
      // Find the note to restore
      const noteToRestore = get().trashNotes.find(
        (note) => note._id === noteId
      );

      if (noteToRestore) {
        // Optimistically update UI first
        set((state) => ({
          trashNotes: state.trashNotes.filter((note) => note._id !== noteId),
        }));

        // Add back to notes without deletedAt
        const { deletedAt, ...restoredNote } = noteToRestore;
        set((state) => ({
          notes: [...state.notes, restoredNote],
        }));

        // Call API
        const response = await restoreNoteApi(noteId);

        if (!response.success) {
          // Rollback if API fails
          set((state) => ({
            trashNotes: [...state.trashNotes, noteToRestore],
            notes: state.notes.filter((note) => note._id !== noteId),
          }));

          throw new Error(response.error || "Failed to restore note");
        }

        return { success: true };
      }

      return { success: false, error: "Note not found in trash" };
    } catch (error) {
      console.error(`Error restoring note ${noteId}:`, error);
      return { success: false, error: error.message };
    }
  },

  // Create note
  createNote: async ({ name, parentId, isFolder }) => {
    try {
      const newNote = {
        name,
        parentId,
        isFolder,
      };

      const response = await createNote(newNote);

      if (response.success) {
        // Add new note to state
        set((state) => ({
          notes: [...state.notes, response.data],
        }));

        return { success: true, data: response.data };
      }

      throw new Error(response.error || "Failed to create note");
    } catch (error) {
      console.error("Error creating note:", error);
      return { success: false, error: error.message };
    }
  },

  // Rename note
  renameNote: async ({ id, name }) => {
    try {
      // Optimistically update state
      set((state) => ({
        notes: state.notes.map((note) =>
          note._id === id ? { ...note, name } : note
        ),
      }));

      // Call API
      const response = await updateNote(id, { name });

      if (!response.success) {
        // Roll back on failure
        const originalNote = get().notes.find((note) => note._id === id);
        if (originalNote) {
          set((state) => ({
            notes: state.notes.map((note) =>
              note._id === id ? { ...note, name: originalNote.name } : note
            ),
          }));
        }

        throw new Error(response.error || "Failed to rename note");
      }

      return { success: true };
    } catch (error) {
      console.error(`Error renaming note ${id}:`, error);
      return { success: false, error: error.message };
    }
  },

  // Move note
  moveNote: async (noteId, newParentId) => {
    try {
      // Store original state for rollback
      const originalNote = get().notes.find((note) => note._id === noteId);
      const originalParentId = originalNote?.parentId;

      // Optimistically update state
      set((state) => ({
        notes: state.notes.map((note) =>
          note._id === noteId ? { ...note, parentId: newParentId } : note
        ),
      }));

      // Call API
      const response = await moveNoteApi(noteId, newParentId);

      if (!response.success) {
        // Roll back on failure
        set((state) => ({
          notes: state.notes.map((note) =>
            note._id === noteId ? { ...note, parentId: originalParentId } : note
          ),
        }));

        throw new Error(response.error || "Failed to move note");
      }

      return { success: true };
    } catch (error) {
      console.error(`Error moving note ${noteId}:`, error);
      return { success: false, error: error.message };
    }
  },
}));

export default useNoteStore;

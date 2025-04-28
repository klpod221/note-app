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
  parentFoldersLoaded: false, // Add a flag to track parent folders loading status

  // Actions
  setNote: (note) => set({ note }),
  setNotes: (notes) => set({ notes }),
  setTrashNotes: (trashNotes) => set({ trashNotes }),
  setLoading: (loading) => set({ loading }),
  setParentFoldersLoaded: (loaded) => set({ parentFoldersLoaded: loaded }),

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
      set({ noteLoading: true, parentFoldersLoaded: false }); // Reset parentFoldersLoaded flag
      const { data } = await getNoteById(id);

      const note = {
        ...data,
        id,
      };

      set({ note, noteLoading: false });

      // Check if note is deleted/in trash
      if (note.deletedAt) {
        // Load trash items if this is a deleted note
        await get().fetchTrashItems();
      }

      // Load all parent folders and their notes
      if (note.parentId) {
        await get().loadParentFoldersAndNotes(note);
      }
      
      // Mark parent folders as loaded after successful loading
      set({ parentFoldersLoaded: true });

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
        
        // Check if the parent is in trash
        const deletedParent = state.trashNotes.find(
          (n) => n._id === currentParentId
        );

        if (existingParent) {
          currentParentId = existingParent.parentId;
        } else if (deletedParent) {
          // If parent is in trash, we can't access it in the normal hierarchy
          console.warn("Parent note is in trash", currentParentId);
          break;
        } else {
          // Need to fetch this parent
          try {
            const { data } = await getNoteById(currentParentId);
            if (!data) break;
            
            // If the fetched parent is deleted, break the chain
            if (data.deletedAt) {
              console.warn("Parent note is deleted", currentParentId);
              break;
            }

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
        
        // Make sure all parent folders are marked as loaded
        parentChain.forEach(folderId => {
          get().addLoadedFolder(folderId);
        });
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

      // Also fetch trash items when refreshing
      await get().fetchTrashItems();

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
      
      // After loading trash notes, we want to add folders containing trashed items to loadedFolders,
      // so that the tree structure can be properly displayed
      const folderIds = new Set();
      trashNotes.forEach(note => {
        if (note.parentId) folderIds.add(note.parentId);
      });
      
      // Update the store
      set(state => ({
        trashNotes,
        trashLoaded: true,
        loadedFolders: new Set([...state.loadedFolders, ...folderIds])
      }));
      
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
        // Find all children recursively (for UI update)
        const findAllChildren = (parentId) => {
          const children = get().notes.filter(note => note.parentId === parentId);
          let allChildren = [...children];
          
          for (const child of children) {
            const childDescendants = findAllChildren(child._id);
            allChildren = [...allChildren, ...childDescendants];
          }
          
          return allChildren;
        };

        const childNotes = findAllChildren(noteId);
        const allNotesToTrash = [noteToTrash, ...childNotes];
        const allNoteIds = allNotesToTrash.map(note => note._id);
        
        // Optimistically update UI first - remove from notes
        set((state) => ({
          notes: state.notes.filter((note) => !allNoteIds.includes(note._id)),
        }));

        // Add to trash with deletedAt timestamp
        const trashedNotes = allNotesToTrash.map(note => ({
          ...note,
          deletedAt: new Date().toISOString(),
        }));

        set((state) => ({
          trashNotes: [...state.trashNotes, ...trashedNotes],
        }));

        // Call API
        const response = await trashNote(noteId);

        if (!response.success) {
          // Rollback if API fails
          set((state) => ({
            notes: [...state.notes, ...allNotesToTrash],
            trashNotes: state.trashNotes.filter((note) => !allNoteIds.includes(note._id)),
          }));

          throw new Error(response.error || "Failed to delete note");
        }

        return { success: true };
      }

      const noteToDelete = get().trashNotes.find((note) => note._id === noteId);
      if (noteToDelete) {
        // Find all children recursively (for UI update)
        const findAllChildrenInTrash = (parentId) => {
          const children = get().trashNotes.filter(note => note.parentId === parentId);
          let allChildren = [...children];
          
          for (const child of children) {
            const childDescendants = findAllChildrenInTrash(child._id);
            allChildren = [...allChildren, ...childDescendants];
          }
          
          return allChildren;
        };

        const childNotes = findAllChildrenInTrash(noteId);
        const allNotesToDelete = [noteToDelete, ...childNotes];
        const allNoteIds = allNotesToDelete.map(note => note._id);

        // Optimistically update UI first
        set((state) => ({
          trashNotes: state.trashNotes.filter((note) => !allNoteIds.includes(note._id)),
        }));

        // Call API
        const response = await trashNote(noteId, true);

        if (!response.success) {
          // Rollback if API fails
          set((state) => ({
            trashNotes: [...state.trashNotes, ...allNotesToDelete],
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
        // Check if parent folder exists and is not in trash
        if (noteToRestore.parentId) {
          const parentExists = get().notes.some(note => note._id === noteToRestore.parentId);
          
          if (!parentExists) {
            return { 
              success: false, 
              error: "Parent folder does not exist or is in trash. Restore parent folder first."
            };
          }
        }

        // Find all children recursively (for UI update)
        const findAllChildrenInTrash = (parentId) => {
          const children = get().trashNotes.filter(note => note.parentId === parentId);
          let allChildren = [...children];
          
          for (const child of children) {
            const childDescendants = findAllChildrenInTrash(child._id);
            allChildren = [...allChildren, ...childDescendants];
          }
          
          return allChildren;
        };

        const childNotes = findAllChildrenInTrash(noteId);
        const allNotesToRestore = [noteToRestore, ...childNotes];
        const allNoteIds = allNotesToRestore.map(note => note._id);

        // Optimistically update UI first - remove from trash
        set((state) => ({
          trashNotes: state.trashNotes.filter((note) => !allNoteIds.includes(note._id)),
        }));

        // Add back to notes without deletedAt
        const restoredNotes = allNotesToRestore.map(note => {
          const { deletedAt, ...restoredNote } = note;
          return restoredNote;
        });

        set((state) => ({
          notes: [...state.notes, ...restoredNotes],
        }));

        // Call API
        const response = await restoreNoteApi(noteId);

        if (!response.success) {
          // Rollback if API fails
          set((state) => ({
            trashNotes: [...state.trashNotes, ...allNotesToRestore],
            notes: state.notes.filter((note) => !allNoteIds.includes(note._id)),
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

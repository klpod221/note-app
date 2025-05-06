import api from "@/lib/api";

export async function fetchRootNotes() {
  try {
    const response = await api.get("/note?root=true");
    return response.data;
  } catch (error) {
    console.error("Failed to fetch root notes:", error);
    throw error;
  }
}

/**
 * Fetch children notes of a folder
 * @param {string} folderId - ID of the folder
 * @returns {Promise} Promise with the API response
 */
export async function fetchFolderChildren(folderId) {
  try {
    const response = await api.get(`/note?parentId=${folderId}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch children for folder ${folderId}:`, error);
    throw error;
  }
}

/**
 * Fetch deleted notes (trash items)
 * @returns {Promise} Promise with the API response
 */
export async function fetchTrashNotes() {
  try {
    const response = await api.get("/note?trash=true");
    return response.data;
  } catch (error) {
    console.error("Failed to fetch trash notes:", error);
    throw error;
  }
}

/**
 * Create a new note
 * @param {Object} noteData - Note data to create
 * @returns {Promise} Promise with the API response
 */
export async function createNote(noteData) {
  try {
    const response = await api.post("/note", noteData);
    return {
      data: response.data,
      success: true,
    };
  } catch (error) {
    console.error("Failed to create note:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Update a note
 * @param {string} noteId - ID of the note to update
 * @param {Object} noteData - Updated note data
 * @returns {Promise} Promise with the API response
 */
export async function updateNote(noteId, noteData) {
  try {
    const response = await api.put(`/note/${noteId}`, noteData);
    return {
      data: response.data,
      success: true,
    };
  } catch (error) {
    console.error(`Failed to update note ${noteId}:`, error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Move a note to trash (soft delete)
 * @param {string} noteId - ID of the note to trash
 * @returns {Promise} Promise with the API response
 */
export async function trashNote(noteId) {
  try {
    const response = await api.delete(`/note/${noteId}`);
    return {
      data: response.data,
      success: true,
    };
  } catch (error) {
    console.error(`Failed to trash note ${noteId}:`, error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get a note by ID
 * @param {string} noteId - ID of the note to fetch
 * @returns {Promise} Promise with the API response
 */
export async function getNoteById(noteId) {
  try {
    const response = await api.get(`/note/${noteId}`);
    return {
      data: response.data,
      success: true,
    };
  } catch (error) {
    console.error(`Failed to fetch note ${noteId}:`, error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Restore a note from trash
 * @param {string} noteId - ID of the note to restore
 * @returns {Promise} Promise with the API response
 */
export async function restoreNote(noteId) {
  try {
    const response = await api.put(`/note/${noteId}/restore`);
    return {
      data: response.data,
      success: true,
    };
  } catch (error) {
    console.error(`Failed to restore note ${noteId}:`, error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Move a note to a different parent folder
 * @param {string} noteId - ID of the note to move
 * @param {string} parentId - ID of the new parent folder (null for root level)
 * @returns {Promise} Promise with the API response
 */
export async function moveNote(noteId, parentId) {
  try {
    const response = await api.patch(`/note/${noteId}/move`, { parentId });
    return {
      data: response.data,
      success: true,
    };
  } catch (error) {
    console.error(`Failed to move note ${noteId}:`, error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Fetch readme notes
 * @returns {Promise} Promise with the API response
 */
export async function fetchReadmeNotes() {
  try {
    const response = await api.get("/readme");
    return {
      ...response.data,
      success: true,
    };
  } catch (error) {
    console.error("Failed to fetch readme notes:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Search notes with text query and pagination support
 * @param {string} query - The search query
 * @param {number} page - Page number for pagination (default: 1)
 * @param {number} limit - Number of items per page (default: 10)
 * @returns {Promise} Promise with search results
 */
export async function searchNotes(query, page = 1, limit = 5) {
  try {
    const response = await api.get(`/note/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Error searching notes:', error);
    return {
      success: false,
      error: error.message || 'Failed to search notes',
    };
  }
}

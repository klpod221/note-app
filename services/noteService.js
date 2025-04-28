/**
 * Service for interacting with the note API endpoints
 */

/**
 * Fetch root level notes (notes without a parent)
 * @returns {Promise} Promise with the API response
 */
export async function fetchRootNotes() {
  try {
    const response = await fetch('/api/note?root=true', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch root notes:', error);
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
    const response = await fetch(`/api/note?parentId=${folderId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    return await response.json();
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
    const response = await fetch('/api/note?trash=true', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch trash notes:', error);
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
    const response = await fetch('/api/note', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(noteData),
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    return {
      data: await response.json(),
      success: true
    };
  } catch (error) {
    console.error('Failed to create note:', error);
    return {
      success: false,
      error: error.message
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
    const response = await fetch(`/api/note/${noteId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(noteData),
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    return {
      data: await response.json(),
      success: true
    };
  } catch (error) {
    console.error(`Failed to update note ${noteId}:`, error);
    return {
      success: false,
      error: error.message
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
    const response = await fetch(`/api/note/${noteId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    return {
      data: await response.json(),
      success: true
    };
  } catch (error) {
    console.error(`Failed to trash note ${noteId}:`, error);
    return {
      success: false,
      error: error.message
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
    const response = await fetch(`/api/note/${noteId}/restore`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    return {
      data: await response.json(),
      success: true
    };
  } catch (error) {
    console.error(`Failed to restore note ${noteId}:`, error);
    return {
      success: false,
      error: error.message
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
    const response = await fetch(`/api/note/${noteId}/move`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ parentId }),
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    return {
      data: await response.json(),
      success: true
    };
  } catch (error) {
    console.error(`Failed to move note ${noteId}:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}

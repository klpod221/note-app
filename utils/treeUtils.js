/**
 * Utility functions for building and manipulating tree data structures for notes
 */

/**
 * Converts a note object to a tree node structure for Ant Design's Tree component
 * 
 * @param {Object} note - The note object
 * @param {boolean} isTrashItem - Whether this note is in the trash
 * @returns {Object} - Tree node object for Ant Design's Tree
 */
export const convertToTreeNode = (note, isTrashItem = false) => {
  return {
    title: note.name,
    key: note._id,
    isLeaf: !note.isFolder,
    isFolder: note.isFolder,
    isTrashItem: isTrashItem,
    parentId: note.parentId,
    children: note.children && note.children.length > 0
      ? sortTreeNodes(note.children.map(child => convertToTreeNode(child, isTrashItem)))
      : undefined,
  };
};

/**
 * Sort tree nodes to show folders first, then files, both in alphabetical order
 * 
 * @param {Array} nodes - Array of tree nodes to sort
 * @returns {Array} - Sorted array with folders first
 */
export const sortTreeNodes = (nodes) => {
  if (!nodes || nodes.length === 0) return [];
  
  return [...nodes].sort((a, b) => {
    // First priority: folders before files
    if (a.isFolder && !b.isFolder) return -1;
    if (!a.isFolder && b.isFolder) return 1;
    
    // Second priority: alphabetical order by title
    return a.title.localeCompare(b.title);
  });
};

/**
 * Builds a tree data structure from a flat array of notes
 * 
 * @param {Array} notes - Flat array of notes
 * @param {boolean} isTrash - Whether these are trash items
 * @param {Set} loadedFolderIds - Set of folder IDs that have been loaded
 * @returns {Array} - Tree data structure for rendering
 */
export const buildTreeData = (notes, isTrash = false, loadedFolderIds = new Set()) => {
  // Create a map of all notes by their ID
  const notesMap = {};
  notes.forEach(note => {
    notesMap[note._id] = {
      ...note,
      children: [],
    };
  });

  // Build tree structure
  const rootNotes = [];

  // Process each note to build the tree
  notes.forEach(note => {
    if (!note.parentId) {
      // Root level items
      rootNotes.push(notesMap[note._id]);
    } else {
      // For trash items, we want to show them in their original hierarchy if possible
      if (isTrash) {
        // Check if parent exists in the current set of notes
        if (notesMap[note.parentId]) {
          notesMap[note.parentId].children.push(notesMap[note._id]);
        } else {
          // If parent doesn't exist in trash, show at root level
          rootNotes.push(notesMap[note._id]);
        }
      } else {
        // For regular notes, only add children to parents that are loaded
        if (notesMap[note.parentId] && loadedFolderIds.has(note.parentId)) {
          notesMap[note.parentId].children.push(notesMap[note._id]);
        }
      }
    }
  });

  // Convert to Tree data structure and sort nodes
  return sortTreeNodes(rootNotes.map(note => convertToTreeNode(note, isTrash)));
};

/**
 * Finds nodes in the tree that match the search term
 * 
 * @param {Array} data - Tree data
 * @param {string} searchValue - Search term
 * @returns {Array} - Array of keys for matching nodes
 */
export const findMatchingNodes = (data, searchValue) => {
  const keys = [];

  const loop = (data, searchValue) => {
    return data.filter(item => {
      if (item.title.toLowerCase().indexOf(searchValue.toLowerCase()) > -1) {
        keys.push(item.key);
        return true;
      }
      if (item.children) {
        return loop(item.children, searchValue).length > 0;
      }
      return false;
    });
  };

  loop(data, searchValue);
  return keys;
};

/**
 * Find a node by its position in the tree
 * 
 * @param {Array} treeData - Tree data array
 * @param {string} pos - Position string (e.g. "0-1-2")
 * @param {string} currentPos - Current position in traversal
 * @returns {Object|null} - Found node or null
 */
export const findNodeByPos = (treeData, pos, currentPos = "0") => {
  for (let i = 0; i < treeData.length; i++) {
    const newPos = `${currentPos}-${i}`;
    if (newPos === pos) {
      return treeData[i];
    }

    if (treeData[i].children) {
      const foundInChildren = findNodeByPos(
        treeData[i].children,
        pos,
        newPos
      );
      if (foundInChildren) {
        return foundInChildren;
      }
    }
  }
  return null;
};

/**
 * Find all parent folder keys for a node with the given key
 * @param {Array} treeData - The tree data structure
 * @param {string} nodeKey - The key of the node to find parents for
 * @returns {Array} - Array of parent folder keys
 */
export const getParentKeys = (treeData, nodeKey) => {
  const parentKeys = [];
  
  const findParents = (nodes, targetKey, path = []) => {
    if (!nodes || !Array.isArray(nodes)) return null;
    
    for (const node of nodes) {
      // Skip undefined or null nodes
      if (!node) continue;
      
      // Current path including this node
      const currentPath = [...path, node.key];
      
      // If this is the node we're looking for, return its parent path (excluding the node itself)
      if (node.key === targetKey) {
        return path;
      }
      
      // If this node has children, search them
      if (node.children && node.children.length > 0) {
        const result = findParents(node.children, targetKey, currentPath);
        if (result) {
          return result;
        }
      }
    }
    
    // Node not found in this branch
    return null;
  };
  
  // Search in the provided tree
  return findParents(treeData, nodeKey) || [];
};
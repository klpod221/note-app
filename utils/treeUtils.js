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
      ? note.children.map(child => convertToTreeNode(child, isTrashItem))
      : undefined,
  };
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

  notes.forEach(note => {
    if (note.parentId === null) {
      // Add root level items
      rootNotes.push(notesMap[note._id]);
    } else if (notesMap[note.parentId] && loadedFolderIds.has(note.parentId)) {
      // Only add children for folders that have been explicitly loaded
      notesMap[note.parentId].children.push(notesMap[note._id]);
    }
  });

  // Convert to Tree data structure
  return rootNotes.map(note => convertToTreeNode(note, isTrash));
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
    for (const node of nodes) {
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
  
  const parents = findParents(treeData, nodeKey);
  return parents || [];
};
import React, { useState, useEffect, useCallback } from "react";
import { Tree, Input, Spin, Dropdown, Menu, Empty, Button, Tooltip } from "antd";
import {
  FileTextOutlined,
  FolderOutlined,
  FolderOpenOutlined,
  SearchOutlined,
  DeleteOutlined,
  EditOutlined,
  CopyOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { motion } from "framer-motion";

const { DirectoryTree } = Tree;

const NoteList = ({
  notes = [],
  loading = false,
  onSelectNote = () => {},
  activeNoteId = null,
  onDeleteNote = () => {},
  onRenameNote = () => {},
  onCreateNote = () => {},
  onDuplicateNote = () => {},
  onMoveNote = () => {},
  onRefresh = () => {},
}) => {
  const [expandedKeys, setExpandedKeys] = useState([]);
  const [searchValue, setSearchValue] = useState("");
  const [autoExpandParent, setAutoExpandParent] = useState(true);
  const [treeData, setTreeData] = useState([]);
  const [rightClickedNode, setRightClickedNode] = useState(null);
  const [contextMenuPosition, setContextMenuPosition] = useState({
    x: 0,
    y: 0,
  });
  const [isTreeAreaContextMenu, setIsTreeAreaContextMenu] = useState(false);

  // Transform flat notes array into tree structure
  useEffect(() => {
    if (notes.length) {
      const treeData = buildTreeData(notes);
      setTreeData(treeData);
    }
  }, [notes]);

  const buildTreeData = (notes) => {
    // Create a map of all notes by their ID
    const notesMap = {};
    notes.forEach((note) => {
      notesMap[note._id] = {
        ...note,
        children: [],
      };
    });

    // Build tree structure
    const rootNotes = [];

    notes.forEach((note) => {
      if (!note.deletedAt) {
        // Skip deleted notes
        if (note.parent === null) {
          rootNotes.push(notesMap[note._id]);
        } else if (notesMap[note.parent]) {
          notesMap[note.parent].children.push(notesMap[note._id]);
        }
      }
    });

    // Convert to Tree data structure
    return rootNotes.map((note) => convertToTreeNode(note));
  };

  const convertToTreeNode = (note) => {
    return {
      title: note.title,
      key: note._id,
      isLeaf: !note.isFolder,
      isFolder: note.isFolder,
      icon: ({ expanded }) =>
        note.isFolder ? (
          expanded ? (
            <FolderOpenOutlined className="text-yellow-500" />
          ) : (
            <FolderOutlined className="text-yellow-500" />
          )
        ) : (
          <FileTextOutlined className="text-blue-500" />
        ),
      children:
        note.children && note.children.length > 0
          ? note.children.map((child) => convertToTreeNode(child))
          : undefined,
    };
  };

  const onExpand = (expandedKeys) => {
    setExpandedKeys(expandedKeys);
    setAutoExpandParent(false);
  };

  const handleSearch = (e) => {
    const { value } = e.target;
    setSearchValue(value);

    if (value) {
      // Find all matching nodes and their parents
      const expandedKeys = findExpandedKeys(treeData, value);
      setExpandedKeys(expandedKeys);
      setAutoExpandParent(true);
    }
  };

  const findExpandedKeys = (data, searchValue) => {
    const keys = [];

    const loop = (data, searchValue) => {
      return data.filter((item) => {
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

  const getHighlightedTitle = (title) => {
    if (!searchValue) return title;

    const index = title.toLowerCase().indexOf(searchValue.toLowerCase());
    if (index === -1) return title;

    const beforeStr = title.substring(0, index);
    const highlightedStr = title.substring(index, index + searchValue.length);
    const afterStr = title.substring(index + searchValue.length);

    return (
      <span>
        {beforeStr}
        <span className="bg-yellow-200">{highlightedStr}</span>
        {afterStr}
      </span>
    );
  };

  const processTreeData = (treeData) => {
    return treeData.map((item) => {
      const newItem = { ...item };
      if (searchValue) {
        newItem.title = getHighlightedTitle(item.title);
      }
      if (item.children) {
        newItem.children = processTreeData(item.children);
      }
      return newItem;
    });
  };

  const handleRightClick = ({ event, node }) => {
    event.preventDefault();
    event.stopPropagation();
    setRightClickedNode(node);
    setContextMenuPosition({ x: event.clientX, y: event.clientY });
    setIsTreeAreaContextMenu(false);
  };

  const handleTreeAreaRightClick = (event) => {
    // Only trigger if the click is directly on the tree area, not on a node
    if (
      event.target.className.includes("ant-tree") ||
      event.target.className.includes("custom-tree-without-drag-handle")
    ) {
      event.preventDefault();
      event.stopPropagation();
      setRightClickedNode(null);
      setContextMenuPosition({ x: event.clientX, y: event.clientY });
      setIsTreeAreaContextMenu(true);
    }
  };

  const handleMenuClick = ({ key }) => {
    // Handle root-level actions
    if (isTreeAreaContextMenu) {
      switch (key) {
        case "newRootNote":
          onCreateNote && onCreateNote(null, false);
          break;
        case "newRootFolder":
          onCreateNote && onCreateNote(null, true);
          break;
        case "refresh":
          onRefresh && onRefresh();
          break;
        default:
          break;
      }
      setIsTreeAreaContextMenu(false);
      return;
    }

    // Handle node-specific actions
    if (!rightClickedNode) return;

    switch (key) {
      case "rename":
        onRenameNote && onRenameNote(rightClickedNode.key);
        break;
      case "delete":
        onDeleteNote && onDeleteNote(rightClickedNode.key);
        break;
      case "newNote":
        onCreateNote && onCreateNote(rightClickedNode.key, false);
        break;
      case "newFolder":
        onCreateNote && onCreateNote(rightClickedNode.key, true);
        break;
      case "duplicate":
        onDuplicateNote && onDuplicateNote(rightClickedNode.key);
        break;
      default:
        break;
    }
    // Close the menu after action
    setRightClickedNode(null);
  };

  // Close context menu when clicking outside
  const handleClickOutside = useCallback(() => {
    setRightClickedNode(null);
    setIsTreeAreaContextMenu(false);
  }, []);

  useEffect(() => {
    // Add event listener to close menu when clicking outside
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [handleClickOutside]);

  const handleDrop = (info) => {
    const dropKey = info.node.key;
    const dragKey = info.dragNode.key;
    const dropPos = info.node.pos.split("-");
    const dropPosition =
      info.dropPosition - Number(dropPos[dropPos.length - 1]);

    const isDroppingOnNode = dropPosition === 0;
    const isDroppingOnFolder = info.node.isFolder;

    // If dropping on a folder, make the dragged item a child of that folder
    if (isDroppingOnNode && isDroppingOnFolder) {
      onMoveNote(dragKey, dropKey);
    }
    // If dropping between items, move the item to the same level
    else {
      // Get the parent of the drop position
      let parentKey = null;

      if (dropPos.length > 2) {
        // If dropping in a subfolder, the parent is the folder
        const parentPos = dropPos.slice(0, dropPos.length - 1).join("-");
        const parentNode = findNodeByPos(treeData, parentPos);
        if (parentNode) {
          parentKey = parentNode.key;
        }
      }

      onMoveNote(dragKey, parentKey);
    }
  };

  const findNodeByPos = (treeData, pos, currentPos = "0") => {
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

  const nodeContextMenu = [
    {
      key: "rename",
      icon: <EditOutlined />,
      label: "Rename",
    },
    {
      key: "delete",
      icon: <DeleteOutlined />,
      label: "Delete",
      danger: true,
    },
    { type: "divider" },
    ...(rightClickedNode?.isFolder
      ? [
          {
            key: "newNote",
            icon: <FileTextOutlined />,
            label: "New Note",
          },
          {
            key: "newFolder",
            icon: <FolderOutlined />,
            label: "New Folder",
          },
        ]
      : []),
    {
      key: "duplicate",
      icon: <CopyOutlined />,
      label: "Duplicate",
    },
  ];

  const treeAreaContextMenu = [
    {
      key: "newRootNote",
      icon: <FileTextOutlined />,
      label: "New Note",
    },
    {
      key: "newRootFolder",
      icon: <FolderOutlined />,
      label: "New Folder",
    },
  ];

  const processedTreeData = processTreeData(treeData);

  return (
    <div className="h-full flex flex-col">
      <div className="px-3 py-1 flex items-center justify-between border-b border-gray-100">
        <h2 className="font-semibold text-lg">Note List</h2>

        <div className="flex items-center">
          <Tooltip title="New Note">
            <Button
              size="small"
              type="text"
              onClick={() => onCreateNote(null, false)}
              icon={<FileTextOutlined />}
            />
          </Tooltip>
          <Tooltip title="New Folder">
            <Button
              size="small"
              type="text"
              onClick={() => onCreateNote(null, true)}
              icon={<FolderOutlined />}
            />
          </Tooltip>
          <Tooltip title="Refresh">
            <Button
              size="small"
              type="text"
              onClick={onRefresh}
              icon={<ReloadOutlined />}
            />
          </Tooltip>
        </div>
      </div>

      <div className="p-3 mb-2 border-b border-gray-100">
        <Input
          placeholder="Search notes..."
          prefix={<SearchOutlined className="text-gray-400" />}
          onChange={handleSearch}
          className="rounded-md"
        />
      </div>

      <div className="flex-grow overflow-auto h-full">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <Spin />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            {treeData.length ? (
              <Dropdown
                menu={{
                  items: isTreeAreaContextMenu
                    ? treeAreaContextMenu
                    : nodeContextMenu,
                }}
                trigger={["contextMenu"]}
                open={!!rightClickedNode || isTreeAreaContextMenu}
                onOpenChange={(visible) => {
                  if (!visible) {
                    setRightClickedNode(null);
                    setIsTreeAreaContextMenu(false);
                  }
                }}
                getPopupContainer={(triggerNode) => triggerNode}
                overlayStyle={{
                  position: "fixed",
                  left: `${contextMenuPosition.x}px`,
                  top: `${contextMenuPosition.y}px`,
                }}
              >
                <div
                  className="h-full"
                  onContextMenu={handleTreeAreaRightClick}
                >
                  <DirectoryTree
                    treeData={processedTreeData}
                    onSelect={(selectedKeys, info) => {
                      onSelectNote(info.node);
                    }}
                    expandedKeys={expandedKeys}
                    autoExpandParent={autoExpandParent}
                    onExpand={onExpand}
                    selectedKeys={activeNoteId ? [activeNoteId] : []}
                    showIcon
                    blockNode
                    onRightClick={handleRightClick}
                    draggable
                    onDrop={handleDrop}
                    allowDrop={({ dropNode, dropPosition }) => {
                      // Only allow dropping into folders or at root level
                      return dropNode.isFolder || dropPosition !== 0;
                    }}
                    showLine={{ showLeafIcon: false }}
                    switcherIcon={null}
                    className="custom-tree-without-drag-handle h-full"
                    style={{ height: "100%" }}
                  />
                </div>
              </Dropdown>
            ) : (
              <Empty
                description="No notes found"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                className="p-4"
              />
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default NoteList;

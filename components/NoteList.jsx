import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { formatShortcut } from "@/utils/helperUtils";
import { buildTreeData, findNodeByPos, getParentKeys } from "@/utils/treeUtils";
import useNoteStore from "@/store/noteStore";
import { NOTE_LIST_SHORTCUTS } from "@/constants/shortcuts";
import useKeyboardShortcuts from "@/hooks/useKeyboardShortcuts";
import SearchModal from "@/components/SearchModal";

import {
  Tree,
  Spin,
  Dropdown,
  Empty,
  Button,
  Tooltip,
  Modal,
  Form,
  Input,
  message,
} from "antd";
import {
  FileTextOutlined,
  FolderOutlined,
  DownOutlined,
  DeleteOutlined,
  EditOutlined,
  CopyOutlined,
  ReloadOutlined,
  DeleteFilled,
  UndoOutlined,
  SearchOutlined,
} from "@ant-design/icons";

const { DirectoryTree } = Tree;

export default function NoteList({ onSelectNote = () => {} }) {
  // Get state and actions from the store
  const {
    note,
    notes,
    trashNotes,
    loading,
    loadedFolders,
    parentFoldersLoaded,
    deleteNote,
    restoreNote,
    renameNote,
    createNote,
    moveNote,
    fetchRootNotes,
    fetchFolderChildren,
    fetchTrashItems,
  } = useNoteStore();

  const [expandedKeys, setExpandedKeys] = useState([]);
  const [autoExpandParent, setAutoExpandParent] = useState(true);
  const [treeData, setTreeData] = useState([]);
  const [trashItems, setTrashItems] = useState([]);
  const [loadedKeys, setLoadedKeys] = useState([]);

  // Combined context menu state
  const [contextMenu, setContextMenu] = useState({
    node: null,
    position: { x: 0, y: 0 },
    isTreeArea: false,
  });

  // Combined modal state
  const [modal, setModal] = useState({
    open: false,
    type: "create",
    item: {},
  });
  const [modalForm] = Form.useForm();
  const inputRef = useRef(null);

  // Simplified search modal state
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  // Transform flat notes array into tree structure
  useEffect(() => {
    if (notes.length) {
      // Convert loadedFolders Set to regular Set for treeUtils
      const loadedFoldersSet = new Set([...loadedFolders].map((id) => id));
      const processedTreeData = buildTreeData(notes, false, loadedFoldersSet);
      setTreeData(processedTreeData);
    } else {
      setTreeData([]);
    }
  }, [notes, loadedFolders]);

  // Handle trash notes separately
  useEffect(() => {
    if (trashNotes.length > 0) {
      // Convert loadedFolders Set to regular Set for treeUtils
      const loadedFoldersSet = new Set([...loadedFolders].map((id) => id));

      // Use buildTreeData for trash notes - passing true for isTrash
      const processedTrashItems = buildTreeData(
        trashNotes,
        true,
        loadedFoldersSet
      );
      setTrashItems(processedTrashItems);
    } else {
      setTrashItems([]);
    }
  }, [trashNotes, loadedFolders]);

  const handleModalOpen = (type, item) => {
    setModal({
      open: true,
      type,
      item,
    });
    modalForm.setFieldsValue({
      name: item.name || "",
    });

    // Focus will happen after render via useEffect
  };

  // Add effect to focus the input when modal opens
  useEffect(() => {
    if (modal.open) {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 0);
    }
  }, [modal.open]);

  const handleFormSubmit = (values) => {
    if (modal.type === "create") {
      console.log("Creating note:", modal.item);
      createNote({
        ...modal.item,
        name: values.name,
      });
    } else if (modal.type === "rename") {
      renameNote({
        id: modal.item.id,
        name: values.name,
      });
    }
    setModal({
      open: false,
      type: "create",
      item: {},
    });
    modalForm.resetFields();
  };

  // Function to load trash items when trash folder is expanded
  const handleTrashFolderExpand = async () => {
    try {
      await fetchTrashItems();
      return Promise.resolve();
    } catch (error) {
      console.error("Error loading trash items:", error);
      return Promise.reject();
    }
  };

  // Modified onLoadData to handle trash folder
  const onLoadData = async (treeNode) => {
    const { key, isLeaf } = treeNode;

    // Special handling for trash folder
    if (key === "trash-folder") {
      return handleTrashFolderExpand();
    }

    // Don't load data for files or already loaded folders
    if (isLeaf || loadedKeys.includes(key)) {
      return Promise.resolve();
    }

    // Load children for this folder
    try {
      await fetchFolderChildren(key);

      // Mark this folder as loaded
      setLoadedKeys((prevKeys) => [...prevKeys, key]);

      // Update the tree data with the new children
      return Promise.resolve();
    } catch (error) {
      console.error("Error loading folder children:", error);
      return Promise.reject();
    }
  };

  const onExpand = (expandedKeys) => {
    setExpandedKeys(expandedKeys);
    setAutoExpandParent(false);
  };

  const processTreeData = (treeData) => {
    return treeData.map((item) => {
      const newItem = { ...item };
      if (item.children) {
        newItem.children = processTreeData(item.children);
      }
      return newItem;
    });
  };

  const handleRightClick = ({ event, node }) => {
    event.preventDefault();
    event.stopPropagation();
    setContextMenu({
      node,
      position: { x: event.clientX, y: event.clientY },
      isTreeArea: false,
    });
  };

  const handleTreeAreaRightClick = (event) => {
    // Only trigger if the click is directly on the tree area, not on a node
    if (
      event.target.className.includes("ant-tree") ||
      event.target.className.includes("custom-tree-without-drag-handle")
    ) {
      event.preventDefault();
      event.stopPropagation();
      setContextMenu({
        node: null,
        position: { x: event.clientX, y: event.clientY },
        isTreeArea: true,
      });
    }
  };

  const handleMenuClick = ({ key }) => {
    // Handle root-level actions
    if (contextMenu.isTreeArea) {
      switch (key) {
        case "newRootNote":
          handleModalOpen("create", {
            isFolder: false,
            parentId: null,
            name: "",
          });
          break;
        case "newRootFolder":
          handleModalOpen("create", {
            isFolder: true,
            parentId: null,
            name: "",
          });
          break;
        case "refresh":
          fetchRootNotes();
          setLoadedKeys([]);
          break;
        default:
          break;
      }
      setContextMenu({
        node: null,
        position: { x: 0, y: 0 },
        isTreeArea: false,
      });
      return;
    }

    // Handle node-specific actions
    if (!contextMenu.node) return;

    switch (key) {
      case "rename":
        handleModalOpen("rename", {
          id: contextMenu.node.key,
          name: contextMenu.node.title,
        });
        break;
      case "delete":
        deleteNote(contextMenu.node.key);
        break;
      case "restore":
        restoreNote(contextMenu.node.key);
        break;
      case "newNote":
        handleModalOpen("create", {
          isFolder: false,
          parentId: contextMenu.node.key,
          name: "",
        });
        break;
      case "newFolder":
        handleModalOpen("create", {
          isFolder: true,
          parentId: contextMenu.node.key,
          name: "",
        });
        break;
      case "duplicate":
        console.log(contextMenu.node);
        handleModalOpen("create", {
          id: contextMenu.node.key,
          isFolder: contextMenu.node.isFolder,
          parentId: contextMenu.node.parentId,
          name: `${contextMenu.node.title} (Copy)`,
        });
        break;
      default:
        break;
    }
    // Close the menu after action
    setContextMenu({
      node: null,
      position: { x: 0, y: 0 },
      isTreeArea: false,
    });
  };

  // Close context menu when clicking outside
  const handleClickOutside = useCallback(() => {
    setContextMenu({
      node: null,
      position: { x: 0, y: 0 },
      isTreeArea: false,
    });
  }, []);

  useEffect(() => {
    // Add event listener to close menu when clicking outside
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [handleClickOutside]);

  const handleDrop = (info) => {
    // Don't allow dropping onto trash items
    if (info.node.isTrashItem) {
      return;
    }

    const dropKey = info.node.key;
    const dragKey = info.dragNode.key;
    const dropPos = info.node.pos.split("-");
    const dropPosition =
      info.dropPosition - Number(dropPos[dropPos.length - 1]);

    const isDroppingOnNode = dropPosition === 0;
    const isDroppingOnFolder = info.node.isFolder;

    // If dropping on a folder, make the dragged item a child of that folder
    if (isDroppingOnNode && isDroppingOnFolder) {
      moveNote(dragKey, dropKey);
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

      moveNote(dragKey, parentKey);
    }
  };

  // Open search modal
  const openSearchModal = () => {
    setIsSearchModalOpen(true);
  };

  // Define shortcut handlers
  const shortcutHandlers = {
    NEW_NOTE: () => {
      handleModalOpen("create", {
        isFolder: false,
        parentId: null,
        name: "",
      });
      message.info("Creating new note");
    },
    NEW_FOLDER: () => {
      handleModalOpen("create", {
        isFolder: true,
        parentId: null,
        name: "",
      });
      message.info("Creating new folder");
    },
    REFRESH: () => {
      fetchRootNotes();
      setLoadedKeys([]);
      message.info("Refreshing notes");
    },
    SEARCH: () => {
      setIsSearchModalOpen(true);
      message.info("Searching notes");
    }
  };

  // Use keyboard shortcuts hook
  useKeyboardShortcuts(
    NOTE_LIST_SHORTCUTS,
    shortcutHandlers,
    {},
    [fetchRootNotes]
  );

  const nodeContextMenu = contextMenu.node?.isTrashItem
    ? [
        {
          key: "restore",
          icon: <UndoOutlined />,
          label: "Restore",
        },
        {
          key: "delete",
          icon: <DeleteOutlined />,
          label: "Delete permanently",
          danger: true,
        },
      ]
    : [
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
        ...(contextMenu.node?.isFolder
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
    {
      key: "refresh",
      icon: <ReloadOutlined />,
      label: "Refresh",
    },
  ];

  const processedTreeData = processTreeData(treeData);

  // Create a combined tree data with the trash folder at the bottom only if there are trash items
  const combinedTreeData = [...processedTreeData];

  // Only add trash folder if there are items in it or if there's a deleted note selected
  if (trashItems.length > 0 || note?.deletedAt) {
    const trashFolder = {
      title: "Trash",
      key: "trash-folder",
      isFolder: true,
      icon: <DeleteFilled />,
      children: trashItems,
      isLeaf: false,
    };

    combinedTreeData.push(trashFolder);
  }

  // Fetch root notes on initial load
  useEffect(() => {
    fetchRootNotes();
  }, []);

  // Track selected note to expand parents - modified to use parentFoldersLoaded
  useEffect(() => {
    if (note?.id && combinedTreeData.length > 0) {
      // Make sure trash folder is expanded if the note is in trash
      if (note.deletedAt) {
        // For deleted notes, we need to explicitly add trash folder key
        // and also check for parent keys within the trash items
        setExpandedKeys((prev) => {
          const newKeys = [...prev];
          if (!newKeys.includes("trash-folder")) {
            newKeys.push("trash-folder");
          }

          // Also get parent keys within trash if there are any
          const parentKeysInTrash = getParentKeys(trashItems, note.id);
          parentKeysInTrash.forEach((key) => {
            if (!newKeys.includes(key)) {
              newKeys.push(key);
            }
          });

          return newKeys;
        });

        // Auto expand parent if needed
        setAutoExpandParent(true);
      } else if (parentFoldersLoaded) {
        // For regular notes, find all parent folder IDs
        // Only do this when parent folders are properly loaded
        const parentKeys = getParentKeys(combinedTreeData, note.id);

        if (parentKeys.length > 0) {
          // Add parent keys to expanded keys without losing current expanded state
          setExpandedKeys((prev) => {
            // Check if we're actually adding new keys to avoid infinite loops
            const newKeys = [...prev];
            let changed = false;

            parentKeys.forEach((key) => {
              if (!newKeys.includes(key)) {
                newKeys.push(key);
                changed = true;
              }
            });

            // Only return new array if something changed
            return changed ? newKeys : prev;
          });

          // Auto expand parent if needed
          setAutoExpandParent(true);
        }
      }
    }
    // Include parentFoldersLoaded in dependencies
  }, [
    note?.id,
    note?.deletedAt,
    JSON.stringify(combinedTreeData.map((item) => item.key)),
    JSON.stringify(trashItems.map((item) => item.key)),
    parentFoldersLoaded,
  ]);

  return (
    <>
      <div className="h-full flex flex-col">
        <div className="px-3 py-1 flex items-center justify-between border-b border-gray-100">
          <h2 className="font-semibold text-lg">Note List</h2>

          <div className="flex items-center">
            <Tooltip title={`Search Notes (${formatShortcut(NOTE_LIST_SHORTCUTS.SEARCH)})`}>
              <Button
                size="small"
                type="text"
                onClick={openSearchModal}
                icon={<SearchOutlined />}
              />
            </Tooltip>
            <Tooltip title={`New Note (${formatShortcut(NOTE_LIST_SHORTCUTS.NEW_NOTE)})`}>
              <Button
                size="small"
                type="text"
                onClick={() =>
                  handleModalOpen("create", {
                    isFolder: false,
                    parentId: null,
                    name: "",
                  })
                }
                icon={<FileTextOutlined />}
              />
            </Tooltip>
            <Tooltip title={`New Folder (${formatShortcut(NOTE_LIST_SHORTCUTS.NEW_FOLDER)})`}>
              <Button
                size="small"
                type="text"
                onClick={() =>
                  handleModalOpen("create", {
                    isFolder: true,
                    parentId: null,
                    name: "",
                  })
                }
                icon={<FolderOutlined />}
              />
            </Tooltip>
            <Tooltip title={`Refresh (${formatShortcut(NOTE_LIST_SHORTCUTS.REFRESH)})`}>
              <Button
                size="small"
                type="text"
                onClick={() => {
                  fetchRootNotes();
                  setLoadedKeys([]); // Reset loaded keys on refresh
                }}
                icon={<ReloadOutlined />}
              />
            </Tooltip>
          </div>
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
            >
              {combinedTreeData.length ? (
                <Dropdown
                  menu={{
                    items: contextMenu.isTreeArea
                      ? treeAreaContextMenu
                      : nodeContextMenu,
                    onClick: handleMenuClick,
                  }}
                  trigger={["contextMenu"]}
                  open={!!contextMenu.node || contextMenu.isTreeArea}
                  onOpenChange={(visible) => {
                    if (!visible) {
                      setContextMenu({
                        node: null,
                        position: { x: 0, y: 0 },
                        isTreeArea: false,
                      });
                    }
                  }}
                  getPopupContainer={(triggerNode) => triggerNode}
                  overlayStyle={{
                    position: "fixed",
                    left: `${contextMenu.position.x}px`,
                    top: `${contextMenu.position.y}px`,
                  }}
                >
                  <div
                    className="h-full"
                    onContextMenu={handleTreeAreaRightClick}
                  >
                    <DirectoryTree
                      treeData={combinedTreeData}
                      onSelect={(selectedKeys, info) => {
                        // Don't allow selecting the trash folder itself
                        if (info.node.key !== "trash-folder") {
                          onSelectNote(info.node);
                        }
                      }}
                      expandedKeys={expandedKeys}
                      autoExpandParent={autoExpandParent}
                      onExpand={onExpand}
                      selectedKeys={note ? [note.id] : []}
                      showIcon
                      onRightClick={handleRightClick}
                      draggable={(node) =>
                        !node.isTrashItem && node.key !== "trash-folder"
                      }
                      onDrop={handleDrop}
                      allowDrop={({ dropNode, dropPosition }) => {
                        // Don't allow dropping into trash items or the trash folder
                        if (
                          dropNode.isTrashItem ||
                          dropNode.key === "trash-folder"
                        ) {
                          return false;
                        }
                        // Only allow dropping into folders or at root level
                        return dropNode.isFolder || dropPosition !== 0;
                      }}
                      showLine={{ showLeafIcon: false }}
                      switcherIcon={<DownOutlined />}
                      loadData={onLoadData} // Add loadData prop
                      className="h-full"
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
      <Modal
        title={
          modal.type === "create"
            ? modal.item.isFolder
              ? "Create Folder"
              : "Create Note"
            : modal.item.isFolder
            ? "Rename Folder"
            : "Rename Note"
        }
        open={modal.open}
        onCancel={() =>
          setModal({
            open: false,
            type: "create",
            item: {},
          })
        }
        footer={
          <Button
            type="primary"
            onClick={() => {
              modalForm.submit();
            }}
          >
            {modal.type === "create" ? "Create" : "Rename"}
          </Button>
        }
        destroyOnClose
        width={400}
      >
        <Form
          form={modalForm}
          layout="vertical"
          onFinish={handleFormSubmit}
          initialValues={{
            name: modal.item.name,
          }}
        >
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: "Please enter a name" }]}
          >
            <Input ref={inputRef} placeholder="Enter name" />
          </Form.Item>
        </Form>
      </Modal>

      <SearchModal
        open={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onSelectNote={onSelectNote}
      />
    </>
  );
}

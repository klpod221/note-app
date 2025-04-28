import React, { useState, useEffect, useCallback } from "react";
import {
  Tree,
  Input,
  Spin,
  Dropdown,
  Empty,
  Button,
  Tooltip,
  Modal,
  Form,
} from "antd";
import {
  FileTextOutlined,
  FolderOutlined,
  SearchOutlined,
  DownOutlined,
  DeleteOutlined,
  EditOutlined,
  CopyOutlined,
  ReloadOutlined,
  DeleteFilled,
  UndoOutlined,
} from "@ant-design/icons";
import { motion } from "framer-motion";
import useNoteStore from "@/store/noteStore";
import {
  buildTreeData,
  convertToTreeNode,
  findMatchingNodes,
  findNodeByPos,
  getParentKeys,
} from "@/utils/treeUtils";

const { DirectoryTree } = Tree;

export default function NoteList({ onSelectNote = () => {} }) {
  // Get state and actions from the store
  const {
    note,
    notes,
    trashNotes,
    loading,
    loadedFolders,
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
  const [searchValue, setSearchValue] = useState("");
  const [autoExpandParent, setAutoExpandParent] = useState(true);
  const [treeData, setTreeData] = useState([]);
  const [trashItems, setTrashItems] = useState([]);
  const [rightClickedNode, setRightClickedNode] = useState(null);
  const [contextMenuPosition, setContextMenuPosition] = useState({
    x: 0,
    y: 0,
  });
  const [isTreeAreaContextMenu, setIsTreeAreaContextMenu] = useState(false);
  const [loadedKeys, setLoadedKeys] = useState([]);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState("create");
  const [activeItem, setActiveItem] = useState({});
  const [modalForm] = Form.useForm();

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
    setModalType(type);
    setActiveItem(item);
    modalForm.setFieldsValue({
      name: item.name || "",
    });
    setModalOpen(true);
  };

  const handleFormSubmit = (values) => {
    if (modalType === "create") {
      createNote({
        ...activeItem,
        name: values.name,
      });
    } else if (modalType === "rename") {
      renameNote({
        id: activeItem.id,
        name: values.name,
      });
    }
    setModalOpen(false);
    setActiveItem({});
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

  const handleSearch = (e) => {
    const { value } = e.target;
    setSearchValue(value);

    if (value) {
      // Find all matching nodes and their parents
      const expandedKeys = findMatchingNodes(treeData, value);
      setExpandedKeys(expandedKeys);
      setAutoExpandParent(true);
    }
  };

  const getHighlightedTitle = (name) => {
    if (!searchValue) return name;

    const index = name.toLowerCase().indexOf(searchValue.toLowerCase());
    if (index === -1) return name;

    const beforeStr = name.substring(0, index);
    const highlightedStr = name.substring(index, index + searchValue.length);
    const afterStr = name.substring(index + searchValue.length);

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
      setIsTreeAreaContextMenu(false);
      return;
    }

    // Handle node-specific actions
    if (!rightClickedNode) return;

    switch (key) {
      case "rename":
        handleModalOpen("rename", {
          id: rightClickedNode.key,
          name: rightClickedNode.title,
        });
        break;
      case "delete":
        deleteNote(rightClickedNode.key);
        break;
      case "restore":
        restoreNote(rightClickedNode.key);
        break;
      case "newNote":
        handleModalOpen("create", {
          isFolder: false,
          parentId: rightClickedNode.key,
          name: "",
        });
        break;
      case "newFolder":
        handleModalOpen("create", {
          isFolder: true,
          parentId: rightClickedNode.key,
          name: "",
        });
        break;
      case "duplicate":
        handleModalOpen("create", {
          isFolder: rightClickedNode.isFolder,
          parentId: rightClickedNode.parentId,
          name: `${rightClickedNode.title} (Copy)`,
        });
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

  const nodeContextMenu = rightClickedNode?.isTrashItem
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

  // Track selected note to expand parents
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
      } else {
        // For regular notes, find all parent folder IDs
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

          // Auto expand parent if needed but only once
          setAutoExpandParent(true);
        }
      }
    }
    // Prevent too frequent re-renders by using proper dependencies
  }, [
    note?.id,
    note?.deletedAt,
    JSON.stringify(combinedTreeData.map((item) => item.key)),
    JSON.stringify(trashItems.map((item) => item.key)),
  ]);

  return (
    <>
      <div className="h-full flex flex-col">
        <div className="px-3 py-1 flex items-center justify-between border-b border-gray-100">
          <h2 className="font-semibold text-lg">Note List</h2>

          <div className="flex items-center">
            <Tooltip name="New Note">
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
            <Tooltip name="New Folder">
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
            <Tooltip name="Refresh">
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

        <div className="p-3 mb-2 border-b border-gray-100">
          <Input
            placeholder="Search notes..."
            prefix={<SearchOutlined />}
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
            >
              {combinedTreeData.length ? (
                <Dropdown
                  menu={{
                    items: isTreeAreaContextMenu
                      ? treeAreaContextMenu
                      : nodeContextMenu,
                    onClick: handleMenuClick,
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
          modalType === "create"
            ? activeItem.isFolder
              ? "Create Folder"
              : "Create Note"
            : activeItem.isFolder
            ? "Rename Folder"
            : "Rename Note"
        }
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={
          <Button
            type="primary"
            onClick={() => {
              modalForm.submit();
            }}
          >
            {modalType === "create" ? "Create" : "Rename"}
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
            name: activeItem.name,
          }}
        >
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: "Please enter a name" }]}
          >
            <Input placeholder="Enter name" autoFocus />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

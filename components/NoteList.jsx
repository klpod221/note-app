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
  FolderOpenOutlined,
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

const { DirectoryTree } = Tree;

export default function NoteList({
  notes = [],
  trashNotes = [], // Add separate prop for trash notes
  loading = false,
  activeNoteId = null,
  onCreateNote = () => {},
  onRenameNote = () => {},
  onSelectNote = () => {},
  onDeleteNote = () => {},
  onRestoreNote = () => {},
  onDuplicateNote = () => {},
  onMoveNote = () => {},
  onRefresh = () => {},
  onLoadFolderChildren = () => {},
  onLoadTrash = () => {}, // Add function to load trash items
}) {
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
  const [loadedKeys, setLoadedKeys] = useState([]); // Track which folders have been loaded

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState("create");
  const [activeItem, setActiveItem] = useState({});
  const [modalForm] = Form.useForm();

  // Transform flat notes array into tree structure
  useEffect(() => {
    if (notes.length) {
      const treeData = buildTreeData(notes, false);
      setTreeData(treeData);
    } else {
      setTreeData([]);
    }
  }, [notes, loadedKeys]);

  // Handle trash notes separately
  useEffect(() => {
    if (trashNotes.length) {
      const trashItems = buildTreeData(trashNotes, true);
      setTrashItems(trashItems);
    } else {
      setTrashItems([]);
    }
  }, [trashNotes]);

  const handleModalOpen = (type, item) => {
    setModalType(type);
    setActiveItem(item);
    modalForm.setFieldsValue({
      title: item.title || "",
    });
    setModalOpen(true);
  };

  const handleFormSubmit = (values) => {
    if (modalType === "create") {
      onCreateNote({
        ...activeItem,
        title: values.title,
      });
    } else if (modalType === "rename") {
      onRenameNote({
        id: activeItem.id,
        title: values.title,
      });
    }
    setModalOpen(false);
    setActiveItem({});
    modalForm.resetFields();
  };

  // Modified buildTreeData to handle either normal notes or trash notes
  const buildTreeData = (notes, isTrash) => {
    // Create a map of all notes by their ID
    const notesMap = {};
    notes.forEach((note) => {
      notesMap[note._id] = {
        ...note,
        children: [],
      };
    });

    // Build tree structure - for initial load, only include root items and track which ones have children
    const rootNotes = [];

    notes.forEach((note) => {
      if (note.parentId === null) {
        // Only add root level items initially
        rootNotes.push(notesMap[note._id]);
      } else if (
        notesMap[note.parentId] &&
        loadedKeys.includes(note.parentId)
      ) {
        // Only add children for folders that have been explicitly loaded
        notesMap[note.parentId].children.push(notesMap[note._id]);
      }
    });

    // Convert to Tree data structure
    return rootNotes.map((note) => convertToTreeNode(note, isTrash));
  };

  const convertToTreeNode = (note, isTrashItem = false) => {
    const hasChildren = note.isFolder;

    return {
      title: note.title,
      key: note._id,
      isLeaf: !note.isFolder,
      isFolder: note.isFolder,
      isTrashItem: isTrashItem,
      icon: ({ expanded }) => {
        if (isTrashItem) {
          return note.isFolder ? <FolderOpenOutlined /> : <FileTextOutlined />;
        }

        return note.isFolder ? (
          expanded ? (
            <FolderOpenOutlined />
          ) : (
            <FolderOutlined />
          )
        ) : (
          <FileTextOutlined />
        );
      },
      // Only include actual children if they've been loaded
      children:
        note.children && note.children.length > 0
          ? note.children.map((child) => convertToTreeNode(child, isTrashItem))
          : undefined,
      // Mark folders as having children so they show the expand icon
      isLeaf: !note.isFolder,
    };
  };

  // Function to load trash items when trash folder is expanded
  const handleTrashFolderExpand = async () => {
    try {
      await onLoadTrash();
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
      await onLoadFolderChildren(key);

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
          handleModalOpen("create", {
            isFolder: false,
            parentId: null,
            title: "",
          });
          break;
        case "newRootFolder":
          handleModalOpen("create", {
            isFolder: true,
            parentId: null,
            title: "",
          });
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
        handleModalOpen("rename", {
          id: rightClickedNode.key,
          title: rightClickedNode.title,
        });
        break;
      case "delete":
        onDeleteNote && onDeleteNote(rightClickedNode.key);
        break;
      case "restore":
        onRestoreNote && onRestoreNote(rightClickedNode.key);
        break;
      case "newNote":
        handleModalOpen("create", {
          isFolder: false,
          parentId: rightClickedNode.key,
          title: "",
        });
        break;
      case "newFolder":
        handleModalOpen("create", {
          isFolder: true,
          parentId: rightClickedNode.key,
          title: "",
        });
        break;
      case "duplicate":
        handleModalOpen("create", {
          isFolder: rightClickedNode.isFolder,
          parentId: rightClickedNode.parentId,
          title: `${rightClickedNode.title} (Copy)`,
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
  ];

  const processedTreeData = processTreeData(treeData);

  // Create a combined tree data with the trash folder at the bottom
  const combinedTreeData = [...processedTreeData];

  // Add trash folder if there are any deleted items or to allow loading trash
  combinedTreeData.push({
    title: "Trash",
    key: "trash-folder",
    isFolder: true,
    icon: <DeleteFilled />,
    children: trashItems,
  });

  return (
    <>
      <div className="h-full flex flex-col">
        <div className="px-3 py-1 flex items-center justify-between border-b border-gray-100">
          <h2 className="font-semibold text-lg">Note List</h2>

          <div className="flex items-center">
            <Tooltip title="New Note">
              <Button
                size="small"
                type="text"
                onClick={() =>
                  handleModalOpen("create", {
                    isFolder: false,
                    parentId: null,
                    title: "",
                  })
                }
                icon={<FileTextOutlined />}
              />
            </Tooltip>
            <Tooltip title="New Folder">
              <Button
                size="small"
                type="text"
                onClick={() =>
                  handleModalOpen("create", {
                    isFolder: true,
                    parentId: null,
                    title: "",
                  })
                }
                icon={<FolderOutlined />}
              />
            </Tooltip>
            <Tooltip title="Refresh">
              <Button
                size="small"
                type="text"
                onClick={() => {
                  onRefresh();
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
                      selectedKeys={activeNoteId ? [activeNoteId] : []}
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
        title={() => {
          if (modalType === "create") {
            return activeItem.isFolder ? "Create Folder" : "Create Note";
          } else {
            return activeItem.isFolder ? "Rename Folder" : "Rename Note";
          }
        }}
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
            title: activeItem.title,
          }}
        >
          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: "Please enter a title" }]}
          >
            <Input placeholder="Enter title" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

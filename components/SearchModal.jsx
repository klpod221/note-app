import React, { useState, useCallback, useEffect, useRef } from "react";
import debounce from "lodash.debounce";
import { Input, Spin, Empty, Modal } from "antd";
import { FileTextOutlined, SearchOutlined } from "@ant-design/icons";
import { searchNotes } from "@/services/noteService";

export default function SearchModal({ open, onClose, onSelectNote }) {
  const [state, setState] = useState({
    query: "",
    results: [],
    loading: false,
    selectedIndex: -1,
    page: 1,
    hasMore: true,
    loadingMore: false,
  });
  
  const resultsContainerRef = useRef(null);
  const observerRef = useRef(null);
  const lastItemRef = useRef(null);
  const inputRef = useRef(null);

  // Focus input when modal opens
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => {
        inputRef.current.focus();
      }, 100);
    }
  }, [open]);

  // Create debounced search function
  const debouncedSearch = useCallback(
    debounce(async (query) => {
      if (query.trim()) {
        setState((prev) => ({ ...prev, loading: true, page: 1, results: [] }));
        try {
          const response = await searchNotes(query, 1);
          if (response.success) {
            setState((prev) => ({
              ...prev,
              results: response.data,
              hasMore: response.hasMore,
              loading: false,
            }));
          } else {
            console.error("Search error:", response.error);
            setState((prev) => ({ ...prev, loading: false }));
          }
        } catch (error) {
          console.error("Search error:", error);
          setState((prev) => ({ ...prev, loading: false }));
        }
      } else {
        setState((prev) => ({ ...prev, results: [], loading: false, hasMore: false }));
      }
    }, 500),
    []
  );

  // Load more results when scrolling
  const loadMoreResults = async () => {
    if (state.loadingMore || !state.hasMore || !state.query.trim()) return;
    
    const nextPage = state.page + 1;
    setState(prev => ({ ...prev, loadingMore: true }));
    
    try {
      const response = await searchNotes(state.query, nextPage);
      if (response.success) {
        setState(prev => ({
          ...prev,
          results: [...prev.results, ...response.data],
          page: nextPage,
          hasMore: response.hasMore,
          loadingMore: false,
        }));
      } else {
        setState(prev => ({ ...prev, loadingMore: false }));
        console.error("Error loading more results:", response.error);
      }
    } catch (error) {
      setState(prev => ({ ...prev, loadingMore: false }));
      console.error("Error loading more results:", error);
    }
  };

  // Setup intersection observer for infinite scroll
  useEffect(() => {
    if (!state.hasMore || state.loadingMore) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMoreResults();
        }
      },
      { threshold: 0.5 }
    );
    
    observerRef.current = observer;
    
    if (lastItemRef.current) {
      observer.observe(lastItemRef.current);
    }
    
    return () => {
      if (observer && lastItemRef.current) {
        observer.unobserve(lastItemRef.current);
      }
    };
  }, [state.results, state.hasMore, state.loadingMore]);

  // Handle search input change
  const handleSearchChange = (e) => {
    const newQuery = e.target.value;
    setState((prev) => ({ ...prev, query: newQuery }));
    debouncedSearch(newQuery);
  };

  // Handle search result click
  const handleResultClick = (item) => {
    onSelectNote({
      key: item._id,
      title: item.name,
      isFolder: false,
    });
    onClose();
  };

  // Handle search submit for manual trigger
  const handleSearchSubmit = async () => {
    if (state.query.trim()) {
      setState((prev) => ({ ...prev, loading: true, page: 1, results: [] }));
      try {
        const response = await searchNotes(state.query, 1);
        if (response.success) {
          setState((prev) => ({
            ...prev,
            results: response.data,
            hasMore: response.hasMore,
            loading: false,
          }));
        } else {
          console.error("Search error:", response.error);
          setState((prev) => ({ ...prev, loading: false }));
        }
      } catch (error) {
        console.error("Search error:", error);
        setState((prev) => ({ ...prev, loading: false }));
      }
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (state.results.length === 0) return;
    
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        // Blur the input when arrow down is pressed
        document.activeElement.blur();
        setState(prev => ({
          ...prev,
          selectedIndex: Math.min(prev.selectedIndex + 1, prev.results.length - 1)
        }));
        break;
      case "ArrowUp":
        e.preventDefault();
        if (state.selectedIndex <= 0) {
          // Focus back to input when at the beginning of the list
          inputRef.current.focus();
          setState(prev => ({ ...prev, selectedIndex: -1 }));
        } else {
          setState(prev => ({
            ...prev,
            selectedIndex: Math.max(prev.selectedIndex - 1, 0)
          }));
        }
        break;
      case "Enter":
        e.preventDefault();
        if (state.selectedIndex >= 0 && state.selectedIndex < state.results.length) {
          handleResultClick(state.results[state.selectedIndex]);
        }
        break;
      default:
        break;
    }
  };

  // Scroll selected item into view
  useEffect(() => {
    if (state.selectedIndex >= 0 && resultsContainerRef.current) {
      const selectedElement = resultsContainerRef.current.children[state.selectedIndex];
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
  }, [state.selectedIndex]);

  // Reset selected index when results change
  useEffect(() => {
    setState(prev => ({ ...prev, selectedIndex: -1 }));
  }, [state.results]);

  // Add keyboard event listener when modal is open
  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, state.results, state.selectedIndex]);

  return (
    <Modal
      title="Search Notes"
      open={open}
      onCancel={onClose}
      footer={null}
      width={600}
    >
      <div className="mb-4">
        <Input.Search
          placeholder="Search for notes..."
          value={state.query}
          onChange={handleSearchChange}
          onSearch={handleSearchSubmit}
          allowClear
          size="large"
          ref={inputRef}
        />
      </div>
      
      <div style={{ minHeight: '200px', maxHeight: '400px', overflowY: 'auto' }}>
        {state.loading ? (
          <div className="flex justify-center items-center py-8">
            <Spin size="large" />
          </div>
        ) : state.results && state.results.length > 0 ? (
          <div ref={resultsContainerRef} className="space-y-2">
            {state.results.map((item, index) => (
              <div
                key={item._id}
                ref={index === state.results.length - 1 ? lastItemRef : null}
                className={`flex items-start p-3 rounded-lg border border-gray-100 cursor-pointer transition duration-200 
                  ${index === state.selectedIndex ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-100'}`}
                onClick={() => handleResultClick(item)}
              >
                <div className="mr-3 pt-1">
                  <FileTextOutlined style={{ fontSize: '24px', color: '#52c41a' }} />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-lg">{item.name}</div>
                  <div 
                    className="mt-1 text-gray-600 line-clamp-2 overflow-hidden text-sm"
                    dangerouslySetInnerHTML={{ 
                      __html: item.content || '<span class="text-gray-400">No content</span>' 
                    }}
                  />
                </div>
              </div>
            ))}
            
            {state.loadingMore && (
              <div className="py-3 text-center">
                <Spin size="small" />
                <div className="mt-1 text-xs text-gray-500">Loading more...</div>
              </div>
            )}
            
            {!state.hasMore && state.results.length > 10 && (
              <div className="py-2 text-center text-gray-500 text-xs">
                No more results
              </div>
            )}
          </div>
        ) : state.query ? (
          <Empty description="No matching notes found" />
        ) : (
          <div className="text-center py-8 text-gray-500">
            <SearchOutlined style={{ fontSize: '32px' }} />
            <p className="mt-2">Type to search for notes</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
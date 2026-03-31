import React, { useState, useRef } from "react";
import { __ } from "@wordpress/i18n";

const styles = {
  container: {
    display: "flex",
    gap: "12px",
    minHeight: "120px",
  },
  panel: {
    flex: 1,
    border: "1px solid #ddd",
    borderRadius: "6px",
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  panelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 12px",
    backgroundColor: "#f8f9fa",
    borderBottom: "1px solid #eee",
    fontSize: "12px",
    fontWeight: 600,
    color: "#555",
  },
  headerBtn: {
    background: "none",
    border: "none",
    color: "#FF7853",
    fontSize: "12px",
    fontWeight: 500,
    cursor: "pointer",
    padding: "2px 6px",
    borderRadius: "3px",
  },
  list: {
    listStyle: "none",
    margin: 0,
    padding: 0,
    maxHeight: "200px",
    overflowY: "auto",
  },
  item: {
    display: "flex",
    alignItems: "center",
    padding: "8px 12px",
    fontSize: "13px",
    color: "#333",
    cursor: "pointer",
    borderBottom: "1px solid #f5f5f5",
    transition: "background-color 0.1s",
    gap: "8px",
  },
  itemHover: {
    backgroundColor: "#f8f9fa",
  },
  dragHandle: {
    cursor: "grab",
    color: "#999",
    fontSize: "14px",
    userSelect: "none",
    flexShrink: 0,
  },
  dragOver: {
    borderTop: "2px solid #FF7853",
  },
  removeBtn: {
    background: "none",
    border: "none",
    color: "#999",
    cursor: "pointer",
    fontSize: "16px",
    padding: "0 4px",
    marginLeft: "auto",
    flexShrink: 0,
    lineHeight: 1,
  },
  fieldLabel: {
    flex: 1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  emptyState: {
    padding: "16px 12px",
    fontSize: "12px",
    color: "#999",
    textAlign: "center",
    fontStyle: "italic",
  },
  orderHint: {
    padding: "6px 12px",
    fontSize: "11px",
    color: "#999",
    textAlign: "center",
    borderTop: "1px solid #f0f0f0",
  },
  checkbox: {
    flexShrink: 0,
    accentColor: "#FF7853",
  },
};

/**
 * OrderableFieldSelector — dual-panel field picker with drag-to-reorder.
 *
 * Props:
 *   options        {object}   { field_name: "field_name::Field Label", ... }
 *   selectedItems  {array}    ["field_name_1", "field_name_2"]
 *   onChange        {function} (selectedItems) => void
 *   selectionLimit {number}   max selections (1 for free, Infinity for pro)
 *   toastMessage   {string}   message when limit hit
 *   isPro          {boolean}  whether pro is active
 */
export default function OrderableFieldSelector({
  options = {},
  selectedItems = [],
  onChange,
  selectionLimit = 1,
  toastMessage = "",
  isPro = false,
}) {
  const [dragIndex, setDragIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [hoveredItem, setHoveredItem] = useState(null);

  // Get display label from option value (e.g., "field_name::Field Label" → "Field Label")
  const getLabel = (fieldName) => {
    const raw = options[fieldName] || fieldName;
    const parts = raw.split("::");
    return parts.length > 1 ? parts[parts.length - 1] : raw;
  };

  // Available fields = all options minus selected
  const availableFields = Object.keys(options).filter(
    (key) => !selectedItems.includes(key)
  );

  const handleSelect = (fieldName) => {
    if (!isPro && selectedItems.length >= selectionLimit) {
      if (typeof window !== "undefined" && window.toast) {
        window.toast(toastMessage, "info", { autoClose: 5000 });
      }
      // For free: replace the single selection
      onChange([fieldName]);
      return;
    }
    onChange([...selectedItems, fieldName]);
  };

  const handleRemove = (fieldName) => {
    onChange(selectedItems.filter((f) => f !== fieldName));
  };

  const handleSelectAll = () => {
    if (!isPro) return;
    onChange(Object.keys(options));
  };

  const handleClearAll = () => {
    onChange([]);
  };

  // Drag & drop reordering
  const handleDragStart = (e, index) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === dropIndex) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }
    const updated = [...selectedItems];
    const [moved] = updated.splice(dragIndex, 1);
    updated.splice(dropIndex, 0, moved);
    onChange(updated);
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div style={styles.container}>
      {/* Left: Available Fields */}
      <div style={styles.panel}>
        <div style={styles.panelHeader}>
          <span>{__("Available Fields", "text-to-audio")}</span>
          {isPro && availableFields.length > 0 && (
            <button
              type="button"
              style={styles.headerBtn}
              onClick={handleSelectAll}
            >
              {__("Select All", "text-to-audio")}
            </button>
          )}
        </div>
        <ul style={styles.list}>
          {availableFields.length === 0 ? (
            <li style={styles.emptyState}>
              {selectedItems.length > 0
                ? __("All fields selected", "text-to-audio")
                : __("No ACF fields found", "text-to-audio")}
            </li>
          ) : (
            availableFields.map((fieldName) => (
              <li
                key={fieldName}
                style={{
                  ...styles.item,
                  ...(hoveredItem === `avail-${fieldName}`
                    ? styles.itemHover
                    : {}),
                }}
                onClick={() => handleSelect(fieldName)}
                onMouseEnter={() => setHoveredItem(`avail-${fieldName}`)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <input
                  type="checkbox"
                  checked={false}
                  readOnly
                  style={styles.checkbox}
                />
                <span style={styles.fieldLabel}>{getLabel(fieldName)}</span>
              </li>
            ))
          )}
        </ul>
      </div>

      {/* Right: Selected Fields (ordered, draggable) */}
      <div style={styles.panel}>
        <div style={styles.panelHeader}>
          <span>{__("Selected (read order)", "text-to-audio")}</span>
          {selectedItems.length > 0 && (
            <button
              type="button"
              style={styles.headerBtn}
              onClick={handleClearAll}
            >
              {__("Clear All", "text-to-audio")}
            </button>
          )}
        </div>
        <ul style={styles.list}>
          {selectedItems.length === 0 ? (
            <li style={styles.emptyState}>
              {__("Click fields on the left to add", "text-to-audio")}
            </li>
          ) : (
            selectedItems.map((fieldName, index) => (
              <li
                key={fieldName}
                draggable={isPro}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                style={{
                  ...styles.item,
                  ...(dragOverIndex === index ? styles.dragOver : {}),
                  ...(hoveredItem === `sel-${fieldName}`
                    ? styles.itemHover
                    : {}),
                  opacity: dragIndex === index ? 0.4 : 1,
                }}
                onMouseEnter={() => setHoveredItem(`sel-${fieldName}`)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                {isPro && <span style={styles.dragHandle}>&#x2630;</span>}
                <span style={styles.fieldLabel}>{getLabel(fieldName)}</span>
                <button
                  type="button"
                  style={styles.removeBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(fieldName);
                  }}
                  title={__("Remove", "text-to-audio")}
                >
                  &times;
                </button>
              </li>
            ))
          )}
        </ul>
        {isPro && selectedItems.length > 1 && (
          <div style={styles.orderHint}>
            ↕ {__("Drag to reorder", "text-to-audio")}
          </div>
        )}
      </div>
    </div>
  );
}

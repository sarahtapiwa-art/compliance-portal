"use client"

import { useState } from "react";
import { useDropzone } from "react-dropzone";
import styles from "../../../styles/Document.module.css";

export default function DocumentsPage() {
  const [viewMode, setViewMode] = useState("grid");
  const [files, setFiles] = useState([]);
  const [filters, setFilters] = useState({
    returnType: "",
    department: "",
    date: ""
  });

  const onDrop = (acceptedFiles) => {
    const mappedFiles = acceptedFiles.map((file) => ({
      name: file.name,
      type: file.type,
      url: URL.createObjectURL(file),
      uploaded: new Date().toISOString().split("T")[0]
    }));
    setFiles((prev) => [...prev, ...mappedFiles]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const filteredFiles = files.filter((file) => {
    return (
      (!filters.returnType || file.name.includes(filters.returnType)) &&
      (!filters.department || file.name.includes(filters.department)) &&
      (!filters.date || file.uploaded === filters.date)
    );
  });

  return (
    <div className={styles.container}>
      <h1>Document Management</h1>

      {/* Filters */}
      <div className={styles.filters}>
        <input
          type="text"
          placeholder="Filter by Return"
          value={filters.returnType}
          onChange={(e) =>
            setFilters({ ...filters, returnType: e.target.value })
          }
        />
        <input
          type="text"
          placeholder="Filter by Department"
          value={filters.department}
          onChange={(e) =>
            setFilters({ ...filters, department: e.target.value })
          }
        />
        <input
          type="date"
          value={filters.date}
          onChange={(e) => setFilters({ ...filters, date: e.target.value })}
        />
      </div>

      {/* View toggle */}
      <div className={styles.toggle}>
        <button
          className={viewMode === "grid" ? styles.active : ""}
          onClick={() => setViewMode("grid")}
        >
          Grid
        </button>
        <button
          className={viewMode === "list" ? styles.active : ""}
          onClick={() => setViewMode("list")}
        >
          List
        </button>
      </div>

      {/* Drag and Drop */}
      <div {...getRootProps()} className={styles.dropzone}>
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the files here...</p>
        ) : (
          <p>Drag & drop files here, or click to select</p>
        )}
      </div>

      {/* Files display */}
      <div
        className={
          viewMode === "grid" ? styles.gridContainer : styles.listContainer
        }
      >
        {filteredFiles.map((file, idx) => (
          <div
            key={idx}
            className={viewMode === "grid" ? styles.gridItem : styles.listItem}
          >
            {file.type === "application/pdf" ? (
              <iframe src={file.url} className={styles.preview} />
            ) : file.type.includes("word") ? (
              <div className={styles.docxPreview}>
                <span>DOCX</span>
              </div>
            ) : (
              <div className={styles.docxPreview}>
                <span>FILE</span>
              </div>
            )}
            <p>{file.name}</p>
            <small>Uploaded: {file.uploaded}</small>
          </div>
        ))}
      </div>
    </div>
  );
}

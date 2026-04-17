# Project Standards

This document defines the absolute laws of physics for this codebase. All agents and developers must strictly adhere to these rules. 

## The Atomization Phase Rules

We are currently in the **Atomization & Documentation Phase**.

### 1. File Constraints (The 80-Line Rule)
- **Max Length:** No file shall exceed 80 lines of code.
- **Single Responsibility (SRP):** A file must serve exactly one purpose.
- **Single Entity:** No file shall contain more than one class or component.

### 2. Function Constraints (The 10-Line Rule)
- **Max Length:** No function shall exceed 10 lines of executable code.
- **Single Responsibility (SRP):** A function must serve exactly one purpose, behavior, or phase.
- **Splitting:** If a function does two things, it must be split into smaller, named functions that encapsulate those behaviors.

### 3. Folder Constraints
- **Size Limits:** Folders must remain small. If a folder holds too many files, it must be subdivided based on domain or behavior.
- **Single Responsibility:** Folders must group strictly related concepts. Do not mix unrelated utilities or domains in a "flat" structure.

### 4. Mandatory Documentation (The Self-Documenting Graph)
- **Docstrings Everywhere:** EVERY class, component, function, and significant variable must have a descriptive docstring (JSDoc format for JS).
- **Graph Intent:** The code must serve as a self-documenting index of itself. Docstrings must explain *why* something exists and its role in the broader system.

---

## The Merging Phase (Future)

Once the codebase is fully atomized and documented, we will enter the **Merging Phase**.
- **Goal:** Reduce the "width" of the codebase and eliminate duplication of purposes that emerged during atomization.
- **Action:** Strategically group highly cohesive atoms into slightly larger, strictly bounded modules, relaxing the 80-line rule *only* where cohesion demands it and duplication is eliminated.

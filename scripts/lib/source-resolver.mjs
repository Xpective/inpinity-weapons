export async function resolveWithSource({
    sourceMode,
    readFromChain,
    readFromDefinitions,
    onWarning
  }) {
    if (sourceMode === "chain") {
      const data = await readFromChain();
      return {
        sourceMode: "chain",
        data
      };
    }
  
    if (sourceMode === "definitions") {
      const data = await readFromDefinitions();
      return {
        sourceMode: "definitions",
        data
      };
    }
  
    if (sourceMode !== "auto") {
      throw new Error(`Unsupported source mode: ${sourceMode}`);
    }
  
    try {
      const data = await readFromChain();
      return {
        sourceMode: "chain",
        data
      };
    } catch (error) {
      if (onWarning) {
        onWarning(`Chain read failed, falling back to definitions: ${error.message}`);
      }
  
      const data = await readFromDefinitions();
      return {
        sourceMode: "definitions",
        data,
        fallbackReason: error.message
      };
    }
  }
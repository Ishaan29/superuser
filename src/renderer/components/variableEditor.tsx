import { useState, useEffect } from 'react';

interface VariableEditorProps {
  onClose?: () => void;
  onComplete?: (filledPrompt: string) => void;
  promptTemplate: string;
  variables?: { [key: string]: string }; // Made optional since we'll auto-detect
}

export default function VariableEditor({ 
  onClose, 
  onComplete, 
  promptTemplate, 
  variables = {}
}: VariableEditorProps) {
  const [variableValues, setVariableValues] = useState<{ [key: string]: string }>({});
  const [detectedVariables, setDetectedVariables] = useState<string[]>([]);
  const [previewPrompt, setPreviewPrompt] = useState<string>(promptTemplate);

  // Auto-detect variables in the prompt template
  useEffect(() => {
    const variablePattern = /\{([^}]+)\}/g;
    const matches = promptTemplate.match(variablePattern);
    const uniqueVariables = matches 
      ? [...new Set(matches.map(match => match.slice(1, -1)))]
      : [];
    
    console.log('VariableEditor - Prompt template:', promptTemplate);
    console.log('VariableEditor - Detected variables:', uniqueVariables);
    setDetectedVariables(uniqueVariables);
  }, [promptTemplate]);

  // Update preview prompt when variables change
  useEffect(() => {
    let preview = promptTemplate;
    
    // Replace filled variables with their values
    Object.entries(variableValues).forEach(([key, value]) => {
      if (value.trim()) {
        preview = preview.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
      }
    });
    
    setPreviewPrompt(preview);
  }, [promptTemplate, variableValues]);

  const handleVariableChange = (variableName: string, value: string) => {
    setVariableValues(prev => ({
      ...prev,
      [variableName]: value
    }));
  };

  const handleComplete = () => {
    let filledPrompt = promptTemplate;
    
    // Replace all variables in the template
    Object.entries(variableValues).forEach(([key, value]) => {
      filledPrompt = filledPrompt.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    });

    onComplete?.(filledPrompt);
  };

  const handleBack = () => {
    onClose?.();
  };

  // Helper function to get variable display name
  const getVariableDisplayName = (variableName: string): string => {
    // Check if we have a custom description from props
    if (variables[variableName]) {
      return variables[variableName];
    }
    
    // Otherwise, format the variable name nicely
    return variableName
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  const allVariables = detectedVariables.length > 0 ? detectedVariables : Object.keys(variables);
  const isComplete = allVariables.every(key => variableValues[key]?.trim());

  // Show message if no variables detected
  if (allVariables.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 min-w-[400px] max-w-[600px]">
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
          <button onClick={handleBack} className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">No Variables Found</h3>
            <p className="text-xs text-gray-500">This prompt doesn't require any variables</p>
          </div>
        </div>
        
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Prompt Preview:</h4>
          <div className="bg-gray-50 p-3 rounded-md text-sm text-gray-800 border border-gray-200">
            {promptTemplate}
          </div>
        </div>

        <div className="flex justify-between items-center pt-3 border-t border-gray-100">
          <button onClick={handleBack} className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors">
            Back
          </button>
          <button onClick={() => onComplete?.(promptTemplate)} className="px-4 py-1.5 text-sm rounded-md font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors">
            Use Prompt
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 min-w-[400px] max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
        <button 
          onClick={handleBack}
          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Prompt Variable Editor</h3>
          <p className="text-xs text-gray-500">Fill in the variables and preview your prompt</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Variable Inputs */}
        <div className="space-y-4 mb-4">
          {allVariables.map((variableName) => (
            <div key={variableName}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {getVariableDisplayName(variableName)}
                <span className="text-gray-400 text-xs ml-1">({`{${variableName}}`})</span>
              </label>
              <textarea
                value={variableValues[variableName] || ''}
                onChange={(e) => handleVariableChange(variableName, e.target.value)}
                placeholder={`Enter value for ${getVariableDisplayName(variableName).toLowerCase()}...`}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows={3}
              />
            </div>
          ))}
        </div>

        {/* Prompt Preview */}
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Prompt Preview:</h4>
          <div className="bg-gray-50 p-3 rounded-md text-sm text-gray-800 border border-gray-200 max-h-40 overflow-y-auto">
            {previewPrompt}
          </div>
          {/* Show remaining variables */}
          {detectedVariables.some(var1 => !variableValues[var1]?.trim()) && (
            <p className="text-xs text-amber-600 mt-2">
              <span className="inline-block w-2 h-2 bg-amber-400 rounded-full mr-1"></span>
              Variables like {detectedVariables.filter(var1 => !variableValues[var1]?.trim()).map(var1 => `{${var1}}`).join(', ')} still need values
            </p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-3 border-t border-gray-100">
        <button
          onClick={handleBack}
          className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleComplete}
          disabled={!isComplete}
          className={`px-4 py-1.5 text-sm rounded-md font-medium transition-colors ${
            isComplete
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          Generate Prompt
        </button>
      </div>
    </div>
  );
} 
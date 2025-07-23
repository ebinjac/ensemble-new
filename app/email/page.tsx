"use client"

import EmailEditor from "@/components/emailEditor";


export default function EmailBuilderPage() {
  const handleSave = (template) => {
    console.log('Saving template:', template);
    // Save to your backend
  };

  const handleExport = (html) => {
    // Download HTML file
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'email-template.html';
    a.click();
  };

  return (
    <EmailEditor 
      onSave={handleSave}
      onExport={handleExport}
    />
  );
}
"use client"

import EmailEditor from "@/components/emailEditor";


const template = {
  "id": "comp-1753298310020-8-4lk8oosoqks",
  "name": "Email Template 7/24/2025",
  "components": [
      {
          "id": "comp-1753297729274-2-l9pknhe76rn",
          "type": "text",
          "content": "Add your text here...",
          "styles": {
              "fontSize": "16px",
              "color": "#333333",
              "fontFamily": "Arial, sans-serif",
              "fontWeight": "400",
              "fontStyle": "normal",
              "lineHeight": "1.5",
              "textAlign": "center",
              "textTransform": "none",
              "textDecoration": "none",
              "letterSpacing": "0px",
              "marginBottom": "0px",
              "marginTop": "0px",
              "marginLeft": "0px",
              "marginRight": "0px",
              "paddingTop": "10px",
              "paddingRight": "10px",
              "paddingBottom": "10px",
              "paddingLeft": "10px",
              "backgroundColor": "transparent",
              "borderRadius": "0px",
              "borderWidth": "0px",
              "borderStyle": "none",
              "borderColor": "#cccccc",
              "opacity": "1",
              "boxShadow": "none"
          }
      },
      {
          "id": "comp-1753298299204-4-11lnrjaf6ywl",
          "type": "heading",
          "content": "Your Heading Here",
          "level": "h2",
          "styles": {
              "fontSize": "28px",
              "color": "#1a1a1a",
              "fontFamily": "Arial, sans-serif",
              "fontWeight": "700",
              "fontStyle": "normal",
              "lineHeight": "1.2",
              "textAlign": "left",
              "textTransform": "none",
              "textDecoration": "none",
              "letterSpacing": "0px",
              "marginBottom": "0px",
              "marginTop": "0px",
              "marginLeft": "0px",
              "marginRight": "0px",
              "paddingTop": "10px",
              "paddingRight": "10px",
              "paddingBottom": "10px",
              "paddingLeft": "10px",
              "backgroundColor": "transparent",
              "borderRadius": "0px",
              "borderWidth": "0px",
              "borderStyle": "none",
              "borderColor": "#cccccc",
              "opacity": "1",
              "boxShadow": "none"
          }
      },
      {
          "id": "comp-1753298300740-5-121e45sggx7",
          "type": "button",
          "text": "Click Here",
          "href": "#",
          "styles": {
              "backgroundColor": "#007bff",
              "color": "#ffffff",
              "fontSize": "16px",
              "fontFamily": "Arial, sans-serif",
              "fontWeight": "500",
              "textAlign": "center",
              "textDecoration": "none",
              "padding": "12px 24px",
              "borderRadius": "4px",
              "borderWidth": "0px",
              "borderStyle": "none",
              "borderColor": "#0056b3",
              "display": "inline-block",
              "cursor": "pointer",
              "transition": "all 0.3s ease",
              "opacity": "1",
              "marginTop": "10px",
              "marginRight": "10px",
              "marginBottom": "10px",
              "marginLeft": "10px",
              "textTransform": "none",
              "boxShadow": "none"
          }
      },
      {
          "id": "comp-1753298302491-6-nlqf0dts0ka",
          "type": "divider",
          "styles": {
              "height": "1px",
              "backgroundColor": "#cccccc",
              "borderStyle": "none",
              "marginTop": "20px",
              "marginRight": "0px",
              "marginBottom": "20px",
              "marginLeft": "0px",
              "paddingTop": "0px",
              "paddingRight": "0px",
              "paddingBottom": "0px",
              "paddingLeft": "0px",
              "width": "100%",
              "opacity": "1",
              "borderRadius": "0px",
              "boxShadow": "none"
          }
      },
      {
          "id": "comp-1753298305640-7-w0hc2g9347",
          "type": "list",
          "listType": "ul",
          "items": [
              "First item",
              "Second item",
              "Third item"
          ],
          "styles": {
              "fontSize": "16px",
              "color": "#333333",
              "lineHeight": "1.5",
              "marginTop": "0px",
              "marginRight": "0px",
              "marginBottom": "0px",
              "marginLeft": "0px",
              "paddingLeft": "20px",
              "fontFamily": "Arial, sans-serif",
              "backgroundColor": "transparent",
              "borderRadius": "0px",
              "borderWidth": "0px",
              "borderStyle": "none",
              "borderColor": "#cccccc",
              "opacity": "1",
              "listStyleType": "disc",
              "listStylePosition": "outside",
              "boxShadow": "none"
          }
      },
      {
          "id": "comp-1753298712542-1-5ufvvrvwzow",
          "type": "image",
          "src": "https://cdn.pixabay.com/photo/2024/05/26/10/15/bird-8788491_1280.jpg",
          "alt": "Image description",
          "styles": {
              "width": "100%",
              "maxWidth": "800px",
              "height": "auto",
              "display": "block",
              "marginBottom": "16px",
              "borderRadius": "0px",
              "borderWidth": "0px",
              "borderStyle": "none",
              "borderColor": "#cccccc",
              "opacity": "1",
              "textAlign": "left",
              "marginLeft": "0",
              "marginRight": "auto",
              "boxShadow": "none"
          }
      }
  ],
  "canvasSettings": {
      "backgroundColor": "#f4f4f4",
      "contentBackgroundColor": "#ffffff",
      "contentWidth": "800px",
      "maxWidth": "800px",
      "padding": "10px",
      "fontFamily": "Arial, sans-serif",
      "fontSize": "16px",
      "lineHeight": "1.5",
      "color": "#333333"
  }
}

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
      initialTemplate={template}
      onSave={handleSave}
      onExport={handleExport}
    />
  );
}